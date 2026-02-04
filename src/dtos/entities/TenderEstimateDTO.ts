/**
 * Tender Estimate DTOs - Centralized Data Transfer Objects
 * Following hexagonal architecture principles
 */

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
}

export interface UpdateTenderEstimateRequestDto {
  tender_id?: string;
  submitted_by?: string;
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  total_amount?: number;
  currency?: string;
  validity_period?: number;
  notes?: string;
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
  tax_amount: number;
  total_with_tax: number;
  final_total: number;
}

export interface TenderEstimateStatsDto {
  total_estimates: number;
  total_amount: number;
  average_amount: number;
  by_status: Record<string, number>;
  by_currency: Record<string, number>;
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

export interface TenderEstimateValidationDto {
  is_valid: boolean;
  errors: TenderEstimateValidationErrorDto[];
  warnings: TenderEstimateValidationWarningDto[];
}

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
