/**
 * Advanced Tender Estimate DTOs - Sophisticated Data Transfer Objects
 * Following hexagonal architecture with comprehensive business logic
 */

// ============= Core DTOs =============
export interface TenderEstimateDTO {
  // Core fields
  id: string;
  tender_id: string;
  submitted_by: string;
  submission_date: string;
  status: TenderEstimateStatus;
  total_amount: number;
  currency: CurrencyCode;
  validity_period: number;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Computed fields (calculated by domain)
  display_name: string;
  formatted_total_amount: string;
  expiry_date: string;
  is_expired: boolean;
  days_until_expiry: number;
  can_be_edited: boolean;
  can_be_submitted: boolean;
  can_be_reviewed: boolean;
  can_be_accepted: boolean;
  can_be_rejected: boolean;
  is_finalized: boolean;
  
  // Business metrics
  risk_assessment: TenderEstimateRiskDTO;
  metrics: TenderEstimateMetricsDTO;
}

export interface TenderEstimateItemDTO {
  id: string;
  estimate_id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  specifications?: string;
  created_at: string;
  updated_at: string;

  // Computed fields
  formatted_unit_price: string;
  formatted_total_price: string;
  price_per_unit_ratio: number;
}

// ============= Request DTOs =============
export interface CreateTenderEstimateRequestDTO {
  tender_id: string;
  submitted_by: string;
  currency: CurrencyCode;
  validity_period?: number;
  notes?: string;
  items?: CreateTenderEstimateItemRequestDTO[];
}

export interface CreateTenderEstimateItemRequestDTO {
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  category?: string;
  specifications?: string;
}

export interface UpdateTenderEstimateRequestDTO {
  status?: TenderEstimateStatus;
  currency?: CurrencyCode;
  validity_period?: number;
  notes?: string;
  rejection_reason?: string;
}

export interface UpdateTenderEstimateItemRequestDTO {
  item_code?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  category?: string;
  specifications?: string;
}

export interface SubmitTenderEstimateRequestDTO {
  estimate_id: string;
  submission_notes?: string;
}

export interface ReviewTenderEstimateRequestDTO {
  estimate_id: string;
  review_decision: 'accept' | 'reject';
  review_notes?: string;
  reviewer_id: string;
}

// ============= Query DTOs =============
export interface GetTenderEstimatesQueryDTO {
  tender_id?: string;
  submitted_by?: string;
  status?: TenderEstimateStatus | TenderEstimateStatus[];
  submission_date_from?: string;
  submission_date_to?: string;
  amount_min?: number;
  amount_max?: number;
  currency?: CurrencyCode;
  is_expired?: boolean;
  risk_level?: RiskLevel;
  include_items?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'submission_date' | 'total_amount' | 'expiry_date' | 'risk_score';
  sort_order?: 'asc' | 'desc';
}

export interface GetTenderEstimateItemsQueryDTO {
  estimate_id: string;
  category?: string;
  item_code?: string;
  min_total_price?: number;
  max_total_price?: number;
  sort_by?: 'total_price' | 'quantity' | 'unit_price' | 'category';
  sort_order?: 'asc' | 'desc';
}

// ============= Response DTOs =============
export interface TenderEstimateStatsDTO {
  total_estimates: number;
  estimates_by_status: Record<TenderEstimateStatus, number>;
  total_value: number;
  average_amount: number;
  median_amount: number;
  highest_amount: number;
  lowest_amount: number;
  estimates_by_currency: Record<CurrencyCode, number>;
  estimates_by_risk_level: Record<RiskLevel, number>;
  expired_estimates: number;
  expiring_soon_estimates: number; // Within 7 days
  submission_trend: Array<{
    date: string;
    count: number;
    total_value: number;
  }>;
}

export interface TenderEstimateComparisonDTO {
  estimate_1: TenderEstimateDTO;
  estimate_2: TenderEstimateDTO;
  comparison_metrics: {
    price_difference: number;
    price_difference_percentage: number;
    item_count_difference: number;
    risk_level_difference: number;
    validity_period_difference: number;
  };
  item_comparisons: TenderEstimateItemComparisonDTO[];
  recommendation: string;
}

export interface TenderEstimateItemComparisonDTO {
  item_code: string;
  description: string;
  estimate_1_item?: TenderEstimateItemDTO;
  estimate_2_item?: TenderEstimateItemDTO;
  price_difference: number;
  price_difference_percentage: number;
  availability_status: 'both' | 'estimate_1_only' | 'estimate_2_only' | 'neither';
}

// ============= Business Logic DTOs =============
export interface TenderEstimateRiskDTO {
  level: RiskLevel;
  score: number;
  factors: RiskFactorDTO[];
  assessment_date: string;
  recommended_actions: string[];
}

