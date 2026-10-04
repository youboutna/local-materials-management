-- =============================================================================
-- MIGRATION : 20250905210000_convert_assigned_to_array.sql
-- Date       : 2025-09-05
-- Objet      : Convertir assigned_to UUID → UUID[]
--              + Supprimer les vues legacy public.*
--
-- ORDRE CRITIQUE :
--   1. DROP les policies (libère la colonne)
--   2. DROP les vues legacy
--   3. DROP la FK
--   4. ALTER COLUMN (maintenant possible)
--   5. CREATE les nouvelles policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : DIAGNOSTIC
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNOSTIC PRÉALABLE';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Policies actuelles
  RAISE NOTICE 'Policies sur btp.task_assignments :';
  FOR v_rec IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'task_assignments'
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.policyname, v_rec.cmd;
  END LOOP;

  -- Vues public.*
  RAISE NOTICE '';
  RAISE NOTICE 'Vues public.* pointant vers btp :';
  FOR v_rec IN
    SELECT c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
      AND pg_get_viewdef(c.oid, true) ILIKE '%btp.%'
  LOOP
    RAISE NOTICE '   • public.%', v_rec.view_name;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 2 : DROP DE TOUTES LES POLICIES SUR btp.task_assignments
-- =============================================================================
-- ⚠️ CRITIQUE : à faire AVANT toute modification de colonne

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 2 : DROP des policies sur btp.task_assignments';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'task_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.task_assignments', v_rec.policyname);
    RAISE NOTICE '  ✅ Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
  RAISE NOTICE '  ⚠️  La table est temporairement SANS policies (RLS par défaut = deny all)';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 3 : DROP DE TOUTES LES VUES public.* QUI POINTENT VERS btp
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
  v_errors INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 3 : DROP des vues legacy public.*';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT c.relname AS view_name, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
      AND pg_get_viewdef(c.oid, true) ILIKE '%btp.%'
    ORDER BY c.relname
  LOOP
    BEGIN
      IF v_rec.relkind = 'm' THEN
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', v_rec.view_name);
      ELSE
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', v_rec.view_name);
      END IF;
      RAISE NOTICE '  ✅ public.%', v_rec.view_name;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ⚠️  Échec sur public.% : %', v_rec.view_name, SQLERRM;
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RAISE NOTICE '  → % vues supprimées, % erreurs', v_count, v_errors;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 4 : SUPPRIMER assignee_id (redondante)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'task_assignments'
      AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE btp.task_assignments DROP COLUMN IF EXISTS assignee_id CASCADE;
    RAISE NOTICE '✅ assignee_id supprimée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : SUPPRIMER LA FK SUR assigned_to (si existe)
-- =============================================================================

DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT tc.constraint_name INTO v_constraint
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'btp'
    AND tc.table_name = 'task_assignments'
    AND kcu.column_name = 'assigned_to'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE btp.task_assignments DROP CONSTRAINT IF EXISTS %I CASCADE', v_constraint);
    RAISE NOTICE '✅ FK supprimée : %', v_constraint;
  ELSE
    RAISE NOTICE 'ℹ️  Aucune FK sur assigned_to';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 6 : CONVERTIR assigned_to UUID → UUID[]
-- =============================================================================
-- ✅ Maintenant possible : plus de policies ni de vues dépendantes

DO $$
DECLARE
  v_current_type TEXT;
BEGIN
  SELECT c.udt_name INTO v_current_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'btp'
    AND c.table_name = 'task_assignments'
    AND c.column_name = 'assigned_to';

  IF v_current_type IS NULL THEN
    RAISE EXCEPTION '❌ Colonne assigned_to introuvable';
  ELSIF v_current_type = '_uuid' THEN
    RAISE NOTICE 'ℹ️  assigned_to déjà UUID[]';
  ELSE
    EXECUTE 'ALTER TABLE btp.task_assignments
             ALTER COLUMN assigned_to TYPE UUID[]
             USING CASE
               WHEN assigned_to IS NULL THEN ''{}''::uuid[]
               ELSE ARRAY[assigned_to]
             END';

    RAISE NOTICE '✅ assigned_to converti de % en UUID[]', v_current_type;
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 7 : NETTOYER LES DONNÉES NULL + DEFAULT
-- =============================================================================

UPDATE btp.task_assignments
SET assigned_to = '{}'::uuid[]
WHERE assigned_to IS NULL;

ALTER TABLE btp.task_assignments
  ALTER COLUMN assigned_to SET DEFAULT '{}'::uuid[];

DO $$ BEGIN RAISE NOTICE '✅ Données NULL nettoyées + DEFAULT configuré'; END $$;

-- =============================================================================
-- ÉTAPE 8 : INDEX GIN
-- =============================================================================

DROP INDEX IF EXISTS idx_task_assignments_assigned_to;

CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to_gin
  ON btp.task_assignments USING GIN (assigned_to);

DO $$ BEGIN RAISE NOTICE '✅ Index GIN créé'; END $$;

-- =============================================================================
-- ÉTAPE 9 : RECRÉER LES POLICIES (sur le nouveau type UUID[])
-- =============================================================================

-- 9.1 : Admins : gestion complète
CREATE POLICY "Admins can manage all task assignments"
ON btp.task_assignments
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 9.2 : SELECT — user dans l'array
CREATE POLICY "Users can view their assigned tasks"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (
  auth.uid() = ANY(btp.task_assignments.assigned_to)
);

-- 9.3 : UPDATE — user dans l'array
CREATE POLICY "Users can update their assigned tasks"
ON btp.task_assignments
FOR UPDATE
TO authenticated
USING (
  auth.uid() = ANY(btp.task_assignments.assigned_to)
)
WITH CHECK (
  auth.uid() = ANY(btp.task_assignments.assigned_to)
);

-- 9.4 : DELETE — admin uniquement
CREATE POLICY "Admins can delete task assignments"
ON btp.task_assignments
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 9.5 : INSERT — authentifié
CREATE POLICY "Authenticated can insert task assignments"
ON btp.task_assignments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DO $$ BEGIN RAISE NOTICE '✅ Policies recréées'; END $$;

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_col_type TEXT;
  v_remaining_views INT;
  v_policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.udt_name INTO v_col_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'btp'
    AND c.table_name = 'task_assignments'
    AND c.column_name = 'assigned_to';

  RAISE NOTICE 'assigned_to : %', COALESCE(v_col_type, '(absente)');
  IF v_col_type = '_uuid' THEN
    RAISE NOTICE '✅ assigned_to est bien UUID[]';
  ELSE
    RAISE WARNING '⚠️  assigned_to est % (attendu _uuid)', v_col_type;
  END IF;

  SELECT COUNT(*) INTO v_remaining_views
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
    AND pg_get_viewdef(c.oid, true) ILIKE '%btp.%';

  RAISE NOTICE '';
  IF v_remaining_views = 0 THEN
    RAISE NOTICE '✅ Plus aucune vue legacy';
  ELSE
    RAISE WARNING '⚠️  % vue(s) persistent', v_remaining_views;
  END IF;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'task_assignments';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'task_assignments'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.policyname, v_rec.cmd;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;