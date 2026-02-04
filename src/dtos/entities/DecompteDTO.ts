// Decompte DTOs - Centralized definitions for decompte calculations

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
  phaseId: string;
  phaseName: string;
  estimatedCost: number;
  progress: number;
  totalPaid: number;
}

export interface VerifiedMilestone {
  id: string;
  title: string;
  weight: number;
  completedDate: string;
  amount: number;
}
