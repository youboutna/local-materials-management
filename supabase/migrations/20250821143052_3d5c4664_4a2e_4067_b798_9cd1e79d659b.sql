-- Fix RLS policies for project_phases table to ensure authenticated users can perform all operations
-- Drop existing policies first
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON btp.project_phases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON btp.project_phases;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON btp.project_phases;
DROP POLICY IF EXISTS "Enable read access for all users" ON btp.project_phases;

-- Create new policies with explicit checks
CREATE POLICY "Allow authenticated users to insert project phases" 
ON btp.project_phases 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update project phases" 
ON btp.project_phases 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete project phases" 
ON btp.project_phases 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to read project phases" 
ON btp.project_phases 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);