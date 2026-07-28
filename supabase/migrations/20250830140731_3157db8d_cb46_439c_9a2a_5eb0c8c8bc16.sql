-- Fix RLS policies for project_phases table
-- The current policy uses auth.role() which should be auth.uid() for user authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON btp.project_phases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON btp.project_phases;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON btp.project_phases;

-- Create new policies that properly check for authenticated users
CREATE POLICY "Enable insert for authenticated users" 
ON btp.project_phases 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON btp.project_phases 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Enable delete for authenticated users" 
ON btp.project_phases 
FOR DELETE 
TO authenticated 
USING (true);