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
  projectId: string; // ✅ CAMELCASE: Primary field
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  milestoneId?: string; // ✅ CAMELCASE: Instead of milestone_id
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  paymentType: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto'; // ✅ CAMELCASE: Instead of payment_type
  dueDate?: string; // ✅ CAMELCASE: Instead of due_date
  recipientId?: string; // ✅ CAMELCASE: Instead of recipient_id
  recipientName?: string; // ✅ CAMELCASE: Instead of recipient_name
  recipientBankInfo?: string; // ✅ CAMELCASE: Instead of recipient_bank_info
  documents?: PaymentDocumentDTO[];
  
  // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
  milestone_id?: string; // Legacy snake_case for backward compatibility
  payment_type?: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'crypto'; // Legacy snake_case for backward compatibility
  due_date?: string; // Legacy snake_case for backward compatibility
  recipient_id?: string; // Legacy snake_case for backward compatibility
  recipient_name?: string; // Legacy snake_case for backward compatibility
  recipient_bank_info?: string; // Legacy snake_case for backward compatibility
}

export interface UpdatePaymentRequestDTO {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  dueDate?: string; // ✅ CAMELCASE: Instead of due_date
  paidDate?: string; // ✅ CAMELCASE: Instead of paid_date
  recipientId?: string; // ✅ CAMELCASE: Instead of recipient_id
  recipientName?: string; // ✅ CAMELCASE: Instead of recipient_name
  recipientBankInfo?: string; // ✅ CAMELCASE: Instead of recipient_bank_info
  documents?: PaymentDocumentDTO[];
  
  // Legacy snake_case for backward compatibility
  due_date?: string; // Legacy snake_case for backward compatibility
  paid_date?: string; // Legacy snake_case for backward compatibility
  recipient_id?: string; // Legacy snake_case for backward compatibility
  recipient_name?: string; // Legacy snake_case for backward compatibility
  recipient_bank_info?: string; // Legacy snake_case for backward compatibility
}
