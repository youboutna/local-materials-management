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
}

// Re-export business rules types
export const DEFAULT_MAURITANIA_RULES: MauritaniaBusinessRulesDTO = {
  retentionPercentage: 10,
  initialAdvanceMaxPercentage: 30,
  initialPaymentPercentage: 30,
  minimumProgressForPayment: 10,
  qualityReservePercentage: 5,
  bankGuaranteeRequiredPercentage: 100,
  paymentTermsDays: 30,
  guaranteeRetentionRate: 10,
  retentionReleaseAtProvisional: 50
};

export enum PaymentType {
  INITIAL_ADVANCE = 'initial_advance',
  PROGRESS_PAYMENT = 'progress_payment',
  MILESTONE_PAYMENT = 'milestone_payment',
  FINAL_PAYMENT = 'final_payment',
  RETENTION_RELEASE = 'retention_release'
}

export interface DecompteLineDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  cumulativeAmount: number;
  previousAmount: number;
}

export interface AutomaticDecompteDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  number: number;
  date: string;
  paymentType: PaymentType;
  lines: DecompteLineDTO[];
  totalAmount: number;
  retentionAmount: number;
  netAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
  updatedAt: string;
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
