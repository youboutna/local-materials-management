CREATE TABLE IF NOT EXISTS btp.phase_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL,
  project_id UUID,
  material_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(phase_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_phase_materials_phase ON btp.phase_materials(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_materials_project ON btp.phase_materials(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.phase_materials TO authenticated;
GRANT ALL ON btp.phase_materials TO service_role;

ALTER TABLE btp.phase_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view phase materials"
  ON btp.phase_materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert phase materials"
  ON btp.phase_materials FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update phase materials"
  ON btp.phase_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete phase materials"
  ON btp.phase_materials FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_phase_materials_updated_at
  BEFORE UPDATE ON btp.phase_materials
  FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column();