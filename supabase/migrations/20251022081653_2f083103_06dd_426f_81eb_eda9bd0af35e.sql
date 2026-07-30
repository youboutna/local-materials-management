-- Add payment_type field to inspections table
ALTER TABLE btp.inspections 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'contractor' CHECK (payment_type IN ('contractor', 'mission_fees', 'engineer_fees'));

COMMENT ON COLUMN btp.inspections.payment_type IS 'Type of payment: contractor (entreprise contractante), mission_fees (frais de mission), engineer_fees (honoraires ingénieur conseil)';
