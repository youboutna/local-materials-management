-- Add inspection_id column to supplier_payment_requests table
ALTER TABLE btp.supplier_payment_requests 
ADD COLUMN IF NOT EXISTS inspection_id uuid REFERENCES btp.inspections(id) ON DELETE SET NULL;

COMMENT ON COLUMN btp.supplier_payment_requests.inspection_id IS 'Link to the inspection this payment request is associated with';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_inspection_id ON btp.supplier_payment_requests(inspection_id);