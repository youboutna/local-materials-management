-- =============================================================================
-- MIGRATION : 20251021090725_improve_inspections_rls.sql
-- Date       : 2025-10-21
-- Objet      : Améliorer les RLS de btp.inspections
--
-- SÉCURITÉ :
--   - Idempotente : boucle DROP POLICY IF EXISTS avant CREATE
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - Utilise btp.is_current_user_admin() (pas de duplication de user_roles)
--   - Ajout de created_by sur btp.projects (colonne utilisée par les policies)
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
-- ÉTAPE 1 : AJOUTER created_by À btp.projects (idempotent)
-- =============================================================================

ALTER TABLE btp.projects
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- S'assurer que la FK est présente (si auth.users existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'projects'
      AND kcu.column_name = 'created_by'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    ALTER TABLE btp.projects
      ADD CONSTRAINT projects_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK projects.created_by → auth.users(id) ajoutée';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_created_by
  ON btp.projects(created_by) WHERE created_by IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Colonne created_by sur btp.projects'; END $$;

-- =============================================================================
-- ÉTAPE 2 : VÉRIFIER LA STRUCTURE DE btp.inspections
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION — btp.inspections';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'inspections'
      AND column_name IN ('id', 'project_id', 'phase_id', 'status')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '  • % : %', v_rec.column_name, v_rec.data_type;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspections FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DYNAMIQUE DE TOUTES LES POLICIES EXISTANTES (fix 42710)
-- =============================================================================
-- Supprime TOUTES les policies de btp.inspections, quelle que soit leur origine.

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES POLICIES — btp.inspections';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspections'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.inspections', v_rec.policyname);
    RAISE NOTICE '  ✅ Supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 5 : CRÉATION DES NOUVELLES POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 : SELECT
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view inspections for their projects"
ON btp.inspections
FOR SELECT
TO authenticated
USING (
  -- 1. Stakeholder du projet (fournisseur ou employé)
  EXISTS (
    SELECT 1 FROM btp.project_stakeholders ps
    LEFT JOIN btp.suppliers s ON ps.supplier_id = s.id
    LEFT JOIN btp.employees e ON ps.employee_id = e.id
    WHERE ps.project_id = btp.inspections.project_id
      AND (
        s.user_id = auth.uid()
        OR e.user_id = auth.uid()
      )
  )
  -- 2. Créateur du projet
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = btp.inspections.project_id
      AND p.created_by = auth.uid()
  )
  -- 3. Admin/director
  OR btp.is_current_user_admin()
);

COMMENT ON POLICY "Users can view inspections for their projects" ON btp.inspections IS
  'Utilisateurs impliqués dans le projet ou créateurs ou admins peuvent voir les inspections.';

-- -----------------------------------------------------------------------------
-- 5.2 : INSERT
-- -----------------------------------------------------------------------------
CREATE POLICY "Authorized users can create inspections"
ON btp.inspections
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin/director/manager/agent OU créateur du projet
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = btp.inspections.project_id
      AND p.created_by = auth.uid()
  )
);

COMMENT ON POLICY "Authorized users can create inspections" ON btp.inspections IS
  'Admin, manager, director, agent ou créateur du projet peuvent créer des inspections.';

-- -----------------------------------------------------------------------------
-- 5.3 : UPDATE
-- -----------------------------------------------------------------------------
CREATE POLICY "Authorized users can update inspections"
ON btp.inspections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = btp.inspections.project_id
      AND p.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'manager', 'director', 'agent')
  )
  OR EXISTS (
    SELECT 1 FROM btp.projects p
    WHERE p.id = btp.inspections.project_id
      AND p.created_by = auth.uid()
  )
);

COMMENT ON POLICY "Authorized users can update inspections" ON btp.inspections IS
  'Admin, manager, director, agent ou créateur du projet peuvent modifier des inspections.';

-- -----------------------------------------------------------------------------
-- 5.4 : DELETE
-- -----------------------------------------------------------------------------
CREATE POLICY "Only admins can delete inspections"
ON btp.inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'manager')
  )
);

COMMENT ON POLICY "Only admins can delete inspections" ON btp.inspections IS
  'Seuls admin et manager peuvent supprimer des inspections.';

DO $$ BEGIN RAISE NOTICE '✅ 4 policies créées'; END $$;

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspections TO authenticated;
GRANT SELECT ON btp.inspections TO anon;
GRANT ALL ON btp.inspections TO service_role;

-- =============================================================================
-- ÉTAPE 7 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_created_by_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- created_by sur projects
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'projects'
      AND column_name = 'created_by'
  ) INTO v_created_by_exists;

  RAISE NOTICE 'projects.created_by : %', v_created_by_exists;

  -- RLS sur inspections
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'inspections';

  RAISE NOTICE 'inspections : RLS=% FORCE=%', v_rls_enabled, v_rls_forced;

  -- Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'inspections';
  RAISE NOTICE 'Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspections'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 8 : NOTIFY POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;