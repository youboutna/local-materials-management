-- ============================================================
-- Strategy & Budget linkage tables for projects
-- ============================================================

CREATE TABLE IF NOT EXISTS btp.project_strategy_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  source_referential text NOT NULL DEFAULT 'SCAPP',
  lever_code text,
  chantier_code text,
  intervention_code text,
  objective_code text,
  contribution_pct numeric(5,2) NOT NULL DEFAULT 0,
  justification text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_project_strategy_links_project ON btp.project_strategy_links(project_id);
CREATE INDEX IF NOT EXISTS idx_project_strategy_links_objective ON btp.project_strategy_links(objective_code);
CREATE INDEX IF NOT EXISTS idx_project_strategy_links_intervention ON btp.project_strategy_links(intervention_code);

CREATE TABLE IF NOT EXISTS btp.project_budget_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  ministry_code text,
  program_code text,
  action_code text,
  chapter_code text,
  line_code text,
  allocated_ce numeric(20,2) NOT NULL DEFAULT 0,
  allocated_cp numeric(20,2) NOT NULL DEFAULT 0,
  fiscal_year integer NOT NULL DEFAULT 2026,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_project_budget_links_project ON btp.project_budget_links(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_links_line ON btp.project_budget_links(line_code);
CREATE INDEX IF NOT EXISTS idx_project_budget_links_program ON btp.project_budget_links(program_code);
CREATE INDEX IF NOT EXISTS idx_project_budget_links_year ON btp.project_budget_links(fiscal_year);

-- updated_at triggers
CREATE OR REPLACE FUNCTION btp.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_strategy_links_updated_at ON btp.project_strategy_links;
CREATE TRIGGER trg_strategy_links_updated_at BEFORE UPDATE ON btp.project_strategy_links
  FOR EACH ROW EXECUTE FUNCTION btp.set_updated_at();

DROP TRIGGER IF EXISTS trg_budget_links_updated_at ON btp.project_budget_links;
CREATE TRIGGER trg_budget_links_updated_at BEFORE UPDATE ON btp.project_budget_links
  FOR EACH ROW EXECUTE FUNCTION btp.set_updated_at();

-- Enable RLS
ALTER TABLE btp.project_strategy_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_budget_links ENABLE ROW LEVEL SECURITY;

-- Project access helper (inline since pattern is repeated)
-- Reuse same access logic as project_alerts
DO $$ BEGIN
  CREATE POLICY "strategy_links_access" ON btp.project_strategy_links FOR ALL
    USING (
      EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_strategy_links.project_id AND p.project_responsable_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM btp.project_organizations po
        JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
        JOIN btp.employees e ON oh.employee_id = e.id
        WHERE po.project_id = project_strategy_links.project_id AND e.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_strategy_links.project_id AND p.project_responsable_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM btp.project_organizations po
        JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
        JOIN btp.employees e ON oh.employee_id = e.id
        WHERE po.project_id = project_strategy_links.project_id AND e.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "budget_links_access" ON btp.project_budget_links FOR ALL
    USING (
      EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_budget_links.project_id AND p.project_responsable_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM btp.project_organizations po
        JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
        JOIN btp.employees e ON oh.employee_id = e.id
        WHERE po.project_id = project_budget_links.project_id AND e.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_budget_links.project_id AND p.project_responsable_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM btp.project_organizations po
        JOIN btp.organizational_hierarchy oh ON po.organization_id = oh.organization_id
        JOIN btp.employees e ON oh.employee_id = e.id
        WHERE po.project_id = project_budget_links.project_id AND e.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- GRANT Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_strategy_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_budget_links TO authenticated;
GRANT USAGE ON SCHEMA btp TO authenticated;