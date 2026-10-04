-- =============================================================================
-- MIGRATION : 20250928085850_fix_project_stakeholders.sql
-- Date       : 2025-09-28
-- Objet      : Créer/compléter btp.project_stakeholders
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - Pas de CHECK sur les nomenclatures (validation côté référentiels)
--   - Trigger via public.update_timestamp()
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : DIAGNOSTIC — Structure actuelle de project_stakeholders
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNOSTIC — btp.project_stakeholders';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE NOTICE '  ℹ️  Table absente — sera créée';
  ELSE
    RAISE NOTICE '  Colonnes actuelles :';
    FOR v_rec IN
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '    • % : % (nullable=%)',
        v_rec.column_name, v_rec.data_type, v_rec.is_nullable;
    END LOOP;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.project_stakeholders (SANS contraintes de nomenclature)
-- =============================================================================
-- ⚠️ Pas de CHECK sur stakeholder_entity_type : validation côté app.
-- ⚠️ Pas de CHECK sur stakeholder_type : validation côté app.
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  stakeholder_entity_type TEXT NOT NULL DEFAULT 'employee',   -- pas de CHECK
  stakeholder_type TEXT NOT NULL DEFAULT 'other',             -- pas de CHECK
  -- Colonnes FK possibles (une seule non-null selon le type)
  employee_id UUID,
  supplier_id UUID,
  organization_id UUID,
  community_type TEXT,
  -- Ancien champ (peut exister déjà)
  stakeholder_id UUID,
  -- Métadonnées
  role_description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  external_ref TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes (idempotent)
ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS stakeholder_entity_type TEXT DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS stakeholder_type TEXT DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS employee_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS community_type TEXT,
  ADD COLUMN IF NOT EXISTS stakeholder_id UUID,
  ADD COLUMN IF NOT EXISTS role_description TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_ref TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.project_stakeholders créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : SUPPRIMER LES CHECK DE NOMENCLATURE (si présents)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname
     AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND t.relname = 'project_stakeholders'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.project_stakeholders DROP CONSTRAINT IF EXISTS %I',
      v_rec.conname);
    RAISE NOTICE '  ✅ Contrainte de nomenclature supprimée : %', v_rec.conname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 4 : INDEX (avec qualification simple + guard de colonne)
-- =============================================================================

DO $$
BEGIN
  -- Index sur project_id (colonne toujours présente)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'project_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project
             ON btp.project_stakeholders(project_id)';
    RAISE NOTICE '  ✅ idx_project_stakeholders_project';
  END IF;

  -- Index sur stakeholder_entity_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'stakeholder_entity_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_entity_type
             ON btp.project_stakeholders(stakeholder_entity_type)';
    RAISE NOTICE '  ✅ idx_project_stakeholders_entity_type';
  END IF;

  -- Index sur stakeholder_id (uniquement si la colonne existe)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'stakeholder_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stakeholder
             ON btp.project_stakeholders(stakeholder_id)
             WHERE stakeholder_id IS NOT NULL';
    RAISE NOTICE '  ✅ idx_project_stakeholders_stakeholder';
  ELSE
    RAISE NOTICE '  ℹ️  Colonne stakeholder_id absente → index skippé';
  END IF;

  -- Index sur les FK dédiées
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'employee_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_employee_id
             ON btp.project_stakeholders(employee_id)
             WHERE employee_id IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'supplier_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_supplier_id
             ON btp.project_stakeholders(supplier_id)
             WHERE supplier_id IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_organization_id
             ON btp.project_stakeholders(organization_id)
             WHERE organization_id IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
      AND column_name = 'external_ref'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_project_stakeholders_external_ref
             ON btp.project_stakeholders(external_ref)
             WHERE external_ref IS NOT NULL';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.project_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_stakeholders FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'project_stakeholders'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.project_stakeholders',
      v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES (avec qualification explicite)
-- =============================================================================

-- 7.1 : Admins : gestion complète
CREATE POLICY "Admins can manage project stakeholders"
ON btp.project_stakeholders
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 7.2 : Utilisateurs authentifiés : lecture
CREATE POLICY "Authenticated can view project stakeholders"
ON btp.project_stakeholders
FOR SELECT
TO authenticated
USING (true);

-- 7.3 : Utilisateurs authentifiés : insertion
CREATE POLICY "Authenticated can insert project stakeholders"
ON btp.project_stakeholders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 7.4 : Utilisateurs authentifiés : mise à jour
CREATE POLICY "Authenticated can update project stakeholders"
ON btp.project_stakeholders
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 7.5 : Suppression admin uniquement
CREATE POLICY "Admins can delete project stakeholders"
ON btp.project_stakeholders
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

COMMENT ON POLICY "Admins can manage project stakeholders" ON btp.project_stakeholders IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view project stakeholders" ON btp.project_stakeholders IS
  'Tous les utilisateurs authentifiés peuvent lire.';
COMMENT ON POLICY "Authenticated can insert project stakeholders" ON btp.project_stakeholders IS
  'Insertion réservée aux utilisateurs authentifiés.';
COMMENT ON POLICY "Authenticated can update project stakeholders" ON btp.project_stakeholders IS
  'Mise à jour réservée aux utilisateurs authentifiés.';
COMMENT ON POLICY "Admins can delete project stakeholders" ON btp.project_stakeholders IS
  'Suppression réservée aux admins/directors.';

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_stakeholders TO authenticated;
GRANT SELECT ON btp.project_stakeholders TO anon;
GRANT ALL ON btp.project_stakeholders TO service_role;

-- =============================================================================
-- ÉTAPE 9 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
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
-- ÉTAPE 10 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS trg_update_project_stakeholders_updated_at ON btp.project_stakeholders;
DROP TRIGGER IF EXISTS update_project_stakeholders_updated_at ON btp.project_stakeholders;

CREATE TRIGGER update_project_stakeholders_updated_at
  BEFORE UPDATE ON btp.project_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_index_count INT;
  v_check_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'project_stakeholders';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'project_stakeholders';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp' AND tablename = 'project_stakeholders';
  RAISE NOTICE 'Index : %', v_index_count;

  SELECT COUNT(*) INTO v_check_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'project_stakeholders'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%IN (%';
  RAISE NOTICE 'Contraintes CHECK de nomenclature : %', v_check_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'project_stakeholders'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;