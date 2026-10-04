-- =============================================================================
-- MIGRATION : 20260703104831_create_tender_lots.sql
-- Date       : 2026-07-03
-- Objet      : Créer btp.tender_lots + RLS + trigger + index + FK
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - WITH CHECK encadré (pas de (true) nu)
--   - DELETE réservé aux admins
--   - FK tender_id, project_id, created_by (avec nettoyage orphelins)
--   - CHECK structurels : number >= 1, estimated_amount >= 0
--   - UNIQUE (tender_id, number)
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.tender_lots (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  project_id UUID,
  number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  estimated_amount NUMERIC,
  linked_phase_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  linked_step_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  requirements TEXT[] NOT NULL DEFAULT '{}'::text[],
  deliverables TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_lots
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS estimated_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS linked_phase_ids UUID[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS linked_step_ids UUID[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deliverables TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_lots créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : CHECK STRUCTURELS
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_tender_lots_number'
      AND conrelid = 'btp.tender_lots'::regclass
  ) THEN
    ALTER TABLE btp.tender_lots
      ADD CONSTRAINT chk_tender_lots_number
      CHECK (number >= 1);
    RAISE NOTICE '  ✅ chk_tender_lots_number créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_tender_lots_estimated_amount'
      AND conrelid = 'btp.tender_lots'::regclass
  ) THEN
    ALTER TABLE btp.tender_lots
      ADD CONSTRAINT chk_tender_lots_estimated_amount
      CHECK (estimated_amount IS NULL OR estimated_amount >= 0);
    RAISE NOTICE '  ✅ chk_tender_lots_estimated_amount créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : UNIQUE (tender_id, number) — IDEMPOTENT
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tender_lots_tender_id_number_key'
      AND conrelid = 'btp.tender_lots'::regclass
  ) THEN
    ALTER TABLE btp.tender_lots
      ADD CONSTRAINT tender_lots_tender_id_number_key
      UNIQUE (tender_id, number);
    RAISE NOTICE '  ✅ UNIQUE (tender_id, number) créé';
  ELSE
    RAISE NOTICE '  ℹ️  UNIQUE (tender_id, number) existe déjà';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : FK VERS btp.tenders, btp.projects, auth.users
-- =============================================================================
-- ✅ Fix 23503 : nettoyer les orphelins AVANT de créer les FK
-- =============================================================================

DO $$
DECLARE
  v_orphan_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES ORPHELINS AVANT FK';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- ---------------------------------------------------------------------------
  -- 4.1 : Nettoyer les orphelins sur tender_id
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'tenders'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lots tl
    LEFT JOIN btp.tenders t ON t.id = tl.tender_id
    WHERE tl.tender_id IS NOT NULL
      AND t.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lots orphelins (tender_id inexistant)', v_orphan_count;

      FOR v_rec IN
        SELECT DISTINCT tl.tender_id
        FROM btp.tender_lots tl
        LEFT JOIN btp.tenders t ON t.id = tl.tender_id
        WHERE tl.tender_id IS NOT NULL AND t.id IS NULL
        LIMIT 10
      LOOP
        RAISE NOTICE '     • tender_id orphelin : %', v_rec.tender_id;
      END LOOP;

      DELETE FROM btp.tender_lots tl
      WHERE tl.tender_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM btp.tenders t WHERE t.id = tl.tender_id
        );

      RAISE NOTICE '  ✅ % lignes orphelines supprimées', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur tender_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lots_tender'
        AND conrelid = 'btp.tender_lots'::regclass
    ) THEN
      ALTER TABLE btp.tender_lots
        ADD CONSTRAINT fk_tender_lots_tender
        FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE;
      RAISE NOTICE '  ✅ FK fk_tender_lots_tender créée';
    ELSE
      RAISE NOTICE '  ℹ️  FK fk_tender_lots_tender existe déjà';
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.2 : Nettoyer les orphelins sur project_id
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lots tl
    LEFT JOIN btp.projects p ON p.id = tl.project_id
    WHERE tl.project_id IS NOT NULL
      AND p.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lots avec project_id inexistant → SET NULL', v_orphan_count;

      UPDATE btp.tender_lots tl
      SET project_id = NULL
      WHERE tl.project_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM btp.projects p WHERE p.id = tl.project_id
        );

      RAISE NOTICE '  ✅ % project_id remis à NULL', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur project_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lots_project'
        AND conrelid = 'btp.tender_lots'::regclass
    ) THEN
      ALTER TABLE btp.tender_lots
        ADD CONSTRAINT fk_tender_lots_project
        FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL;
      RAISE NOTICE '  ✅ FK fk_tender_lots_project créée';
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.3 : Nettoyer les orphelins sur created_by
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lots tl
    LEFT JOIN auth.users u ON u.id = tl.created_by
    WHERE tl.created_by IS NOT NULL
      AND u.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lots avec created_by inexistant → SET NULL', v_orphan_count;

      UPDATE btp.tender_lots tl
      SET created_by = NULL
      WHERE tl.created_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM auth.users u WHERE u.id = tl.created_by
        );

      RAISE NOTICE '  ✅ % created_by remis à NULL', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur created_by';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lots_created_by'
        AND conrelid = 'btp.tender_lots'::regclass
    ) THEN
      ALTER TABLE btp.tender_lots
        ADD CONSTRAINT fk_tender_lots_created_by
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE '  ✅ FK fk_tender_lots_created_by créée';
    END IF;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_lots FORCE ROW LEVEL SECURITY;

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
    WHERE schemaname = 'btp' AND tablename = 'tender_lots'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.tender_lots', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : SELECT — authentifié
