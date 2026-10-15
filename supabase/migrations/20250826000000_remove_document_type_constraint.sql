-- =============================================================================
-- MIGRATION: remove_document_type_constraint
-- Description: Remove restrictive CHECK constraint on document_type to allow centralized enum management
-- =============================================================================

-- Remove the restrictive CHECK constraint on document_type
-- This allows any document type value as defined in the centralized referential
-- src/config/referentials/documents/document-types.referential.ts
-- and src/dtos/entities/DocumentDTO.ts

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'documents_document_type_check'
        AND conrelid = 'btp.documents'::regclass
    ) THEN
        ALTER TABLE btp.documents DROP CONSTRAINT documents_document_type_check;
        RAISE NOTICE '✅ Removed restrictive document_type CHECK constraint';
    ELSE
        RAISE NOTICE '⏭️ document_type CHECK constraint does not exist';
    END IF;
END $$;

-- Add a comment explaining that document_type is managed centrally
COMMENT ON COLUMN btp.documents.document_type IS 'Type de document - valeurs gérées dans src/config/referentials/documents/document-types.referential.ts';
