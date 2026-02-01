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
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

export interface PaymentBlockDTO extends BaseEntityDTO {
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
  metadata?: any;
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
export interface CreatePaymentRequestDTO {
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

export interface UpdatePaymentRequestDTO {
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
