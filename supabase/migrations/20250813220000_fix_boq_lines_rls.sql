-- =============================================================================
-- MIGRATION: fix_boq_lines_rls
-- Description: Ajoute les politiques RLS pour btp.boq_lines
-- =============================================================================

-- 1. Activer RLS (si ce n'est pas déjà fait)
ALTER TABLE btp.boq_lines ENABLE ROW LEVEL SECURITY;

-- 2. Politique SELECT
DROP POLICY IF EXISTS "Users can view boq_lines" ON btp.boq_lines;
CREATE POLICY "Users can view boq_lines" ON btp.boq_lines
FOR SELECT USING (true);

-- 3. Politique INSERT
DROP POLICY IF EXISTS "Users can insert boq_lines" ON btp.boq_lines;
CREATE POLICY "Users can insert boq_lines" ON btp.boq_lines
FOR INSERT WITH CHECK (true);

-- 4. Politique UPDATE
DROP POLICY IF EXISTS "Users can update boq_lines" ON btp.boq_lines;
CREATE POLICY "Users can update boq_lines" ON btp.boq_lines
FOR UPDATE USING (true);

-- 5. Politique DELETE
DROP POLICY IF EXISTS "Users can delete boq_lines" ON btp.boq_lines;
CREATE POLICY "Users can delete boq_lines" ON btp.boq_lines
FOR DELETE USING (true);

-- 6. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_lines TO authenticated;
GRANT SELECT ON btp.boq_lines TO anon;