
-- Enable trigram extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create textbooks table
CREATE TABLE public.textbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  class_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  source_url TEXT,
  total_pages INTEGER,
  ingestion_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingestion_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_chunks table
CREATE TABLE public.content_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  class_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  chapter_title TEXT,
  section_title TEXT,
  topic TEXT,
  content TEXT NOT NULL,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_textbooks_class_subject ON public.textbooks(class_number, subject);
CREATE INDEX idx_chapters_textbook ON public.chapters(textbook_id);
CREATE INDEX idx_chunks_textbook ON public.content_chunks(textbook_id);
CREATE INDEX idx_chunks_chapter ON public.content_chunks(chapter_id);
CREATE INDEX idx_chunks_class_subject ON public.content_chunks(class_number, subject);
CREATE INDEX idx_chunks_topic ON public.content_chunks(topic);
CREATE INDEX idx_chunks_content_trgm ON public.content_chunks USING gin(content gin_trgm_ops);

-- Enable RLS
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

-- Open policies (restrict to admins when auth is added)
CREATE POLICY "Anyone can view textbooks" ON public.textbooks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert textbooks" ON public.textbooks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update textbooks" ON public.textbooks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete textbooks" ON public.textbooks FOR DELETE USING (true);

CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chapters" ON public.chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete chapters" ON public.chapters FOR DELETE USING (true);

CREATE POLICY "Anyone can view content chunks" ON public.content_chunks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert content chunks" ON public.content_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete content chunks" ON public.content_chunks FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_textbooks_updated_at
  BEFORE UPDATE ON public.textbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('textbooks', 'textbooks', false);
CREATE POLICY "Anyone can upload textbooks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'textbooks');
CREATE POLICY "Anyone can read textbooks" ON storage.objects FOR SELECT USING (bucket_id = 'textbooks');
CREATE POLICY "Anyone can delete textbooks" ON storage.objects FOR DELETE USING (bucket_id = 'textbooks');
