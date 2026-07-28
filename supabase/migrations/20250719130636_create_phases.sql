-- =============================================================================
-- MIGRATION: create_phases
-- Description: Crée la table btp.phases
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
    phase_type TEXT NOT NULL DEFAULT 'standard' CHECK (phase_type IN ('standard', 'custom')),
    phase_name TEXT,
    stage_name TEXT,
    custom_phase_number INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    estimated_duration INTEGER,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    budget NUMERIC DEFAULT 0,
    actual_cost NUMERIC DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    location TEXT,
    notes TEXT,
    custom_stages JSONB DEFAULT '[]',
    materials JSONB DEFAULT '[]',
    human_resources JSONB DEFAULT '[]',
    suppliers JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE btp.phases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_phases_project_id ON btp.phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON btp.phases(status);

GRANT SELECT ON btp.phases TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.phases TO authenticated;