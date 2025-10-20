-- Add missing columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS nif text,
ADD COLUMN IF NOT EXISTS commerce_register_ref text,
ADD COLUMN IF NOT EXISTS model_documents text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN public.suppliers.nif IS 'Numéro d''Identification Fiscale';
COMMENT ON COLUMN public.suppliers.commerce_register_ref IS 'Référence Registre de Commerce';
COMMENT ON COLUMN public.suppliers.model_documents IS 'URLs of model documents uploaded by supplier';