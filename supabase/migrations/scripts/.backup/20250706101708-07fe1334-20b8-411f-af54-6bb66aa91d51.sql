
-- Remove the foreign key constraint from tender_documents table
ALTER TABLE btp.tender_documents DROP CONSTRAINT IF EXISTS tender_documents_project_id_fkey;

-- Make project_id nullable in tender_documents since we'll use tender_id instead
ALTER TABLE btp.tender_documents ALTER COLUMN project_id DROP NOT NULL;

-- Add tender_id column to properly link to tenders table
ALTER TABLE btp.tender_documents ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES btp.tenders(id) ON DELETE CASCADE;

-- Add comment to clarify the relationship
COMMENT ON COLUMN btp.tender_documents.project_id IS 'Legacy project reference - use tender_id for new tender documents';
COMMENT ON COLUMN btp.tender_documents.tender_id IS 'Reference to tenders table for tender-specific documents';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON btp.tender_documents(tender_id);
