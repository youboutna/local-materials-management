-- Create insurance certificates table
CREATE TABLE public.insurance_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  contractor_name TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_amount NUMERIC NOT NULL,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('responsabilite_civile', 'decennale', 'vehicules', 'materiel', 'tous_risques')),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring_soon', 'missing')),
  last_verified TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bank guarantees table
CREATE TABLE public.bank_guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  guarantee_amount NUMERIC NOT NULL,
  guarantee_type TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment blocks table
CREATE TABLE public.payment_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  blocking_reasons JSONB NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.insurance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to insurance_certificates" ON public.insurance_certificates FOR ALL USING (true);
CREATE POLICY "Allow all access to bank_guarantees" ON public.bank_guarantees FOR ALL USING (true);
CREATE POLICY "Allow all access to payment_blocks" ON public.payment_blocks FOR ALL USING (true);