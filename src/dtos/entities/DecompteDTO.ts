// Decompte DTOs - Centralized definitions for decompte calculations

// Import existing MauritaniaBusinessRulesDTO - complex interface
export interface MauritaniaBusinessRulesDTO {
  retentionPercentage: number;
  initialAdvanceMaxPercentage?: number;
  initialPaymentPercentage?: number;
  minimumProgressForPayment?: number;
  qualityReservePercentage?: number;
  bankGuaranteeRequiredPercentage?: number;
  paymentTermsDays?: number;
  guaranteeRetentionRate?: number;
  retentionReleaseAtProvisional?: number;
  paymentThresholds?: number[];
  requiredDocuments?: Record<number, string[]>;
  requiredInspections?: Record<number, string[]>;
  minimumPaymentAmounts?: {
    initial: number;
    progress: number;
    final: number;
  };
  validationDelays?: {
    inspection: number;
    approval: number;
    payment: number;
  };
  notificationConfig?: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Legacy snake_case aliases for compatibility
  guarantee_retention_rate?: number;
  retention_release_at_provisional?: number;
}

// Re-export business rules types with snake_case properties for compatibility
export const DEFAULT_MAURITANIA_RULES: MauritaniaBusinessRulesDTO = {
  retentionPercentage: 10,
  initialAdvanceMaxPercentage: 30,
  initialPaymentPercentage: 30,
  minimumProgressForPayment: 10,
  qualityReservePercentage: 5,
  bankGuaranteeRequiredPercentage: 100,
  paymentTermsDays: 30,
  guaranteeRetentionRate: 10,
  retentionReleaseAtProvisional: 50,
  // snake_case aliases
  guarantee_retention_rate: 0.10,
  retention_release_at_provisional: 0.50
};

export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';
export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface DecompteLineDTO {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  unit_price?: number;
  amount: number;
  total_amount?: number;
  cumulativeAmount: number;
  previousAmount: number;
  category?: 'works' | 'materials' | 'services' | 'other';
  milestone_id?: string;
  verification_status?: string;
}

export interface VerifiedMilestoneDTO {
  milestone_id: string;
  title: string;
  weight: number;
  amount: number;
  verified_at: string;
}

export interface AutomaticDecompteDTO {
  id: string;
  projectId: string;
  project_id?: string;
  phaseId?: string;
  phase_id?: string;
  number: number;
  decompte_number?: number;
  date: string;
  paymentType: PaymentType;
  decompte_type?: PaymentType;
  lines: DecompteLineDTO[];
  totalAmount: number;
  retentionAmount: number;
  netAmount: number;
  status: DecompteStatus;
  createdAt: string;
  updatedAt: string;
  // Extended properties for detailed calculations
  contract_amount?: number;
  previous_cumulative?: number;
  current_period_amount?: number;
  cumulative_amount?: number;
  retention_rate?: number;
  retention_amount?: number;
  previous_retention_released?: number;
  retention_to_release?: number;
  net_payable?: number;
  verified_milestones?: VerifiedMilestoneDTO[];
  progress_at_decompte?: number;
  inspection_reference?: string;
  pv_reference?: string;
  calculated_at?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  calculation_log?: Array<{
    timestamp: string;
    action: string;
    details: Record<string, unknown>;
  }>;
}

export interface CalculateProjectDecompteRequestDto {
  projectId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

export interface CalculatePhaseDecompteRequestDto {
  projectId: string;
  phaseId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

export interface CanGenerateDecompteRequestDto {
  projectId: string;
  phaseId?: string;
}

export interface CanGenerateDecompteResponseDto {
  allowed: boolean;
  reason: string;
  suggestedAmount: number;
}

// Service-specific types that may be used by other services
export interface ProjectFinancials {
  budget: number;
  totalPaid: number;
  totalRetentionHeld: number;
  paymentCount: number;
  allowsInitialPayment: boolean;
  initialPaymentPercentage: number;
}

export interface PhaseFinancials {
  id: string;
  name: string;
  phaseName?: string;
  estimatedCost: number;
  progress: number;
  totalPaid: number;
  remainingBudget?: number;
}

export interface VerifiedMilestone {
  id: string;
  title: string;
  weight: number;
  completedDate: string;
  amount: number;
  phaseId?: string;
  phaseEstimatedCost?: number;
}
