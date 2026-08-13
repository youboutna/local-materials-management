ALTER TABLE btp.project_risks
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS contingency_plan text,
  ADD COLUMN IF NOT EXISTS costs numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timeline_impact integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_date date;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_risks TO authenticated;
GRANT ALL ON btp.project_risks TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read btp.project_risks" ON btp.project_risks;
DROP POLICY IF EXISTS "Authenticated users can insert btp.project_risks" ON btp.project_risks;
DROP POLICY IF EXISTS "Authenticated users can update btp.project_risks" ON btp.project_risks;
DROP POLICY IF EXISTS "Authenticated users can delete btp.project_risks" ON btp.project_risks;

CREATE POLICY "Authenticated users can read btp.project_risks"
  ON btp.project_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert btp.project_risks"
  ON btp.project_risks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update btp.project_risks"
  ON btp.project_risks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete btp.project_risks"
  ON btp.project_risks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_btp_project_risks_updated_at ON btp.project_risks;
CREATE TRIGGER update_btp_project_risks_updated_at
  BEFORE UPDATE ON btp.project_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();