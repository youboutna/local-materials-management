-- Add missing columns to projects table
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS project_responsable_id UUID,
ADD COLUMN IF NOT EXISTS main_contractor TEXT,
ADD COLUMN IF NOT EXISTS allows_initial_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS initial_payment_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_phase TEXT,
ADD COLUMN IF NOT EXISTS current_stage TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add index for project responsable for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_responsable 
ON btp.projects(project_responsable_id);

-- Update the trigger to include new timestamp fields
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;