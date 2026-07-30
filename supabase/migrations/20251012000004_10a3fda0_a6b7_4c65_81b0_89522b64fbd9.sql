-- =============================================================================
-- MIGRATION: fix_tenders_rls
-- Description: Suppression et recréation robuste des politiques RLS pour btp.tenders
-- =============================================================================

-- 1. Suppression des anciennes politiques (safe)
DROP POLICY IF EXISTS "Authenticated users can create tenders" ON btp.tenders;
DROP POLICY IF EXISTS "Authenticated users can view tenders" ON btp.tenders;
DROP POLICY IF EXISTS "Authenticated users can update tenders" ON btp.tenders;
DROP POLICY IF EXISTS "Authenticated users can delete tenders" ON btp.tenders;

-- 2. Suppression préventive de toutes les nouvelles politiques (Pour éviter l'erreur 42710)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON btp.tenders;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON btp.tenders;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON btp.tenders;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON btp.tenders;

-- 3. Création des nouvelles politiques
CREATE POLICY "Enable read access for authenticated users" 
  ON btp.tenders 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
  ON btp.tenders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
  ON btp.tenders 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
  ON btp.tenders 
  FOR DELETE 
  TO authenticated
  USING (true);