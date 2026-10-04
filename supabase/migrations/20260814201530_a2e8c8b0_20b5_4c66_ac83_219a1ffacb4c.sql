ALTER TABLE btp.workspaces
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.workspaces TO authenticated;
GRANT ALL ON btp.workspaces TO service_role;

ALTER TABLE btp.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select_authenticated" ON btp.workspaces;
CREATE POLICY "workspaces_select_authenticated" ON btp.workspaces
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON btp.workspaces;
CREATE POLICY "workspaces_insert_authenticated" ON btp.workspaces
  FOR INSERT TO authenticated WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_update_authenticated" ON btp.workspaces;
CREATE POLICY "workspaces_update_authenticated" ON btp.workspaces
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workspaces_delete_owner_or_admin" ON btp.workspaces;
CREATE POLICY "workspaces_delete_owner_or_admin" ON btp.workspaces
  FOR DELETE TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin','director','manager']));

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON btp.workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON btp.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();