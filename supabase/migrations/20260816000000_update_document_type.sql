-- Migration : Suppression de la contrainte sur document_type
ALTER TABLE btp.documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
COMMENT ON COLUMN btp.documents.document_type IS 
'Type de document – La validation est effectuée par le référentiel front-end.';
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON btp.documents (document_type);