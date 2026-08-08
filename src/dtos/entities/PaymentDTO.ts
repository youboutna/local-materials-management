/**
 * Payment Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, MonetaryDTO } from '../shared';

export interface PaymentDTO extends BaseEntityDTO {
  projectId: string;
  contractorId: string;
  contractorName: string;
  contractorContact: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId: string;
  progressAtPayment: number;
  inspectionId?: string;
  phaseId?: string;
  status?: string; // Add status property to match domain entity
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

export interface PaymentBlockDetailDTO extends BaseEntityDTO {
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
  }>;
  blockedAt: string;
  blockedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface PaymentActionDTO extends BaseEntityDTO {
  paymentId: string;
  projectId: string;
  contractorId: string;
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

export interface PaymentSummaryDTO {
  totalAmount: MonetaryDTO;
  averageAmount: MonetaryDTO;
  paymentsByMethod: Record<string, MonetaryDTO>;
  paymentsByMonth: Record<string, MonetaryDTO>;
  paymentsByContractor: Record<string, PaymentDTO[]>;
  overduePayments: PaymentDTO[];
  pendingPayments: PaymentDTO[];
  completedPayments: PaymentDTO[];
}

export interface CreatePaymentDTO {
  projectId: string;
  contractorId: string;
  contractorName: string;
  contractorContact: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId: string;
  progressAtPayment: number;
  inspectionId?: string;
  phaseId?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

export type UpdatePaymentDTO = Partial<CreatePaymentDTO>;

export interface PaymentValidationDTO {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  paymentMethod: string;
  requiredFields: string[];
  optionalFields: string[];
}

export interface PaymentRequestDTO {
  id: string;
  supplierId: string;
  projectId?: string;
  amount: number;
  description?: string;
  paymentReason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentRequestDTO {
  supplierId: string;
  projectId?: string;
  amount: number;
  description?: string;
  paymentReason?: string;
}

export interface UpdatePaymentRequestDTO {
  amount?: number;
  description?: string;
  paymentReason?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  notes?: string;
}

// Payment Blocking Types (merged from PaymentBlockingDTO.ts)
export interface PaymentBlockDTO {
  id: string;
  paymentRequestId: string;
  blockReason: string;
  blockType: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blockedAmount: number;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentControlActionDTO {
  id: string;
  paymentBlockId: string;
  actionType: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// Service Request DTOs
export interface CreatePaymentBlockRequestDto {
  paymentRequestId: string;
  blockReason: string;
  blockType: 'financial' | 'document' | 'compliance' | 'technical';
  blockedAmount: number;
}

export interface ResolvePaymentBlockRequestDto {
  blockId: string;
  resolutionNotes: string;
  resolvedBy: string;
}

export interface CreatePaymentControlActionRequestDto {
  paymentBlockId: string;
  actionType: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assignedTo?: string;
  dueDate?: string;
  createdBy?: string;
}

// Response DTOs
export interface GetPaymentBlockStatsRequestDto {
  total: number;
  active: number;
  resolved: number;
  cancelled: number;
  totalBlockedAmount: number;
  blocksByType: Record<string, number>;
}

export interface PaymentEligibilityValidationDto {
  canProceed: boolean;
  warningReasons?: PaymentWarningReasonDto[];
  blockingReasons?: PaymentBlockingReasonDto[];
}

export interface PaymentWarningReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction?: string;
}

export interface PaymentBlockingReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

export interface PaymentProcessingResultDto {
  success: boolean;
  message: string;
  blockReasons?: string[];
}

// Query DTOs
export interface GetPaymentBlocksRequestDto {
  paymentRequestId?: string;
  status?: string;
  blockType?: string;
}

export interface GetPaymentControlActionsRequestDto {
  paymentBlockId: string;
  status?: string;
}

// Legacy compatibility types from transforms
export interface PaymentDocumentDTO {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadDate?: string;
  uploadedBy?: string;
  size?: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Legacy request DTOs for backward compatibility
export interface LegacyCreatePaymentRequestDTO {
  projectId: string;
  phaseId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  paymentType: 'bankTransfer' | 'cash' | 'check' | 'mobile_money' | 'crypto';
  dueDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
  documents?: PaymentDocumentDTO[];
  
  // Legacy snake_case for backward compatibility
  phaseId?: string;
  milestoneId?: string;
  paymentType?: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto';
  dueDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
}

export interface LegacyUpdatePaymentRequestDTO {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  dueDate?: string;
  paidDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
  documents?: PaymentDocumentDTO[];
  
  // Legacy snakeCase for backward compatibility
  dueDate?: string;
  paidDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
}
// Moved from src/components/invoices/ConsultantValidationPanel.tsx
export interface ProgressInvoice {
  id: string;
  invoiceNumber: string; // ✅ CAMELCASE: Instead of invoiceNumber
  invoiceType: string; // ✅ CAMELCASE: Instead of invoiceType
  progressPercentage: number; // ✅ CAMELCASE: Instead of progressPercentage
  previousProgress: number; // ✅ CAMELCASE: Instead of previousProgress
  totalContractAmount: number; // ✅ CAMELCASE: Instead of total_contract_amount
  invoiceAmount: number; // ✅ CAMELCASE: Instead of invoiceAmount
  workDescription: string; // ✅ CAMELCASE: Instead of workDescription
  status: string;
  submittedAt: string; // ✅ CAMELCASE: Instead of submittedAt
  projectId: string; // ✅ CAMELCASE: Instead of projectId
  inspectionId: string; // ✅ CAMELCASE: Instead of inspectionId
  supportingDocuments: string[]; // ✅ CAMELCASE: Instead of supportingDocuments
  projects?: {
    title: string;
    projectType: string; // ✅ CAMELCASE: Instead of projectType
    fundingSource: string; // ✅ CAMELCASE: Instead of fundingSource
  };
  
  // Legacy snakeCase for backward compatibility
  invoiceNumber?: string; // Legacy snakeCase for backward compatibility
  invoiceType?: string; // Legacy snakeCase for backward compatibility
  progressPercentage?: number; // Legacy snakeCase for backward compatibility
  previousProgress?: number; // Legacy snakeCase for backward compatibility
  total_contract_amount?: number; // Legacy snakeCase for backward compatibility
  invoiceAmount?: number; // Legacy snakeCase for backward compatibility
  workDescription?: string; // Legacy snakeCase for backward compatibility
  submittedAt?: string; // Legacy snakeCase for backward compatibility
  projectId?: string; // Legacy snakeCase for backward compatibility
  inspectionId?: string; // Legacy snakeCase for backward compatibility
  supportingDocuments?: string[]; // Legacy snakeCase for backward compatibility
}

// Moved from src/components/payment/PaymentRequestDetailsDialog.tsx
export interface PaymentRequest {
  id: string;
  supplierId: string;
  projectId: string;
  amount: number;
  description: string;
  paymentReason: string;
  status: string;
  requestedDate: string;
  notes: string;
  suppliers?: {
    name: string;
    accountNumber: string | null;
    bankName: string | null;
    rib: string | null;
  };
  projects?: {
    title: string;
  };
}

// Moved from src/components/payment/PaymentRequestsManagement.tsx
export interface PaymentRequest {
  id: string;
  supplierId: string;
  projectId: string;
  amount: number;
  description: string;
  paymentReason: string;
  status: string;
  requestedDate: string;
  notes: string;
  suppliers?: {
    name: string;
    accountNumber: string | null;
    bankName: string | null;
    rib: string | null;
  };
  projects?: {
    title: string;
  };
}

// Moved from src/components/payments/PaymentRequestModal.tsx
export interface PaymentDocument {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  createdAt: string;
  status?: string;
}

// Moved from src/components/suppliers/SupplierPaymentRequest.tsx
export interface LocalPaymentRequest {
  id: string;
  supplierId: string;
  projectId?: string;
  amount: number;
  description: string;
  paymentReason: string;
  supportingDocuments: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
}

// Moved from src/hooks/hexagonal/index.ts
export interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  projectId: string;
  phaseId?: string;
}

// Moved from src/utils/mauritania.ts
export interface EnhancedPayment {
  id: string;
  amount: number;
  date: string; // ISO format
  method: PaymentMethod;
  progressAtPayment: number;
  reference: string; // Better than "transactionId"
  recipient?: string; // Who received payment locally
  verifiedBy?: string; // User ID who verified
  notes?: string;
  attachments?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

// Moved from src/application/services/ProjectCalculationService.ts
export interface ProjectPayment {
  amount: number;
  phaseId?: string;
  contractorId?: string;
  contractorName?: string;
}

// Moved from src/utils/types.ts
export interface InvoiceLine {
  id?: string;
  number?: string;         // numero
  designation: string;
  unit?: string;           // unite
  quantity: number;       // quantite
  unitPrice?: number;      // prixUnitaire
  totalPrice?: number;     // prixTotal
  currency?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  taxRate?: number | null;
  taxAmount?: number | null;
  metadata?: Record<string, unknown>;
  dimensions?: Dimensions;
}

// Moved from src/hooks/hexagonal/usePaymentTransferValidation.ts
export interface PaymentTransferValidationResult {
  allowedAmount: number;
  maxAllowedAmount: number;
  isInitialPaymentPhase: boolean;
  maxInitialPayment: number;
  canPay: boolean;
  blockingReasons: string[];
  recommendations: string[];
  paymentStatus: 'initialAllowed' | 'initial' | 'inspectionRequired' | 'requiresChanges' | 'rejected';
  isLoading: boolean;
  error: string | null;
}

// Moved from src/hooks/usePhaseWorkflow.ts
export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  phaseId: string | null;
  projectId: string;
  contractorName: string;
  progress_at_payment: number;
  paymentMethod: string;
}

// Moved from src/hooks/hexagonal/usePhasePaymentsHex.ts
export interface PhasePaymentFormData {
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  progress_at_payment: string;
  contractorName: string;
  contractorContact: string;
  transactionId: string;
  supplierId: string;
}

// Moved from src/hooks/useProjectCheckpoints.ts
export interface ProjectPayment {
  id: string;
  phaseId: string | null;
  amount: number;
  [key: string]: any;
}

// Moved from src/utils/projectDataCalculations.ts
export interface ProjectPayment {
  amount: number;
  phaseId?: string;
  contractorId?: string;
  contractorName?: string;
}
// Moved from src/dtos/entities/ContractDTO.ts (reconciled)
export interface ContractPayment {
  id: string;
  paymentNumber: number;
  amount: MonetaryDTO;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  associatedMilestones: string[];
  documents: string[]; // Document IDs
}

// Moved from src/dtos/entities/InspectionDTO.ts (reconciled)
export interface InspectionPaymentValidationDTO {
  status: string;
  comments: string;
  paymentType: string;
  paymentStatus?: string;
  projectId?: string;
  inspectionId?: string;
  rejectionNotes?: string;
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface CreateInvoiceDTO {
  invoiceNumber: string;
  supplierId: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status?: InvoiceDTO['status'];
  description?: string;
  projectId?: string;
  purchaseOrderNumber?: string;
  paymentTerms?: string;
  paymentMethod?: InvoiceDTO['paymentMethod'];
  taxAmount?: number;
  totalAmount?: number;
  attachments?: Omit<InvoiceAttachmentDTO, 'id' | 'createdAt' | 'updatedAt'>[];
  metadata?: InvoiceDTO['metadata'];
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface UpdateInvoiceDTO {
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  status?: InvoiceDTO['status'];
  description?: string;
  projectId?: string;
  purchaseOrderNumber?: string;
  paymentTerms?: string;
  paymentMethod?: InvoiceDTO['paymentMethod'];
  taxAmount?: number;
  totalAmount?: number;
  attachments?: Omit<InvoiceAttachmentDTO, 'id' | 'createdAt' | 'updatedAt'>[];
  metadata?: Partial<InvoiceDTO['metadata']>;
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceLineItemDTO {
  id?: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  category?: string;
  productCode?: string;
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceSearchCriteriaDTO {
  supplierId?: string;
  status?: InvoiceDTO['status'];
  projectId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  amountRange?: {
    minAmount: number;
    maxAmount: number;
  };
  searchText?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceSearchResultDTO {
  invoices: InvoiceDTO[];
  totalCount: number;
  facets: {
    statuses: Record<string, number>;
    suppliers: Record<string, number>;
    categories: Record<string, number>;
    priorities: Record<string, number>;
  };
  suggestions?: Array<{
    type: 'correction' | 'expansion' | 'refinement';
    text: string;
    reason: string;
  }>;
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceStatisticsDTO {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageAmount: number;
  currencyBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  overdueAnalysis: {
    count: number;
    amount: number;
    averageDaysOverdue: number;
  };
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceValidationDTO {
  isValid: boolean;
  confidence: number;
  errors: Array<{
    field: string;
    type: 'missing' | 'invalidFormat' | 'businessRule' | 'duplicate';
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    type: 'suggestion' | 'bestPractice';
    message: string;
  }>;
  suggestions: Array<{
    action: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Moved from src/dtos/entities/InvoiceDTO.ts (reconciled)
export interface InvoiceProcessingDTO {
  invoiceId: string;
  status: 'queued' | 'processing' | 'validated' | 'rejected' | 'completed';
  steps: Array<{
    step: string;
    status: 'pending' | 'inProgress' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    error?: string;
  }>;
  currentStep?: string;
  estimatedCompletion?: string;
  progress: number;
}

// Moved from src/dtos/entities/MaterialDTO.ts (reconciled)
export interface MaterialTransactionDTO {
  id: string;
  materialId: string;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reference?: string;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  performedBy?: string;
  performedAt?: string;
  notes?: string;
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface PaymentControlSummaryDTO {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'blocked' | 'overdue';
  dueDate: string;
  blockedReason?: string;
  supplier: string;
  priority: 'low' | 'medium' | 'high';
}

// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
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

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentValidationRequestDTO {
  projectId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  contractorId?: string;
  contractorName?: string;
  contractorContact: string;
  
  // Method-specific fields
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentValidationResultDTO {
  isValid: boolean;
  message?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  allowedAmount: number;
  maxAllowedAmount: number;
  varianceAmount: number;
}

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentRiskAssessmentDTO {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
  score: number;
}

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentRuleConfigDTO {
  maxInitialPaymentPercentage: number;
  maxInitialPaymentAmount: number;
  requireInspectionForProgressThreshold: number;
  allowedPaymentMethods: string[];
  paymentDateValidationDays: number;
  contractorValidationRequired: boolean;
  bankValidationRequired: boolean;
}

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentValidationStatisticsDTO {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  mostCommonFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  validationsByRiskLevel: Record<string, number>;
  validationsByPaymentMethod: Record<string, number>;
}

// Moved from src/dtos/entities/PaymentValidationDTO.ts (reconciled)
export interface PaymentValidationConfigDTO {
  rules: PaymentRuleConfigDTO;
  notifications: {
    successEmail?: string;
    failureEmail?: string;
    escalationEmail?: string;
  };
  integration: {
    accountingSystem?: string;
    erpSystem?: string;
    bankApi?: {
      enabled: boolean;
      endpoint: string;
      apiKey: string;
    };
  };
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progressAtPayment: number;
  transactionId: string;
  // New contractor fields
  contractorId?: string;
  contractorName: string;
  contractorContact: string;
  // Method-specific fields
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

// Moved from src/dtos/entities/ProjectWithPaymentsDTO.ts (reconciled)
export interface PaymentSummaryDTO {
  id: string;
  amount: number;
  paymentDate: string;
  contractorName?: string | null;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface PaymentMilestoneDTO {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

// Moved from src/dtos/entities/SupplierPaymentDTO.ts (reconciled)
export interface CreateSupplierPaymentRequestDTO {
  /** ID de l'inspection associée */
  inspectionId: string;
  /** ID du fournisseur */
  supplierId: string;
  /** ID du projet (optionnel) */
  projectId?: string;
  /** Montant en MRU */
  amount: number;
  /** Devise (défaut: MRU) */
  currency?: string;
  /** Type de paiement */
  paymentType: string;
  /** Commentaires */
  comments?: string;
  /** Notes (alias pour comments) */
  notes?: string;
  /** Documents justificatifs */
  documents?: string[];
  /** Documents support (alias pour documents) */
  supportingDocuments?: string[];
  /** Compte bancaire */
  bankAccount?: string;
  /** Numéro de facture */
  invoiceNumber?: string;
  /** Date de facture */
  invoiceDate?: string;
  /** Description des travaux */
  workDescription?: string;
  /** Localisation des travaux */
  workLocation?: string;
  /** Période des travaux */
  workPeriod?: string;
  /** Raison du paiement */
  paymentReason?: string;
  /** Statut initial (défaut: pending) */
  status?: SupplierPaymentStatus;
  /** Date de la demande (défaut: maintenant) */
  requestedAt?: string;
  /** Date de la demande (alias pour requestedAt) */
  requestedDate?: string;
}

