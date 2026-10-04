-- =============================================================================
-- MIGRATION : 20260216164754_add_workspace_contact_fields.sql
-- Date       : 2026-02-16
-- Objet      : Ajouter les champs de contact à btp.workspaces
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur status (validation côté référentiels)
--   - CHECK structurel sur capacity (invariant)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.workspaces EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'workspaces'
  ) THEN
    RAISE EXCEPTION 'Table btp.workspaces introuvable — migration annulée';
  END IF;
  RAISE NOTICE '✅ Table btp.workspaces présente';
END $$;

-- =============================================================================
-- ÉTAPE 1 : AJOUTER LES COLONNES (idempotent)
-- =============================================================================

ALTER TABLE btp.workspaces
  ADD COLUMN IF NOT EXISTS contact_manager TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS facilities TEXT[];

DO $$ BEGIN RAISE NOTICE '✅ Colonnes ajoutées/vérifiées'; END $$;

-- =============================================================================
-- ÉTAPE 2 : SUPPRIMER LES CHECK DE NOMENCLATURE (si présents)
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
      AND t.relname = 'workspaces'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.workspaces DROP CONSTRAINT IF EXISTS %I',
      v_rec.conname);
    RAISE NOTICE '  ✅ CHECK de nomenclature supprimé : %', v_rec.conname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 3 : MISE À JOUR DES DONNÉES EXISTANTES (idempotent)
-- =============================================================================

-- Initialiser status basé sur is_active si NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'workspaces'
      AND column_name = 'is_active'
  ) THEN
    UPDATE btp.workspaces
    SET status = CASE
      WHEN is_active IS TRUE THEN 'active'
      WHEN is_active IS FALSE THEN 'inactive'
      ELSE 'active'
    END
    WHERE status IS NULL;

    RAISE NOTICE '  ✅ status initialisé depuis is_active';
  ELSE
    UPDATE btp.workspaces
    SET status = 'active'
    WHERE status IS NULL;

    RAISE NOTICE '  ✅ status initialisé à active (is_active absent)';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : CHECK STRUCTURELS (capacity uniquement)
-- =============================================================================
-- ✅ Garder les invariants structurels (capacity >= 0).
-- ❌ Pas de CHECK sur status (nomenclature).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_workspaces_capacity_positive'
      AND conrelid = 'btp.workspaces'::regclass
  ) THEN
    ALTER TABLE btp.workspaces
      ADD CONSTRAINT chk_workspaces_capacity_positive
      CHECK (capacity IS NULL OR capacity >= 0);
    RAISE NOTICE '  ✅ chk_workspaces_capacity_positive créé';
  ELSE
    RAISE NOTICE '  ℹ️  chk_workspaces_capacity_positive existe déjà';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.workspaces FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'workspaces'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.workspaces', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : Admins : gestion complète
CREATE POLICY "Admins can manage workspaces"
ON btp.workspaces
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 7.2 : Utilisateurs authentifiés : lecture
CREATE POLICY "Authenticated can view workspaces"
ON btp.workspaces
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage workspaces" ON btp.workspaces IS
  'Admin/director : gestion complète des workspaces.';
COMMENT ON POLICY "Authenticated can view workspaces" ON btp.workspaces IS
  'Tous les utilisateurs authentifiés peuvent lire les workspaces.';

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.workspaces TO authenticated;
GRANT SELECT ON btp.workspaces TO anon;
GRANT ALL ON btp.workspaces TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_status
  ON btp.workspaces(status);

CREATE INDEX IF NOT EXISTS idx_workspaces_capacity
  ON btp.workspaces(capacity) WHERE capacity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_facilities
  ON btp.workspaces USING GIN (facilities)
  WHERE facilities IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_contact_manager
  ON btp.workspaces(contact_manager)
  WHERE contact_manager IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : TRIGGER updated_at (si absent)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'workspaces'
      AND column_name = 'updated_at'
  ) THEN
    RAISE NOTICE '  ℹ️  btp.workspaces.updated_at absente — trigger non créé';
    RETURN;
  END IF;

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

  EXECUTE 'DROP TRIGGER IF EXISTS update_workspaces_updated_at ON btp.workspaces';
  EXECUTE 'CREATE TRIGGER update_workspaces_updated_at
           BEFORE UPDATE ON btp.workspaces
           FOR EACH ROW EXECUTE FUNCTION public.update_timestamp()';

  RAISE NOTICE '  ✅ Trigger updated_at créé';
END $$;

-- =============================================================================
-- ÉTAPE 11 : SEED NOMENCLATURE (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('workspace_status', 'active',   'Actif',   'Active',   1),
  ('workspace_status', 'inactive', 'Inactif', 'Inactive', 2),
  ('workspace_status', 'closed',   'Fermé',   'Closed',   3)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed workspace_status appliqué'; END $$;

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
  WHERE n.nspname = 'btp' AND c.relname = 'workspaces';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'workspaces';
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
    AND t.relname = 'workspaces'
    AND c.contype = 'c'
    AND col.data_type IN ('text', 'character varying')
    AND pg_get_constraintdef(c.oid) ILIKE '%IN (%';

  IF v_check_count = 0 THEN
    RAISE NOTICE '✅ Aucune contrainte CHECK de nomenclature';
  ELSE
    RAISE WARNING '⚠️  % contrainte(s) CHECK persistent', v_check_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes ajoutées :';
  FOR v_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'workspaces'
      AND column_name IN ('contact_manager', 'contact_phone', 'location', 'status', 'capacity', 'facilities')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '   • % : %', v_rec.column_name, v_rec.data_type;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;