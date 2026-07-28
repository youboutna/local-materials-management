-- =============================================================================
-- MIGRATION: create_documents_table
-- Description: Crée la table btp.documents pour la gestion des documents
-- =============================================================================

-- 1. Créer la table documents dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.documents (
    id UUID DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    file_name TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    document_type TEXT CHECK (document_type IN ('contract', 'plan', 'report', 'invoice', 'procedure', 'other')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
    
    -- Relations
    project_id UUID,
    phase_id UUID,
    inspection_id UUID,
    payment_id UUID,
    supplier_id UUID,
    
    -- Métadonnées
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_internal_only BOOLEAN DEFAULT false,
    is_shared_with_suppliers BOOLEAN DEFAULT false,
    
    -- Suivi
    uploaded_by UUID,
    assigned_to UUID,
    deadline_date DATE,
    shared_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE,
    CONSTRAINT documents_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES btp.phases(id) ON DELETE SET NULL,
    CONSTRAINT documents_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES btp.inspections(id) ON DELETE SET NULL,
    CONSTRAINT documents_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES btp.payments(id) ON DELETE SET NULL
);

-- 2. Activer RLS
ALTER TABLE btp.documents ENABLE ROW LEVEL SECURITY;

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON btp.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_phase_id ON btp.documents(phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_supplier_id ON btp.documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_payment_id ON btp.documents(payment_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON btp.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON btp.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON btp.documents(uploaded_by);

-- 4. Trigger updated_at
CREATE TRIGGER set_timestamp_documents
    BEFORE UPDATE ON btp.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 5. Permissions
GRANT SELECT ON btp.documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.documents TO authenticated;

-- 6. Politiques RLS
DROP POLICY IF EXISTS select_documents ON btp.documents;
CREATE POLICY select_documents ON btp.documents
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager') OR uploaded_by = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS insert_documents ON btp.documents;
CREATE POLICY insert_documents ON btp.documents
    FOR INSERT TO public
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager') OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS update_documents ON btp.documents;
CREATE POLICY update_documents ON btp.documents
    FOR UPDATE TO public
    USING (auth.role() IN ('admin', 'director', 'manager') OR uploaded_by = auth.uid())
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager') OR uploaded_by = auth.uid());

-- 7. Commentaires
COMMENT ON TABLE btp.documents IS 'Table des documents';
COMMENT ON COLUMN btp.documents.document_type IS 'Type de document: contract, plan, report, invoice, procedure, other';
COMMENT ON COLUMN btp.documents.status IS 'Statut du document: draft, pending_review, approved, rejected, archived';