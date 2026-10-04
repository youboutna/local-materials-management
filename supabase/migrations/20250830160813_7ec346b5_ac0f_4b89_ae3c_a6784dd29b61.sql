-- =============================================================================
-- MIGRATION : add_phase_links_and_phase_employees
-- Date       : 2025-XX-XX
-- Objet      : Ajouter phase_id aux tables liées + créer btp.phase_employees
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT EXISTS
--                   + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - FK phase_id → btp.project_phases(id) ON DELETE SET NULL
--   - Trigger via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE LA FONCTION btp.is_current_user_admin EXISTE
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : S'ASSURER QUE btp.project_phases EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
  ) THEN
    RAISE EXCEPTION 'Table btp.project_phases introuvable — migration annulée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 2 : AJOUTER phase_id AUX TABLES EXISTANTES (idempotent + FK)
-- =============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'task_assignments',
    'documents',
    'payments',
    'inspections',
    'project_materials'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    -- Skip si la table n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'btp' AND table_name = v_table
    ) THEN
      RAISE NOTICE '  ⚠️  btp.% inexistante — skip', v_table;
      CONTINUE;
    END IF;

    -- Ajouter la colonne si absente
    EXECUTE format(
      'ALTER TABLE btp.%I ADD COLUMN IF NOT EXISTS phase_id UUID',
      v_table
    );

    -- Ajouter la FK si absente
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'btp'
        AND tc.table_name = v_table
        AND kcu.column_name = 'phase_id'
    ) THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE btp.%I
           ADD CONSTRAINT %I
           FOREIGN KEY (phase_id)
           REFERENCES btp.project_phases(id)
           ON DELETE SET NULL',
          v_table,
          v_table || '_phase_id_fkey'
        );
        RAISE NOTICE '  ✅ FK phase_id ajoutée à btp.%', v_table;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '  ⚠️  FK phase_id sur btp.% : %', v_table, SQLERRM;
      END;
    ELSE
      RAISE NOTICE '  ℹ️  FK phase_id existe déjà sur btp.%', v_table;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.phase_employees (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.phase_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES btp.project_phases(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL DEFAULT '',
  employee_role TEXT NOT NULL DEFAULT '',
  employee_contact TEXT,
  daily_rate NUMERIC,
  start_date DATE,
  end_date DATE,
  is_primary_supplier BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.phase_employees
  ADD COLUMN IF NOT EXISTS phase_id UUID,
  ADD COLUMN IF NOT EXISTS employee_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS employee_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS employee_contact TEXT,
  ADD COLUMN IF NOT EXISTS daily_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS is_primary_supplier BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.phase_employees créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.phase_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.phase_employees FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'phase_employees'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.phase_employees', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : Admins : gestion complète
CREATE POLICY "Admins can manage phase employees"
ON btp.phase_employees
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 6.2 : Utilisateurs authentifiés : lecture
CREATE POLICY "Authenticated can view phase employees"
ON btp.phase_employees
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage phase employees" ON btp.phase_employees IS
  'Admin/director : gestion complète des employés de phase.';
COMMENT ON POLICY "Authenticated can view phase employees" ON btp.phase_employees IS
  'Tous les utilisateurs authentifiés peuvent lire les employés de phase.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.phase_employees TO authenticated;
GRANT SELECT ON btp.phase_employees TO anon;
GRANT ALL ON btp.phase_employees TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (idempotents + vérifiés)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_indexes TEXT[] := ARRAY[
    'task_assignments',
    'documents',
    'payments',
    'inspections',
    'project_materials',
    'phase_employees'
  ];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_indexes
  LOOP
    -- Vérifier que la table et la colonne existent
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'btp' AND table_name = v_table AND column_name = 'phase_id'
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON btp.%I(phase_id) WHERE phase_id IS NOT NULL',
        'idx_' || v_table || '_phase_id',
        v_table
      );
      RAISE NOTICE '  ✅ idx_%_phase_id', v_table;
    ELSE
      RAISE NOTICE '  ⚠️  btp.%.phase_id absente — skip index', v_table;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 9 : TRIGGER updated_at (IDEMPOTENT)
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

DROP TRIGGER IF EXISTS update_phase_employees_updated_at ON btp.phase_employees;
CREATE TRIGGER update_phase_employees_updated_at
  BEFORE UPDATE ON btp.phase_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'phase_employees';

  RAISE NOTICE 'btp.phase_employees : RLS=% FORCE=%', v_rls_enabled, v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'phase_employees';
  RAISE NOTICE 'Policies : %', v_policy_count;

  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'phase_employees'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;