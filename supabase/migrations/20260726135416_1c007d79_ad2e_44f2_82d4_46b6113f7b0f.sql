-- =============================================================================
-- MIGRATION: create_inspectors_and_user_profiles
-- Description: Création des tables d'inspecteurs, disponibilités, membres et vue user_profiles
-- =============================================================================

-- ============================================================
-- 1. TABLE inspectors
-- ============================================================
CREATE TABLE IF NOT EXISTS btp.inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspectors TO authenticated;
GRANT ALL ON btp.inspectors TO service_role;

ALTER TABLE btp.inspectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspectors_select_authenticated" ON btp.inspectors
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "inspectors_manage_admin" ON btp.inspectors
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER update_inspectors_updated_at BEFORE UPDATE ON btp.inspectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 2. TABLE inspector_availability
-- ============================================================
CREATE TABLE IF NOT EXISTS btp.inspector_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID NOT NULL REFERENCES btp.inspectors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspector_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspector_availability TO authenticated;
GRANT ALL ON btp.inspector_availability TO service_role;

ALTER TABLE btp.inspector_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspector_availability_select_authenticated" ON btp.inspector_availability
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "inspector_availability_manage_admin" ON btp.inspector_availability
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER update_inspector_availability_updated_at BEFORE UPDATE ON btp.inspector_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 3. TABLE project_members
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_project_members_project ON btp.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON btp.project_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_members TO authenticated;
GRANT ALL ON btp.project_members TO service_role;

ALTER TABLE btp.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_select_own_or_admin" ON btp.project_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_current_user_admin());

CREATE POLICY "project_members_manage_admin" ON btp.project_members
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER update_project_members_updated_at BEFORE UPDATE ON btp.project_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 4. TABLE payment_control_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS btp.payment_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_block_id UUID NOT NULL REFERENCES btp.payment_blocks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_control_actions_block ON btp.payment_control_actions(payment_block_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.payment_control_actions TO authenticated;
GRANT ALL ON btp.payment_control_actions TO service_role;

ALTER TABLE btp.payment_control_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_control_actions_select_authenticated" ON btp.payment_control_actions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_write_authenticated" ON btp.payment_control_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_update_authenticated" ON btp.payment_control_actions
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payment_control_actions_delete_admin" ON btp.payment_control_actions
  FOR DELETE TO authenticated USING (public.is_current_user_admin());

CREATE TRIGGER update_payment_control_actions_updated_at BEFORE UPDATE ON btp.payment_control_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 5. CRÉATION DE LA FONCTION get_highest_role (CORRECTION)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_highest_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, btp
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role_name INTO v_role
  FROM public.user_roles
  WHERE user_id = $1
  ORDER BY 
    CASE role_name
      WHEN 'admin' THEN 1
      WHEN 'director' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'agent' THEN 4
      ELSE 5
    END ASC
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'member');
END;
$$;

-- On donne les droits d'exécution à tout le monde (fonction stable et sécurisée)
GRANT EXECUTE ON FUNCTION public.get_highest_role(uuid) TO authenticated, anon, service_role;


-- ============================================================
-- 6. VUE user_profiles (AVEC LA BONNE FONCTION)
-- ============================================================
CREATE OR REPLACE VIEW public.user_profiles
WITH (security_invoker = on) AS
SELECT 
  p.id AS user_id,
  p.full_name,
  public.get_highest_role(p.id) AS role
FROM public.profiles p;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

-- ============================================================
-- 7. NOTIFY PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';