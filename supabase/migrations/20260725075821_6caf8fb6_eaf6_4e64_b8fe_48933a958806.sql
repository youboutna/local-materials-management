
-- 1) Drop public.users mirror
DROP TABLE IF EXISTS public.users CASCADE;

-- 2) Overly permissive policies
DROP POLICY IF EXISTS "Allow all access to payment_blocks" ON btp.payment_blocks;
DROP POLICY IF EXISTS "Allow all operations on tender_estimate_items" ON btp.tender_estimate_items;
DROP POLICY IF EXISTS "Allow all operations on tender_estimates" ON btp.tender_estimates;

-- 3) tender_workflow_status: restrict SELECT
DROP POLICY IF EXISTS "Users can view tender workflow status" ON btp.tender_workflow_status;
CREATE POLICY "Admins and participants can view tender workflow status"
  ON btp.tender_workflow_status FOR SELECT
  TO authenticated
  USING (
    btp.is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM btp.tender_estimates te
      WHERE te.id = tender_workflow_status.tender_id
        AND te.submitted_by = auth.uid()
    )
  );

-- 4) workflow_status: restrict management to admins
DROP POLICY IF EXISTS "Authenticated users can manage workflow status" ON btp.workflow_status;
CREATE POLICY "Admins can manage workflow status"
  ON btp.workflow_status FOR ALL
  TO authenticated
  USING (btp.is_current_user_admin())
  WITH CHECK (btp.is_current_user_admin());

-- 5) profiles: remove blanket view-all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 6) user_roles: drop JWT-claim policies (privilege escalation risk)
DROP POLICY IF EXISTS "director can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "manage_roles_admin_only" ON public.user_roles;

-- 7) Storage policies: enforce ownership on documents & prospect_documents
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to prospect_documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to prospect_documents" ON storage.objects;

CREATE POLICY "Owners can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

CREATE POLICY "Owners can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'documents' AND auth.uid() = owner);

CREATE POLICY "Owners can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

CREATE POLICY "Owners can read prospect_documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'prospect_documents' AND auth.uid() = owner);

CREATE POLICY "Authenticated uploads to prospect_documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'prospect_documents' AND auth.uid() = owner);

-- 8) Fixed search_path on SECURITY DEFINER functions
ALTER FUNCTION btp.admin_update_user_email(uuid, text) SET search_path = public;
ALTER FUNCTION btp.assign_user_role(uuid, text) SET search_path = public;
ALTER FUNCTION btp.generate_supplier_reset_token(text) SET search_path = public;
ALTER FUNCTION btp.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION btp.get_user_roles(uuid) SET search_path = public;
ALTER FUNCTION btp.handle_new_user() SET search_path = public;
ALTER FUNCTION btp.handle_oauth_user_profile() SET search_path = public;
ALTER FUNCTION btp.has_role(uuid, text) SET search_path = public;

-- 9) Revoke EXECUTE on admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION btp.admin_update_user_email(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION btp.assign_user_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION btp.generate_supplier_reset_token(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION btp.create_progress_invoice(uuid, uuid, numeric, numeric, text, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION btp.create_station_from_authorization(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION btp.create_supplier_payment_request(uuid, numeric, text, text, uuid, text[], text) FROM PUBLIC, anon;
