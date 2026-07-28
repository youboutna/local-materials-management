
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind='v' AND n.nspname IN ('public','btp')
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(c.reloptions,'{}')) o
        WHERE o ILIKE 'security_invoker=%'
      )
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on)', r.nspname, r.relname);
  END LOOP;
END $$;
