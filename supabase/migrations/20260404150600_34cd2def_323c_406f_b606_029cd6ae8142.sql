-- Enable RLS on the locations table (schéma résolu dynamiquement : la table est
-- créée sans qualification dans 20260216100000, donc selon le search_path elle
-- peut résider dans `public` ou `btp`).
DO $$
DECLARE
    v_schema TEXT;
BEGIN
    SELECT table_schema INTO v_schema
    FROM information_schema.tables
    WHERE table_name = 'locations' AND table_schema IN ('public', 'btp')
    ORDER BY CASE table_schema WHEN 'public' THEN 1 ELSE 2 END
    LIMIT 1;

    IF v_schema IS NULL THEN
        RAISE NOTICE 'Table locations introuvable — migration ignorée';
        RETURN;
    END IF;

    EXECUTE format('ALTER TABLE %I.locations ENABLE ROW LEVEL SECURITY', v_schema);

    EXECUTE format('DROP POLICY IF EXISTS "Anyone can read locations" ON %I.locations', v_schema);
    EXECUTE format($p$
        CREATE POLICY "Anyone can read locations"
        ON %I.locations
        FOR SELECT
        TO anon, authenticated
        USING (true)
    $p$, v_schema);

    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage locations" ON %I.locations', v_schema);
    EXECUTE format($p$
        CREATE POLICY "Authenticated users can manage locations"
        ON %I.locations
        FOR ALL
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL)
    $p$, v_schema);

    EXECUTE format('GRANT SELECT ON %I.locations TO anon, authenticated', v_schema);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON %I.locations TO authenticated', v_schema);
    EXECUTE format('GRANT ALL ON %I.locations TO service_role', v_schema);
END
$$;
