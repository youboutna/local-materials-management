-- =============================================================================
-- MIGRATION: improve_inspections_rls
-- Description: Ajout de la colonne created_by sur projects et amélioration des RLS pour inspections
-- =============================================================================

-- 0. Ajout de la colonne manquante created_by sur la table projects (CORRECTION ICI)
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- 1. Suppression des anciennes politiques
DROP POLICY IF EXISTS "Allow authenticated users to view inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to insert inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to update inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to delete inspections" ON btp.inspections;

-- 2. POLITIQUE DE SÉLECTION (SELECT)
CREATE POLICY "Users can view inspections for their projects"
ON btp.inspections
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur est impliqué dans le projet en tant que stakeholder
  EXISTS (
    SELECT 1 FROM btp.project_stakeholders ps
    LEFT JOIN btp.suppliers s ON ps.supplier_id = s.id
    LEFT JOIN btp.employees e ON ps.employee_id = e.id
    WHERE ps.project_id = inspections.project_id
    AND (
      s.user_id = auth.uid() 
      OR e.user_id = auth.uid()
    )
  )
  -- OU l'utilisateur a créé le projet (utilise la colonne fraîchement ajoutée)
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
  -- OU l'utilisateur a un rôle admin/manager/director
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director')
  )
);

-- 3. POLITIQUE D'INSERTION (INSERT)
CREATE POLICY "Authorized users can create inspections"
ON btp.inspections
FOR INSERT
TO authenticated
WITH CHECK (
  -- Seuls les admin, manager, director, ou agent peuvent créer des inspections
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OU l'utilisateur a créé le projet
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
);

-- 4. POLITIQUE DE MISE À JOUR (UPDATE)
CREATE POLICY "Authorized users can update inspections"
ON btp.inspections
FOR UPDATE
TO authenticated
USING (
  -- Admin/manager/director/agent peuvent mettre à jour
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OU l'utilisateur a créé le projet
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
);

-- 5. POLITIQUE DE SUPPRESSION (DELETE)
CREATE POLICY "Only admins can delete inspections"
ON btp.inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager')
  )
);

-- 6. Commentaires explicatifs
COMMENT ON POLICY "Users can view inspections for their projects" ON btp.inspections IS 
  'Allows suppliers and employees to view inspections for projects they are stakeholders in';

COMMENT ON POLICY "Authorized users can create inspections" ON btp.inspections IS 
  'Allows project managers and admins to create inspections';

COMMENT ON POLICY "Authorized users can update inspections" ON btp.inspections IS 
  'Allows project managers and admins to update inspections';

COMMENT ON POLICY "Only admins can delete inspections" ON btp.inspections IS 
  'Only admins and managers can delete inspections';