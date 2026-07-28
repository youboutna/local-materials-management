-- Update RLS policies for project_phases to support DEV_MODE
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert project phases" ON btp.project_phases;
DROP POLICY IF EXISTS "Allow authenticated users to update project phases" ON btp.project_phases;
DROP POLICY IF EXISTS "Allow authenticated users to delete project phases" ON btp.project_phases;
DROP POLICY IF EXISTS "Allow authenticated users to read project phases" ON btp.project_phases;

-- Create new policies that support both authenticated users and allow all access for testing
CREATE POLICY "Allow insert project phases" 
ON btp.project_phases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update project phases" 
ON btp.project_phases 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete project phases" 
ON btp.project_phases 
FOR DELETE 
USING (true);

CREATE POLICY "Allow read project phases" 
ON btp.project_phases 
FOR SELECT 
USING (true);

-- Also make sure the created_by column can be null for DEV_MODE

-- =============================================================================
-- Correction: Ajout de created_by à btp.project_phases
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'project_phases') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'btp' AND table_name = 'project_phases' 
                       AND column_name = 'created_by') THEN
            ALTER TABLE btp.project_phases 
            ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE '✅ Colonne created_by ajoutée à btp.project_phases';
        ELSE
            RAISE NOTICE '⏭️ Colonne created_by existe déjà';
        END IF;
    ELSE
        RAISE NOTICE '⏭️ Table btp.project_phases n''existe pas';
    END IF;
END $$;

ALTER TABLE btp.project_phases ALTER COLUMN created_by DROP NOT NULL;