-- 1. inspectors
CREATE TABLE IF NOT EXISTS public.inspectors (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspectors TO authenticated;
GRANT ALL ON public.inspectors TO service_role;
ALTER TABLE public.inspectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspectors_select_authenticated" ON public.inspectors
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "inspectors_manage_admin" ON public.inspectors
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
CREATE TRIGGER update_inspectors_updated_at BEFORE UPDATE ON public.inspectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. inspector_availability
CREATE TABLE IF NOT EXISTS public.inspector_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID NOT NULL REFERENCES public.inspectors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspector_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspector_availability TO authenticated;
GRANT ALL ON public.inspector_availability TO service_role;
ALTER TABLE public.inspector_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspector_availability_select_authenticated" ON public.inspector_availability
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "inspector_availability_manage_admin" ON public.inspector_availability
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
CREATE TRIGGER update_inspector_availability_updated_at BEFORE UPDATE ON public.inspector_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. project_members
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  access_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_members_select_own_or_admin" ON public.project_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_current_user_admin());
CREATE POLICY "project_members_manage_admin" ON public.project_members
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
CREATE TRIGGER update_project_members_updated_at BEFORE UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. payment_control_actions
CREATE TABLE IF NOT EXISTS public.payment_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_block_id UUID NOT NULL REFERENCES public.payment_blocks(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_payment_control_actions_block ON public.payment_control_actions(payment_block_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_control_actions TO authenticated;
GRANT ALL ON public.payment_control_actions TO service_role;
ALTER TABLE public.payment_control_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_control_actions_select_authenticated" ON public.payment_control_actions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "payment_control_actions_write_authenticated" ON public.payment_control_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payment_control_actions_update_authenticated" ON public.payment_control_actions
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payment_control_actions_delete_admin" ON public.payment_control_actions
  FOR DELETE TO authenticated USING (public.is_current_user_admin());
CREATE TRIGGER update_payment_control_actions_updated_at BEFORE UPDATE ON public.payment_control_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. user_profiles view (user_id + highest role)
CREATE OR REPLACE VIEW public.user_profiles
WITH (security_invoker = on) AS
SELECT p.id AS user_id,
       p.full_name,
       public.get_highest_role(p.id) AS role
FROM public.profiles p;
GRANT SELECT ON public.user_profiles TO authenticated;