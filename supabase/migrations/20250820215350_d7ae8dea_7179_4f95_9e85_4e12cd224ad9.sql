-- =============================================================================
-- MIGRATION : 20250820215350_create_scheduled_calls_and_task_assignments.sql
-- Date       : 2025-08-20
-- Objet      : Créer/compléter btp.scheduled_calls + btp.task_assignments
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin()
--   - Pas de CHECK sur nomenclatures
--   - FK phase_id → btp.project_phases(id) (pas btp.phases)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.scheduled_calls (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.scheduled_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',    -- pas de CHECK
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',   -- pas de CHECK
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.scheduled_calls
  ADD COLUMN IF NOT EXISTS recipient_id UUID,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.scheduled_calls créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.task_assignments (IDEMPOTENTE + complétion)
-- =============================================================================
-- ⚠️ La table existe probablement déjà avec une structure partielle.
--    On complète avec ADD COLUMN IF NOT EXISTS pour garantir la présence
--    de TOUTES les colonnes référencées dans les commentaires et index.
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_to UUID NOT NULL,
  assignee_name TEXT NOT NULL,
  assignee_email TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',   -- pas de CHECK
  due_date TIMESTAMPTZ,
  project_id UUID,
  phase_id UUID,
  related_id UUID,
  action_type TEXT NOT NULL DEFAULT 'task_assignment',
  status TEXT NOT NULL DEFAULT 'assigned',   -- pas de CHECK
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ Compléter TOUTES les colonnes manquantes (le vrai fix du 42703)
ALTER TABLE btp.task_assignments
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS assignee_email TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS phase_id UUID,
  ADD COLUMN IF NOT EXISTS related_id UUID,           -- ✅ la colonne manquante
  ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'task_assignment',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'assigned',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.task_assignments créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : CORRIGER LA FK phase_id → btp.project_phases (pas btp.phases)
-- =============================================================================
-- Si la FK existe et pointe vers btp.phases (qui n'existe pas), la recréer
-- vers btp.project_phases.
-- =============================================================================

DO $$
BEGIN
  -- Supprimer l'ancienne FK si elle pointe vers btp.phases
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'task_assignments'
      AND ccu.table_name = 'phases'
  ) THEN
    ALTER TABLE btp.task_assignments
      DROP CONSTRAINT IF EXISTS task_assignments_phase_id_fkey;
    RAISE NOTICE '  FK phase_id → btp.phases supprimée';
  END IF;

  -- Créer la FK vers btp.project_phases si absente et si la table existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'task_assignments'
      AND kcu.column_name = 'phase_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'btp' AND table_name = 'project_phases'
    ) THEN
      ALTER TABLE btp.task_assignments
        ADD CONSTRAINT task_assignments_phase_id_fkey
        FOREIGN KEY (phase_id) REFERENCES btp.project_phases(id) ON DELETE SET NULL;
      RAISE NOTICE '  ✅ FK phase_id → btp.project_phases créée';
    ELSE
      RAISE WARNING '  ⚠️  btp.project_phases n''existe pas — FK phase_id non créée';
    END IF;
  END IF;

  -- FK project_id → btp.projects
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'task_assignments'
      AND kcu.column_name = 'project_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'btp' AND table_name = 'projects'
    ) THEN
      ALTER TABLE btp.task_assignments
        ADD CONSTRAINT task_assignments_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL;
      RAISE NOTICE '  ✅ FK project_id → btp.projects créée';
    END IF;
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : INDEX (IDEMPOTENTS)
-- =============================================================================

