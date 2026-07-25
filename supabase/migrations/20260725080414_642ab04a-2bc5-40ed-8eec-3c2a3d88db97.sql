
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname='fuel_stations'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND (qual='true' OR with_check='true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR %s TO authenticated %s %s',
      r.policyname, r.schemaname, r.tablename, r.cmd,
      CASE WHEN r.qual IS NOT NULL THEN 'USING (auth.uid() IS NOT NULL)' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN 'WITH CHECK (auth.uid() IS NOT NULL)' ELSE '' END
    );
  END LOOP;
END $$;
