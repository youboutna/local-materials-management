-- Keep BOQ document deletion coherent with its persisted lines.
-- NOT VALID allows deployment even if older data contains orphan document IDs;
-- new rows are still checked and matching rows cascade on header deletion.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'boq_lines_document_header_fkey'
      AND conrelid = 'btp.boq_lines'::regclass
  ) THEN
    ALTER TABLE btp.boq_lines
      ADD CONSTRAINT boq_lines_document_header_fkey
      FOREIGN KEY (document_id)
      REFERENCES btp.boq_document_headers(document_id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;
