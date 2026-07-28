-- =============================================================================
-- MIGRATION: create_inspections_table
-- Description: Crée la table inspections dans le schema btp
-- =============================================================================

-- Create the btp schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS btp;

-- Create inspections table
CREATE TABLE IF NOT EXISTS btp.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    phase_id UUID,
    date DATE,
    inspector TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    payment_type TEXT,
    progress_at_inspection INTEGER DEFAULT 0 CHECK (progress_at_inspection >= 0 AND progress_at_inspection <= 100),
    comments TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES btp.phases(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON btp.inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_phase_id ON btp.inspections(phase_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON btp.inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON btp.inspections(date);

-- Enable Row Level Security
ALTER TABLE btp.inspections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS select_inspections ON btp.inspections;
CREATE POLICY select_inspections ON btp.inspections 
    FOR SELECT USING (true);
    
DROP POLICY IF EXISTS insert_inspections ON btp.inspections;
CREATE POLICY insert_inspections ON btp.inspections 
    FOR INSERT WITH CHECK (true);
    
DROP POLICY IF EXISTS update_inspections ON btp.inspections;
CREATE POLICY update_inspections ON btp.inspections 
    FOR UPDATE USING (true);
    
DROP POLICY IF EXISTS delete_inspections ON btp.inspections;
CREATE POLICY delete_inspections ON btp.inspections 
    FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inspections_timestamp ON btp.inspections;
CREATE TRIGGER update_inspections_timestamp
    BEFORE UPDATE ON btp.inspections
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- Grant permissions
GRANT SELECT ON btp.inspections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.inspections TO authenticated;

-- Add comments
COMMENT ON TABLE btp.inspections IS 'Table des inspections de chantier';
COMMENT ON COLUMN btp.inspections.id IS 'Identifiant unique de l''inspection';
COMMENT ON COLUMN btp.inspections.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.inspections.phase_id IS 'Référence à la phase du projet';
COMMENT ON COLUMN btp.inspections.date IS 'Date de l''inspection';
COMMENT ON COLUMN btp.inspections.inspector IS 'Nom de l''inspecteur';
COMMENT ON COLUMN btp.inspections.status IS 'Statut de l''inspection';
COMMENT ON COLUMN btp.inspections.payment_type IS 'Type de paiement associé';
COMMENT ON COLUMN btp.inspections.progress_at_inspection IS 'Progression du projet lors de l''inspection (0-100)';
COMMENT ON COLUMN btp.inspections.comments IS 'Commentaires sur l''inspection';
COMMENT ON COLUMN btp.inspections.documents IS 'Documents associés à l''inspection (JSON)';
COMMENT ON COLUMN btp.inspections.created_at IS 'Date de création';
COMMENT ON COLUMN btp.inspections.updated_at IS 'Date de dernière mise à jour';