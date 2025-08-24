
export type NotificationType = 
  | 'task_assignment' 
  | 'task_completed'
  | 'task_overdue'
  | 'project_update' 
  | 'project_created'
  | 'project_completed'
  | 'project_milestone'
  | 'inspection_required' 
  | 'payment_due' 
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_pending'
  | 'document_review' 
  | 'document_shared'
  | 'document_approved'
  | 'document_rejected'
  | 'document_uploaded'
  | 'system'
  | 'delay_warning'
  | 'bank_guarantee_trigger'
  | 'inspection_overdue'
  | 'contractor_penalty'
  | 'compliance_alert'
  | 'escalation_required'
  | 'insurance_expiry'
  | 'insurance_update'
  | 'payment_blocked'
  | 'payment_warning';

export type TaskType = 
  | 'project' 
  | 'inspection' 
  | 'document' 
  | 'payment' 
  | 'material' 
  | 'insurance'
  | 'general';

export interface NotificationMetadata {
  task_type?: TaskType;
  related_project_id?: string;
  related_inspection_id?: string;
  related_document_id?: string;
  related_payment_id?: string;
  related_material_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assignee_name?: string;
  assigner_name?: string;
  delay_percentage?: number;
  bank_liaison_email?: string;
  contract_guarantee_amount?: number;
  contractor_name?: string;
  engineering_consultant?: string;
  inspection_type?: string;
  violation_count?: number;
  escalation_level?: number;
  penalty_amount?: number;
  compliance_standard?: string;
  payment_amount?: number;
  payment_method?: string;
  document_name?: string;
  document_type?: string;
  shared_with?: string[];
  action_required?: string;
  project_phase?: string;
  completion_percentage?: number;
  approval_status?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id?: string;
  metadata?: NotificationMetadata;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
