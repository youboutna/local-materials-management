-- Create tender_estimates table
CREATE TABLE btp.tender_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  project_id UUID,
  title VARCHAR NOT NULL,
  description TEXT,
  tax_rate NUMERIC DEFAULT 18.0,
  overhead_percentage NUMERIC DEFAULT 10.0,
  profit_percentage NUMERIC DEFAULT 15.0,
  total_materials NUMERIC DEFAULT 0,
  total_labor NUMERIC DEFAULT 0,
  total_equipment NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  overhead_amount NUMERIC DEFAULT 0,
  profit_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  supplier_id UUID ,
);

-- Create tender_estimate_items table
CREATE TABLE btp.tender_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES btp.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID,
  item_code VARCHAR,
  description TEXT NOT NULL,
  unit VARCHAR NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  category TEXT DEFAULT 'materials',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
--fix bug 
ALTER TABLE  btp.tender_estimates ADD COLUMN IF NOT EXISTS  supplier_id UUID ;
-- Enable RLS
ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for tender_estimates
CREATE POLICY "Users can view tender estimates" 
ON btp.tender_estimates 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create tender estimates" 
ON btp.tender_estimates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update tender estimates" 
ON btp.tender_estimates 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete tender estimates" 
ON btp.tender_estimates 
FOR DELETE 
USING (true);

-- RLS policies for tender_estimate_items
CREATE POLICY "Users can view tender estimate items" 
ON btp.tender_estimate_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create tender estimate items" 
ON btp.tender_estimate_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update tender estimate items" 
ON btp.tender_estimate_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete tender estimate items" 
ON btp.tender_estimate_items 
FOR DELETE 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_tender_estimates_updated_at
  BEFORE UPDATE ON btp.tender_estimates
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();

CREATE TRIGGER update_tender_estimate_items_updated_at
  BEFORE UPDATE ON btp.tender_estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();