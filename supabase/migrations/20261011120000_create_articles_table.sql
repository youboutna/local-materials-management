-- Create articles table for news/blog content
-- This table stores news articles and blog posts with rich text content

CREATE TABLE IF NOT EXISTS btp.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  project_id UUID REFERENCES btp.projects(id) ON DELETE SET NULL,
  document_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT articles_slug_check CHECK (char_length(slug) >= 3)
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_articles_status ON btp.articles(status);

-- Create index on published_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON btp.articles(published_at DESC);

-- Create index on author_id for user content
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON btp.articles(author_id);

-- Create index on project_id for project-related articles
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON btp.articles(project_id);

-- Add RLS policies
ALTER TABLE btp.articles ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read published articles
CREATE POLICY "Public can read published articles"
  ON btp.articles
  FOR SELECT
  USING (status = 'published');

-- Authenticated users can read published articles, their own drafts, and all
-- articles when they have an editorial role.
CREATE POLICY "Authenticated users can read permitted articles"
  ON btp.articles
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Admin/Director can manage all articles
CREATE POLICY "Admin/Director can manage all articles"
  ON btp.articles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Authors can insert their own articles
CREATE POLICY "Authors can insert their own articles"
  ON btp.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Policy: Authors can update their own articles
CREATE POLICY "Authors can update their own articles"
  ON btp.articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'draft')
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Policy: Authors can delete their own articles
CREATE POLICY "Authors can delete their own articles"
  ON btp.articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'draft');

-- Add comment
COMMENT ON TABLE btp.articles IS 'News articles and blog posts with rich text content';
COMMENT ON COLUMN btp.articles.slug IS 'URL-friendly unique identifier for public access';
COMMENT ON COLUMN btp.articles.status IS 'Article status: draft, published, or archived';
COMMENT ON COLUMN btp.articles.project_id IS 'Optional link to a project';
COMMENT ON COLUMN btp.articles.document_ids IS 'Array of document IDs from GED';
COMMENT ON COLUMN btp.articles.metadata IS 'Additional metadata including showProjectInfo flag';
