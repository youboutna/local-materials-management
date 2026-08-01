-- Keep imported and manually-created phases compatible with the NOT NULL weight column.

UPDATE btp.project_phases
SET weight = 0.1
WHERE weight IS NULL;

ALTER TABLE btp.project_phases
  ALTER COLUMN weight SET DEFAULT 0.1;

NOTIFY pgrst, 'reload schema';
