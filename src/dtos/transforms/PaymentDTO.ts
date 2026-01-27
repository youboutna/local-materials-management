/**
 * Payment DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
 */

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

export interface PaymentDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  paymentType: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto';
  dueDate?: string;
  paidDate?: string;
  paymentDate?: string;
  recipientId?: string;
  recipientName?: string;
  recipientBankInfo?: string;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
  inspectionId?: string;
  progressAtPayment?: number;
  transactionId?: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
  documents?: PaymentDocumentDTO[];
  approvedBy?: string;
  approvedDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
}
