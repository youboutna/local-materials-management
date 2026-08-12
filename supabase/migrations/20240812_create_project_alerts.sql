-- ============================================================
-- Migration: Create project_alerts table
-- Version: 20240812_create_project_alerts
-- Description: Table for storing project alerts with full audit trail
-- Intégration avec le schéma existant (profiles, user_roles)
-- ============================================================

-- ============================================================
-- 0. Drop table if exists (for re-runs)
-- ============================================================
DROP TABLE IF EXISTS btp.project_alerts CASCADE;

-- ============================================================
-- 1. Create the table
-- ============================================================
CREATE TABLE btp.project_alerts (
  -- Primary identifiers
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  
  -- Alert core data
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  
  -- Project context
  project_title TEXT,
  related_entity_id UUID,
  
  -- Dates
  trigger_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'open',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Action management
  action_required BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  action_taken_by UUID,
  action_taken_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  
  -- Additional data
  delay_days INTEGER,
  available_actions TEXT[] DEFAULT '{}',
  action_proof JSONB DEFAULT '[]'::JSONB,
  recurrence TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- ============================================================
  -- Constraints
  -- ============================================================
  CONSTRAINT project_alerts_pkey PRIMARY KEY (id),
  
  -- Severity check
  CONSTRAINT project_alerts_severity_check CHECK (
    severity = ANY (ARRAY[
      'low'::TEXT,
      'medium'::TEXT,
      'high'::TEXT,
      'critical'::TEXT
    ])
  ),
  
  -- Type check
  CONSTRAINT project_alerts_type_check CHECK (
    type = ANY (ARRAY[
      'budget'::TEXT,
      'deadline'::TEXT,
      'resource'::TEXT,
      'risk'::TEXT,
      'compliance'::TEXT,
      'system'::TEXT
    ])
  ),
  
  -- Status check
  CONSTRAINT project_alerts_status_check CHECK (
    status = ANY (ARRAY[
      'open'::TEXT,
      'acknowledged'::TEXT,
      'resolved'::TEXT,
      'closed'::TEXT,
      'escalated'::TEXT
    ])
  ),
  
  -- Source check
  CONSTRAINT project_alerts_source_check CHECK (
    source = ANY (ARRAY[
      'deadline'::TEXT,
      'budget'::TEXT,
      'resource'::TEXT,
      'risk'::TEXT,
      'compliance'::TEXT,
      'system'::TEXT,
      'user'::TEXT
    ])
  )
);

-- ============================================================
-- 2. Create indexes
-- ============================================================

-- Project ID indexes
CREATE INDEX IF NOT EXISTS idx_project_alerts_project_id 
  ON btp.project_alerts USING btree (project_id);

-- Severity index
CREATE INDEX IF NOT EXISTS idx_project_alerts_severity 
  ON btp.project_alerts USING btree (severity);

-- Status index
CREATE INDEX IF NOT EXISTS idx_project_alerts_status 
  ON btp.project_alerts USING btree (status);

-- Type index
CREATE INDEX IF NOT EXISTS idx_project_alerts_type 
  ON btp.project_alerts USING btree (type);

-- Source index
CREATE INDEX IF NOT EXISTS idx_project_alerts_source 
  ON btp.project_alerts USING btree (source);

-- Acknowledged index
CREATE INDEX IF NOT EXISTS idx_project_alerts_acknowledged 
  ON btp.project_alerts USING btree (acknowledged);

-- Created at index (for sorting and date filtering)
CREATE INDEX IF NOT EXISTS idx_project_alerts_created_at 
  ON btp.project_alerts USING btree (created_at DESC);

-- Updated at index
CREATE INDEX IF NOT EXISTS idx_project_alerts_updated_at 
  ON btp.project_alerts USING btree (updated_at);

-- Deadline index (for overdue queries)
CREATE INDEX IF NOT EXISTS idx_project_alerts_deadline 
  ON btp.project_alerts USING btree (deadline) 
  WHERE status NOT IN ('resolved', 'closed');

-- Composite index for active alerts queries
CREATE INDEX IF NOT EXISTS idx_project_alerts_active 
  ON btp.project_alerts USING btree (project_id, status, severity) 
  WHERE status IN ('open', 'acknowledged');

-- Composite index for project + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_project_alerts_project_created 
  ON btp.project_alerts USING btree (project_id, created_at DESC);

