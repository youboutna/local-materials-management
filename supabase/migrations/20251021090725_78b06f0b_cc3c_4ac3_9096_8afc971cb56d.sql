-- Améliorer les RLS policies pour la table inspections
-- Pour permettre aux fournisseurs de voir les inspections de leurs projets

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to insert inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to update inspections" ON btp.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to delete inspections" ON btp.inspections;

-- Create better RLS policies for inspections

-- 1. SELECT policy: Allow users to view inspections for projects they're involved in
CREATE POLICY "Users can view inspections for their projects"
ON btp.inspections
FOR SELECT
TO authenticated
USING (
  -- Allow if user is involved in the project as a stakeholder
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
  -- OR if user created the project
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
  -- OR if user has admin/manager role
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director')
  )
);

-- 2. INSERT policy: Allow authenticated users with proper roles to create inspections
CREATE POLICY "Authorized users can create inspections"
ON btp.inspections
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admin, manager, director, or agents can create inspections
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OR if user created the project
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
);

-- 3. UPDATE policy: Allow users to update inspections for their projects
CREATE POLICY "Authorized users can update inspections"
ON btp.inspections
FOR UPDATE
TO authenticated
USING (
  -- Admin/manager/director can update any inspection
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OR if user created the project
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
);

-- 4. DELETE policy: Only admin/manager can delete inspections
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

-- Add helpful comments
COMMENT ON POLICY "Users can view inspections for their projects" ON btp.inspections IS 
  'Allows suppliers and employees to view inspections for projects they are stakeholders in';

COMMENT ON POLICY "Authorized users can create inspections" ON btp.inspections IS 
  'Allows project managers and admins to create inspections';

COMMENT ON POLICY "Authorized users can update inspections" ON btp.inspections IS 
  'Allows project managers and admins to update inspections';

COMMENT ON POLICY "Only admins can delete inspections" ON btp.inspections IS 
  'Only admins and managers can delete inspections';