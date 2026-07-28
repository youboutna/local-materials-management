-- =============================================================================
-- MIGRATION: workflow_tables
-- Description: Tables de workflow (tender_steps, tender_step_documents, workflow_status)
-- =============================================================================

-- 1. Vérifier que la fonction update_timestamp existe
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Table tender_steps
CREATE TABLE IF NOT EXISTS btp.tender_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    procurement_phase TEXT,
    procurement_stage TEXT,
    required_documents TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'approved'))
);

-- 3. Table tender_step_documents
CREATE TABLE IF NOT EXISTS btp.tender_step_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id UUID NOT NULL,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_document_status CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    UNIQUE(step_id, document_id)
);

-- 4. Table workflow_status avec colonne générée pour UNIQUE
CREATE TABLE IF NOT EXISTS btp.workflow_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    phase_code TEXT NOT NULL,
    stage_code TEXT NOT NULL,
    task_id TEXT,
    -- ⬇️ Colonne générée pour la contrainte UNIQUE
    task_id_for_unique TEXT GENERATED ALWAYS AS (COALESCE(task_id, '')) STORED,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('project', 'tender')),
    CONSTRAINT valid_workflow_status CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    -- ⬇️ Utiliser la colonne générée pour UNIQUE
    UNIQUE(entity_id, entity_type, phase_code, stage_code, task_id_for_unique)
);

-- 5. Activer RLS
ALTER TABLE btp.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.workflow_status ENABLE ROW LEVEL SECURITY;

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id ON btp.tender_steps(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_steps_status ON btp.tender_steps(status);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_step_id ON btp.tender_step_documents(step_id);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_document_id ON btp.tender_step_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status_entity ON btp.workflow_status(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_status_phase ON btp.workflow_status(phase_code, stage_code);

-- 7. Triggers
CREATE TRIGGER set_timestamp_tender_steps
    BEFORE UPDATE ON btp.tender_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_tender_step_documents
    BEFORE UPDATE ON btp.tender_step_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_workflow_status
    BEFORE UPDATE ON btp.workflow_status
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 8. Permissions
GRANT SELECT ON btp.tender_steps TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_steps TO authenticated;

GRANT SELECT ON btp.tender_step_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_step_documents TO authenticated;

GRANT SELECT ON btp.workflow_status TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.workflow_status TO authenticated;

-- 9. Politiques RLS
DROP POLICY IF EXISTS select_tender_steps ON btp.tender_steps;
CREATE POLICY select_tender_steps ON btp.tender_steps
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS manage_tender_steps ON btp.tender_steps;
CREATE POLICY manage_tender_steps ON btp.tender_steps
    FOR ALL TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

-- Politiques pour tender_step_documents
DROP POLICY IF EXISTS select_tender_step_documents ON btp.tender_step_documents;
CREATE POLICY select_tender_step_documents ON btp.tender_step_documents
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS manage_tender_step_documents ON btp.tender_step_documents;
CREATE POLICY manage_tender_step_documents ON btp.tender_step_documents
    FOR ALL TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

-- Politiques pour workflow_status
DROP POLICY IF EXISTS select_workflow_status ON btp.workflow_status;
CREATE POLICY select_workflow_status ON btp.workflow_status
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS manage_workflow_status ON btp.workflow_status;
CREATE POLICY manage_workflow_status ON btp.workflow_status
    FOR ALL TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

-- 10. Commentaires
COMMENT ON TABLE btp.tender_steps IS 'Étapes des appels d''offres';
COMMENT ON TABLE btp.tender_step_documents IS 'Documents des étapes d''appels d''offres';
COMMENT ON TABLE btp.workflow_status IS 'Statut unifié des workflows';