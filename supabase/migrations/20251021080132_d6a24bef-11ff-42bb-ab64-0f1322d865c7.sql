
-- Add payment_id column to documents table
ALTER TABLE public.documents 
ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_documents_payment_id ON public.documents(payment_id);

-- Add comment for documentation
COMMENT ON COLUMN public.documents.payment_id IS 'Reference to the payment associated with this document (invoice, RIB, etc.)';
