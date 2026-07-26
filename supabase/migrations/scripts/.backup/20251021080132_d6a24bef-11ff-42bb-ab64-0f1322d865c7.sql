
-- Add payment_id column to documents table
ALTER TABLE btp.documents 
ADD COLUMN payment_id UUID REFERENCES btp.payments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_documents_payment_id ON btp.documents(payment_id);

-- Add comment for documentation
COMMENT ON COLUMN btp.documents.payment_id IS 'Reference to the payment associated with this document (invoice, RIB, etc.)';
