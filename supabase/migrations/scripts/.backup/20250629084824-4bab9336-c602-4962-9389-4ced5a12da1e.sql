
-- Create tenders table
CREATE TABLE btp.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id UUID REFERENCES btp.projects(id),
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
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to manage tenders
CREATE POLICY "Authenticated users can view tenders" 
  ON btp.tenders 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tenders" 
  ON btp.tenders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tenders" 
  ON btp.tenders 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tenders" 
  ON btp.tenders 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Create tender_suppliers junction table
CREATE TABLE btp.tender_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES btp.tenders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES btp.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tender_id, supplier_id)
);

-- Add RLS for tender_suppliers
ALTER TABLE btp.tender_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tender suppliers" 
  ON btp.tender_suppliers 
  FOR ALL 
  TO authenticated
  USING (true);

-- Add update trigger for tenders
CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON btp.tenders
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();
