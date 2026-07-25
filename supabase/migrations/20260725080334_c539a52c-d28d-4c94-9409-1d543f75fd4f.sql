
DO $$
DECLARE r RECORD;
  new_qual TEXT;
  new_check TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public','btp')
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    new_qual := CASE WHEN r.qual IS NULL THEN NULL
                     WHEN r.qual = 'true' THEN '(auth.uid() IS NOT NULL)'
                     ELSE r.qual END;
    new_check := CASE WHEN r.with_check IS NULL THEN NULL
                      WHEN r.with_check = 'true' THEN '(auth.uid() IS NOT NULL)'
                      ELSE r.with_check END;
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR %s TO authenticated %s %s',
      r.policyname, r.schemaname, r.tablename, r.cmd,
      CASE WHEN new_qual IS NOT NULL THEN 'USING ('||new_qual||')' ELSE '' END,
      CASE WHEN new_check IS NOT NULL THEN 'WITH CHECK ('||new_check||')' ELSE '' END
    );
  END LOOP;
END $$;
