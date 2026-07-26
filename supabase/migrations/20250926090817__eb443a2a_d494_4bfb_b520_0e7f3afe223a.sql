-- Create association tables for project stakeholders
CREATE TABLE IF NOT EXISTS btp.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('project_manager', 'technical_manager', 'client', 'supervisor', 'contractor', 'supplier', 'consultant')),
  stakeholder_entity_type TEXT NOT NULL CHECK (stakeholder_entity_type IN ('employee', 'supplier')),
  stakeholder_id UUID NOT NULL, -- References either employees.id or suppliers.id
  role_description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, stakeholder_type, stakeholder_id)
);

-- Enable RLS
ALTER TABLE btp.project_stakeholders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage project stakeholders" 
ON btp.project_stakeholders 
FOR ALL 
USING (true);

-- Add estimated_days to projects table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'estimated_days') THEN
    ALTER TABLE btp.projects ADD COLUMN estimated_days INTEGER;
  END IF;
END $$;

-- Add project_reference_number for better project identification
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_reference_number') THEN
    ALTER TABLE btp.projects ADD COLUMN project_reference_number TEXT;
  END IF;
END $$;

-- Add currency and payment fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'currency') THEN
    ALTER TABLE btp.projects ADD COLUMN currency TEXT DEFAULT 'MRU';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'payment_mode') THEN
    ALTER TABLE btp.projects ADD COLUMN payment_mode TEXT DEFAULT 'progressive';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'payment_frequency') THEN
    ALTER TABLE btp.projects ADD COLUMN payment_frequency TEXT DEFAULT 'monthly';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'initial_advance_percentage') THEN
    ALTER TABLE btp.projects ADD COLUMN initial_advance_percentage NUMERIC DEFAULT 20;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'retention_percentage') THEN
    ALTER TABLE btp.projects ADD COLUMN retention_percentage NUMERIC DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
    ALTER TABLE btp.projects ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
    ALTER TABLE btp.projects ADD COLUMN project_type TEXT DEFAULT 'construction';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sector') THEN
    ALTER TABLE btp.projects ADD COLUMN sector TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'permit_number') THEN
    ALTER TABLE btp.projects ADD COLUMN permit_number TEXT;
  END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER update_project_stakeholders_updated_at
    BEFORE UPDATE ON btp.project_stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_updated_at_column();