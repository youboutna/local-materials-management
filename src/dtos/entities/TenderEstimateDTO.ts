/**
 * Tender Estimate DTOs - Centralized Data Transfer Objects
 * Following hexagonal architecture principles
 */

import { TenderEstimateFinancialData, TenderEstimateCostBreakdown, TenderEstimateBusinessLogic } from '@/dtos/transforms/shared';

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
  materialId?: string;  // ✅ Added for UI form support
  itemType?: string;   // ✅ Added for UI form support
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
  prS.md Rule #2)
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
 'medium' | 'high' | 'critical';
  factors: string[];
  score: number;
}

// Margin Rules DTO  
export interface TenderEstimateMarginRulesDto {
  overheadPercentage: number;
  profit_margin_percentage: number;
  riskMultiplier: number;
}

export interface TenderEstimateStatsDto {
  totalEstimates: number;
  total_amount: number;
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

// Comparisonrface TenderEstimateStatsDto {
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
export interface TenderEstimateCompa