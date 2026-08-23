/**
 * Tender Estimate DTOs - Centralized Data Transfer Objects
 * Following hexagonal architecture principles
 */

import { TenderEstimateFinancialData, TenderEstimateCostBreakdown, TenderEstimateBusinessLogic } from '@/dtos/transforms/shared';

export interface TenderEstimateDTO {
  id: string;
  tenderId: string;
  submittedBy: string;
  submissionDate: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  totalAmount: number;
  currency: string;
  validityPeriod: number; // in days
  notes?: string;
  // Estimate type for compatibility with EstimateData
  estimateType: string;
  // Snake_case properties for EstimateData compatibility
  totalMaterialsCost?: number | null;
  totalLaborCost?: number | null;
  totalEquipmentCost?: number | null;
  subtotal?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalWithTax?: number | null;
  overheadPercentage?: number | null;
  overheadAmount?: number | null;
  profitMarginPercentage?: number | null;
  profitMarginAmount?: number | null;
  finalTotal?: number | null;
  // Financial calculation fields (camelCase - PROMPTS.md Rule #2)
  discountRate?: number;   // ✅ Changed from discount_rate
  discountAmount?: number;  // ✅ Changed from discount_amount
  // Cost breakdown fields
  // Business logic calculated fields
  marginRules?: {
    overheadPercentage: number;
    profitMarginPercentage: number;
    riskMultiplier: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    score: number;
  };
  createdAt: string;
  updatedAt: string;
}


