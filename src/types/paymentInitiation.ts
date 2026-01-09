// Payment Initiation Notification Types
export type InitiatorRole = 'project_manager' | 'technical_manager' | 'engineering_consultant' | 'inspector';

export type PaymentInitiationStatus = 
  | 'pending_approval' 
  | 'ready_for_supplier' 
  | 'supplier_notified' 
  | 'supplier_completed'
  | 'validation_in_progress'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface ApprovalChainStep {
  level: number;
  role: string;
  approver_id?: string;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  action_at?: string;
  comments?: string;
  deadline: string;
}

export interface PaymentInitiationNotification {
  id: string;
  project_id: string;
  phase_id?: string;
  inspection_id?: string;
  initiated_by: string;
  initiator_role: InitiatorRole;
  initiator_name?: string;
  supplier_id: string;
  supplier_name?: string;
  estimated_amount: number;
  final_amount?: number;
  justification: string;
  attached_documents: string[];
  status: PaymentInitiationStatus;
  approval_chain: ApprovalChainStep[];
  current_approval_level: number;
  supplier_deadline?: string;
  created_at: string;
  updated_at: string;
  project_title?: string;
  phase_title?: string;
  supplier_payment_request_id?: string;
}

export interface CreatePaymentInitiationDTO {
  project_id: string;
  phase_id?: string;
  inspection_id?: string;
  initiator_role: InitiatorRole;
  supplier_id: string;
  estimated_amount: number;
  justification: string;
  attached_documents?: string[];
}

export interface ApprovalActionDTO {
  notification_id: string;
  action: 'approved' | 'rejected' | 'request_info';
  comments?: string;
}

export interface SupplierCompletionDTO {
  notification_id: string;
  final_amount: number;
  description: string;
  payment_reason: 'progress_payment' | 'inspection_fee' | 'final_payment' | 'other';
  additional_documents?: string[];
  notes?: string;
}

// Role-based limits and rules
export const ROLE_PAYMENT_LIMITS: Record<InitiatorRole, number> = {
  project_manager: Infinity, // No limit
  technical_manager: 500000,
  engineering_consultant: 250000,
  inspector: 100000
};

export const ROLE_APPROVAL_CHAIN: Record<InitiatorRole, string[]> = {
  project_manager: [], // Direct to supplier
  technical_manager: ['project_manager'],
  engineering_consultant: ['technical_manager', 'project_manager'],
  inspector: ['engineering_consultant', 'technical_manager', 'project_manager']
};

export const ROLE_LABELS: Record<InitiatorRole, string> = {
  project_manager: 'Chef de Projet',
  technical_manager: 'Responsable Technique',
  engineering_consultant: 'Ingénieur Conseil',
  inspector: 'Inspecteur'
};

export const STATUS_LABELS: Record<PaymentInitiationStatus, string> = {
  pending_approval: 'En attente d\'approbation',
  ready_for_supplier: 'Prêt pour fournisseur',
  supplier_notified: 'Fournisseur notifié',
  supplier_completed: 'Complété par fournisseur',
  validation_in_progress: 'Validation en cours',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  cancelled: 'Annulé',
  expired: 'Expiré'
};
