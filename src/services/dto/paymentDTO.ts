// Payment DTO transformers
export interface PaymentDTO {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PaymentBlockDTO {
  id: string;
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

export interface PaymentActionDTO {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

// Transform database records to DTOs
export const transformPaymentToDTO = (dbRecord: any): PaymentDTO => {
  return {
    id: dbRecord.id,
    projectId: dbRecord.project_id,
    contractorId: dbRecord.contractor_id || '',
    contractorName: dbRecord.contractor_name,
    contractorContact: dbRecord.contractor_contact,
    amount: dbRecord.amount,
    paymentMethod: dbRecord.payment_method,
    paymentDate: dbRecord.payment_date,
    transactionId: dbRecord.transaction_id,
    progressAtPayment: dbRecord.progress_at_payment,
    inspectionId: dbRecord.inspection_id,
    phaseId: dbRecord.phase_id,
    bankName: dbRecord.bank_name,
    accountNumber: dbRecord.account_number,
    checkNumber: dbRecord.check_number,
    mobileNumber: dbRecord.mobile_number,
    mobileOperator: dbRecord.mobile_operator,
    receiverName: dbRecord.receiver_name,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
};

// Transform DTOs to database records
export const transformPaymentFromDTO = (dto: Partial<PaymentDTO>): any => {
  return {
    project_id: dto.projectId,
    contractor_id: dto.contractorId,
    contractor_name: dto.contractorName,
    contractor_contact: dto.contractorContact,
    amount: dto.amount,
    payment_method: dto.paymentMethod,
    payment_date: dto.paymentDate,
    transaction_id: dto.transactionId,
    progress_at_payment: dto.progressAtPayment,
    inspection_id: dto.inspectionId,
    phase_id: dto.phaseId,
    bank_name: dto.bankName,
    account_number: dto.accountNumber,
    check_number: dto.checkNumber,
    mobile_number: dto.mobileNumber,
    mobile_operator: dto.mobileOperator,
    receiver_name: dto.receiverName
  };
};

export const transformPaymentBlockToDTO = (dbRecord: any): PaymentBlockDTO => {
  return {
    id: dbRecord.id,
    projectId: dbRecord.project_id,
    contractorId: dbRecord.contractor_id,
    amount: dbRecord.amount,
    blockingReasons: dbRecord.blocking_reasons || [],
    blockedAt: dbRecord.blocked_at,
    blockedBy: dbRecord.blocked_by,
    resolvedAt: dbRecord.resolved_at,
    resolvedBy: dbRecord.resolved_by,
    notes: dbRecord.notes
  };
};

export const validatePaymentDTO = (dto: Partial<PaymentDTO>): string[] => {
  const errors: string[] = [];

  if (!dto.projectId) errors.push('Project ID is required');
  if (!dto.contractorName) errors.push('Contractor name is required');
  if (!dto.contractorContact) errors.push('Contractor contact is required');
  if (!dto.amount || dto.amount <= 0) errors.push('Amount must be greater than 0');
  if (!dto.paymentMethod) errors.push('Payment method is required');
  if (dto.progressAtPayment === undefined || dto.progressAtPayment < 0 || dto.progressAtPayment > 100) {
    errors.push('Progress at payment must be between 0 and 100');
  }

  // Validate payment method specific fields
  if (dto.paymentMethod === 'bank_transfer') {
    if (!dto.bankName) errors.push('Bank name is required for bank transfer');
    if (!dto.accountNumber) errors.push('Account number is required for bank transfer');
  }

  if (dto.paymentMethod === 'check') {
    if (!dto.checkNumber) errors.push('Check number is required for check payment');
    if (!dto.bankName) errors.push('Bank name is required for check payment');
  }

  if (dto.paymentMethod === 'mobile_money') {
    if (!dto.mobileNumber) errors.push('Mobile number is required for mobile money');
    if (!dto.mobileOperator) errors.push('Mobile operator is required for mobile money');
  }

  return errors;
};

export const calculatePaymentSummary = (payments: PaymentDTO[]): {
  totalAmount: number;
  averageAmount: number;
  paymentsByMethod: Record<string, number>;
  paymentsByMonth: Record<string, number>;
} => {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const averageAmount = payments.length > 0 ? totalAmount / payments.length : 0;

  const paymentsByMethod = payments.reduce((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentsByMonth = payments.reduce((acc, payment) => {
    const month = new Date(payment.paymentDate).toISOString().slice(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    averageAmount: Math.round(averageAmount * 100) / 100,
    paymentsByMethod,
    paymentsByMonth
  };
};

export const filterPaymentsByDateRange = (
  payments: PaymentDTO[],
  startDate: Date,
  endDate: Date
): PaymentDTO[] => {
  return payments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    return paymentDate >= startDate && paymentDate <= endDate;
  });
};

export const sortPaymentsByDate = (payments: PaymentDTO[], ascending: boolean = false): PaymentDTO[] => {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.paymentDate).getTime();
    const dateB = new Date(b.paymentDate).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const groupPaymentsByContractor = (payments: PaymentDTO[]): Record<string, PaymentDTO[]> => {
  return payments.reduce((groups, payment) => {
    const key = payment.contractorId || payment.contractorName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(payment);
    return groups;
  }, {} as Record<string, PaymentDTO[]>);
};