// Moved from src/dtos/entities/SupplierPaymentDTO.ts (reconciled)
export interface UpdateSupplierPaymentRequestDTO {
  /** Statut de la demande */
  status?: SupplierPaymentStatus;
  /** Commentaires */
  comments?: string;
  /** Notes (alias pour comments) */
  notes?: string;
  /** Raison du rejet */
  rejectionReason?: string;
  /** Validé par */
  validatedBy?: string;
  /** Approuvé par (alias pour validatedBy) */
  approvedBy?: string;
  /** Date de validation */
  validatedAt?: string;
  /** Date d'approbation (alias pour validatedAt) */
  approvedAt?: string;
  /** Documents justificatifs */
  documents?: string[];
  /** Documents support (alias pour documents) */
  supportingDocuments?: string[];
  /** Type de paiement */
  paymentType?: string;
  /** Compte bancaire */
  bankAccount?: string;
  /** Numéro de facture */
  invoiceNumber?: string;
  /** Date de facture */
  invoiceDate?: string;
  /** Description des travaux */
  workDescription?: string;
  /** Localisation des travaux */
  workLocation?: string;
  /** Période des travaux */
  workPeriod?: string;
  /** Montant */
  amount?: number;
  /** Raison du paiement */
  paymentReason?: string;
}

// Moved from src/dtos/entities/SupplierPaymentDTO.ts (reconciled)
export interface SupplierPaymentRequestListDTO {
  items: SupplierPaymentRequestDTO[];
  total: number;
  page: number;
  limit: number;
  statusCounts?: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    cancelled: number;
  };
}

// Moved from src/dtos/entities/SupplierPaymentDTO.ts (reconciled)
export interface SupplierPaymentStatsDTO {
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  averageAmount: number;
  countByStatus: Record<SupplierPaymentStatus, number>;
  countByType: Record<string, number>;
  recentPayments: SupplierPaymentRequestDTO[];
}

// Moved from src/dtos/entities/WorkflowDTO.ts (reconciled)
export interface TriggerPaymentRequestDTO {
  phaseId: string;
  amount: number;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
}

// Moved from src/dtos/entities/WorkflowDTO.ts (reconciled)
export interface TriggerPaymentResponseDTO {
  success: boolean;
  paymentId?: string;
  error?: string;
}
