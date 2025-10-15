-- Add service_fait_document_id column to progress_invoices table
-- This links the signed "service fait" document to the invoice validation

ALTER TABLE IF EXISTS progress_invoices 
ADD COLUMN IF NOT EXISTS service_fait_document_id uuid REFERENCES documents(id) ON DELETE SET NULL;

COMMENT ON COLUMN progress_invoices.service_fait_document_id IS 'Reference to the signed "service fait" document required for consultant approval';