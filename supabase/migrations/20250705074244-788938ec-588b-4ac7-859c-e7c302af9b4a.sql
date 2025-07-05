
-- Create table for tender estimates with tax calculations
CREATE TABLE public.tender_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  project_id UUID,
  estimate_type TEXT NOT NULL DEFAULT 'quantitative', -- 'quantitative', 'uploaded_document'
  total_materials_cost NUMERIC DEFAULT 0,
  total_labor_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0, -- TVA percentage
  tax_amount NUMERIC DEFAULT 0,
  total_with_tax NUMERIC DEFAULT 0,
  overhead_percentage NUMERIC DEFAULT 15,
  overhead_amount NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 10,
  profit_margin_amount NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'MRU',
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for estimate line items (from materials repository)
CREATE TABLE public.tender_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  item_type TEXT DEFAULT 'material', -- 'material', 'labor', 'equipment', 'other'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for parsed invoice data
CREATE TABLE public.parsed_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id),
  file_name TEXT,
  parsed_data JSONB, -- Store extracted invoice data
  total_amount NUMERIC,
  tax_amount NUMERIC,
  items JSONB, -- Array of parsed line items
  supplier_info JSONB,
  invoice_date DATE,
  invoice_number TEXT,
  parsing_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  parsing_errors TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on tender_estimates" ON public.tender_estimates FOR ALL USING (true);
CREATE POLICY "Allow all operations on tender_estimate_items" ON public.tender_estimate_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on parsed_invoices" ON public.parsed_invoices FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX idx_tender_estimates_tender_id ON public.tender_estimates(tender_id);
CREATE INDEX idx_tender_estimate_items_estimate_id ON public.tender_estimate_items(estimate_id);
CREATE INDEX idx_parsed_invoices_tender_id ON public.parsed_invoices(tender_id);
CREATE INDEX idx_parsed_invoices_document_id ON public.parsed_invoices(document_id);
