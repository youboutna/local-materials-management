-- =============================================================================
-- MIGRATION : 20260726135416_create_inspectors_and_user_profiles.sql
-- Date       : 2026-07-26
-- Objet      : Créer les tables inspectors, inspector_availability,
--              project_members, payment_control_actions
--              + fonction get_highest_role + vue user_profiles
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - `public.is_current_user_admin()` créée si absente
--   - `public.update_timestamp()` créée si absente
--   - Fonctions SECURITY DEFINER + SET search_path = ''
--   - FK avec nettoyage préalable
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : CRÉER LES FONCTIONS UTILITAIRES SI ABSENTES
-- =============================================================================

-- 0.1 : public.is_current_user_admin()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_current_user_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.is_current_user_admin()
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
    REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
    RAISE NOTICE '✅ public.is_current_user_admin() créée';
  END IF;
END $$;

-- 0.2 : public.update_timestamp()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_timestamp'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.update_timestamp()
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
    REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.update_timestamp() TO authenticated;
    RAISE NOTICE '✅ public.update_timestamp() créée';
  END IF;
END $$;

-- 0.3 : public.update_updated_at_column() — alias rétrocompatible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.update_updated_at_column()
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
    REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
    RAISE NOTICE '✅ public.update_updated_at_column() créée (alias)';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.inspectors
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  specializations TEXT[] NOT NULL DEFAULT '{}'::text[],
  certifications TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'active',   -- pas de CHECK (nomenclature)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.inspectors
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- FK user_id → auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_inspectors_user'
      AND conrelid = 'btp.inspectors'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    -- Nettoyer les orphelins
    UPDATE btp.inspectors i
    SET user_id = NULL
    WHERE i.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id);

    ALTER TABLE btp.inspectors
      ADD CONSTRAINT fk_inspectors_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK fk_inspectors_user créée';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.inspectors'; END $$;

-- RLS
ALTER TABLE btp.inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspectors FORCE ROW LEVEL SECURITY;

-- Nettoyage policies
DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'btp' AND tablename = 'inspectors'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.inspectors', v_rec.policyname);
  END LOOP;
END $$;

-- Policies
CREATE POLICY "inspectors_select_authenticated"
ON btp.inspectors
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "inspectors_manage_admin"
ON btp.inspectors
FOR ALL TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Trigger
DROP TRIGGER IF EXISTS update_inspectors_updated_at ON btp.inspectors;
CREATE TRIGGER update_inspectors_updated_at
  BEFORE UPDATE ON btp.inspectors
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspectors TO authenticated;
GRANT SELECT ON btp.inspectors TO anon;
GRANT ALL ON btp.inspectors TO service_role;

-- Index
CREATE INDEX IF NOT EXISTS idx_inspectors_user_id
  ON btp.inspectors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inspectors_status
  ON btp.inspectors(status);

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.inspector_availability
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.inspector_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspector_id, date)
);

-- FK inspector_id → btp.inspectors(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_inspector_availability_inspector'
      AND conrelid = 'btp.inspector_availability'::regclass
  ) THEN
    -- Nettoyer les orphelins
    DELETE FROM btp.inspector_availability a
    WHERE a.inspector_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM btp.inspectors i WHERE i.id = a.inspector_id);

    ALTER TABLE btp.inspector_availability
      ADD CONSTRAINT fk_inspector_availability_inspector
      FOREIGN KEY (inspector_id) REFERENCES btp.inspectors(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_inspector_availability_inspector créée';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.inspector_availability'; END $$;

-- RLS
ALTER TABLE btp.inspector_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspector_availability FORCE ROW LEVEL SECURITY;

-- Nettoyage
DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'btp' AND tablename = 'inspector_availability'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.inspector_availability', v_rec.policyname);
  END LOOP;
END $$;

-- Policies
CREATE POLICY "inspector_availability_select_authenticated"
ON btp.inspector_availability
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "inspector_availability_manage_admin"
ON btp.inspector_availability
FOR ALL TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Trigger
DROP TRIGGER IF EXISTS update_inspector_availability_updated_at ON btp.inspector_availability;
CREATE TRIGGER update_inspector_availability_updated_at
  BEFORE UPDATE ON btp.inspector_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspector_availability TO authenticated;
GRANT ALL ON btp.inspector_availability TO service_role;

-- Index
CREATE INDEX IF NOT EXISTS idx_inspector_availability_inspector
  ON btp.inspector_availability(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspector_availability_date
  ON btp.inspector_availability(date);

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.project_members
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  access_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- CHECK structurel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_project_members_access_level'
      AND conrelid = 'btp.project_members'::regclass
  ) THEN
    ALTER TABLE btp.project_members
      ADD CONSTRAINT chk_project_members_access_level
      CHECK (access_level >= 0);
  END IF;
END $$;

-- FK project_id → btp.projects(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_project_members_project'
      AND conrelid = 'btp.project_members'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    DELETE FROM btp.project_members m
    WHERE m.project_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = m.project_id);

    ALTER TABLE btp.project_members
      ADD CONSTRAINT fk_project_members_project
      FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_project_members_project créée';
  END IF;

  -- FK user_id → auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_project_members_user'
      AND conrelid = 'btp.project_members'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    DELETE FROM btp.project_members m
    WHERE m.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = m.user_id);

    ALTER TABLE btp.project_members
      ADD CONSTRAINT fk_project_members_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_project_members_user créée';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.project_members'; END $$;

-- RLS
ALTER TABLE btp.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_members FORCE ROW LEVEL SECURITY;

-- Nettoyage
DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'btp' AND tablename = 'project_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.project_members', v_rec.policyname);
  END LOOP;
END $$;

