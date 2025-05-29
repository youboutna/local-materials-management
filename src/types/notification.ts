
export type NotificationType = 
  | 'task_assignment' 
  | 'project_update' 
  | 'inspection_required' 
  | 'payment_due' 
  | 'document_review' 
  | 'system';

export type TaskType = 
  | 'project' 
  | 'inspection' 
  | 'document' 
  | 'payment' 
  | 'material' 
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
