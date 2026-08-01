-- Allow the authenticated full-dataset import workflow for explicitly
-- authorized business roles. Never expose the service-role key to the browser.

CREATE OR REPLACE FUNCTION btp.can_import_full_dataset()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, btp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director', 'manager')
  );
$$;

REVOKE ALL ON FUNCTION btp.can_import_full_dataset() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION btp.can_import_full_dataset() TO authenticated;

DROP POLICY IF EXISTS "Authorized users can import organizations" ON btp.organizations;
CREATE POLICY "Authorized users can import organizations"
ON btp.organizations
FOR INSERT
TO authenticated
WITH CHECK (btp.can_import_full_dataset());

DROP POLICY IF EXISTS "Authorized users can update imported organizations" ON btp.organizations;
CREATE POLICY "Authorized users can update imported organizations"
ON btp.organizations
FOR UPDATE
TO authenticated
USING (btp.can_import_full_dataset())
WITH CHECK (btp.can_import_full_dataset());

DROP POLICY IF EXISTS "Authorized users can import suppliers" ON btp.suppliers;
CREATE POLICY "Authorized users can import suppliers"
ON btp.suppliers
FOR INSERT
TO authenticated
WITH CHECK (btp.can_import_full_dataset());

DROP POLICY IF EXISTS "Authorized users can update imported suppliers" ON btp.suppliers;
CREATE POLICY "Authorized users can update imported suppliers"
ON btp.suppliers
FOR UPDATE
TO authenticated
USING (btp.can_import_full_dataset())
WITH CHECK (btp.can_import_full_dataset());

NOTIFY pgrst, 'reload schema';
