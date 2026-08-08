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
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blocked_amount: number;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentControlActionDTO {
  id: string;
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

// Service Request DTOs
export interface CreatePaymentBlockRequestDto {
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  blocked_amount: number;
}

export interface ResolvePaymentBlockRequestDto {
  block_id: string;
  resolution_notes: string;
  resolved_by: string;
}

export interface CreatePaymentControlActionRequestDto {
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  created_by?: string;
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
  payment_request_id?: string;
  status?: string;
  block_type?: string;
}

export interface GetPaymentControlActionsRequestDto {
  payment_block_id: string;
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
  paymentType: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto';
  dueDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
  documents?: PaymentDocumentDTO[];
  
  // Legacy snake_case for backward compatibility
  phase_id?: string;
  milestone_id?: string;
  payment_type?: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto';
  due_date?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_bank_info?: string;
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
  
  // Legacy snake_case for backward compatibility
  due_date?: string;
  paid_date?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_bank_info?: string;
}
