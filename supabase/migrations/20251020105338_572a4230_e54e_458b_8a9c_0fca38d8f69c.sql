-- Add supplier_id to documents table to link documents to suppliers
ALTER TABLE btp.documents 
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES btp.suppliers(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_supplier_id ON btp.documents(supplier_id);

-- Add supplier_info document type if not exists (already exists in enum)
-- Add supplier_catalog document type for supplier model documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'document_type' AND e.enumlabel = 'supplier_catalog'
  ) THEN
    ALTER TYPE document_type ADD VALUE 'supplier_catalog';
  END IF;
END $$;

-- Remove model_documents column from suppliers table (no longer needed)
ALTER TABLE btp.suppliers 
DROP COLUMN IF EXISTS model_documents;