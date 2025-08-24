-- Add NIF (tax identification number) field to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN nif VARCHAR(50);

-- Add an index for better search performance
CREATE INDEX idx_suppliers_nif ON public.suppliers(nif);

-- Add an index for contact_person search performance
CREATE INDEX idx_suppliers_contact_person ON public.suppliers(contact_person);

-- Add an index for name search performance
CREATE INDEX idx_suppliers_name ON public.suppliers(name);