export interface RiskFactorDTO {
  type: 'amount' | 'validity_period' | 'item_count' | 'expiry' | 'currency' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact_score: number;
  mitigation_suggestion: string;
}

export interface TenderEstimateMetricsDTO {
  total_items: number;
  total_amount: number;
  average_item_price: number;
  median_item_price: number;
  most_expensive_item?: TenderEstimateItemDTO;
  cheapest_item?: TenderEstimateItemDTO;
  category_breakdown: CategoryBreakdownDTO[];
  price_distribution: PriceDistributionDTO;
  complexity_score: number;
}

export interface CategoryBreakdownDTO {
  category: string;
  total_amount: number;
  item_count: number;
  percentage_of_total: number;
  average_item_price: number;
}

export interface PriceDistributionDTO {
  ranges: Array<{
    min_price: number;
    max_price: number;
    item_count: number;
    percentage: number;
  }>;
  standard_deviation: number;
  variance: number;
}

// ============= Validation DTOs =============
export interface TenderEstimateValidationDTO {
  is_valid: boolean;
  validation_score: number;
  errors: ValidationErrorDTO[];
  warnings: ValidationWarningDTO[];
  recommendations: string[];
  validation_date: string;
}

export interface ValidationErrorDTO {
  field: string;
  code: string;
  message: string;
  severity: 'error';
  suggested_fix: string;
}

export interface ValidationWarningDTO {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

// ============= Workflow DTOs =============
export interface TenderEstimateWorkflowDTO {
  estimate_id: string;
  current_status: TenderEstimateStatus;
  available_transitions: WorkflowTransitionDTO[];
  workflow_history: WorkflowHistoryDTO[];
  next_actions: WorkflowActionDTO[];
  approval_chain: ApprovalChainDTO[];
}

export interface WorkflowTransitionDTO {
  from_status: TenderEstimateStatus;
  to_status: TenderEstimateStatus;
  is_available: boolean;
  requirements: string[];
  restrictions: string[];
  estimated_processing_time: number; // in hours
}

export interface WorkflowHistoryDTO {
  id: string;
  action: string;
  from_status?: TenderEstimateStatus;
  to_status?: TenderEstimateStatus;
  performed_by: string;
  performed_at: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowActionDTO {
  action_type: 'submit' | 'review' | 'approve' | 'reject' | 'cancel' | 'resubmit';
  description: string;
  is_available: boolean;
  requirements: string[];
  estimated_time: number;
}

export interface ApprovalChainDTO {
  level: number;
  role: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  notes?: string;
}

// ============= Analytics DTOs =============
export interface TenderEstimateAnalyticsDTO {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  metrics: {
    total_estimates: number;
    total_value: number;
    average_value: number;
    success_rate: number; // accepted / submitted
    average_processing_time: number; // in hours
    rejection_rate: number;
    expiry_rate: number;
  };
  trends: AnalyticsTrendDTO[];
  forecasts: AnalyticsForecastDTO[];
  insights: AnalyticsInsightDTO[];
}

export interface AnalyticsTrendDTO {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage_change: number;
  confidence: number;
  factors: string[];
}

export interface AnalyticsForecastDTO {
  metric: string;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  time_horizon: string;
  accuracy_score: number;
}

export interface AnalyticsInsightDTO {
  type: 'opportunity' | 'risk' | 'efficiency' | 'quality';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggested_actions: string[];
  data_points: Array<{
    label: string;
    value: number;
    comparison?: number;
  }>;
}

// ============= Types and Enums =============
export type TenderEstimateStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ============= Utility DTOs =============
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SearchFiltersDTO {
  text?: string;
  filters: Record<string, any>;
  advanced_filters?: {
    date_range?: {
      field: string;
      start: string;
      end: string;
    };
    number_range?: {
      field: string;
      min: number;
      max: number;
    };
    enum_values?: {
      field: string;
      values: string[];
    };
  };
}

export interface ExportOptionsDTO {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  include_items: boolean;
  include_metrics: boolean;
  include_history: boolean;
  language: 'fr' | 'en';
  template?: string;
}

// ============= API Response DTOs =============
export interface TenderEstimateListResponseDTO {
  estimates: TenderEstimateDTO[];
  pagination: PaginationDTO;
  filters_applied: SearchFiltersDTO;
  sort_options: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface TenderEstimateDetailResponseDTO {
  estimate: TenderEstimateDTO;
  items: TenderEstimateItemDTO[];
  workflow: TenderEstimateWorkflowDTO;
  validation: TenderEstimateValidationDTO;
  analytics?: TenderEstimateAnalyticsDTO;
}

export interface TenderEstimateOperationResponseDTO {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    operation_id: string;
    processing_time: number;
    affected_records: number;
  };
}
