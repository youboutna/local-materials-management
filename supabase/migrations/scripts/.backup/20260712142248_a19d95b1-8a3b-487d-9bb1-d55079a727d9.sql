CREATE TABLE IF NOT EXISTS btp.boq_alignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_name text NOT NULL,
  normalized_key text NOT NULL,
  resource_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('material','labor','equipment')),
  occurrences integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_key, resource_id)
);

CREATE INDEX IF NOT EXISTS boq_alignment_history_key_idx ON btp.boq_alignment_history (normalized_key);
CREATE INDEX IF NOT EXISTS boq_alignment_history_resource_idx ON btp.boq_alignment_history (resource_id);

-- Expose via public view for PostgREST (btp schema is served through mirror views elsewhere).
CREATE OR REPLACE VIEW btp.boq_alignment_history AS
  SELECT * FROM btp.boq_alignment_history;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_alignment_history TO authenticated;
GRANT ALL ON btp.boq_alignment_history TO service_role;

GRANT USAGE ON SCHEMA btp TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_alignment_history TO authenticated;
GRANT ALL ON btp.boq_alignment_history TO service_role;

ALTER TABLE btp.boq_alignment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read alignment history" ON btp.boq_alignment_history;
CREATE POLICY "Authenticated can read alignment history"
  ON btp.boq_alignment_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert alignment entries" ON btp.boq_alignment_history;
CREATE POLICY "Authenticated can insert alignment entries"
  ON btp.boq_alignment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin can update alignment entries" ON btp.boq_alignment_history;
CREATE POLICY "Owner or admin can update alignment entries"
  ON btp.boq_alignment_history FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR btp.is_current_user_admin())
  WITH CHECK (created_by = auth.uid() OR btp.is_current_user_admin());

DROP POLICY IF EXISTS "Owner or admin can delete alignment entries" ON btp.boq_alignment_history;
CREATE POLICY "Owner or admin can delete alignment entries"
  ON btp.boq_alignment_history FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR btp.is_current_user_admin());

CREATE OR REPLACE FUNCTION btp.set_boq_alignment_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS boq_alignment_history_touch ON btp.boq_alignment_history;
CREATE TRIGGER boq_alignment_history_touch
  BEFORE UPDATE ON btp.boq_alignment_history
  FOR EACH ROW EXECUTE FUNCTION btp.set_boq_alignment_updated_at();
