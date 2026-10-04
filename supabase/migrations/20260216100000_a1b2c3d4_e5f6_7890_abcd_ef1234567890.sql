-- =============================================================================
-- MIGRATION : 20260216100000_create_locations_table.sql
-- Date       : 2026-02-16
-- Objet      : Créer la table btp.locations (régions, villes, etc.)
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + DROP CONSTRAINT/TRIGGER IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur type (validation côté référentiels)
--   - CHECK structurel sur latitude/longitude (invariant)
--   - Fonction trigger sécurisée
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
-- ÉTAPE 1 : TABLE btp.locations (IDEMPOTENTE, SANS CHECK de nomenclature)
-- =============================================================================
-- ⚠️ Pas de CHECK sur type : validation côté référentiels TS.
-- ✅ CHECK sur latitude/longitude : invariant structurel.
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  type VARCHAR(30) NOT NULL DEFAULT 'region',   -- pas de CHECK
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  parent_code VARCHAR(50),
  economic_importance VARCHAR(50),
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.locations
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'region',
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS parent_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS economic_importance VARCHAR(50),
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.locations créée/vérifiée'; END $$;

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
      AND t.relname = 'locations'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.locations DROP CONSTRAINT IF EXISTS %I',
      v_rec.conname);
    RAISE NOTICE '  ✅ Contrainte de nomenclature supprimée : %', v_rec.conname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 3 : INDEX (idempotents, avec guard de colonne)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_type
  ON btp.locations(type);

CREATE INDEX IF NOT EXISTS idx_locations_code
  ON btp.locations(code);

CREATE INDEX IF NOT EXISTS idx_locations_parent_code
  ON btp.locations(parent_code)
  WHERE parent_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_locations_coordinates
  ON btp.locations(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_locations_name
  ON btp.locations(name);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 4 : FK AUTO-RÉFÉRENTIELLE (avec guard)
-- =============================================================================
-- ✅ Fix : ON DELETE SET NULL au lieu de CASCADE
--    (supprimer une région ne doit PAS supprimer ses villes).
-- =============================================================================

DO $$
BEGIN
  -- Supprimer l'ancienne FK si elle existe avec un mauvais ON DELETE
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_locations_parent_code'
      AND conrelid = 'btp.locations'::regclass
  ) THEN
    -- Vérifier le ON DELETE actuel
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_name = 'fk_locations_parent_code'
        AND delete_rule = 'SET NULL'
    ) THEN
      ALTER TABLE btp.locations
        DROP CONSTRAINT fk_locations_parent_code;
      RAISE NOTICE '  ℹ️  Ancienne FK fk_locations_parent_code supprimée (mauvaise ON DELETE)';
    END IF;
  END IF;

  -- Créer la FK si absente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_locations_parent_code'
      AND conrelid = 'btp.locations'::regclass
  ) THEN
    ALTER TABLE btp.locations
      ADD CONSTRAINT fk_locations_parent_code
      FOREIGN KEY (parent_code) REFERENCES btp.locations(code)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    RAISE NOTICE '  ✅ FK fk_locations_parent_code créée (SET NULL)';
  ELSE
    RAISE NOTICE '  ℹ️  FK fk_locations_parent_code déjà présente';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : CHECK STRUCTURELS (latitude/longitude)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_latitude_range'
      AND conrelid = 'btp.locations'::regclass
  ) THEN
    ALTER TABLE btp.locations
      ADD CONSTRAINT chk_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
    RAISE NOTICE '  ✅ chk_latitude_range créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_longitude_range'
      AND conrelid = 'btp.locations'::regclass
  ) THEN
    ALTER TABLE btp.locations
      ADD CONSTRAINT chk_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
    RAISE NOTICE '  ✅ chk_longitude_range créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 6 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.locations FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 7 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'locations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.locations', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 8 : POLICIES SÉCURISÉES
-- =============================================================================

-- 8.1 : Lecture publique (données géographiques non sensibles)
CREATE POLICY "Authenticated can view locations"
ON btp.locations
FOR SELECT
TO authenticated
USING (true);

-- 8.2 : Admins : gestion complète
CREATE POLICY "Admins can manage locations"
ON btp.locations
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view locations" ON btp.locations IS
  'Tous les utilisateurs authentifiés peuvent lire les localisations.';
COMMENT ON POLICY "Admins can manage locations" ON btp.locations IS
  'Admin/director : gestion complète des localisations.';

-- =============================================================================
-- ÉTAPE 9 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.locations TO authenticated;
GRANT SELECT ON btp.locations TO anon;
GRANT ALL ON btp.locations TO service_role;

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
-- ÉTAPE 11 : TRIGGER updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_locations_updated_at ON btp.locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON btp.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 12 : SEED NOMENCLATURE (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('location_type', 'region',     'Région',     'Region',     1),
  ('location_type', 'city',       'Ville',      'City',       2),
  ('location_type', 'localite',   'Localité',   'Locality',   3),
  ('location_type', 'wilaya',     'Wilaya',     'Wilaya',     4),
  ('location_type', 'moughataa',  'Moughataa',  'Moughataa',  5),
  ('location_type', 'commune',    'Commune',    'Commune',    6),
  ('location_type', 'jiha',       'Jiha',       'Jiha',       7)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed location_type appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
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
  WHERE n.nspname = 'btp' AND c.relname = 'locations';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'locations';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp' AND tablename = 'locations';
  RAISE NOTICE 'Index : %', v_index_count;

  SELECT COUNT(*) INTO v_check_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'locations'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%IN (%';

  IF v_check_count = 0 THEN
    RAISE NOTICE '✅ Aucune contrainte CHECK de nomenclature';
  ELSE
    RAISE WARNING '⚠️  % contrainte(s) CHECK persistent', v_check_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'locations'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;