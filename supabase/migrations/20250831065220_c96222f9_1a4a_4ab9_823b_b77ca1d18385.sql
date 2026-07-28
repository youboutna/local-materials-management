-- Add sharing controls and fix tender document structure
-- Update documents table with sharing flags
ALTER TABLE btp.documents 
ADD COLUMN IF NOT EXISTS is_shared_with_suppliers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_internal_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMPTZ;

-- Create tender_submissions table to properly track bid submissions
CREATE TABLE btp.tender_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  user_id UUID NOT NULL,
  supplier_name TEXT,
  supplier_email TEXT,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted',
  administrative_score NUMERIC,
  technical_score NUMERIC,
  financial_score NUMERIC,
  total_score NUMERIC,
  evaluator_notes TEXT,
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tender_id, user_id)
);

-- Create tender_submission_documents table to link documents to submissions
CREATE TABLE btp.tender_submission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES btp.tender_submissions(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('administrative', 'technical', 'financial')),
  subcategory TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE btp.tender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_submission_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for tender_submissions
CREATE POLICY "Users can view their own submissions"
ON btp.tender_submissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own submissions"
ON btp.tender_submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own draft submissions"
ON btp.tender_submissions FOR UPDATE
USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can view all submissions"
ON btp.tender_submissions FOR SELECT
USING (is_current_user_admin());

CREATE POLICY "Admins can update all submissions"
ON btp.tender_submissions FOR UPDATE
USING (is_current_user_admin());

-- RLS policies for tender_submission_documents
CREATE POLICY "Users can view their submission documents"
ON btp.tender_submission_documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM btp.tender_submissions ts 
  WHERE ts.id = submission_id AND ts.user_id = auth.uid()
));

CREATE POLICY "Users can insert their submission documents"
ON btp.tender_submission_documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM btp.tender_submissions ts 
  WHERE ts.id = submission_id AND ts.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all submission documents"
ON btp.tender_submission_documents FOR ALL
USING (is_current_user_admin());

-- Create function for updating updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER update_tender_submissions_updated_at
BEFORE UPDATE ON btp.tender_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update tenders table to include deadline validation
ALTER TABLE btp.tenders
ADD CONSTRAINT valid_deadline_date CHECK (
  deadline_date IS NULL OR deadline_date > launch_date
);