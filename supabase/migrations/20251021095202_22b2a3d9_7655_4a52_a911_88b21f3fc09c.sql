-- Add banking information fields to suppliers table
ALTER TABLE btp.suppliers
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS rib TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Add comments for documentation
COMMENT ON COLUMN btp.suppliers.account_number IS 'Bank account number';
COMMENT ON COLUMN btp.suppliers.bank_name IS 'Bank name';
COMMENT ON COLUMN btp.suppliers.rib IS 'RIB (Relevé d''Identité Bancaire)';