-- Escalation level index
CREATE INDEX IF NOT EXISTS idx_project_alerts_escalation 
  ON btp.project_alerts USING btree (escalation_level);

-- ============================================================
-- 3. Create trigger for updated_at
-- ============================================================

-- Ensure the update_updated_at_column function exists in btp schema
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_updated_at ON btp.project_alerts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON btp.project_alerts
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

-- ============================================================
-- 4. Row Level Security (RLS)
-- ============================================================

-- Enable RLS on project_alerts table
ALTER TABLE btp.project_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own alerts" ON btp.project_alerts;
DROP POLICY IF EXISTS "Users can view alerts from their projects" ON btp.project_alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON btp.project_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON btp.project_alerts;
DROP POLICY IF EXISTS "Admins can manage all alerts" ON btp.project_alerts;

-- ============================================================
-- Policy: Users can view their own alerts
-- ============================================================
CREATE POLICY "Users can view their own alerts" ON btp.project_alerts
  FOR SELECT USING (
    auth.uid() = acknowledged_by 
    OR auth.uid() = action_taken_by
  );

-- ============================================================
-- Policy: Users can view alerts from their projects
-- Utilise public.user_roles avec role_name
-- ============================================================
CREATE POLICY "Users can view alerts from their projects" ON btp.project_alerts
  FOR SELECT USING (
    -- User has a role in the project
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role_name IN ('admin', 'manager', 'director', 'agent')
    )
    OR
    -- User is admin via profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- Policy: Admins can manage all alerts
-- ============================================================
CREATE POLICY "Admins can manage all alerts" ON btp.project_alerts
  FOR ALL USING (
    -- Check admin via profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR
    -- Check admin via user_roles
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role_name IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- Policy: Users can create alerts
-- ============================================================
CREATE POLICY "Users can create alerts" ON btp.project_alerts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.status = 'active'
    )
  );

-- ============================================================
-- Policy: Users can update their own alerts
-- ============================================================
CREATE POLICY "Users can update their own alerts" ON btp.project_alerts
  FOR UPDATE USING (
    auth.uid() = acknowledged_by 
    OR auth.uid() = action_taken_by
  );

-- ============================================================
-- 5. Comments
-- ============================================================

COMMENT ON TABLE btp.project_alerts IS 'Table for storing project alerts with full audit trail';
COMMENT ON COLUMN btp.project_alerts.id IS 'Unique alert identifier';
COMMENT ON COLUMN btp.project_alerts.project_id IS 'Reference to the project';
COMMENT ON COLUMN btp.project_alerts.type IS 'Alert type: budget, deadline, resource, risk, compliance, system';
COMMENT ON COLUMN btp.project_alerts.severity IS 'Alert severity: low, medium, high, critical';
COMMENT ON COLUMN btp.project_alerts.title IS 'Alert title';
COMMENT ON COLUMN btp.project_alerts.message IS 'Alert message/description';
COMMENT ON COLUMN btp.project_alerts.source IS 'Alert source: deadline, budget, resource, risk, compliance, system, user';
COMMENT ON COLUMN btp.project_alerts.status IS 'Alert status: open, acknowledged, resolved, closed, escalated';
COMMENT ON COLUMN btp.project_alerts.acknowledged IS 'Whether the alert has been acknowledged';
COMMENT ON COLUMN btp.project_alerts.escalation_level IS 'Current escalation level (0 = not escalated)';
COMMENT ON COLUMN btp.project_alerts.action_proof IS 'Proof of actions taken (JSON array)';
COMMENT ON COLUMN btp.project_alerts.metadata IS 'Additional metadata (JSON object)';

-- ============================================================
-- 6. Grant permissions
-- ============================================================

GRANT ALL ON btp.project_alerts TO authenticated;
GRANT ALL ON btp.project_alerts TO service_role;

-- ============================================================
-- 7. Seed data (optional - for testing)
-- ============================================================

-- Insert sample alerts if needed (commented out)
/*
INSERT INTO btp.project_alerts (
  project_id,
  type,
  severity,
  title,
  message,
  source,
  status,
  acknowledged,
  escalation_level
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'deadline',
  'high',
  'Project deadline approaching',
  'Project deadline is in 3 days. Please take necessary actions.',
  'deadline',
  'open',
  false,
  0
);
*/

-- ============================================================
-- 8. Migration rollback (optional)
-- ============================================================

-- To rollback:
-- DROP TABLE IF EXISTS btp.project_alerts CASCADE;