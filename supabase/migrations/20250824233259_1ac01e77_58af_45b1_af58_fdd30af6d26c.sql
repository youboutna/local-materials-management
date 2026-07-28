-- Add NIF (tax identification number) field to suppliers table
ALTER TABLE btp.suppliers 
ADD COLUMN nif VARCHAR(50);

-- Add an index for better search performance
CREATE INDEX IF NOT EXISTS idx_suppliers_nif ON btp.suppliers(nif);

-- Add an index for contact_person search performance
CREATE INDEX IF NOT EXISTS idx_suppliers_contact_person ON btp.suppliers(contact_person);

-- Add an index for name search performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON btp.suppliers(name);