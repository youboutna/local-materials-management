-- =============================================================================
-- MIGRATION : 20250918075330_fix_workflow_status.sql
-- Date       : 2025-09-18
-- Objet      : Créer/compléter btp.workflow_status
--              + DÉDUPLIQUER avant création de l'index UNIQUE
--              + RLS + triggers + seed
--
-- FIX 23505 : Doublons existants sur (entity_id, entity_type, phase_code, stage_code, task_id)
--             → Déduplication AVANT création de l'index UNIQUE.
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
-- ÉTAPE 1 : TABLE btp.workflow_status (SANS contraintes de nomenclature)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.workflow_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'project',
  phase_code TEXT NOT NULL,
  stage_code TEXT NOT NULL,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.workflow_status
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS phase_code TEXT,
  ADD COLUMN IF NOT EXISTS stage_code TEXT,
  ADD COLUMN IF NOT EXISTS task_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.workflow_status créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : SUPPRIMER LES CONTRAINTES DE NOMENCLATURE (si présentes)
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
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname
     AND col.table_name = t.relname
     AND col.column_name = ANY(
       ARRAY(SELECT a.attname FROM pg_attribute a
             WHERE a.attrelid = t.oid AND a.attnum = ANY(c.conkey))
     )
    WHERE n.nspname = 'btp'
      AND t.relname = 'workflow_status'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.workflow_status DROP CONSTRAINT IF EXISTS %I', v_rec.conname);
    RAISE NOTICE '  ✅ Contrainte de nomenclature supprimée : %', v_rec.conname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 3 : 🔴 DÉDUPLICATION — Fix 23505
-- =============================================================================
-- Identifie les doublons et ne garde QUE la ligne la plus récente par groupe.
-- Critère : (entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, ''))
-- =============================================================================

DO $$
DECLARE
  v_dup_groups INT;
  v_dup_rows INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 3 : DÉDUPLICATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Compter les groupes avec doublons
  SELECT COUNT(*) INTO v_dup_groups
  FROM (
    SELECT entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, '') AS tid
    FROM btp.workflow_status
    GROUP BY entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, '')
    HAVING COUNT(*) > 1
  ) sub;

  -- Compter les lignes en trop
  SELECT COALESCE(SUM(nb - 1), 0) INTO v_dup_rows
  FROM (
    SELECT COUNT(*) AS nb
    FROM btp.workflow_status
    GROUP BY entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, '')
    HAVING COUNT(*) > 1
  ) sub;

  RAISE NOTICE '  Groupes en doublon : %', v_dup_groups;
  RAISE NOTICE '  Lignes en trop     : %', v_dup_rows;

  IF v_dup_groups = 0 THEN
    RAISE NOTICE '  ✅ Aucun doublon détecté';
  ELSE
    RAISE NOTICE '  → Suppression des doublons (garde la ligne la plus récente)...';

    -- Supprimer les doublons en gardant la ligne la plus récente (updated_at DESC, id DESC)
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, '')
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) AS rn
      FROM btp.workflow_status
    ),
    to_delete AS (
      SELECT id FROM ranked WHERE rn > 1
    )
    DELETE FROM btp.workflow_status
    WHERE id IN (SELECT id FROM to_delete);

    RAISE NOTICE '  ✅ Doublons supprimés';
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 4 : UNICITÉ VIA INDEX PARTIEL (gère les NULL dans task_id)
-- =============================================================================
-- ✅ Maintenant possible car plus de doublons

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_status_unique
  ON btp.workflow_status (
    entity_id,
    entity_type,
    phase_code,
    stage_code,
    COALESCE(task_id, '')
  );

DO $$ BEGIN RAISE NOTICE '✅ Index UNIQUE idx_workflow_status_unique créé'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.workflow_status FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'workflow_status'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.workflow_status', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

CREATE POLICY "Admins can manage all workflow status"
ON btp.workflow_status
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view workflow status"
ON btp.workflow_status
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Assignees can update their workflow status"
ON btp.workflow_status
FOR UPDATE
TO authenticated
USING (btp.workflow_status.assigned_to = auth.uid())
WITH CHECK (btp.workflow_status.assigned_to = auth.uid());

CREATE POLICY "Authenticated can insert workflow status"
ON btp.workflow_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DO $$ BEGIN RAISE NOTICE '✅ Policies recréées'; END $$;

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.workflow_status TO authenticated;
GRANT SELECT ON btp.workflow_status TO anon;
GRANT ALL ON btp.workflow_status TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX DE PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workflow_status_entity
  ON btp.workflow_status(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_status_phase
  ON btp.workflow_status(phase_code, stage_code);
CREATE INDEX IF NOT EXISTS idx_workflow_status_due_date
  ON btp.workflow_status(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_status_assigned_to
  ON btp.workflow_status(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_status_status
  ON btp.workflow_status(status);

DO $$ BEGIN RAISE NOTICE '✅ Index de performance créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION TRIGGER (public.update_timestamp)
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 11 : TRIGGER updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_workflow_status_updated_at ON btp.workflow_status;
CREATE TRIGGER update_workflow_status_updated_at
  BEFORE UPDATE ON btp.workflow_status
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 12 : SEED NOMENCLATURES
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('workflow_entity_type', 'project', 'Projet',          'Project', 1),
  ('workflow_entity_type', 'tender',  'Appel d''offres', 'Tender',  2),
  ('workflow_status', 'pending',     'En attente', 'Pending',     1),
  ('workflow_status', 'in_progress', 'En cours',   'In Progress', 2),
  ('workflow_status', 'completed',   'Terminé',    'Completed',   3),
  ('workflow_status', 'blocked',     'Bloqué',     'Blocked',     4)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed nomenclatures appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_dup_remaining INT;
  v_policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Vérifier qu'il n'y a plus de doublons
  SELECT COUNT(*) INTO v_dup_remaining
  FROM (
    SELECT 1 FROM btp.workflow_status
    GROUP BY entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, '')
    HAVING COUNT(*) > 1
  ) sub;

  IF v_dup_remaining = 0 THEN
    RAISE NOTICE '✅ Aucun doublon restant';
  ELSE
    RAISE WARNING '⚠️  % groupes en doublon persistent', v_dup_remaining;
  END IF;

  -- Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'workflow_status';
  RAISE NOTICE 'Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'workflow_status'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;