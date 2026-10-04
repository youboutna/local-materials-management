ALTER TABLE btp.boq_lines ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE btp.boq_lines ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE btp.boq_lines ADD COLUMN IF NOT EXISTS dqe_type TEXT;

CREATE INDEX IF NOT EXISTS idx_boq_lines_code ON btp.boq_lines(code);
CREATE INDEX IF NOT EXISTS idx_boq_lines_category ON btp.boq_lines(category);
CREATE INDEX IF NOT EXISTS idx_boq_lines_dqe_type ON btp.boq_lines(dqe_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_lines TO authenticated;
GRANT SELECT ON btp.boq_lines TO anon;
GRANT ALL ON btp.boq_lines TO service_role;

ALTER TABLE btp.boq_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boq_lines_select" ON btp.boq_lines;
CREATE POLICY "boq_lines_select" ON btp.boq_lines FOR SELECT USING (true);

DROP POLICY IF EXISTS "boq_lines_insert" ON btp.boq_lines;
CREATE POLICY "boq_lines_insert" ON btp.boq_lines FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "boq_lines_update" ON btp.boq_lines;
CREATE POLICY "boq_lines_update" ON btp.boq_lines FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "boq_lines_delete" ON btp.boq_lines;
CREATE POLICY "boq_lines_delete" ON btp.boq_lines FOR DELETE TO authenticated USING (true);