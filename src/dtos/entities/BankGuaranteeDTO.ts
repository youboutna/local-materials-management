/**
 * Bank Guarantee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

type BankGuaranteeType = 'performance' | 'payment' | 'advancePayment' | 'warranty' | 'retention';
type BankGuaranteeStatus = 'active' | 'expired' | 'claimed' | 'cancelled' | 'pending';

export interface BankGuaranteeDTO {
  id: string;
  projectId: string;
  contractorId?: string;
  type: BankGuaranteeType;
  number: string;
  issuingBank: string;
  beneficiary?: string;
  issueDate: string;
  expiryDate: string;
  amount: number;
  currency: string;
  status: BankGuaranteeStatus;
  conditions?: string[];
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BankGuaranteeActionDTO {
  id: string;
  guaranteeId: string;
  type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension';
  status: 'pending' | 'inProgress' | 'completed' | 'failed';
  performedBy: string;
  dueDate?: string;
  completedAt?: string;
  documents: string[];
  notes?: string;
}

export interface BankGuaranteeActionTemplateDTO {
  id: string;
  action_type: BankGuaranteeActionDTO['type'];
  title_template: string;
  description_template: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  default_due_days: number;
  required_documents: string[];
  is_active: boolean;
}

export interface CreateBankGuaranteeActionRequestDto {
  guarantee_id: string;
  action_type: BankGuaranteeActionDTO['type'];
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  documents?: string[];
  notes?: string;
}

export interface UpdateBankGuaranteeActionRequestDto {
  title?: string;
  description?: string;
  status?: BankGuaranteeActionDTO['status'];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  due_date?: string;
  documents?: string[];
  notes?: string;
}

export interface BankGuaranteeActionStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  failed: number;
  overdue: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface BankGuaranteeStatsDTO {
  total: number;
  active: number;
  expired: number;
  claimed: number;
  cancelled: number;
  expiringSoonCount: number;
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
