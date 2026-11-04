CREATE TABLE IF NOT EXISTS btp.receptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  phase_id uuid,
  type text NOT NULL CHECK (type IN ('provisional','definitive')),
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_date date NOT NULL,
  actual_date date,
  chairman_id uuid,
  chairman_name text NOT NULL DEFAULT '',
  reception_committee jsonb NOT NULL DEFAULT '[]'::jsonb,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  inspections jsonb NOT NULL DEFAULT '[]'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  provisional_valid_until date,
  definitive_approval_date date,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS receptions_project_idx ON btp.receptions(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.receptions TO authenticated;
GRANT ALL ON btp.receptions TO service_role;
ALTER TABLE btp.receptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY receptions_read ON btp.receptions FOR SELECT TO authenticated
  USING (public.project_workbench_access(project_id, false));
CREATE POLICY receptions_insert ON btp.receptions FOR INSERT TO authenticated
  WITH CHECK (public.project_workbench_access(project_id, true));
CREATE POLICY receptions_update ON btp.receptions FOR UPDATE TO authenticated
  USING (public.project_workbench_access(project_id, true)) WITH CHECK (public.project_workbench_access(project_id, true));
CREATE POLICY receptions_delete ON btp.receptions FOR DELETE TO authenticated
  USING (public.project_workbench_access(project_id, true));
CREATE TRIGGER receptions_updated_at BEFORE UPDATE ON btp.receptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();