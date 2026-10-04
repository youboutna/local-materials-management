ALTER TABLE btp.boq_lines
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS business_status text,
  ADD COLUMN IF NOT EXISTS facturx_type_code text,
  ADD COLUMN IF NOT EXISTS billed_percentage numeric;

CREATE INDEX IF NOT EXISTS idx_boq_lines_document_type ON btp.boq_lines(document_type);
CREATE INDEX IF NOT EXISTS idx_boq_lines_business_status ON btp.boq_lines(business_status);

UPDATE btp.boq_lines
SET document_type = COALESCE(document_type, metadata->'invoiceWorkflow'->>'documentType', dqe_type),
    business_status = COALESCE(business_status, metadata->'invoiceWorkflow'->>'businessStatus'),
    facturx_type_code = COALESCE(facturx_type_code, metadata->'invoiceWorkflow'->>'facturxTypeCode'),
    billed_percentage = COALESCE(billed_percentage, NULLIF(metadata->'invoiceWorkflow'->>'percentage','')::numeric)
WHERE document_type IS NULL OR business_status IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_lines TO authenticated;
GRANT ALL ON btp.boq_lines TO service_role;