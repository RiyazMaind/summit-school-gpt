import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { textbookId, pdfUrl, title, classNumber, subject } = await req.json();

    if (!textbookId || !pdfUrl || !title || !classNumber || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: textbookId, pdfUrl, title, classNumber, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("textbooks")
      .update({ ingestion_status: "processing" })
      .eq("id", textbookId);

    // Fetch the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }

    const pdfText = await extractTextFromPdf(pdfResponse);

    // Parse into chapters and chunks
    const { chapters, chunks } = parseTextbook(pdfText, classNumber, subject, textbookId);

    // Insert chapters
    if (chapters.length > 0) {
      const { data: insertedChapters, error: chErr } = await supabase
        .from("chapters")
        .insert(chapters)
        .select("id, chapter_number");

      if (chErr) throw new Error(`Chapter insert failed: ${chErr.message}`);

      // Map chapter IDs to chunks
      const chapterMap = new Map<number, string>();
      insertedChapters?.forEach((ch) => chapterMap.set(ch.chapter_number, ch.id));

      for (const chunk of chunks) {
        if (chunk._chapterNum !== undefined) {
          chunk.chapter_id = chapterMap.get(chunk._chapterNum) || null;
          delete chunk._chapterNum;
        }
      }
    }

    // Insert chunks in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const { error: ckErr } = await supabase.from("content_chunks").insert(batch);
      if (ckErr) throw new Error(`Chunk insert failed at batch ${i}: ${ckErr.message}`);
    }

    // Update status
    await supabase
      .from("textbooks")
      .update({
        ingestion_status: "completed",
        total_pages: Math.ceil(pdfText.length / 3000),
      })
      .eq("id", textbookId);

    return new Response(
      JSON.stringify({
        success: true,
        chapters: chapters.length,
        chunks: chunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Ingestion error:", error);

    // Try to update status to failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const body = await req.clone().json().catch(() => ({}));
      if (body.textbookId) {
        await supabase
          .from("textbooks")
          .update({
            ingestion_status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", body.textbookId);
      }
    } catch (_) {
      // ignore cleanup errors
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Simple text extraction from PDF response.
 * For a production system, use a proper PDF parsing library.
 * This extracts readable text content from the PDF binary.
 */
async function extractTextFromPdf(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Extract text streams from PDF binary
  const text: string[] = [];
  let i = 0;

  while (i < bytes.length) {
    // Look for text stream markers
    if (findPattern(bytes, i, "stream")) {
      const streamStart = i + 7; // skip past "stream\n"
      const streamEnd = findPatternIndex(bytes, streamStart, "endstream");
      if (streamEnd > streamStart) {
        const streamBytes = bytes.slice(streamStart, streamEnd);
        const decoded = tryDecodeStream(streamBytes);
        if (decoded) text.push(decoded);
        i = streamEnd + 9;
        continue;
      }
    }
    i++;
  }

  // If stream extraction yielded little, fall back to raw text extraction
  let result = text.join("\n");
  if (result.length < 100) {
    result = extractRawText(bytes);
  }

  return result;
}

function findPattern(bytes: Uint8Array, start: number, pattern: string): boolean {
  for (let j = 0; j < pattern.length; j++) {
    if (bytes[start + j] !== pattern.charCodeAt(j)) return false;
  }
  return true;
}

function findPatternIndex(bytes: Uint8Array, start: number, pattern: string): number {
  for (let i = start; i < bytes.length - pattern.length; i++) {
    if (findPattern(bytes, i, pattern)) return i;
  }
  return -1;
}

function tryDecodeStream(bytes: Uint8Array): string | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // Extract text between parentheses (PDF text objects)
    const textParts: string[] = [];
    const regex = /\(([^)]*)\)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const cleaned = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (cleaned.trim()) textParts.push(cleaned);
    }

    // Also try Tj/TJ operator extraction
    const tjRegex = /\[([^\]]*)\]\s*TJ/g;
    while ((match = tjRegex.exec(text)) !== null) {
      const inner = match[1];
      const parts: string[] = [];
      const partRegex = /\(([^)]*)\)/g;
      let pm;
      while ((pm = partRegex.exec(inner)) !== null) {
        parts.push(pm[1]);
      }
      if (parts.length) textParts.push(parts.join(""));
    }

    const result = textParts.join(" ");
    return result.length > 5 ? result : null;
  } catch {
    return null;
  }
}

function extractRawText(bytes: Uint8Array): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const lines: string[] = [];

  // Extract BT...ET text blocks
  const btRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btRegex.exec(text)) !== null) {
    const block = match[1];
    const tjParts: string[] = [];
    const partRegex = /\(([^)]*)\)/g;
    let pm;
    while ((pm = partRegex.exec(block)) !== null) {
      const cleaned = pm[1].replace(/\\[nrt]/g, " ").trim();
      if (cleaned) tjParts.push(cleaned);
    }
    if (tjParts.length) lines.push(tjParts.join(" "));
  }

  return lines.join("\n");
}

/**
 * Parse extracted text into chapters and content chunks.
 */
function parseTextbook(
  text: string,
  classNumber: number,
  subject: string,
  textbookId: string
): { chapters: any[]; chunks: any[] } {
  const lines = text.split("\n").filter((l) => l.trim());
  const chapters: any[] = [];
  const chunks: any[] = [];

  // Detect chapter headings
  const chapterPattern = /^(?:CHAPTER|Chapter)\s*(\d+)\s*[:\-–]?\s*(.+)/i;
  let currentChapter: { num: number; title: string } | null = null;
  let currentContent: string[] = [];
  let chunkIndex = 0;

  const flushChunk = () => {
    if (currentContent.length === 0) return;
    const content = currentContent.join("\n").trim();
    if (content.length < 20) {
      currentContent = [];
      return;
    }

    chunks.push({
      textbook_id: textbookId,
      class_number: classNumber,
      subject,
      chapter_title: currentChapter?.title || null,
      content,
      chunk_index: chunkIndex++,
      _chapterNum: currentChapter?.num,
    });
    currentContent = [];
  };

  for (const line of lines) {
    const chMatch = line.match(chapterPattern);
    if (chMatch) {
      flushChunk();
      currentChapter = { num: parseInt(chMatch[1]), title: chMatch[2].trim() };

      // Check if chapter already added
      if (!chapters.find((c) => c.chapter_number === currentChapter!.num)) {
        chapters.push({
          textbook_id: textbookId,
          chapter_number: currentChapter.num,
          title: currentChapter.title,
        });
      }
      continue;
    }

    currentContent.push(line);

    // Chunk at ~1500 chars
    if (currentContent.join("\n").length > 1500) {
      flushChunk();
    }
  }
  flushChunk();

  // If no chapters were detected, create a single "Full Text" chapter
  if (chapters.length === 0 && text.length > 50) {
    chapters.push({
      textbook_id: textbookId,
      chapter_number: 1,
      title: "Full Content",
    });

    // Re-chunk the full text
    const CHUNK_SIZE = 1500;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const content = text.slice(i, i + CHUNK_SIZE).trim();
      if (content.length > 20) {
        chunks.push({
          textbook_id: textbookId,
          class_number: classNumber,
          subject,
          chapter_title: "Full Content",
          content,
          chunk_index: chunks.length,
          _chapterNum: 1,
        });
      }
    }
  }

  return { chapters, chunks };
}
