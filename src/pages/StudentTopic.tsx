import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, MessageCircle, Sparkles, ThumbsUp, ThumbsDown, Copy, Database } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockExplanation } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";

export default function StudentTopic() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topic = decodeURIComponent(params.get("topic") || "Topic");
  const subject = params.get("subject") || "";
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [followUp, setFollowUp] = useState("");
  const [followUps, setFollowUps] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [contentSource, setContentSource] = useState<"mock" | "database">("mock");

  // Try to fetch real content from database
  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("content_chunks")
        .select("content, chapter_title, section_title, topic")
        .or(`topic.ilike.%${topic}%,content.ilike.%${topic}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        const combined = data.map((c) => c.content).join("\n\n");
        setDbContent(combined);
        setContentSource("database");
      }
    };
    fetchContent();
  }, [topic]);

  const handleFollowUp = () => {
    if (!followUp.trim()) return;
    setLoading(true);
    const q = followUp;
    setFollowUp("");
    setTimeout(() => {
      setFollowUps((prev) => [
        ...prev,
        {
          q,
          a: `Great question! In the context of **${topic}**, ${q.toLowerCase()} relates to the core concept. The NCERT textbook explains this in detail in the subsequent sections.\n\n📚 *Reference: NCERT, Chapter 1, Section 1.3*`,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const explanation = dbContent
    ? dbContent
    : mode === "simple"
    ? mockExplanation.simple
    : mockExplanation.detailed;

  return (
    <AppLayout role="student">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to topics
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{topic}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          NCERT Mathematics · Class 10 · Chapter 1: Real Numbers
        </p>
        {contentSource === "database" && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            <Database className="h-3 w-3" /> From ingested content
          </span>
        )}
      </div>

      {/* Mode toggle - only show when using mock data */}
      {!dbContent && (
        <div className="mb-4 flex gap-2">
          <Button variant={mode === "simple" ? "default" : "outline"} size="sm" onClick={() => setMode("simple")}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Simple
          </Button>
          <Button variant={mode === "detailed" ? "default" : "outline"} size="sm" onClick={() => setMode("detailed")}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Detailed
          </Button>
        </div>
      )}

      {/* Explanation */}
      <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-6 p-5">
        <div className="prose prose-sm max-w-none text-foreground">
          {explanation.split("\n").map((line, i) => {
            const fmt = (text: string) => text
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>');

            if (line.startsWith("###")) {
              return <h3 key={i} className="mt-4 mb-2 font-display text-base font-semibold" dangerouslySetInnerHTML={{ __html: fmt(line.replace("### ", "")) }} />;
            }
            if (line.startsWith(">")) {
              return <blockquote key={i} className="my-2 border-l-2 border-secondary pl-3 font-mono text-sm" dangerouslySetInnerHTML={{ __html: fmt(line.replace("> ", "")) }} />;
            }
            if (line.startsWith("- ")) {
              return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: fmt(line.replace("- ", "")) }} />;
            }
            if (line.match(/^\d+\.\s/)) {
              return <li key={i} className="ml-4 text-sm list-decimal" dangerouslySetInnerHTML={{ __html: fmt(line.replace(/^\d+\.\s/, "")) }} />;
            }
            if (line.startsWith("📚")) {
              return <p key={i} className="mt-3 rounded-md bg-secondary/10 px-3 py-2 text-xs text-secondary" dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
            }
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Helpful
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ThumbsDown className="mr-1 h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </motion.div>

      {/* Follow-ups */}
      {followUps.map((fu, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="mb-2 flex justify-end">
            <div className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">{fu.q}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-sm leading-relaxed text-foreground" dangerouslySetInnerHTML={{
              __html: fu.a
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br/>')
            }} />
          </div>
        </motion.div>
      ))}

      {/* Follow-up input */}
      <div className="sticky bottom-4 flex gap-2">
        <Input
          placeholder="Ask a follow-up question..."
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
          className="flex-1"
        />
        <Button onClick={handleFollowUp} disabled={loading || !followUp.trim()}>
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </div>
    </AppLayout>
  );
}
