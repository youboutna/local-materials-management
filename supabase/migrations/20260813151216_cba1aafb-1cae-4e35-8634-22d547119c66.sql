-- Widen access on strategic/budget linkage tables
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_budget_links TO authenticated;
GRANT ALL ON btp.project_budget_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_strategy_links TO authenticated;
GRANT ALL ON btp.project_strategy_links TO service_role;

DROP POLICY IF EXISTS budget_links_access ON btp.project_budget_links;
CREATE POLICY budget_links_access ON btp.project_budget_links
FOR ALL
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur','manager','agent'])
  OR EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_budget_links.project_id AND p.project_responsable_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM btp.project_organizations po
    JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE po.project_id = project_budget_links.project_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur','manager','agent'])
  OR EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_budget_links.project_id AND p.project_responsable_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM btp.project_organizations po
    JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE po.project_id = project_budget_links.project_id AND e.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS strategy_links_access ON btp.project_strategy_links;
CREATE POLICY strategy_links_access ON btp.project_strategy_links
FOR ALL
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur','manager','agent'])
  OR EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_strategy_links.project_id AND p.project_responsable_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM btp.project_organizations po
    JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE po.project_id = project_strategy_links.project_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur','manager','agent'])
  OR EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_strategy_links.project_id AND p.project_responsable_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM btp.project_organizations po
    JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE po.project_id = project_strategy_links.project_id AND e.user_id = auth.uid()
  )
);