ALTER TABLE btp.boq_lines
  ADD COLUMN IF NOT EXISTS source_document_id uuid,
  ADD COLUMN IF NOT EXISTS source_document_type text;

CREATE INDEX IF NOT EXISTS idx_boq_lines_source_document
  ON btp.boq_lines (source_document_id);

ALTER TABLE btp.tenders
  ADD COLUMN IF NOT EXISTS source_dqe_document_id uuid,
  ADD COLUMN IF NOT EXISTS portal_published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tenders_source_dqe_document
  ON btp.tenders (source_dqe_document_id);