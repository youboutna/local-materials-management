DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='btp' AND c.relname='tender_access_logs') THEN
    EXECUTE 'ALTER TABLE btp.tender_access_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT USAGE ON SCHEMA btp TO authenticated, anon, service_role';
    EXECUTE 'GRANT SELECT, INSERT ON btp.tender_access_logs TO authenticated';
    EXECUTE 'GRANT ALL ON btp.tender_access_logs TO service_role';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_users_can_insert_access_logs" ON btp.tender_access_logs';
    EXECUTE 'CREATE POLICY "authenticated_users_can_insert_access_logs" ON btp.tender_access_logs FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_users_can_read_access_logs" ON btp.tender_access_logs';
    EXECUTE 'CREATE POLICY "authenticated_users_can_read_access_logs" ON btp.tender_access_logs FOR SELECT TO authenticated USING (true)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='btp' AND c.relname='tender_sharing_access_logs') THEN
    EXECUTE 'ALTER TABLE btp.tender_sharing_access_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT ON btp.tender_sharing_access_logs TO authenticated';
    EXECUTE 'GRANT ALL ON btp.tender_sharing_access_logs TO service_role';
    EXECUTE 'DROP POLICY IF EXISTS "sharing_logs_insert_auth" ON btp.tender_sharing_access_logs';
    EXECUTE 'CREATE POLICY "sharing_logs_insert_auth" ON btp.tender_sharing_access_logs FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "sharing_logs_select_auth" ON btp.tender_sharing_access_logs';
    EXECUTE 'CREATE POLICY "sharing_logs_select_auth" ON btp.tender_sharing_access_logs FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;