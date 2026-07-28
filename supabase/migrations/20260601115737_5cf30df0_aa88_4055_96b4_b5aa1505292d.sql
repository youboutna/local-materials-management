CREATE TABLE IF NOT EXISTS btp.inspection_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL,
  document_id text,
  document_name text NOT NULL,
  document_url text NOT NULL,
  document_type text,
  file_size bigint,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspection_documents TO authenticated;
GRANT ALL ON btp.inspection_documents TO service_role;

ALTER TABLE btp.inspection_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read inspection documents"
  ON btp.inspection_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create inspection documents"
  ON btp.inspection_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update inspection documents"
  ON btp.inspection_documents FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete inspection documents"
  ON btp.inspection_documents FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_inspection_documents_inspection_id ON btp.inspection_documents(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_documents_uploaded_at ON btp.inspection_documents(uploaded_at DESC);

CREATE TRIGGER update_inspection_documents_updated_at
  BEFORE UPDATE ON btp.inspection_documents
  FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column();