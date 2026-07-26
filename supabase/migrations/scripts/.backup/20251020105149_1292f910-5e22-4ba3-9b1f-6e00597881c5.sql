-- Add missing columns to suppliers table
ALTER TABLE btp.suppliers 
ADD COLUMN IF NOT EXISTS nif text,
ADD COLUMN IF NOT EXISTS commerce_register_ref text,
ADD COLUMN IF NOT EXISTS model_documents text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN btp.suppliers.nif IS 'Numéro d''Identification Fiscale';
COMMENT ON COLUMN btp.suppliers.commerce_register_ref IS 'Référence Registre de Commerce';
COMMENT ON COLUMN btp.suppliers.model_documents IS 'URLs of model documents uploaded by supplier';