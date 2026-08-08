
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
  taskType?: TaskType;
  relatedProjectId?: string;
  relatedInspectionId?: string;
  relatedDocumentId?: string;
  relatedPaymentId?: string;
  relatedMaterialId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assigneeName?: string;
  assignerName?: string;
  delayPercentage?: number;
  bankLiaisonEmail?: string;
  contractGuaranteeAmount?: number;
  contractorName?: string;
  engineeringConsultant?: string;
  inspectionType?: string;
  violationCount?: number;
  escalationLevel?: number;
  penaltyAmount?: number;
  complianceStandard?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  documentName?: string;
  documentType?: string;
  sharedWith?: string[];
  actionRequired?: string;
  projectPhase?: string;
  completionPercentage?: number;
  approvalStatus?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  metadata?: NotificationMetadata;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
