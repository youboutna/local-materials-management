/**
 * Tender Estimate DTOs - Centralized Data Transfer Objects
 * Following hexagonal architecture principles
 */

import { TenderEstimateFinancialData, TenderEstimateCostBreakdown, TenderEstimateBusinessLogic } from '@/dtos/transforms/shared';

export interface TenderEstimateDTO {
  id: string;
  tender_id: string;
  submitted_by: string;
  submission_date: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  total_amount: number;
  currency: string;
  validity_period: number; // in days
  notes?: string;
  // Estimate type for compatibility with EstimateData
  estimate_type: string;
  // Snake_case properties for EstimateData compatibility
  total_materials_cost?: number | null;
  total_labor_cost?: number | null;
  total_equipment_cost?: number | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total_with_tax?: number | null;
  overhead_percentage?: number | null;
  overhead_amount?: number | null;
  profit_margin_percentage?: number | null;
  profit_margin_amount?: number | null;
  final_total?: number | null;
  // Financial calculation fields (camelCase - PROMPTS.md Rule #2)
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
  // Business logic calculated fields
  margin_rules?: {
    overhead_percentage: number;
    profit_margin_percentage: number;
    risk_multiplier: number;
  };
  risk_assessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    score: number;
  };
  created_at: string;
  updated_at: string;
}


export interface TenderEstimateItemDTO {
  id: string;
  estimate_id: string;
  material_id?: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  specifications?: string;
  item_type?: string;
  materialId?: string;  // ✅ Added for UI form support
  itemType?: string;   // ✅ Added for UI form support
  // Business logic calculated fields
  margin_percentage?: number;
  line_total?: number;
  // --- Ancrage RH / Prestataires (Plan v10 §3) ---
  /** Type de ressource pointée par la ligne DQE. */
  resource_kind?: 'internal_qualification' | 'external_provider' | 'material';
  /** Id qualification interne (organigramme) — coût horaire chargé hérité. */
  employee_qualification_id?: string;
  /** Id fournisseur externe rattaché à la ligne. */
  supplier_id?: string;
  /** Référence contractuelle appliquée (convention-cadre / marché). */
  supplier_contract_ref?: string;
  /** Nb d'heures/jours estimé pour cette ressource (informatif). */
  estimated_hours?: number;
  created_at: string;
  updated_at: string;
}

// Service Request DTOs
export interface CreateTenderEstimateRequestDto {
  tender_id: string;
  submitted_by: string;
  total_amount: number;
  currency: string;
  validity_period: number;
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
  estimate_id: string;
  material_id?: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  specifications?: string;
  item_type?: string;
  materialId?: string;
  itemType?: string;
  // Ancrage RH/Prestataires (v10)
  resource_kind?: 'internal_qualification' | 'external_provider' | 'material';
  employee_qualification_id?: string;
  supplier_id?: string;
  supplier_contract_ref?: string;
  estimated_hours?: number;
}

export interface UpdateTenderEstimateRequestDto {
  tender_id?: string;
  submitted_by?: string;
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  total_amount?: number;
  currency?: string;
  validity_period?: number;
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
  item_code?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  category?: string;
  specifications?: string;
}

// Query DTOs
export interface GetTenderEstimatesRequestDto {
  tender_id?: string;
  submitted_by?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetTenderEstimateByIdRequestDto {
  id: string;
}

export interface GetTenderEstimateItemsRequestDto {
  estimate_id: string;
}

export interface GetMyEstimatesRequestDto {
  submitted_by: string;
  status?: string;
}

export interface GetEstimatesByProjectIdRequestDto {
  project_id: string;
}

export interface GetEstimateStatsRequestDto {
  tender_id: string;
}

export interface CalculateEstimateTotalsRequestDto {
  estimate_id: string;
}

// Response DTOs
export interface EstimateStatsDto {
  total_estimates: number;
  total_amount: number;
  average_amount: number;
  by_status: Record<string, number>;
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
  overhead_percentage: number;
  profit_margin_percentage: number;
  risk_multiplier: number;
}

export interface TenderEstimateStatsDto {
  total_estimates: number;
  total_amount: number;
  average_amount: number;
  estimates_by_status: Record<string, number>;
  estimates_by_currency: Record<string, number>;
  total_value: number;
  recent_estimates: TenderEstimateDTO[];
}

// Validation DTOs
export interface TenderEstimateValidationDto {
  is_valid: boolean;
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
  original_estimate: TenderEstimateDTO;
  revised_estimate: TenderEstimateDTO;
  differences: {
    amount_change: number;
    percentage_change: number;
    changed_fields: string[];
  };
}

// Query DTOs
export interface GetTenderEstimatesRequestDto {
  tender_id?: string;
  submitted_by?: string;
  status?: string;
  submission_date_from?: string;
  submission_date_to?: string;
}

export interface GetTenderEstimateItemsRequestDto {
  estimate_id: string;
  category?: string;
}

// Response DTOs
export interface TenderEstimateStatsDto {
  total_estimates: number;
  estimates_by_status: Record<string, number>;
  total_value: number;
  average_amount: number;
  estimates_by_submitter: Record<string, number>;
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
  estimate_1: TenderEstimateDTO;
  estimate_2: TenderEstimateDTO;
  price_difference: number;
  price_difference_percentage: number;
  item_differences: TenderEstimateItemDifferenceDto[];
}

export interface TenderEstimateItemDifferenceDto {
  item_code: string;
  description: string;
  estimate_1_price: number;
  estimate_2_price: number;
  price_difference: number;
  price_difference_percentage: number;
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
