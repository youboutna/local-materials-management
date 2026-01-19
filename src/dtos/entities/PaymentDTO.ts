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

export interface CreatePaymentDTO extends Omit<PaymentDTO, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdatePaymentDTO extends Partial<CreatePaymentDTO> {}

export interface PaymentValidationDTO {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  paymentMethod: string;
  requiredFields: string[];
  optionalFields: string[];
}