-- scheduled_calls
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_recipient_id
  ON btp.scheduled_calls(recipient_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status
  ON btp.scheduled_calls(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_for
  ON btp.scheduled_calls(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_priority
  ON btp.scheduled_calls(priority);

-- task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to
  ON btp.task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id
  ON btp.task_assignments(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_assignments_phase_id
  ON btp.task_assignments(phase_id) WHERE phase_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_assignments_status
  ON btp.task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_priority
  ON btp.task_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_task_assignments_due_date
  ON btp.task_assignments(due_date) WHERE due_date IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS
-- =============================================================================

ALTER TABLE btp.scheduled_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.scheduled_calls FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.task_assignments FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE POLICIES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('scheduled_calls', 'task_assignments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : scheduled_calls

CREATE POLICY "Admins can manage all scheduled calls"
ON btp.scheduled_calls
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their own scheduled calls"
ON btp.scheduled_calls
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can insert their own scheduled calls"
ON btp.scheduled_calls
FOR INSERT
TO authenticated
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "Users can update their own scheduled calls"
ON btp.scheduled_calls
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own scheduled calls"
ON btp.scheduled_calls
FOR DELETE
TO authenticated
USING (recipient_id = auth.uid());

-- 7.2 : task_assignments

CREATE POLICY "Admins can manage all task assignments"
ON btp.task_assignments
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their own task assignments"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Authenticated can view project task assignments"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (project_id IS NOT NULL);

CREATE POLICY "Authenticated users can insert task assignments"
ON btp.task_assignments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own task assignments"
ON btp.task_assignments
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can delete their own task assignments"
ON btp.task_assignments
FOR DELETE
TO authenticated
USING (assigned_to = auth.uid());

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.scheduled_calls TO authenticated;
GRANT SELECT ON btp.scheduled_calls TO anon;
GRANT ALL ON btp.scheduled_calls TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.task_assignments TO authenticated;
GRANT SELECT ON btp.task_assignments TO anon;
GRANT ALL ON btp.task_assignments TO service_role;

-- =============================================================================
-- ÉTAPE 9 : TRIGGERS updated_at (IDEMPOTENTS)
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

DROP TRIGGER IF EXISTS update_scheduled_calls_updated_at ON btp.scheduled_calls;
CREATE TRIGGER update_scheduled_calls_updated_at
  BEFORE UPDATE ON btp.scheduled_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_task_assignments_updated_at ON btp.task_assignments;
CREATE TRIGGER update_task_assignments_updated_at
  BEFORE UPDATE ON btp.task_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : COMMENTAIRES (après avoir garanti les colonnes)
-- =============================================================================
-- ⚠️ Les COMMENT ON COLUMN ne s'exécutent QUE si les colonnes existent.
--    Maintenant que l'ÉTAPE 2 les a créées, c'est sûr.

COMMENT ON TABLE btp.scheduled_calls IS 'Appels programmés pour le suivi des communications';

COMMENT ON COLUMN btp.scheduled_calls.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.scheduled_calls.recipient_id IS 'ID utilisateur destinataire';
COMMENT ON COLUMN btp.scheduled_calls.recipient_phone IS 'Téléphone destinataire';
COMMENT ON COLUMN btp.scheduled_calls.subject IS 'Sujet';
COMMENT ON COLUMN btp.scheduled_calls.message IS 'Message';
COMMENT ON COLUMN btp.scheduled_calls.priority IS 'Priorité — validation côté référentiels';
COMMENT ON COLUMN btp.scheduled_calls.scheduled_for IS 'Date et heure programmées';
COMMENT ON COLUMN btp.scheduled_calls.action_type IS 'Type d''action';
COMMENT ON COLUMN btp.scheduled_calls.status IS 'Statut — validation côté référentiels';
COMMENT ON COLUMN btp.scheduled_calls.metadata IS 'Métadonnées JSON';
COMMENT ON COLUMN btp.scheduled_calls.created_at IS 'Date de création';
COMMENT ON COLUMN btp.scheduled_calls.updated_at IS 'Date de mise à jour';

COMMENT ON TABLE btp.task_assignments IS 'Assignations de tâches';

COMMENT ON COLUMN btp.task_assignments.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.task_assignments.assigned_to IS 'ID de la personne assignée';
COMMENT ON COLUMN btp.task_assignments.assignee_name IS 'Nom de l''assigné';
COMMENT ON COLUMN btp.task_assignments.assignee_email IS 'Email de l''assigné';
COMMENT ON COLUMN btp.task_assignments.title IS 'Titre';
COMMENT ON COLUMN btp.task_assignments.description IS 'Description';
COMMENT ON COLUMN btp.task_assignments.priority IS 'Priorité — validation côté référentiels';
COMMENT ON COLUMN btp.task_assignments.due_date IS 'Date d''échéance';
COMMENT ON COLUMN btp.task_assignments.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.task_assignments.phase_id IS 'Référence à la phase (btp.project_phases)';
COMMENT ON COLUMN btp.task_assignments.related_id IS 'ID de l''entité liée (inspection, payment, etc.)';
COMMENT ON COLUMN btp.task_assignments.action_type IS 'Type d''action';
COMMENT ON COLUMN btp.task_assignments.status IS 'Statut — validation côté référentiels';
COMMENT ON COLUMN btp.task_assignments.metadata IS 'Métadonnées JSON';
COMMENT ON COLUMN btp.task_assignments.created_at IS 'Date de création';
COMMENT ON COLUMN btp.task_assignments.updated_at IS 'Date de mise à jour';

DO $$ BEGIN RAISE NOTICE '✅ Commentaires appliqués'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_related_id_exists BOOLEAN;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['scheduled_calls', 'task_assignments'];
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

  -- Vérifier que related_id existe maintenant
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'task_assignments'
      AND column_name = 'related_id'
  ) INTO v_related_id_exists;

  RAISE NOTICE '';
  IF v_related_id_exists THEN
    RAISE NOTICE '✅ Colonne related_id existe dans btp.task_assignments';
  ELSE
    RAISE WARNING '⚠️  Colonne related_id toujours absente !';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('scheduled_calls', 'task_assignments')
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