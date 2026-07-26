-- Create supplier_inspections table
CREATE TABLE IF NOT EXISTS btp.supplier_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  inspector_name TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  comments TEXT,
  recommendations TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS btp.supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE btp.supplier_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.supplier_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier_inspections
CREATE POLICY "Admins can manage all supplier inspections" 
ON btp.supplier_inspections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'director', 'manager')
  )
);

CREATE POLICY "Suppliers can view their own inspections" 
ON btp.supplier_inspections 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_inspections.supplier_id 
    AND s.user_id = auth.uid()
  )
);

-- Create policies for supplier_payments
CREATE POLICY "Admins can manage all supplier payments" 
ON btp.supplier_payments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'director', 'manager')
  )
);

CREATE POLICY "Suppliers can view their own payments" 
ON btp.supplier_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_payments.supplier_id 
    AND s.user_id = auth.uid()
  )
);

-- Create update triggers
CREATE TRIGGER update_supplier_inspections_updated_at
  BEFORE UPDATE ON btp.supplier_inspections
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();

CREATE TRIGGER update_supplier_payments_updated_at
  BEFORE UPDATE ON btp.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();