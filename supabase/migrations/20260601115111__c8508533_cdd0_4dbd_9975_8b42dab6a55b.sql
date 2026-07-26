CREATE TABLE IF NOT EXISTS btp.inspection_pvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL,
  pv_number text NOT NULL,
  pv_type text NOT NULL,
  title text,
  content text NOT NULL,
  pdf_url text,
  status text NOT NULL DEFAULT 'draft',
  generated_by text,
  version integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspection_pvs TO authenticated;
GRANT ALL ON btp.inspection_pvs TO service_role;

ALTER TABLE btp.inspection_pvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read inspection PVs"
  ON btp.inspection_pvs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create inspection PVs"
  ON btp.inspection_pvs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update inspection PVs"
  ON btp.inspection_pvs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can delete inspection PVs"
  ON btp.inspection_pvs FOR DELETE TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_inspection_id ON btp.inspection_pvs(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_pvs_generated_at ON btp.inspection_pvs(generated_at DESC);

CREATE TRIGGER update_inspection_pvs_updated_at
  BEFORE UPDATE ON btp.inspection_pvs
  FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column();