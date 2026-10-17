export type InitiatorRole = 'inspector' | 'manager' | 'director' | 'supervisor' | 'project_manager';

export interface ApprovalChainStep {
  level: number;
  role: InitiatorRole;
  status: 'pending' | 'approved' | 'rejected';
  deadline: string;
}

export interface ApprovalRecord {
  step: number;
  action: 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface SupplierCompletionData {
  completedAt: string;
  finalAmount: number;
  description: string;
  paymentReason: string;
  additionalDocuments?: string[];
  notes?: string;
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
  action: 'approved' | 'rejected';
  comments?: string;
}

export interface SupplierCompletionDTO {
  notificationId: string;
  finalAmount: number;
  description: string;
  paymentReason: string;
  additionalDocuments?: string[];
  notes?: string;
}

export interface SupplierInfoDTO {
  userId: string;
  name: string;
  email: string;
}

export interface PaymentInitiationNotificationDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  inspectionId?: string;
  initiatedBy: string;
  initiatorRole: InitiatorRole;
  supplierId: string;
  estimatedAmount: number;
  justification: string;
  attachedDocuments: string[];
  approvalChain: ApprovalChainStep[];
  currentApprovalLevel: number;
  status: 'pending_approval' | 'ready_for_supplier' | 'rejected' | 'completed';
  supplierDeadline?: string;
  projectTitle: string;
  supplierInfo?: SupplierInfoDTO;
  approvals?: ApprovalRecord[];
  supplierCompletion?: SupplierCompletionData;
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABELS: Record<InitiatorRole, string> = {
  inspector: 'Inspecteur',
  manager: 'Responsable',
  project_manager: 'Chef de Projet',
  supervisor: 'Superviseur',
  director: 'Directeur'
};

import { PAYMENT_INITIATION_POLICY } from '@/config/referentials/payment-initiation.referential';
/** Compatibility exports; rules are owned by the referential. */
export const ROLE_PAYMENT_LIMITS = PAYMENT_INITIATION_POLICY.limits;
export const ROLE_APPROVAL_CHAIN = PAYMENT_INITIATION_POLICY.approvalChain;