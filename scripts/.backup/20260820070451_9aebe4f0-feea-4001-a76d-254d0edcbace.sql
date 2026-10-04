ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
    'info','success','warning','error',
    'task_assigned','task_updated','task_completed','task_assignment','task_overdue',
    'delay_warning','bank_guarantee_trigger','inspection_overdue','inspection_required',
    'contractor_penalty','compliance_alert','escalation_required',
    'project_update','project_created','project_completed','project_milestone',
    'insurance_expiry','insurance_update',
    'payment_due','payment_completed','payment_failed','payment_pending','payment_blocked','payment_warning',
    'document_review','document_shared','document_approved','document_rejected','document_uploaded',
    'supplier_payment_request','system'
  ]::text[]));