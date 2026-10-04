-- 1. Missing milestone columns (btp)
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS stage_type text,
  ADD COLUMN IF NOT EXISTS is_from_template boolean DEFAULT false;

-- 2. project_resources: allow privileged roles (admin/director/manager/consultant/supplier read)
DROP POLICY IF EXISTS "Privileged roles can manage project resources" ON btp.project_resources;
CREATE POLICY "Privileged roles can manage project resources"
ON btp.project_resources FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','director','manager','project_manager','engineering_consultant']))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','director','manager','project_manager','engineering_consultant']));

DROP POLICY IF EXISTS "Suppliers and consultants can view project resources" ON btp.project_resources;
CREATE POLICY "Suppliers and consultants can view project resources"
ON btp.project_resources FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['supplier','engineering_consultant']));

-- 3. oauth_providers: public read of enabled providers (no admin function call needed)
DROP POLICY IF EXISTS "Anyone can view oauth providers" ON public.oauth_providers;
CREATE POLICY "Anyone can view oauth providers"
ON public.oauth_providers FOR SELECT
USING (true);

GRANT SELECT ON public.oauth_providers TO anon, authenticated;