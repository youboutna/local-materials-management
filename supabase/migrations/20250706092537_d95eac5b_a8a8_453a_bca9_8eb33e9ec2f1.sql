
-- Remove the foreign key constraint that's causing the issue
ALTER TABLE btp.documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;

-- Make project_id nullable since not all documents are tied to projects
ALTER TABLE btp.documents ALTER COLUMN project_id DROP NOT NULL;

-- Add a comment to clarify the relationship
COMMENT ON COLUMN btp.documents.project_id IS 'Optional reference to projects table. Can be null for tender documents or other document types.';
