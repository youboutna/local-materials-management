
CREATE TABLE btp.tender_lot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL,
  lot_id uuid NULL REFERENCES btp.tender_lots(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  category text NULL,
  file_url text NOT NULL,
  file_name text NULL,
  file_size bigint NULL,
  mime_type text NULL,
  uploaded_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tender_lot_documents_tender ON btp.tender_lot_documents(tender_id);
CREATE INDEX idx_tender_lot_documents_lot ON btp.tender_lot_documents(lot_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_lot_documents TO authenticated;
GRANT ALL ON btp.tender_lot_documents TO service_role;

ALTER TABLE btp.tender_lot_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read tender lot documents" ON btp.tender_lot_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert tender lot documents" ON btp.tender_lot_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update tender lot documents" ON btp.tender_lot_documents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete tender lot documents" ON btp.tender_lot_documents
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_tender_lot_documents_updated_at
  BEFORE UPDATE ON btp.tender_lot_documents
  FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column();
