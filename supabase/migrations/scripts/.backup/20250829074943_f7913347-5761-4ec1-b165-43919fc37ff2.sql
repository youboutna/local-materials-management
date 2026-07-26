-- Create tender document submissions table for tracking supplier submissions
CREATE TABLE IF NOT EXISTS btp.tender_document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  document_id UUID NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_revision')),
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tender_id, supplier_id, document_id)
);

-- Add RLS policies for tender document submissions
ALTER TABLE btp.tender_document_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for suppliers to view their own submissions
CREATE POLICY "Suppliers can view their own submissions"
ON btp.tender_document_submissions
FOR SELECT
USING (supplier_id = (
  SELECT id FROM suppliers WHERE user_id = auth.uid() LIMIT 1
));

-- Policy for suppliers to create their own submissions
CREATE POLICY "Suppliers can create their own submissions"
ON btp.tender_document_submissions
FOR INSERT
WITH CHECK (supplier_id = (
  SELECT id FROM suppliers WHERE user_id = auth.uid() LIMIT 1
));

-- Policy for admins to view all submissions
CREATE POLICY "Admins can view all submissions"
ON btp.tender_document_submissions
FOR SELECT
USING (is_current_user_admin());

-- Policy for admins to update all submissions (for reviews)
CREATE POLICY "Admins can update all submissions"
ON btp.tender_document_submissions
FOR UPDATE
USING (is_current_user_admin());

-- Add current_phase column to tenders table to track workflow phase
ALTER TABLE btp.tenders 
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 7);

-- Update existing tenders to have current_phase based on status
UPDATE btp.tenders 
SET current_phase = CASE 
  WHEN status = 'draft' THEN 1
  WHEN status = 'published' THEN 2
  WHEN status = 'closed' THEN 6
  WHEN status = 'awarded' THEN 7
  ELSE 1
END
WHERE current_phase IS NULL;

-- Create tender estimates table for quantitative estimates
CREATE TABLE IF NOT EXISTS btp.tender_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  project_id UUID,
  supplier_id UUID,
  estimate_type TEXT NOT NULL DEFAULT 'quantitative',
  total_materials_cost NUMERIC DEFAULT 0,
  total_labor_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 14,
  tax_amount NUMERIC DEFAULT 0,
  total_with_tax NUMERIC DEFAULT 0,
  overhead_percentage NUMERIC DEFAULT 15,
  overhead_amount NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 10,
  profit_margin_amount NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'MRU',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE  btp.tender_estimates ADD COLUMN IF NOT EXISTS  submitted_by UUID ;
-- Create tender estimate items table
CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES btp.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID REFERENCES btp.materials(id),
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT DEFAULT 'material' CHECK (item_type IN ('material', 'labor', 'equipment', 'service')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies for tender estimates
ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own estimates
CREATE POLICY "Suppliers can manage their own estimates"
ON btp.tender_estimates
FOR ALL
USING (supplier_id = (
  SELECT id FROM suppliers WHERE user_id = auth.uid() LIMIT 1
));

-- Admins can view all estimates
CREATE POLICY "Admins can view all estimates"
ON btp.tender_estimates
FOR SELECT
USING (is_current_user_admin());

-- Add RLS policies for tender estimate items
ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage items for their own estimates
CREATE POLICY "Suppliers can manage their own estimate items"
ON btp.tender_estimate_items
FOR ALL
USING (estimate_id IN (
  SELECT id FROM tender_estimates WHERE supplier_id = (
    SELECT id FROM suppliers WHERE user_id = auth.uid() LIMIT 1
  )
));

-- Admins can view all estimate items
CREATE POLICY "Admins can view all estimate items"
ON btp.tender_estimate_items
FOR SELECT
USING (is_current_user_admin());

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_tender_document_submissions_updated_at
  BEFORE UPDATE ON btp.tender_document_submissions
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tender_estimates_updated_at
  BEFORE UPDATE ON btp.tender_estimates
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tender_estimate_items_updated_at
  BEFORE UPDATE ON btp.tender_estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();