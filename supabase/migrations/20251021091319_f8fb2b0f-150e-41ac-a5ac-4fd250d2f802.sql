-- Fix RLS policies for inspections - Allow broader access while maintaining security

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view inspections for their projects" ON public.inspections;
DROP POLICY IF EXISTS "Authorized users can create inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authorized users can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Only admins can delete inspections" ON public.inspections;

-- 1. SELECT policy: Allow authenticated users to view inspections
-- Suppliers can see inspections for their projects through the service layer
CREATE POLICY "Authenticated users can view inspections"
ON public.inspections
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT policy: Allow authenticated users with proper roles to create inspections
CREATE POLICY "Authorized users can create inspections"
ON public.inspections
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin, manager, director, or agents can create
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OR if user created the project
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
);

-- 3. UPDATE policy: Allow authorized users to update inspections
CREATE POLICY "Authorized users can update inspections"
ON public.inspections
FOR UPDATE
TO authenticated
USING (
  -- Admin/manager/director/agent can update
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  -- OR if user created the project
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = inspections.project_id
    AND p.created_by = auth.uid()
  )
  -- OR if user is a stakeholder of the project (supplier or employee)
  OR EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    LEFT JOIN public.suppliers s ON ps.supplier_id = s.id
    LEFT JOIN public.employees e ON ps.employee_id = e.id
    WHERE ps.project_id = inspections.project_id
    AND (s.user_id = auth.uid() OR e.user_id = auth.uid())
  )
);

-- 4. DELETE policy: Only admin/manager can delete
CREATE POLICY "Only admins can delete inspections"
ON public.inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager')
  )
);

COMMENT ON POLICY "Authenticated users can view inspections" ON public.inspections IS 
  'All authenticated users can view inspections - filtering is done at the service layer';

COMMENT ON POLICY "Authorized users can create inspections" ON public.inspections IS 
  'Project managers, admins, and project creators can create inspections';

COMMENT ON POLICY "Authorized users can update inspections" ON public.inspections IS 
  'Project stakeholders (suppliers/employees), managers and admins can update inspections';

COMMENT ON POLICY "Only admins can delete inspections" ON public.inspections IS 
  'Only admins and managers can delete inspections';