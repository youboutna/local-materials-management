-- =============================================================================
-- MIGRATION : 20250920100137_create_system_settings_and_processing_logs.sql
-- Date       : 2025-09-20
-- Objet      : Créer/compléter btp.system_settings + btp.processing_logs
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin()
--   - Trigger via public.update_timestamp()
--   - Pas de CHECK sur les nomenclatures
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.is_current_user_admin EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION btp.is_current_user_admin()
      RETURNS BOOLEAN
      LANGUAGE SQL
      SECURITY DEFINER
      STABLE
      SET search_path = ''
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role_name IN ('admin', 'director')
        );
      $body$;
    $fn$;

    REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO authenticated;
    RAISE NOTICE '✅ Fonction btp.is_current_user_admin() créée';
  ELSE
    RAISE NOTICE 'ℹ️  btp.is_current_user_admin() déjà présente';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.system_settings (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.system_settings
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS key TEXT,
  ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Contrainte UNIQUE si absente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'system_settings_category_key_key'
      AND conrelid = 'btp.system_settings'::regclass
  ) THEN
    ALTER TABLE btp.system_settings
      ADD CONSTRAINT system_settings_category_key_key
      UNIQUE (category, key);
    RAISE NOTICE '  ✅ UNIQUE (category, key) ajouté à system_settings';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.system_settings créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.processing_logs (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_type TEXT NOT NULL,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.processing_logs
  ADD COLUMN IF NOT EXISTS process_type TEXT,
  ADD COLUMN IF NOT EXISTS summary JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.processing_logs créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.system_settings FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.processing_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('system_settings', 'processing_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES SÉCURISÉES
-- =============================================================================

-- 5.1 : btp.system_settings

-- Admins : gestion complète
CREATE POLICY "Admins can manage system settings"
ON btp.system_settings
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Utilisateurs authentifiés : lecture (config publique)
CREATE POLICY "Authenticated can view system settings"
ON btp.system_settings
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage system settings" ON btp.system_settings IS
  'Admin/director : gestion complète des paramètres système.';
COMMENT ON POLICY "Authenticated can view system settings" ON btp.system_settings IS
  'Tous les utilisateurs authentifiés peuvent lire les paramètres système.';

-- 5.2 : btp.processing_logs

-- Admins : gestion complète
CREATE POLICY "Admins can manage processing logs"
ON btp.processing_logs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Utilisateurs authentifiés : insertion (le système insère via service_role ou auth)
CREATE POLICY "Authenticated can insert processing logs"
ON btp.processing_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Utilisateurs authentifiés : lecture
CREATE POLICY "Authenticated can view processing logs"
ON btp.processing_logs
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage processing logs" ON btp.processing_logs IS
  'Admin/director : gestion complète des logs.';
COMMENT ON POLICY "Authenticated can insert processing logs" ON btp.processing_logs IS
  'Les utilisateurs authentifiés peuvent insérer des logs.';
COMMENT ON POLICY "Authenticated can view processing logs" ON btp.processing_logs IS
  'Tous les utilisateurs authentifiés peuvent lire les logs.';

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.system_settings TO authenticated;
GRANT SELECT ON btp.system_settings TO anon;
GRANT ALL ON btp.system_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.processing_logs TO authenticated;
GRANT SELECT ON btp.processing_logs TO anon;
GRANT ALL ON btp.processing_logs TO service_role;

-- =============================================================================
-- ÉTAPE 7 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_category
  ON btp.system_settings(category);

CREATE INDEX IF NOT EXISTS idx_system_settings_key
  ON btp.system_settings(key);

CREATE INDEX IF NOT EXISTS idx_processing_logs_process_type
  ON btp.processing_logs(process_type);

CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at
  ON btp.processing_logs(created_at DESC);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 8 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_timestamp'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_timestamp()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $body$;
    $fn$;
    RAISE NOTICE '  Fonction public.update_timestamp() créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 9 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON btp.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON btp.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 10 : SEED — Configuration par défaut
-- =============================================================================

INSERT INTO btp.system_settings (category, key, configuration)
VALUES (
  'alerts_processor',
  'configuration',
  '{
    "enabled": false,
    "batchSize": 10,
    "intervalMinutes": 60,
    "maxRetries": 3
  }'::jsonb
)
ON CONFLICT (category, key) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Configuration par défaut insérée'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_settings_count INT;
  v_tables TEXT[] := ARRAY['system_settings', 'processing_logs'];
  v_tbl TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = v_tbl;

    RAISE NOTICE 'btp.% : RLS=% FORCE=%', v_tbl, v_rls_enabled, v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = v_tbl;
    RAISE NOTICE '   Policies : %', v_policy_count;
  END LOOP;

  -- Compter les settings
  SELECT COUNT(*) INTO v_settings_count FROM btp.system_settings;
  RAISE NOTICE '';
  RAISE NOTICE 'Settings en base : %', v_settings_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('system_settings', 'processing_logs')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% [%] → %',
      v_rec.tablename, v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;