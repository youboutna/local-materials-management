-- Add missing columns for workflow step date management
ALTER TABLE btp.tender_steps 
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMP WITH TIME ZONE;

-- Update null status values to pending
UPDATE btp.tender_steps 
SET status = 'pending' 
WHERE status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id_status ON btp.tender_steps(tender_id, status);
CREATE INDEX IF NOT EXISTS idx_tender_steps_dates ON btp.tender_steps(due_date, submission_date);

-- Add trigger to auto-update dates when status changes
CREATE OR REPLACE FUNCTION update_tender_step_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Set actual_completion_date when step is completed or approved
  IF NEW.status IN ('completed', 'approved') AND OLD.status NOT IN ('completed', 'approved') THEN
    NEW.actual_completion_date = NOW();
  END IF;
  
  -- Clear completion date if status is rolled back
  IF NEW.status NOT IN ('completed', 'approved') AND OLD.status IN ('completed', 'approved') THEN
    NEW.actual_completion_date = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_tender_step_dates ON btp.tender_steps;
CREATE TRIGGER trigger_update_tender_step_dates
  BEFORE UPDATE ON btp.tender_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_step_dates();