-- =============================================================================
-- MIGRATION: create_projects
-- Description: Crée la table btp.projects
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en attente' CHECK (status IN ('en cours', 'terminé', 'en attente', 'suspendu', 'annulé')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget NUMERIC NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    thumbnail TEXT DEFAULT '/img/project-placeholder.jpg',
    team_size INTEGER NOT NULL DEFAULT 1,
    coordinates_latitude NUMERIC,
    coordinates_longitude NUMERIC,
    project_order INTEGER,
    financing_source TEXT,
    market_type TEXT,
    selection_mode TEXT,
    launch_date TIMESTAMPTZ,
    attribution_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    project_reference TEXT,
    project_responsable_id UUID,
    main_contractor TEXT,
    allows_initial_payment BOOLEAN DEFAULT FALSE,
    initial_payment_percentage NUMERIC DEFAULT 0,
    current_phase TEXT,
    current_stage TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE btp.projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_status ON btp.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON btp.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON btp.projects(updated_at);

GRANT SELECT ON btp.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.projects TO authenticated;