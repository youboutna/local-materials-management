
-- Ensure btp schema exists and is usable
CREATE SCHEMA IF NOT EXISTS btp;
GRANT USAGE ON SCHEMA btp TO anon, authenticated, service_role;

-- === btp.tender_lots ===
CREATE TABLE IF NOT EXISTS btp.tender_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL,
  project_id uuid NULL,
  number integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT '',
  description text NULL,
  estimated_amount numeric NULL,
  linked_phase_ids uuid[] NOT NULL DEFAULT '{}',
  linked_step_ids uuid[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  deliverables text[] NOT NULL DEFAULT '{}',
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_lots TO authenticated;
GRANT ALL ON btp.tender_lots TO service_role;

ALTER TABLE btp.tender_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "btp_tender_lots_select" ON btp.tender_lots;
CREATE POLICY "btp_tender_lots_select" ON btp.tender_lots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "btp_tender_lots_insert" ON btp.tender_lots;
CREATE POLICY "btp_tender_lots_insert" ON btp.tender_lots FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "btp_tender_lots_update" ON btp.tender_lots;
CREATE POLICY "btp_tender_lots_update" ON btp.tender_lots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "btp_tender_lots_delete" ON btp.tender_lots;
CREATE POLICY "btp_tender_lots_delete" ON btp.tender_lots FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_btp_tender_lots_tender_id ON btp.tender_lots(tender_id);

DROP TRIGGER IF EXISTS trg_btp_tender_lots_updated ON btp.tender_lots;
CREATE TRIGGER trg_btp_tender_lots_updated
  BEFORE UPDATE ON btp.tender_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === btp.tender_lot_documents ===
CREATE TABLE IF NOT EXISTS btp.tender_lot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL,
  lot_id uuid NULL,
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

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_lot_documents TO authenticated;
GRANT ALL ON btp.tender_lot_documents TO service_role;

ALTER TABLE btp.tender_lot_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "btp_tender_lot_documents_select" ON btp.tender_lot_documents;
CREATE POLICY "btp_tender_lot_documents_select" ON btp.tender_lot_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "btp_tender_lot_documents_insert" ON btp.tender_lot_documents;
CREATE POLICY "btp_tender_lot_documents_insert" ON btp.tender_lot_documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "btp_tender_lot_documents_update" ON btp.tender_lot_documents;
CREATE POLICY "btp_tender_lot_documents_update" ON btp.tender_lot_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "btp_tender_lot_documents_delete" ON btp.tender_lot_documents;
CREATE POLICY "btp_tender_lot_documents_delete" ON btp.tender_lot_documents FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_btp_tender_lot_documents_tender_id ON btp.tender_lot_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_btp_tender_lot_documents_lot_id ON btp.tender_lot_documents(lot_id);

DROP TRIGGER IF EXISTS trg_btp_tender_lot_documents_updated ON btp.tender_lot_documents;
CREATE TRIGGER trg_btp_tender_lot_documents_updated
  BEFORE UPDATE ON btp.tender_lot_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from public if any rows exist there
INSERT INTO btp.tender_lots (
  id, tender_id, project_id, number, title, description, estimated_amount,
  linked_phase_ids, linked_step_ids, requirements, deliverables,
  created_by, created_at, updated_at
)
SELECT id, tender_id, project_id, number, title, description, estimated_amount,
       linked_phase_ids, linked_step_ids, requirements, deliverables,
       created_by, created_at, updated_at
FROM public.tender_lots
ON CONFLICT (id) DO NOTHING;

INSERT INTO btp.tender_lot_documents (
  id, tender_id, lot_id, title, description, category, file_url,
  file_name, file_size, mime_type, uploaded_by, created_at, updated_at
)
SELECT id, tender_id, lot_id, title, description, category, file_url,
       file_name, file_size, mime_type, uploaded_by, created_at, updated_at
FROM public.tender_lot_documents
ON CONFLICT (id) DO NOTHING;
