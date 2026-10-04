-- =============================================================================
-- MIGRATION : 20250829220827_create_organizations_tables.sql
-- Date       : 2025-08-29
-- Objet      : Créer/compléter :
--              - btp.organizations
--              - btp.organizational_hierarchy
--              - btp.project_organizations
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - is_current_user_admin() qualifiée btp.
--   - Triggers via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE LA FONCTION btp.is_current_user_admin EXISTE
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
  ELSE
    RAISE NOTICE 'ℹ️  Fonction btp.is_current_user_admin() déjà présente';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.organizations (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  description text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.organizations créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.organizational_hierarchy (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.organizational_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES btp.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES btp.employees(id) ON DELETE CASCADE,
  position_title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  parent_id uuid REFERENCES btp.organizational_hierarchy(id) ON DELETE SET NULL,
  direct_reports_count integer DEFAULT 0,
  can_approve_projects boolean DEFAULT false,
  can_approve_payments boolean DEFAULT false,
  can_escalate_to_director boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "in_app": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_id)
);

ALTER TABLE btp.organizational_hierarchy
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS position_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS department text DEFAULT '',
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS direct_reports_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS can_approve_projects boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_approve_payments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_escalate_to_director boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "in_app": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.organizational_hierarchy créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.project_organizations (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.project_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES btp.organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contractor',
  is_primary boolean DEFAULT false,
  contract_amount numeric,
  contract_start_date date,
  contract_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, organization_id, role)
);

ALTER TABLE btp.project_organizations
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'contractor',
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_amount numeric,
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS contract_end_date date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.project_organizations créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.organizational_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.organizational_hierarchy FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.project_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_organizations FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('organizations', 'organizational_hierarchy', 'project_organizations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 : btp.organizations
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can view organizations"
ON btp.organizations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage organizations"
ON btp.organizations
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view organizations" ON btp.organizations IS
  'Tous les utilisateurs authentifiés peuvent lire les organisations.';
COMMENT ON POLICY "Admins can manage organizations" ON btp.organizations IS
  'Admin/director : gestion complète.';

-- -----------------------------------------------------------------------------
-- 6.2 : btp.organizational_hierarchy
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can view org hierarchy"
ON btp.organizational_hierarchy
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage org hierarchy"
ON btp.organizational_hierarchy
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view org hierarchy" ON btp.organizational_hierarchy IS
  'Tous les utilisateurs authentifiés peuvent lire la hiérarchie.';
COMMENT ON POLICY "Admins can manage org hierarchy" ON btp.organizational_hierarchy IS
  'Admin/director : gestion complète.';

-- -----------------------------------------------------------------------------
-- 6.3 : btp.project_organizations
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated can view project organizations"
ON btp.project_organizations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage project organizations"
ON btp.project_organizations
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view project organizations" ON btp.project_organizations IS
  'Tous les utilisateurs authentifiés peuvent lire les liens projet-organisation.';
COMMENT ON POLICY "Admins can manage project organizations" ON btp.project_organizations IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.organizations TO authenticated;
GRANT SELECT ON btp.organizations TO anon;
GRANT ALL ON btp.organizations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.organizational_hierarchy TO authenticated;
GRANT SELECT ON btp.organizational_hierarchy TO anon;
GRANT ALL ON btp.organizational_hierarchy TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_organizations TO authenticated;
GRANT SELECT ON btp.project_organizations TO anon;
GRANT ALL ON btp.project_organizations TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX
-- =============================================================================

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_code
  ON btp.organizations(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_is_active
  ON btp.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON btp.organizations(name);

-- organizational_hierarchy
CREATE INDEX IF NOT EXISTS idx_organizational_hierarchy_organization_id
  ON btp.organizational_hierarchy(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizational_hierarchy_employee_id
  ON btp.organizational_hierarchy(employee_id);
CREATE INDEX IF NOT EXISTS idx_organizational_hierarchy_parent_id
  ON btp.organizational_hierarchy(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizational_hierarchy_level
  ON btp.organizational_hierarchy(level);

-- project_organizations
CREATE INDEX IF NOT EXISTS idx_project_organizations_project_id
  ON btp.project_organizations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_organizations_organization_id
  ON btp.project_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_organizations_role
  ON btp.project_organizations(role);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : TRIGGERS updated_at (IDEMPOTENTS + fonction correcte)
-- =============================================================================
-- ✅ FIX : public.update_timestamp() au lieu de btp.update_updated_at_column()
-- ✅ FIX : DROP TRIGGER IF EXISTS avant CREATE TRIGGER
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

-- organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON btp.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON btp.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- organizational_hierarchy
DROP TRIGGER IF EXISTS update_organizational_hierarchy_updated_at ON btp.organizational_hierarchy;
CREATE TRIGGER update_organizational_hierarchy_updated_at
  BEFORE UPDATE ON btp.organizational_hierarchy
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- project_organizations (pas de updated_at dans la table, on skip)

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['organizations', 'organizational_hierarchy', 'project_organizations'];
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

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('organizations', 'organizational_hierarchy', 'project_organizations')
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