/**
-- Drop the existing constraint
ALTER TABLE btp.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all notification types used in the application
ALTER TABLE btp.notifications ADD CONSTRAINT IF NOT EXISTS notifications_type_check 
CHECK (type IN (
  'task_assigned', 'task_updated', 'task_completed', 'delay_warning', 
  'bank_guarantee_trigger', 'inspection_overdue', 'contractor_penalty', 
  'compliance_alert', 'escalation_required', 'inspection_required', 
  'project_update', 'insurance_expiry', 'insurance_update', 
  'task_assignment', 'task_overdue', 'project_created', 'project_completed', 
  'project_milestone', 'payment_due', 'payment_completed', 'payment_failed', 
  'payment_pending', 'document_review', 'document_shared', 'document_approved', 
  'document_rejected', 'document_uploaded', 'system', 'payment_blocked', 
  'payment_warning'
)); 

**/