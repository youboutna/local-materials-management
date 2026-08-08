export type InitiatorRole = 'inspector' | 'manager' | 'director' | 'supervisor' | 'project_manager';

export interface ApprovalRecord {
  step: number;
  action: 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface SupplienalDocuments?: string[];
  notes?: string;
}

export interface CreatePaymentInitiationDTO {
  projectId: string;
  phaseId?: strinace ApprovalActionDTO {
  notificationId: string;
  action: 'approved' | 'rejected';
  comments?: string;
}

export interface SupplierCompletionDTO {
  notificationId: string;
  finalAmount: onDTO {
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
  apper' | 'rejected' | 'completed';
  supplierDeadline?: string;
  projectTitle: string;
  supplierInfo?: SupplierInfoDTO;
  anspector: 'Inspecteur',
  manager: 'Responsable',
  project_manager: 'Chef de Projet',
  supervisor: 'Superviseur',
  director: 'Directeur'
};

export const ROLE_PAYMENT_LIMITS: Record<Initiato000000,
  supervisor: 5000000,
  director: 20000000
};

export const ROLE_APPROVAL_CHAIN: