-- Refactor project_phases table to align with the workflow model
-- Add missing columns for proper phase management

-- Add new columns to align with the PhaseData interface from UI
ALTER TABLE btp.project_phases 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS construction_phase TEXT,
ADD COLUMN IF NOT EXISTS construction_stage TEXT,
ADD COLUMN IF NOT EXISTS custom_phase_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS human_resources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS suppliers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update the status column to use consistent values
-- Update existing records to use the new status values
UPDATE btp.project_phases 
SET status = CASE 
  WHEN status = 'pending' THEN 'not_started'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'not_started'
END;

-- Create an index for better performance on construction phases
CREATE INDEX IF NOT EXISTS idx_project_phases_construction_phase 
ON btp.project_phases(construction_phase);

CREATE INDEX IF NOT EXISTS idx_project_phases_construction_stage 
ON btp.project_phases(construction_stage);

-- Add a check constraint to ensure valid status values
ALTER TABLE btp.project_phases 
DROP CONSTRAINT IF EXISTS project_phases_status_check;

ALTER TABLE btp.project_phases 
ADD CONSTRAINT project_phases_status_check 
CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed'));

--
ALTER TABLE btp.project_phases ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
-- Add a check constraint for progress percentage
ALTER TABLE btp.project_phases 
DROP CONSTRAINT IF EXISTS project_phases_progress_check;

ALTER TABLE btp.project_phases 
ADD CONSTRAINT project_phases_progress_check 
CHECK (progress >= 0 AND progress <= 100);