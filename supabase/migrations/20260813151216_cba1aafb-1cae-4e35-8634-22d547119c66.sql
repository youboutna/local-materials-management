-- ============================================================
-- MIGRATION: timestemps012451_add
-- But : Élargir les accès aux tables de liaison stratégie/budget
--       et créer la fonction has_any_role basée sur user_roles
-- ============================================================

-- 1. Créer la table user_roles si elle n'existe pas

-- 2. Insérer les rôles (avec ON CONFLICT pour éviter les doublons)

-- 3. Créer la fonction has_any_role qui interroge user_roles
CREATE OR REPLACE FUNCTION public.has_any_role(
    user_id UUID,
    roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER -- optionnel, pour exécuter avec les privilèges du créateur
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = $1
          AND status = 'active'
          AND role_name = ANY($2)
    );
$$;

-- Accorder l'exécution de la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT[]) TO authenticated;

-- 4. Accorder les droits sur les tables de liaison
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_budget_links TO authenticated;
GRANT ALL ON btp.project_budget_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_strategy_links TO authenticated;
GRANT ALL ON btp.project_strategy_links TO service_role;

-- 5. Politique RLS pour project_budget_links
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

-- 6. Politique RLS pour project_strategy_links
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