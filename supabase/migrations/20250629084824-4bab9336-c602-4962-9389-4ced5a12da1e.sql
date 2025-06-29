
-- Create tenders table
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  launch_date DATE,
  attribution_date DATE,
  selection_mode TEXT,
  market_type TEXT,
  financing_source TEXT,
  project_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'awarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for tenders
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to manage tenders
CREATE POLICY "Authenticated users can view tenders" 
  ON public.tenders 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tenders" 
  ON public.tenders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tenders" 
  ON public.tenders 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tenders" 
  ON public.tenders 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Create tender_suppliers junction table
CREATE TABLE public.tender_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tender_id, supplier_id)
);

-- Add RLS for tender_suppliers
ALTER TABLE public.tender_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tender suppliers" 
  ON public.tender_suppliers 
  FOR ALL 
  TO authenticated
  USING (true);

-- Add update trigger for tenders
CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();
