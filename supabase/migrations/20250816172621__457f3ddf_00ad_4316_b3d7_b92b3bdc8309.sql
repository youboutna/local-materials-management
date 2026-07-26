-- Add material identifiers and multi-language support
ALTER TABLE materials ADD COLUMN gtin VARCHAR(14) NULL;
ALTER TABLE materials ADD COLUMN sku VARCHAR(100) NULL;
ALTER TABLE materials ADD COLUMN ean VARCHAR(13) NULL;
ALTER TABLE materials ADD COLUMN asin VARCHAR(10) NULL;
ALTER TABLE materials ADD COLUMN multilang_labels JSONB NULL DEFAULT '{}'::JSONB;

-- Create material_documents table for invoice, delivery note, warranty documents
CREATE TABLE material_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'delivery_note', 'warranty', 'certificate', 'manual', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255),
  file_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_number VARCHAR(100),
  document_date DATE,
  expiry_date DATE,
  supplier_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::JSONB,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_materials_gtin ON materials(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX idx_materials_sku ON materials(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_materials_ean ON materials(ean) WHERE ean IS NOT NULL;
CREATE INDEX idx_materials_asin ON materials(asin) WHERE asin IS NOT NULL;
CREATE INDEX idx_material_documents_material_id ON material_documents(material_id);
CREATE INDEX idx_material_documents_type ON material_documents(document_type);
CREATE INDEX idx_material_documents_date ON material_documents(document_date);

-- Enable RLS on material_documents
ALTER TABLE material_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for material_documents
CREATE POLICY "Allow public access to material documents"
ON material_documents FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_material_documents_updated_at
  BEFORE UPDATE ON material_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();