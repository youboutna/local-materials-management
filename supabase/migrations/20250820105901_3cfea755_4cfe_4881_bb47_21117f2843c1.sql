-- Create supplier payment requests table
CREATE TABLE btp.supplier_payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  project_id UUID NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  payment_reason TEXT NOT NULL,
  supporting_documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  approved_by UUID NULL,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE btp.supplier_payment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier payment requests
CREATE POLICY "Suppliers can view their own payment requests" 
ON btp.supplier_payment_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM btp.suppliers s 
    WHERE s.id = supplier_payment_requests.supplier_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can create their own payment requests" 
ON btp.supplier_payment_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.suppliers s 
    WHERE s.id = supplier_payment_requests.supplier_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can view all payment requests" 
ON btp.supplier_payment_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name IN ('admin', 'director', 'manager')
  )
);

CREATE POLICY "Managers can update payment requests" 
ON btp.supplier_payment_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name IN ('admin', 'director', 'manager')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_supplier_payment_requests_updated_at
BEFORE UPDATE ON btp.supplier_payment_requests
FOR EACH ROW
EXECUTE FUNCTION btp.update_timestamp();