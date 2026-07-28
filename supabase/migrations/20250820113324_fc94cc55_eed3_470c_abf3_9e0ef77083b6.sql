-- Drop the existing restrictive constraint that's causing the notification type error
ALTER TABLE btp.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a new constraint that includes all necessary notification types including supplier_payment_request
ALTER TABLE btp.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'task_assignment'
  'task_updated', 
  'task_completed',
  'project_update',
  'inspection_required',
  'payment_due',
  'document_review',
  'system',
  'delay_warning',
  'bank_guarantee_trigger',
  'inspection_overdue',
  'contractor_penalty',
  'compliance_alert',
  'escalation_required',
  'insurance_expiry',
  'insurance_update',
  'payment_blocked',
  'payment_warning',
  'supplier_payment_request',
  'password_reset',
  'info',
  'warning',
  'error',
  'success',
  'payment_reminder'
));