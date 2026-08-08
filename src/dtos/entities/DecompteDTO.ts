// Decompte DTOs - Centralized definitions for decompte calculations

// Import existing MauritaniaBusinessRulesDTO - complex interface

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
  guarantee_retentionRate: 0.10,
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
  unitPrice?: number;
  amount: number;
  totalAmount?: number;
  cumulativeAmount: number;
  previousAmount: number;
  category?: 'works' | 'materials' | 'services' | 'other';
  milestoneId?: string;
  verificationStatus?: string;
}

export interface VerifiedMilestoneDTO {
  milestoneId: string;
  title: string;
  weight: number;
  amount: number;
  verifiedAt: string;
}

export interface AutomaticDecompteDTO {
  id: string;
  projectId: string;
  projectId?: string;
  phaseId?: string;
  phaseId?: string;
  number: number;
  decompteNumber?: number;
  date: string;
  paymentType: PaymentType;
  decompteType?: PaymentType;
  lines: DecompteLineDTO[];
  totalAmount: number;
  retentionAmount: number;
  netAmount: number;
  status: DecompteStatus;
  createdAt: string;
  updatedAt: string;
  // Extended properties for detailed calculations
  contractAmount?: number;
  previousCumulative?: number;
  currentPeriodAmount?: number;
  cumulativeAmount?: number;
  retention_rate?: number;
  retentionAmount?: number;
  previousRetentionReleased?: number;
  retentionToRelease?: number;
  netPayable?: number;
  verifiedMilestones?: VerifiedMilestoneDTO[];
  progressAtDecompte?: number;
  inspectionReference?: strin string;
  calculationLog?: Array<{
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
  completionDate: string;
  amount: number;
  phaseId?: string;
  phaseEstimatedCost?: number;
}