-- =============================================================================
-- MIGRATION: create_tenders_and_link_documents
-- Description: Crée la table btp.tenders et lie les documents aux appels d'offres
-- =============================================================================

-- 1. Créer la table tenders
CREATE TABLE IF NOT EXISTS btp.tenders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    project_id UUID REFERENCES btp.projects(id) ON DELETE CASCADE,
    launch_date DATE,
    attribution_date DATE,
    selection_mode TEXT,
    market_type TEXT,
    financing_source TEXT,
    project_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'awarded')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Créer les index pour tenders
CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON btp.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_launch_date ON btp.tenders(launch_date);

-- 3. Activer RLS sur tenders
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour tenders
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable read access for authenticated users" 
ON btp.tenders 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable insert access for authenticated users" 
ON btp.tenders 
FOR INSERT 
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable update access for authenticated users" 
ON btp.tenders 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable delete access for authenticated users" 
ON btp.tenders 
FOR DELETE 
TO authenticated
USING (true);

-- 5. Ajouter la colonne tender_id à tender_documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'tender_documents') THEN
        ALTER TABLE btp.tender_documents 
        ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES btp.tenders(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Colonne tender_id ajoutée à btp.tender_documents';
    ELSE
        RAISE NOTICE '⏭️ Table btp.tender_documents n''existe pas encore';
    END IF;
END $$;

-- 6. Créer l'index pour tender_id
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON btp.tender_documents(tender_id);

-- 7. Ajouter la colonne tender_document_id à documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'documents') THEN
        ALTER TABLE btp.documents 
        ADD COLUMN IF NOT EXISTS tender_document_id UUID REFERENCES btp.tender_documents(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne tender_document_id ajoutée à btp.documents';
    ELSE
        RAISE NOTICE '⏭️ Table btp.documents n''existe pas encore';
    END IF;
END $$;

-- 8. Créer l'index pour tender_document_id
CREATE INDEX IF NOT EXISTS idx_documents_tender_document_id ON btp.documents(tender_document_id);

-- 9. Mettre à jour les politiques RLS pour tender_documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'tender_documents') THEN
        -- Supprimer les anciennes politiques
        DROP POLICY IF EXISTS "select_tender_documents_by_role" ON btp.tender_documents;
        DROP POLICY IF EXISTS "manage_tender_documents_admin_director_manager" ON btp.tender_documents;
        DROP POLICY IF EXISTS "Enable read access for tender documents" ON btp.tender_documents;
        DROP POLICY IF EXISTS "Enable insert access for tender documents" ON btp.tender_documents;
        DROP POLICY IF EXISTS "Enable update access for tender documents" ON btp.tender_documents;
        DROP POLICY IF EXISTS "Enable delete access for tender documents" ON btp.tender_documents;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Enable read access for tender documents" 
        ON btp.tender_documents 
        FOR SELECT 
        TO authenticated
        USING (true);
        
        CREATE POLICY "Enable insert access for tender documents" 
        ON btp.tender_documents 
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
        
        CREATE POLICY "Enable update access for tender documents" 
        ON btp.tender_documents 
        FOR UPDATE 
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        CREATE POLICY "Enable delete access for tender documents" 
        ON btp.tender_documents 
        FOR DELETE 
        TO authenticated
        USING (true);
        
        RAISE NOTICE '✅ Politiques RLS mises à jour pour btp.tender_documents';
    END IF;
END $$;

-- 10. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tenders TO authenticated;
GRANT SELECT ON btp.tenders TO anon;

-- 11. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_tenders_updated_at ON btp.tenders;
CREATE TRIGGER update_tenders_updated_at
    BEFORE UPDATE ON btp.tenders
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 12. Commentaires
COMMENT ON TABLE btp.tenders IS 'Table des appels d''offres';
COMMENT ON COLUMN btp.tenders.id IS 'Identifiant unique de l''appel d''offres';
COMMENT ON COLUMN btp.tenders.title IS 'Titre de l''appel d''offres';
COMMENT ON COLUMN btp.tenders.description IS 'Description détaillée';
COMMENT ON COLUMN btp.tenders.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.tenders.launch_date IS 'Date de lancement';
COMMENT ON COLUMN btp.tenders.attribution_date IS 'Date d''attribution';
COMMENT ON COLUMN btp.tenders.selection_mode IS 'Mode de sélection';
COMMENT ON COLUMN btp.tenders.market_type IS 'Type de marché';
COMMENT ON COLUMN btp.tenders.financing_source IS 'Source de financement';
COMMENT ON COLUMN btp.tenders.project_reference IS 'Référence du projet';
COMMENT ON COLUMN btp.tenders.status IS 'Statut de l''appel d''offres';
COMMENT ON COLUMN btp.tenders.created_at IS 'Date de création';
COMMENT ON COLUMN btp.tenders.updated_at IS 'Date de dernière mise à jour';

-- 13. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250812000000 terminée avec succès';
    RAISE NOTICE '   - Table btp.tenders créée/vérifiée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Colonnes ajoutées aux tables liées';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;