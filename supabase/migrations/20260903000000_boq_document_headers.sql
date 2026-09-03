-- ============================================================================
-- MIGRATION: boq_document_headers
-- Description: Table des en-têtes documentaires BOQ
-- Référence: boq_lines.document_id → boq_document_headers.document_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS btp.boq_document_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE,

  -- DocumentHeaderDTO
  reference TEXT,
  issue_date DATE,
  currency TEXT DEFAULT 'MRU',
  validity_days INTEGER DEFAULT 30,
  facturx_type_code TEXT DEFAULT '310',
  notes TEXT,

  -- Émetteur (DocumentPartyDTO)
  sender_id UUID,
  sender_name TEXT NOT NULL,
  sender_kind TEXT,
  sender_tax_id TEXT,
  sender_address TEXT,
  sender_phone TEXT,
  sender_email TEXT,

  -- Destinataire principal (DocumentPartyDTO)
  recipient_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_kind TEXT,
  recipient_tax_id TEXT,
  recipient_address TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Destinataires additionnels (DocumentPartyDTO[])
  extra_recipients JSONB DEFAULT '[]',

  -- Workflow
  workflow_stage TEXT DEFAULT 'draft',
  validation_status TEXT,
  validation_comment TEXT,

  -- Signature
  signed_by TEXT,
  signed_at TIMESTAMPTZ,
  signature_role TEXT,

  -- Traçabilité DQE
  source_document_id UUID,
  source_document_type TEXT,
  next_document_id UUID,
  next_document_type TEXT,
  stages_history JSONB DEFAULT '[]',
  workflow_instance_id TEXT,

  -- Métadonnées
  metadata JSONB,
  deleted_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- INDEX
CREATE UNIQUE INDEX idx_boq_doc_headers_document_id ON btp.boq_document_headers(document_id);
CREATE INDEX idx_boq_doc_headers_workflow_stage ON btp.boq_document_headers(workflow_stage);
CREATE INDEX idx_boq_doc_headers_source_doc ON btp.boq_document_headers(source_document_id);
CREATE INDEX idx_boq_doc_headers_next_doc ON btp.boq_document_headers(next_document_id);

-- RLS
ALTER TABLE btp.boq_document_headers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boq_doc_headers_select" ON btp.boq_document_headers
  FOR SELECT USING (true);

CREATE POLICY "boq_doc_headers_insert" ON btp.boq_document_headers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "boq_doc_headers_update" ON btp.boq_document_headers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "boq_doc_headers_delete" ON btp.boq_document_headers
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION btp.tg_boq_doc_headers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boq_doc_headers_updated_at
  BEFORE UPDATE ON btp.boq_document_headers
  FOR EACH ROW
  EXECUTE FUNCTION btp.tg_boq_doc_headers_updated_at();

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_document_headers TO authenticated;
GRANT SELECT ON btp.boq_document_headers TO anon;
GRANT ALL ON btp.boq_document_headers TO service_role;