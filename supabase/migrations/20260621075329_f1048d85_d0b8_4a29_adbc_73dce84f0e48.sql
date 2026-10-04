-- =============================================================================
-- MIGRATION : 20260621075329_create_phase_materials.sql
-- Date       : 2026-06-21
-- Objet      : Créer btp.phase_materials + RLS + trigger + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - WITH CHECK encadré (pas de (true) nu)
--   - DELETE réservé aux admins
--   - FK phase_id, project_id, material_id, created_by
--   - CHECK structurel (quantity >= 0)
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
-- ÉTAPE 1 : TABLE btp.phase_materials (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.phase_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL,
  project_id UUID,
  material_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.phase_materials
  ADD COLUMN IF NOT EXISTS phase_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS material_id UUID,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- =============================================================================
-- ÉTAPE 2 : UNIQUE (phase_id, material_id) — IDEMPOTENT
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'phase_materials_phase_id_material_id_key'
      AND conrelid = 'btp.phase_materials'::regclass
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT phase_materials_phase_id_material_id_key
      UNIQUE (phase_id, material_id);
    RAISE NOTICE '  ✅ UNIQUE (phase_id, material_id) créé';
  ELSE
    RAISE NOTICE '  ℹ️  UNIQUE (phase_id, material_id) existe déjà';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : CHECK STRUCTURELS
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_phase_materials_quantity'
      AND conrelid = 'btp.phase_materials'::regclass
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT chk_phase_materials_quantity
      CHECK (quantity >= 0);
    RAISE NOTICE '  ✅ chk_phase_materials_quantity créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : FK VERS btp.project_phases, btp.projects, btp.materials, auth.users
-- =============================================================================

DO $$
BEGIN
  -- FK phase_id → btp.project_phases(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_phase_materials_phase'
      AND conrelid = 'btp.phase_materials'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT fk_phase_materials_phase
      FOREIGN KEY (phase_id) REFERENCES btp.project_phases(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_phase_materials_phase créée';
  END IF;

  -- FK project_id → btp.projects(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_phase_materials_project'
      AND conrelid = 'btp.phase_materials'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT fk_phase_materials_project
      FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_phase_materials_project créée';
  END IF;

  -- FK material_id → btp.materials(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_phase_materials_material'
      AND conrelid = 'btp.phase_materials'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'materials'
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT fk_phase_materials_material
      FOREIGN KEY (material_id) REFERENCES btp.materials(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_phase_materials_material créée';
  END IF;

  -- FK created_by → auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_phase_materials_created_by'
      AND conrelid = 'btp.phase_materials'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    ALTER TABLE btp.phase_materials
      ADD CONSTRAINT fk_phase_materials_created_by
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK fk_phase_materials_created_by créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.phase_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.phase_materials FORCE ROW LEVEL SECURITY;

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
    WHERE schemaname = 'btp' AND tablename = 'phase_materials'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.phase_materials', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : SELECT — authentifié
CREATE POLICY "Authenticated can view phase materials"
ON btp.phase_materials
FOR SELECT
TO authenticated
USING (true);

-- 7.2 : INSERT — authentifié avec quantity >= 0 (CHECK le fait déjà, mais cohérent)
CREATE POLICY "Authenticated can insert phase materials"
ON btp.phase_materials
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND btp.phase_materials.quantity >= 0
);

-- 7.3 : UPDATE — authentifié avec quantity >= 0
CREATE POLICY "Authenticated can update phase materials"
ON btp.phase_materials
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND btp.phase_materials.quantity >= 0
);

-- 7.4 : DELETE — admin uniquement
CREATE POLICY "Admins can delete phase materials"
ON btp.phase_materials
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 7.5 : Admins — gestion complète
CREATE POLICY "Admins can manage phase materials"
ON btp.phase_materials
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view phase materials" ON btp.phase_materials IS
  'Tous les utilisateurs authentifiés peuvent lire les matériaux de phase.';
COMMENT ON POLICY "Authenticated can insert phase materials" ON btp.phase_materials IS
  'Insertion avec quantity >= 0.';
COMMENT ON POLICY "Authenticated can update phase materials" ON btp.phase_materials IS
  'Mise à jour avec quantity >= 0.';
COMMENT ON POLICY "Admins can delete phase materials" ON btp.phase_materials IS
  'Seul admin/director peut supprimer un matériau de phase.';
COMMENT ON POLICY "Admins can manage phase materials" ON btp.phase_materials IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.phase_materials TO authenticated;
GRANT SELECT ON btp.phase_materials TO anon;
GRANT ALL ON btp.phase_materials TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_phase_materials_phase
  ON btp.phase_materials(phase_id);

CREATE INDEX IF NOT EXISTS idx_phase_materials_project
  ON btp.phase_materials(project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phase_materials_material
  ON btp.phase_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_phase_materials_created_by
  ON btp.phase_materials(created_by)
  WHERE created_by IS NOT NULL;

-- Index composite pour recherche par phase + material
CREATE INDEX IF NOT EXISTS idx_phase_materials_phase_material
  ON btp.phase_materials(phase_id, material_id);

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

DROP TRIGGER IF EXISTS trg_phase_materials_updated_at ON btp.phase_materials;
CREATE TRIGGER trg_phase_materials_updated_at
  BEFORE UPDATE ON btp.phase_materials
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
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'phase_materials';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'phase_materials';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'phase_materials'
    AND c.contype = 'f';
  RAISE NOTICE 'FK : %', v_fk_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'phase_materials'
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
      AND t.relname = 'phase_materials'
      AND c.contype = 'f'
    ORDER BY c.conname
  LOOP
    RAISE NOTICE '   • % : %.% → %.%',
      v_rec.conname, 'phase_materials', v_rec.source_col,
      v_rec.target_table, v_rec.target_col;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;