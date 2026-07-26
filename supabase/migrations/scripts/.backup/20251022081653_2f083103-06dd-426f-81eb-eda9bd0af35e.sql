-- Add payment_type field to inspections table
ALTER TABLE inspections 
ADD COLUMN payment_type text DEFAULT 'contractor' CHECK (payment_type IN ('contractor', 'mission_fees', 'engineer_fees'));

COMMENT ON COLUMN inspections.payment_type IS 'Type of payment: contractor (entreprise contractante), mission_fees (frais de mission), engineer_fees (honoraires ingénieur conseil)';
