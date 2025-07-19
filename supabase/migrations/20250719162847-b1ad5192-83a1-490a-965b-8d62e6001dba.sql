-- Create tender_steps table for workflow management
CREATE TABLE IF NOT EXISTS public.tender_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tender_id, step_number)
);

-- Create tender_step_documents table for linking documents to workflow steps
CREATE TABLE IF NOT EXISTS public.tender_step_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.tender_steps(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, document_id)
);

-- Enable RLS on both tables
ALTER TABLE public.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_step_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tender_steps
CREATE POLICY "Allow all operations on tender_steps"
ON public.tender_steps
FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policies for tender_step_documents  
CREATE POLICY "Allow all operations on tender_step_documents"
ON public.tender_step_documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id ON public.tender_steps(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_steps_status ON public.tender_steps(status);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_step_id ON public.tender_step_documents(step_id);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_document_id ON public.tender_step_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_status ON public.tender_step_documents(status);

-- Create updated_at triggers
CREATE TRIGGER update_tender_steps_updated_at
  BEFORE UPDATE ON public.tender_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_tender_step_documents_updated_at
  BEFORE UPDATE ON public.tender_step_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();