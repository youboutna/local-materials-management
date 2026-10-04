-- 1) Fonction unique d'accès projet (responsable, hiérarchie organisationnelle, parties prenantes, rôles privilégiés)
CREATE OR REPLACE FUNCTION btp.has_project_access(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = btp, public
AS $$
  SELECT
    public.has_any_role(auth.uid(), ARRAY['admin','super_admin','director','manager','project_manager','engineering_consultant'])
    OR EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = _project_id AND p.project_responsable_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM btp.project_organizations po
      JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
      JOIN btp.employees e ON oh.employee_id = e.id
      WHERE po.project_id = _project_id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM btp.project_stakeholders ps
      WHERE ps.project_id = _project_id
        AND (ps.employee_id IN (SELECT e2.id FROM btp.employees e2 WHERE e2.user_id = auth.uid()))
    );
$$;

-- 2) project_resources : politiques unifiées
DROP POLICY IF EXISTS "Users can create project resources if they have project access" ON btp.project_resources;
DROP POLICY IF EXISTS "Users can update project resources if they have project access" ON btp.project_resources;
DROP POLICY IF EXISTS "Users can delete project resources if they have project access" ON btp.project_resources;
DROP POLICY IF EXISTS "Users can view project resources if they have project access" ON btp.project_resources;

CREATE POLICY "Project access can view project resources"
  ON btp.project_resources FOR SELECT TO authenticated
  USING (btp.has_project_access(project_id));
CREATE POLICY "Project access can create project resources"
  ON btp.project_resources FOR INSERT TO authenticated
  WITH CHECK (btp.has_project_access(project_id));
CREATE POLICY "Project access can update project resources"
  ON btp.project_resources FOR UPDATE TO authenticated
  USING (btp.has_project_access(project_id))
  WITH CHECK (btp.has_project_access(project_id));
CREATE POLICY "Project access can delete project resources"
  ON btp.project_resources FOR DELETE TO authenticated
  USING (btp.has_project_access(project_id));

-- 3) Autoriser la famille « équipement » (propagation DQE)
ALTER TABLE btp.project_resources DROP CONSTRAINT IF EXISTS project_resources_type_check;
ALTER TABLE btp.project_resources
  ADD CONSTRAINT project_resources_type_check
  CHECK (type = ANY (ARRAY['human','material','equipment']));

-- 4) Jalons : écriture réservée aux accès projet (au lieu de tout utilisateur connecté)
DROP POLICY IF EXISTS "Authenticated users can manage project milestones" ON btp.project_milestones;
CREATE POLICY "Project access can manage project milestones"
  ON btp.project_milestones FOR ALL TO authenticated
  USING (btp.has_project_access(project_id))
  WITH CHECK (btp.has_project_access(project_id));