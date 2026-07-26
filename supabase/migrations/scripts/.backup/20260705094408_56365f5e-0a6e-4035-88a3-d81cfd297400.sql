
-- Align tenders.status CHECK constraint with the workflow referential
-- (draft, published, open, under_evaluation, awarded, contracted, closed, cancelled)
ALTER TABLE btp.tenders DROP CONSTRAINT IF EXISTS tenders_status_check;
ALTER TABLE btp.tenders
  ADD CONSTRAINT tenders_status_check
  CHECK (status = ANY (ARRAY[
    'draft'::text,
    'published'::text,
    'open'::text,
    'under_evaluation'::text,
    'awarded'::text,
    'contracted'::text,
    'closed'::text,
    'cancelled'::text
  ]));
