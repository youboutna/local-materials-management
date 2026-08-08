/**
 * Bank Guarantee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export type BankGuaranteeType = 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
export type BankGuaranteeStatus = 'active' | 'expired' | 'claimed' | 'cancelled' | 'pending';

export interface BankGuaranteeDTO {
  id: string;
  projectId: string;
  projectId?: string;
  contractorId?: string;
  contractorId?: string;
  type: BankGuaranteeType;
  guaranteeType?: BankGuaranteeType;
  guaranteeType?: string;
  number: string;
  guaranteeNumber?: string;
  guaranteeNumber?: string;
  issuingBank: string;
  issuingBank?: string;
  bankName?: string;
  beneficiary?: string;
  issueDate: string;
  issueDate?: string;
  expiryDate: string;
  expiryDate?: string;
  amount: number;
  guaranteeAmount?: number;
  guaranteeAmount?: number;
  currency: string;
  status: BankGuaranteeStatus;
  conditions?: string[];
  documents: string[];
  actions?: BankGuaranteeActionDTO[];
  createdAt: string;
  createdAt?: string;
  updatedAt: string;
  updatedAt?: string;
}

export interface BankGuaranteeActionDTO {
  id: string;
  guaranteeId: string;
  type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension';
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'failed';
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
// Moved from src/hooks/hexagonal/useBankGuaranteesHex.ts
export interface BankGuaranteeRow {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  bankName: string;
  guaranteeAmount: number;
  guaranteeType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  phaseId?: string;
  createdAt?: string;
  updatedAt?: string;
  releasedAt?: string;
  notes?: string;
  supportingDocuments?: string[];
  // Legacy snakeCase for backward compatibility
  projectId?: string;
  contractorId?: string;
  contractorName?: string;
  bankName?: string;
  guaranteeAmount?: number;
  guaranteeType?: string;
  issueDate?: string;
  expiryDate?: string;
  phaseId?: string;
  createdAt?: string;
  updatedAt?: string;
  releasedAt?: string;
}
// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface BankGuaranteeData {
  projectId: string;
  contractorId: string;
  bankLiaisonEmail: string;
  guaranteeAmount: number;
  delayPercentage: number;
  contractClause: string;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface BankGuaranteeDTO {
  id: string;
  type: string;
  amount: number;
  issueDate: Date;
  expiryDate: Date;
  bankName: string;
  status: 'active' | 'expired' | 'claimed';
}
