
-- Create tender_steps table
CREATE TABLE btp.tender_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES btp.tenders(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tender_id, step_number)
);

-- Create tender_step_documents table
CREATE TABLE btp.tender_step_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL REFERENCES btp.tender_steps(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  submitted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(step_id, document_id)
);

-- Add RLS policies for tender_steps
ALTER TABLE btp.tender_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tender steps" 
  ON btp.tender_steps 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tender steps" 
  ON btp.tender_steps 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tender steps" 
  ON btp.tender_steps 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tender steps" 
  ON btp.tender_steps 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Add RLS policies for tender_step_documents
ALTER TABLE btp.tender_step_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view step documents" 
  ON btp.tender_step_documents 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create step documents" 
  ON btp.tender_step_documents 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update step documents" 
  ON btp.tender_step_documents 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete step documents" 
  ON btp.tender_step_documents 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Add update triggers
CREATE TRIGGER update_tender_steps_updated_at
  BEFORE UPDATE ON btp.tender_steps
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();
