/**
 * Bank Guarantee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export type BankGuaranteeType = 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
export type BankGuaranteeStatus = 'active' | 'expired' | 'claimed' | 'cancelled' | 'pending';

export interface BankGuaranteeDTO {
  id: string;
  projectId: string;
  contractorId?: string;
  type: BankGuaranteeType;
  guaranteeType?: BankGuaranteeType;
  number: string;
  guaranteeNumber?: string;
  issuingBank: string;
  bankName?: string;
  beneficiary?: string;
  issueDate: string;
  expiryDate: string;
  amount: number;
  guaranteeAmount?: number;
  currency: string;
  exchangeRate?: number;
  phaseId?: string;
  status: BankGuaranteeStatus;
  conditions?: string[];
  documents: string[];
  actions?: BankGuaranteeActionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface BankGuaranteeActionDTO {
  id: string;
  guaranteeId: string;
  type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  performedBy: string;
  performedAt?: string;
  dueDate?: string;
  completedAt?: string;
  documents?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBankGuaranteeActionRequestDto {
  guaranteeId: string;
  actionType: BankGuaranteeActionDTO['type'];
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  documents?: string[];
  notes?: string;
}

export interface UpdateBankGuaranteeActionRequestDto {
  title?: string;
  description?: string;
  status?: BankGuaranteeActionDTO['status'];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  documents?: string[];
  notes?: string;
}

export interface BankGuaranteeActionStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  failed: number;
  overdue: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface BankGuaranteeStatsDTO {
  total: number;
  active: number;
  expired: number;
  claimed: number;
  cancelled: number;
  expiringSoonCount: number;
  totalAmount?: number;
  averageExpiryDays?: number;
}

export interface CreateBankGuaranteeDTO {
  projectId: string;
  contractorId?: string;
  type: BankGuaranteeType;
  number: string;
  issuingBank: string;
  issueDate: string;
  expiryDate: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
}

export interface GetBankGuaranteesOptionsDTO {
  projectId?: string;
  limit?: number;
  offset?: number;
  status?: BankGuaranteeStatus;
}
