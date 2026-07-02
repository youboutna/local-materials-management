/**
 * Payment Initiation DTOs
 * Migrated from @/dtos/types/paymentInitiation
 */

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
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actionAt?: string;
  comments?: string;
  deadline: string;
}

export interface PaymentInitiationNotification {
  id: string;
  projectId: string;
  phaseId?: string;
  inspectionId?: string;
  initiatedBy: string;
  initiatorRole: InitiatorRole;
  initiatorName?: string;
  supplierId: string;
  supplierName?: string;
  estimatedAmount: number;
  finalAmount?: number;
  justification: string;
  attachedDocuments: string[];
  status: PaymentInitiationStatus;
  approvalChain: ApprovalChainStep[];
  currentApprovalLevel: number;
  supplierDeadline?: string;
  createdAt: string;
  updatedAt: string;
  projectTitle?: string;
  phaseTitle?: string;
  supplierPaymentRequestId?: string;
}

export interface CreatePaymentInitiationDTO {
  projectId: string;
  phaseId?: string;
  inspectionId?: string;
  initiatorRole: InitiatorRole;
  supplierId: string;
  estimatedAmount: number;
  justification: string;
  attachedDocuments?: string[];
}

export interface ApprovalActionDTO {
  notificationId: string;
  action: 'approved' | 'rejected' | 'request_info';
  comments?: string;
}

export interface SupplierCompletionDTO {
  notificationId: string;
  finalAmount: number;
  description: string;
  paymentReason: 'progress_payment' | 'inspection_fee' | 'final_payment' | 'other';
  additionalDocuments?: string[];
  notes?: string;
}

export const ROLE_PAYMENT_LIMITS: Record<InitiatorRole, number> = {
  project_manager: Infinity,
  technical_manager: 500000,
  engineering_consultant: 250000,
  inspector: 100000
};

export const ROLE_APPROVAL_CHAIN: Record<InitiatorRole, string[]> = {
  project_manager: [],
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
