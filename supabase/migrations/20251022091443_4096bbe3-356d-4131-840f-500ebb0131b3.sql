-- Add inspection_id column to supplier_payment_requests table
ALTER TABLE public.supplier_payment_requests 
ADD COLUMN inspection_id uuid REFERENCES public.inspections(id) ON DELETE SET NULL;

COMMENT ON COLUMN supplier_payment_requests.inspection_id IS 'Link to the inspection this payment request is associated with';

-- Create index for better query performance
CREATE INDEX idx_supplier_payment_requests_inspection_id ON public.supplier_payment_requests(inspection_id);