export interface TenderEstimateItemDTO {
  id: string;
  estimateId: string;
  materialId?: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: string;
  itemType?: string;
  // Business logic calculated fields
  marginPercentage?: number;
  lineTotal?: number;
  // --- Ancrage RH / Prestataires (Plan v10 §3) ---
  /** Type de ressource pointée par la ligne DQE. */
  resourceKind?: 'internal_qualification' | 'external_provider' | 'material';
  /** Id qualification interne (organigramme) — coût horaire chargé hérité. */
  employeeQualificationId?: string;
  /** Id fournisseur externe rattaché à la ligne. */
  supplierId?: string;
  /** Référence contractuelle appliquée (convention-cadre / marché). */
  supplierContractRef?: string;
  /** Nb d'heures/jours estimé pour cette ressource (informatif). */
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

// Service Request DTOs
export interface CreateTenderEstimateRequestDto {
  tenderId: string;
  submittedBy: string;
  totalAmount: number;
  currency: string;
  validityPeriod: number;
  notes?: string;
  // Financial calculation fields (camelCase - PROMPTS.md Rule #2)
  subtotal?: number;
  taxRate?: number;        // ✅ Changed from tax_rate
  taxAmount?: number;      // ✅ Changed from tax_amount
  totalWithTax?: number;   // ✅ Changed from total_with_tax
  discountRate?: number;   // ✅ Changed from discount_rate
  discountAmount?: number;  // ✅ Changed from discount_amount
  overheadPercentage?: number;
  overheadAmount?: number;
  profitMarginPercentage?: number;
  profitMarginAmount?: number;
  finalTotal?: number;
  // Cost breakdown fields
  totalMaterialsCost?: number;
  totalLaborCost?: number;
  totalEquipmentCost?: number;
  items?: CreateTenderEstimateItemRequestDto[];
}

export interface CreateTenderEstimateItemRequestDto {
  estimateId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: string;
  // Ancrage RH/Prestataires (v10)
  resourceKind?: 'internal_qualification' | 'external_provider' | 'material';
  employeeQualificationId?: string;
  supplierId?: string;
  supplierContractRef?: string;
  estimatedHours?: number;
  materialId?: string;
  itemType?: string;
}

export interface UpdateTenderEstimateRequestDto {
  tenderId?: string;
  submittedBy?: string;
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  totalAmount?: number;
  currency?: string;
  validityPeriod?: number;
  notes?: string;
  // Financial calculation fields (camelCase - PROMPTS.md Rule #2)
  subtotal?: number;
  taxRate?: number;        // ✅ Changed from tax_rate
  taxAmount?: number;      // ✅ Changed from tax_amount
  totalWithTax?: number;   // ✅ Changed from total_with_tax
  discountRate?: number;   // ✅ Changed from discount_rate
  discountAmount?: number;  // ✅ Changed from discount_amount
  overheadPercentage?: number;
  overheadAmount?: number;
  profitMarginPercentage?: number;
  profitMarginAmount?: number;
  finalTotal?: number;
  // Cost breakdown fields
  totalMaterialsCost?: number;
  totalLaborCost?: number;
  totalEquipmentCost?: number;
}

export interface UpdateTenderEstimateItemRequestDto {
  itemCode?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  category?: string;
  specifications?: string;
}

// Query DTOs
export interface GetTenderEstimatesRequestDto {
  tenderId?: string;
  submittedBy?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetTenderEstimateByIdRequestDto {
  id: string;
}

export interface GetTenderEstimateItemsRequestDto {
  estimateId: string;
}

export interface GetMyEstimatesRequestDto {
  submittedBy: string;
  status?: string;
}

export interface GetEstimatesByProjectIdRequestDto {
  projectId: string;
}

export interface GetEstimateStatsRequestDto {
  tenderId: string;
}

export interface CalculateEstimateTotalsRequestDto {
  estimateId: string;
}

// Response DTOs
export interface EstimateStatsDto {
  totalEstimates: number;
  totalAmount: number;
  averageAmount: number;
  byStatus: Record<string, number>;
}

export interface EstimateTotalsDto {
  subtotal: number;
  discountAmount: number;    // ✅ Changed from discount_amount
  taxAmount: number;         // ✅ Changed from tax_amount
  totalWithTax: number;      // ✅ Changed from total_with_tax
  finalTotal: number;        // ✅ Changed from final_total
}

// Risk Assessment DTO
export interface TenderEstimateRiskDto {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  score: number;
}

// Margin Rules DTO  
export interface TenderEstimateMarginRulesDto {
  overheadPercentage: number;
  profitMarginPercentage: number;
  riskMultiplier: number;
}

export interface TenderEstimateStatsDto {
  totalEstimates: number;
  totalAmount: number;
  averageAmount: number;
  estimatesByStatus: Record<string, number>;
  estimatesByCurrency: Record<string, number>;
  totalValue: number;
  recentEstimates: TenderEstimateDTO[];
}

// Validation DTOs
export interface TenderEstimateValidationDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TenderEstimateValidationErrorDto {
  field: string;
  message: string;
  code: string;
}

export interface TenderEstimateValidationWarningDto {
  field: string;
  message: string;
  code: string;
}

// Comparison DTOs
export interface TenderEstimateComparisonDto {
  originalEstimate: TenderEstimateDTO;
  revisedEstimate: TenderEstimateDTO;
  differences: {
    amountChange: number;
    percentageChange: number;
    changedFields: string[];
  };
}

// Query DTOs
export interface GetTenderEstimatesRequestDto {
  tenderId?: string;
  submittedBy?: string;
  status?: string;
  submissionDateFrom?: string;
  submissionDateTo?: string;
}

export interface GetTenderEstimateItemsRequestDto {
  estimateId: string;
  category?: string;
}

// Response DTOs
export interface TenderEstimateStatsDto {
  totalEstimates: number;
  estimatesByStatus: Record<string, number>;
  totalValue: number;
  averageAmount: number;
  estimatesBySubmitter: Record<string, number>;
}

// TenderEstimateValidationDto already defined above

export interface TenderEstimateValidationErrorDto {
  field: string;
  message: string;
  severity: 'error';
}

export interface TenderEstimateValidationWarningDto {
  field: string;
  message: string;
  severity: 'warning';
  recommendation?: string;
}

// Business Logic DTOs
export interface TenderEstimateComparisonDto {
  estimate1: TenderEstimateDTO;
  estimate2: TenderEstimateDTO;
  priceDifference: number;
  priceDifferencePercentage: number;
  itemDifferences: TenderEstimateItemDifferenceDto[];
}

export interface TenderEstimateItemDifferenceDto {
  itemCode: string;
  description: string;
  estimate1Price: number;
  estimate2Price: number;
  priceDifference: number;
  priceDifferencePercentage: number;
}

// Validation-related DTOs
export interface TenderEstimateBusinessRulesDTO {
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedValidityPeriod: number;
}

export interface TenderEstimatePermissionDTO {
  userRole: string;
  allowedActions: Array<'create' | 'submit' | 'review' | 'approve' | 'reject'>;
}

export interface TenderEstimateStatusTransitionDTO {
  currentStatus: string;
  validTransitions: string[];
}
