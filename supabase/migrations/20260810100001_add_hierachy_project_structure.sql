CREATE TABLE IF NOT EXISTS btp.project_hierarchy_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'task',
  parent_id uuid REFERENCES btp.project_hierarchy_nodes(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  path text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phn_project ON btp.project_hierarchy_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_phn_parent ON btp.project_hierarchy_nodes(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_hierarchy_nodes TO authenticated;
GRANT ALL ON btp.project_hierarchy_nodes TO service_role;

ALTER TABLE btp.project_hierarchy_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated manage hierarchy nodes" ON btp.project_hierarchy_nodes;
CREATE POLICY "authenticated manage hierarchy nodes"
ON btp.project_hierarchy_nodes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION btp.set_hierarchy_node_derived()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = btp, public
AS $$
DECLARE
  parent_level integer;
  parent_path text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
    NEW.path := NEW.name;
  ELSE
    SELECT level, path INTO parent_level, parent_path
    FROM btp.project_hierarchy_nodes WHERE id = NEW.parent_id;
    NEW.level := COALESCE(parent_level, 1) + 1;
    NEW.path := COALESCE(parent_path, 'root') || '.' || NEW.name;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_phn_derived ON btp.project_hierarchy_nodes;
CREATE TRIGGER trg_phn_derived
BEFORE INSERT OR UPDATE ON btp.project_hierarchy_nodes
FOR EACH ROW EXECUTE FUNCTION btp.set_hierarchy_node_derived();