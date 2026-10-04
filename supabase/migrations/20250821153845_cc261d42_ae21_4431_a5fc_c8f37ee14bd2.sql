-- =============================================================================
-- MIGRATION : 20250821153845_update_project_phases_rls.sql
-- Date       : 2025-08-21
-- Objet      : Mettre à jour les policies RLS de btp.project_phases
--              + garantir l'existence de la colonne created_by (nullable)
--
-- SÉCURITÉ :
--   - Idempotente : boucle DROP POLICY IF EXISTS avant CREATE
--   - RLS activé + FORCE
--   - Policies TO authenticated (pas PUBLIC/anon)
--   - DELETE restreint à is_current_user_admin()
--   - created_by nullable (FK → auth.users)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : VÉRIFICATION PRÉALABLE — table existe ?
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
  ) THEN
    RAISE EXCEPTION 'Table btp.project_phases introuvable — migration annulée';
  END IF;
  RAISE NOTICE '✅ Table btp.project_phases présente';
END $$;

-- =============================================================================
-- ÉTAPE 2 : GARANTIR LA COLONNE created_by (idempotent)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE btp.project_phases
      ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Colonne created_by ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne created_by existe déjà';
  END IF;
END $$;

-- Rendre nullable (idempotent)
ALTER TABLE btp.project_phases
  ALTER COLUMN created_by DROP NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ created_by est nullable'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS activé + FORCE
-- =============================================================================

ALTER TABLE btp.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_phases FORCE ROW LEVEL SECURITY;

DO $$ BEGIN RAISE NOTICE '✅ RLS activé + FORCE'; END $$;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE COMPLET DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================
-- On supprime TOUTES les policies sur project_phases, peu importe leur nom.
-- C'est ce qui garantit l'idempotence : aucune collision de nom.

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'project_phases'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.project_phases', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 5 : CRÉATION DES NOUVELLES POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 : SELECT — tous les utilisateurs authentifiés
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can read project phases"
ON btp.project_phases
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Authenticated can read project phases" ON btp.project_phases IS
  'Tous les utilisateurs authentifiés peuvent lire les phases.';

-- -----------------------------------------------------------------------------
-- 5.2 : INSERT — utilisateurs authentifiés
-- -----------------------------------------------------------------------------
-- DEV_MODE : auth.uid() IS NOT NULL
-- PROD     : remplacer par btp.is_current_user_admin()
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can insert project phases"
ON btp.project_phases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Authenticated can insert project phases" ON btp.project_phases IS
  'Utilisateurs authentifiés peuvent insérer des phases (DEV_MODE).';

-- -----------------------------------------------------------------------------
-- 5.3 : UPDATE — utilisateurs authentifiés
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can update project phases"
ON btp.project_phases
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Authenticated can update project phases" ON btp.project_phases IS
  'Utilisateurs authentifiés peuvent modifier des phases (DEV_MODE).';

-- -----------------------------------------------------------------------------
-- 5.4 : DELETE — admin/director uniquement (sécurisé)
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can delete project phases"
ON btp.project_phases
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

COMMENT ON POLICY "Admins can delete project phases" ON btp.project_phases IS
  'Seul admin/director peut supprimer une phase.';

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_phases TO authenticated;
GRANT SELECT ON btp.project_phases TO anon;
GRANT ALL ON btp.project_phases TO service_role;

-- =============================================================================
-- ÉTAPE 7 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_created_by_exists BOOLEAN;
  v_created_by_nullable BOOLEAN;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION — btp.project_phases';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- RLS via pg_class (relforcerowsecurity n'existe PAS dans pg_tables)
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'project_phases';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  -- created_by
  SELECT
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'btp' AND table_name = 'project_phases'
        AND column_name = 'created_by'
    ),
    COALESCE((
      SELECT is_nullable = 'YES'
      FROM information_schema.columns
      WHERE table_schema = 'btp' AND table_name = 'project_phases'
        AND column_name = 'created_by'
    ), false)
  INTO v_created_by_exists, v_created_by_nullable;

  RAISE NOTICE 'created_by existe   : %', v_created_by_exists;
  RAISE NOTICE 'created_by nullable : %', v_created_by_nullable;

  -- Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'project_phases';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'project_phases'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;