-- =============================================================================
-- MIGRATION: enhance_documents
-- Description: Ajoute des colonnes à btp.documents
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'documents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'document_version') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN document_version TEXT DEFAULT ''1.0''';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'parent_document_id') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN parent_document_id UUID';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'expiry_date') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN expiry_date DATE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'approval_status') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN approval_status TEXT DEFAULT ''pending'' CHECK (approval_status IN (''pending'', ''approved'', ''rejected'', ''under_review''))';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'approved_by') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN approved_by UUID';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'approval_date') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN approval_date TIMESTAMPTZ';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'document_hash') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN document_hash TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'documents' AND column_name = 'access_level') THEN
            EXECUTE 'ALTER TABLE btp.documents ADD COLUMN access_level TEXT DEFAULT ''internal'' CHECK (access_level IN (''public'', ''internal'', ''confidential'', ''restricted''))';
        END IF;
        RAISE NOTICE '✅ btp.documents enrichie';
    ELSE
        RAISE NOTICE '⏭️ btp.documents n''existe pas';
    END IF;
END $$;