CREATE POLICY "Authenticated can view tender lots"
ON btp.tender_lots
FOR SELECT
TO authenticated
USING (true);

-- 7.2 : INSERT — authentifié avec contenu minimum
CREATE POLICY "Authenticated can insert tender lots"
ON btp.tender_lots
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(title)) > 0
  AND number >= 1
);

-- 7.3 : UPDATE — authentifié avec contenu minimum
CREATE POLICY "Authenticated can update tender lots"
ON btp.tender_lots
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(title)) > 0
  AND number >= 1
);

-- 7.4 : DELETE — admin uniquement
CREATE POLICY "Admins can delete tender lots"
ON btp.tender_lots
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 7.5 : Admins — gestion complète
CREATE POLICY "Admins can manage tender lots"
ON btp.tender_lots
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view tender lots" ON btp.tender_lots IS
  'Tous les utilisateurs authentifiés peuvent lire les lots d''appel d''offres.';
COMMENT ON POLICY "Authenticated can insert tender lots" ON btp.tender_lots IS
  'Insertion avec titre non vide et numéro >= 1.';
COMMENT ON POLICY "Authenticated can update tender lots" ON btp.tender_lots IS
  'Mise à jour avec titre non vide et numéro >= 1.';
COMMENT ON POLICY "Admins can delete tender lots" ON btp.tender_lots IS
  'Seul admin/director peut supprimer un lot.';
COMMENT ON POLICY "Admins can manage tender lots" ON btp.tender_lots IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_lots TO authenticated;
GRANT SELECT ON btp.tender_lots TO anon;
GRANT ALL ON btp.tender_lots TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_lots_tender_id
  ON btp.tender_lots(tender_id);

CREATE INDEX IF NOT EXISTS idx_tender_lots_project_id
  ON btp.tender_lots(project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_lots_number
  ON btp.tender_lots(tender_id, number);

CREATE INDEX IF NOT EXISTS idx_tender_lots_created_by
  ON btp.tender_lots(created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_lots_phase_ids
  ON btp.tender_lots USING GIN (linked_phase_ids);

CREATE INDEX IF NOT EXISTS idx_tender_lots_step_ids
  ON btp.tender_lots USING GIN (linked_step_ids);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
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
-- ÉTAPE 11 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS trg_tender_lots_updated_at ON btp.tender_lots;
CREATE TRIGGER trg_tender_lots_updated_at
  BEFORE UPDATE ON btp.tender_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_fk_count INT;
  v_index_count INT;
  v_row_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'tender_lots';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'tender_lots';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'tender_lots'
    AND c.contype = 'f';
  RAISE NOTICE 'FK : %', v_fk_count;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp' AND tablename = 'tender_lots';
  RAISE NOTICE 'Index : %', v_index_count;

  SELECT COUNT(*) INTO v_row_count
  FROM btp.tender_lots;
  RAISE NOTICE 'Lignes : %', v_row_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'tender_lots'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des FK :';
  FOR v_rec IN
    SELECT
      c.conname,
      kcu.column_name AS source_col,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_col
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = c.conname
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = c.conname
    WHERE n.nspname = 'btp'
      AND t.relname = 'tender_lots'
      AND c.contype = 'f'
    ORDER BY c.conname
  LOOP
    RAISE NOTICE '   • % : % → %.%.%',
      v_rec.conname, v_rec.source_col,
      v_rec.target_schema, v_rec.target_table, v_rec.target_col;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;