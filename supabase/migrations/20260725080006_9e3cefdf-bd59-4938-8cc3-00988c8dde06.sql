
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public','btp','fuel_stations')
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = %I, public',
                     r.nspname, r.proname, r.args, r.nspname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
