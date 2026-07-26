ALTER TABLE btp.bank_guarantees
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

-- Refresh public view if it exists (mirror btp table columns)
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                 WHERE n.nspname='public' AND c.relname='bank_guarantees' AND c.relkind='v')
  INTO v_exists;
  IF v_exists THEN
    DROP VIEW btp.bank_guarantees;
    CREATE VIEW btp.bank_guarantees AS
      SELECT * FROM btp.bank_guarantees;
    GRANT SELECT, INSERT, UPDATE, DELETE ON btp.bank_guarantees TO authenticated;
    GRANT ALL ON btp.bank_guarantees TO service_role;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';