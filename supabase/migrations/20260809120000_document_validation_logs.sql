
-- ============================================================
-- MIGRATION: 20260809120000_document_validation_logs.sql
-- Date: 2026-08-09
-- Description: Ajout des colonnes de validation pour document_validation_logs
-- Schema: btp
-- ===========================================================
ALTER TABLE btp.document_validation_logs
  ADD COLUMN IF NOT EXISTS validation_type text NOT NULL DEFAULT 'completeness',
  ADD COLUMN IF NOT EXISTS validated_by uuid,
  ADD COLUMN IF NOT EXISTS processing_time_ms integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dvl_submission ON btp.document_validation_logs (submission_id);
CREATE INDEX IF NOT EXISTS idx_dvl_document ON btp.document_validation_logs (document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.document_validation_logs TO authenticated;
GRANT ALL ON btp.document_validation_logs TO service_role;

CREATE OR REPLACE VIEW public.document_validation_logs
WITH (security_invoker = true) AS
  SELECT id, document_id, submission_id, is_valid, errors, warnings,
         validation_type, validated_by, processing_time_ms, validated_at, created_at
  FROM btp.document_validation_logs;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_validation_logs TO authenticated;
GRANT ALL ON public.document_validation_logs TO service_role;

NOTIFY pgrst, 'reload schema'; 