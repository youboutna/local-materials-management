-- =============================================================================
-- MIGRATION : 20260601115111_create_inspection_pvs.sql
-- Date       : 2026-06-01
-- Objet      : Créer btp.inspection_pvs + RLS + trigger + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Pas de WITH CHECK (true) nu
--   - Trigger via public.update_timestamp()
--   - CHECK structurel sur version (>= 1)
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
-- ÉTAPE 1 : TABLE btp.inspection_pvs (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.inspection_pvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL,
  pv_number TEXT NOT NULL DEFAULT '',
  pv_type TEXT NOT NULL DEFAULT 'initial',   -- pas de CHECK (nomenclature)
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',       -- pas de CHECK (nomenclature)
  generated_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.inspection_pvs
  ADD COLUMN IF NOT EXISTS inspection_id UUID,
  ADD COLUMN IF NOT EXISTS pv_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pv_type TEXT DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS generated_by TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.inspection_pvs créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : CHECK STRUCTUREL (version >= 1)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_inspection_pvs_version'
      AND conrelid = 'btp.inspection_pvs'::regclass
  ) THEN
    ALTER TABLE btp.inspection_pvs
      ADD CONSTRAINT chk_inspection_pvs_version
      CHECK (version >= 1);
    RAISE NOTICE '  ✅ chk_inspection_pvs_version créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : FK inspection_id → btp.inspections(id) (si la table existe)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_inspection_pvs_inspection'
      AND conrelid = 'btp.inspection_pvs'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'inspections'
  ) THEN
    ALTER TABLE btp.inspection_pvs
      ADD CONSTRAINT fk_inspection_pvs_inspection
      FOREIGN KEY (inspection_id) REFERENCES btp.inspections(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_inspection_pvs_inspection créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.inspection_pvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspection_pvs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspection_pvs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.inspection_pvs', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : SELECT — authentifié (lecture des PV d'inspection)
CREATE POLICY "Authenticated can read inspection PVs"
ON btp.inspection_pvs
FOR SELECT
TO authenticated
USING (true);

-- 6.2 : INSERT — authentifié avec contrôle du contenu minimum
CREATE POLICY "Authenticated can create inspection PVs"
ON btp.inspection_pvs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(pv_number)) > 0
  AND length(trim(content)) > 0
);

-- 6.3 : UPDATE — authentifié avec contrôle
CREATE POLICY "Authenticated can update inspection PVs"
ON btp.inspection_pvs
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(pv_number)) > 0
  AND length(trim(content)) > 0
);

-- 6.4 : DELETE — admin uniquement (plus sûr)
CREATE POLICY "Admins can delete inspection PVs"
ON btp.inspection_pvs
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 6.5 : Admins — gestion complète
CREATE POLICY "Admins can manage inspection PVs"
ON btp.inspection_pvs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can read inspection PVs" ON btp.inspection_pvs IS
  'Tous les utilisateurs authentifiés peuvent lire les PV d''inspection.';
COMMENT ON POLICY "Authenticated can create inspection PVs" ON btp.inspection_pvs IS
  'Création avec contenu minimum (pv_number et content non vides).';
COMMENT ON POLICY "Authenticated can update inspection PVs" ON btp.inspection_pvs IS
  'Mise à jour avec contenu minimum.';
COMMENT ON POLICY "Admins can delete inspection PVs" ON btp.inspection_pvs IS
  'Seul admin/director peut supprimer un PV.';
COMMENT ON POLICY "Admins can manage inspection PVs" ON btp.inspection_pvs IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspection_pvs TO authenticated;
GRANT SELECT ON btp.inspection_pvs TO anon;
GRANT ALL ON btp.inspection_pvs TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_inspection_id
  ON btp.inspection_pvs(inspection_id);

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_generated_at
  ON btp.inspection_pvs(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_status
  ON btp.inspection_pvs(status);

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_pv_number
  ON btp.inspection_pvs(pv_number);

CREATE INDEX IF NOT EXISTS idx_inspection_pvs_pv_type
  ON btp.inspection_pvs(pv_type);

-- Index partiel sur pdf_url (les PV générés)
CREATE INDEX IF NOT EXISTS idx_inspection_pvs_pdf_url
  ON btp.inspection_pvs(pdf_url)
  WHERE pdf_url IS NOT NULL;

-- Index composite pour recherche par inspection + date
CREATE INDEX IF NOT EXISTS idx_inspection_pvs_inspection_date
  ON btp.inspection_pvs(inspection_id, generated_at DESC);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 10 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS update_inspection_pvs_updated_at ON btp.inspection_pvs;
CREATE TRIGGER update_inspection_pvs_updated_at
  BEFORE UPDATE ON btp.inspection_pvs
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : SEED NOMENCLATURE (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  -- Types de PV
  ('inspection_pv_type', 'initial',      'Initial',       'Initial',      1),
  ('inspection_pv_type', 'intermediaire','Intermédiaire', 'Intermediate', 2),
  ('inspection_pv_type', 'final',        'Final',         'Final',        3),
  ('inspection_pv_type', 'levee_reserves','Levée de réserves', 'Reserves Clearance', 4),

  -- Statuts de PV
  ('inspection_pv_status', 'draft',     'Brouillon', 'Draft',     1),
  ('inspection_pv_status', 'generated', 'Généré',    'Generated', 2),
  ('inspection_pv_status', 'signed',    'Signé',     'Signed',    3),
  ('inspection_pv_status', 'archived',  'Archivé',   'Archived',  4)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed nomenclatures inspection_pv appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
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
  WHERE n.nspname = 'btp' AND c.relname = 'inspection_pvs';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'inspection_pvs';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_check_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
  JOIN information_schema.columns col
    ON col.table_schema = n.nspname
   AND col.table_name = t.relname
   AND col.column_name = a.attname
  WHERE n.nspname = 'btp'
    AND t.relname = 'inspection_pvs'
    AND c.contype = 'c'
    AND col.data_type IN ('text', 'character varying')
    AND pg_get_constraintdef(c.oid) ILIKE '%IN (%';

  IF v_check_count = 0 THEN
    RAISE NOTICE '✅ Aucune contrainte CHECK de nomenclature';
  ELSE
    RAISE WARNING '⚠️  % contrainte(s) CHECK persistent', v_check_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspection_pvs'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;