-- =============================================================================
-- MIGRATION: create_tender_documents_table
-- Description: Crée la table btp.tender_documents
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_documents (
    id UUID DEFAULT gen_random_uuid(),
    tender_id UUID,
    document_id UUID,
    project_id UUID,
    category TEXT CHECK (category IN ('administrative', 'technical', 'financial', 'legal', 'other')),
    subcategory TEXT,
    is_required BOOLEAN DEFAULT false,
    is_submitted BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    reviewer_notes TEXT,
    submission_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT tender_documents_pkey PRIMARY KEY (id),
    CONSTRAINT tender_documents_tender_id_fkey FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE,
    CONSTRAINT tender_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES btp.documents(id) ON DELETE CASCADE,
    CONSTRAINT tender_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE
);

ALTER TABLE btp.tender_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON btp.tender_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_document_id ON btp.tender_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_project_id ON btp.tender_documents(project_id);

GRANT SELECT ON btp.tender_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_documents TO authenticated;