
-- First, let's create a tenders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  launch_date DATE,
  attribution_date DATE,
  selection_mode TEXT,
  market_type TEXT,
  financing_source TEXT,
  project_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'awarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tenders table
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenders
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" 
  ON public.tenders 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert access for authenticated users" 
  ON public.tenders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update access for authenticated users" 
  ON public.tenders 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable delete access for authenticated users" 
  ON public.tenders 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Update tender_documents table to properly link to tenders instead of projects directly
-- First, add tender_id column if it doesn't exist
ALTER TABLE public.tender_documents 
ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON public.tender_documents(tender_id);

-- Update the documents table to support tender document relationships
-- Add a tender_document_id column to link documents to tender_documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS tender_document_id UUID REFERENCES public.tender_documents(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_tender_document_id ON public.documents(tender_document_id);

-- Update RLS policies for tender_documents to work with both project_id and tender_id
DROP POLICY IF EXISTS "select_tender_documents_by_role" ON public.tender_documents;
DROP POLICY IF EXISTS "manage_tender_documents_admin_director_manager" ON public.tender_documents;

CREATE POLICY "Enable read access for tender documents" 
  ON public.tender_documents 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for tender documents" 
  ON public.tender_documents 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for tender documents" 
  ON public.tender_documents 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for tender documents" 
  ON public.tender_documents 
  FOR DELETE 
  TO authenticated
  USING (true);