-- Policies
CREATE POLICY "project_members_select_own_or_admin"
ON btp.project_members
FOR SELECT TO authenticated
USING (
  btp.project_members.user_id = auth.uid()
  OR public.is_current_user_admin()
);

CREATE POLICY "project_members_manage_admin"
ON btp.project_members
FOR ALL TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Trigger
DROP TRIGGER IF EXISTS update_project_members_updated_at ON btp.project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON btp.project_members
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_members TO authenticated;
GRANT ALL ON btp.project_members TO service_role;

-- Index
CREATE INDEX IF NOT EXISTS idx_project_members_project
  ON btp.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user
  ON btp.project_members(user_id);

-- =============================================================================
-- ÉTAPE 4 : TABLE btp.payment_control_actions
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.payment_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_block_id UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'other',    -- pas de CHECK
  description TEXT,
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',       -- pas de CHECK
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK payment_block_id → btp.payment_blocks(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_control_actions_block'
      AND conrelid = 'btp.payment_control_actions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'payment_blocks'
  ) THEN
    DELETE FROM btp.payment_control_actions a
    WHERE a.payment_block_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM btp.payment_blocks b WHERE b.id = a.payment_block_id);

    ALTER TABLE btp.payment_control_actions
      ADD CONSTRAINT fk_payment_control_actions_block
      FOREIGN KEY (payment_block_id) REFERENCES btp.payment_blocks(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_payment_control_actions_block créée';
  END IF;

  -- FK assigned_to → auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_control_actions_assigned_to'
      AND conrelid = 'btp.payment_control_actions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    UPDATE btp.payment_control_actions a
    SET assigned_to = NULL
    WHERE a.assigned_to IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.assigned_to);

    ALTER TABLE btp.payment_control_actions
      ADD CONSTRAINT fk_payment_control_actions_assigned_to
      FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- FK created_by → auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_control_actions_created_by'
      AND conrelid = 'btp.payment_control_actions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    UPDATE btp.payment_control_actions a
    SET created_by = NULL
    WHERE a.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.created_by);

    ALTER TABLE btp.payment_control_actions
      ADD CONSTRAINT fk_payment_control_actions_created_by
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.payment_control_actions'; END $$;

-- RLS
ALTER TABLE btp.payment_control_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.payment_control_actions FORCE ROW LEVEL SECURITY;

-- Nettoyage
DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'btp' AND tablename = 'payment_control_actions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.payment_control_actions', v_rec.policyname);
  END LOOP;
END $$;

-- Policies
CREATE POLICY "payment_control_actions_select_authenticated"
ON btp.payment_control_actions
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_insert_authenticated"
ON btp.payment_control_actions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_update_authenticated"
ON btp.payment_control_actions
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_delete_admin"
ON btp.payment_control_actions
FOR DELETE TO authenticated
USING (public.is_current_user_admin());

-- Trigger
DROP TRIGGER IF EXISTS update_payment_control_actions_updated_at ON btp.payment_control_actions;
CREATE TRIGGER update_payment_control_actions_updated_at
  BEFORE UPDATE ON btp.payment_control_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.payment_control_actions TO authenticated;
GRANT ALL ON btp.payment_control_actions TO service_role;

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_control_actions_block
  ON btp.payment_control_actions(payment_block_id);
CREATE INDEX IF NOT EXISTS idx_payment_control_actions_assigned_to
  ON btp.payment_control_actions(assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_control_actions_status
  ON btp.payment_control_actions(status);

-- =============================================================================
-- ÉTAPE 5 : FONCTION public.get_highest_role() — avec DROP préalable
-- =============================================================================
-- ✅ FIX 42P13 : DROP la fonction AVANT de la recréer
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_highest_role(UUID) CASCADE;

CREATE FUNCTION public.get_highest_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT ur.role_name
      FROM public.user_roles ur
      WHERE ur.user_id = p_user_id
      ORDER BY
        CASE ur.role_name
          WHEN 'admin' THEN 1
          WHEN 'director' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'agent' THEN 4
          ELSE 5
        END ASC
      LIMIT 1
    ),
    'member'
  );
$$;

REVOKE ALL ON FUNCTION public.get_highest_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_highest_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_highest_role(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_highest_role(UUID) TO service_role;

COMMENT ON FUNCTION public.get_highest_role(UUID) IS
  'Retourne le rôle le plus élevé d''un utilisateur (admin > director > manager > agent > member). '
  'SECURITY DEFINER + search_path = ''''.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction public.get_highest_role(UUID)'; END $$;

-- =============================================================================
-- ÉTAPE 6 : VUE public.user_profiles
-- =============================================================================

DROP VIEW IF EXISTS public.user_profiles CASCADE;

CREATE VIEW public.user_profiles
WITH (security_invoker = on) AS
SELECT
  p.id AS user_id,
  p.full_name,
  public.get_highest_role(p.id) AS role
FROM public.profiles p;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

COMMENT ON VIEW public.user_profiles IS
  'Vue des profils avec le rôle le plus élevé calculé via get_highest_role().';

DO $$ BEGIN RAISE NOTICE '✅ Vue public.user_profiles'; END $$;

-- =============================================================================
-- ÉTAPE 7 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_func_security TEXT;
  v_tables TEXT[] := ARRAY[
    'inspectors',
    'inspector_availability',
    'project_members',
    'payment_control_actions'
  ];
  v_tbl TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    RAISE NOTICE '  • btp.% :', v_tbl;
  END LOOP;

  -- Fonctions
  FOR v_rec IN
    SELECT p.proname, CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS sec
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_highest_role', 'is_current_user_admin', 'update_timestamp')
    ORDER BY p.proname
  LOOP
    RAISE NOTICE '   • fonction % : %', v_rec.proname, v_rec.sec;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;