/**
 * Advanced Tender Estimate DTOs - Sophisticated Data Transfer Objects
 * Following hexagonal architecture with comprehensive business logic
 */

// ============= Core DTOs =============

export interface TenderEstimateItemDTO {
  id: string;
  estimateId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: string;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  formattedUnitPrice: string;
  formattedTotalPrice: string;
  pricePerUnitRatio: number;
}

// ============= Request DTOs =============
export interface CreateTenderEstimateRequestDTO {
  tenderId: string;
  submittedBy: string;
  currency: CurrencyCode;
  validityPeriod?: number;
  notes?: string;
  items?: CreateTenderEstimateItemRequestDTO[];
}

export interface CreateTenderEstimateItemRequestDTO {
  itemCode: string;
  dription?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  category?: string;
  specifications?: string;
}

export interface SubmitTenderEstimateRequestDTO {
  estimateId: string;
  submissionNotes?: string;
}

export interface ReviewTenderEstimateRequestDTO {
  estimateId: string;
  reviewDecision: 'accept' | 'reject';
  reviewNotes?: string;
  reviewerId: string;
}

// ============= Query DTOs =============
export interfa?: number;
  amountMax?: number;
  currency?: CurrencyCode;
  isExpired?: boolean;
  riskLevel?: RiskLevel;
  includeItems?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'submission_date' | 'totalAmount' |number;
  maxTotalPrice?: number;
  sortBy?: 'total_price' | 'quantity' | 'unit_price' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// ============= Response DTOs =============
export interface TenderEstighestAmount: number;
  lowestAmount: number;
  estimatesByCurrency: Record<CurrencyCode, number>;
  estimatesByRiskLevel: Record<RiskLevel, number>;
  expiredEstimates: number;
  expirienderEstimateDTO;
  estimate_2: TenderEstimateDTO;
  comparisonMetrics: {
    priceDifference: number;
    priceDifferencePercentage: number;
    itemCountDifference: number;
    riskLevelDifference: number;
  
  recommendation: string;
}

export interface TenderEstimateItemComparisonDTO {
  itemCode: string;
  Percentage: number;
  availabilityStatus: 'both' | 'estimate_1_only' | 'estimate_2_only' | 'neither';
}

// ============= Business Logic DTOs =============
export interface TenderEstimateRiskDTO {
  lev
  medianItemPrice: number;
  mostExpensiveItem?: TenderEstimateItemDTO;
  cheapestItem?: TenderEstimateItemDTO;
  categoryBreakdown: CategoryBreakdownDTO[];
  priceDistribution: PriceDistributionDTO;
  complexityScore: number;
}

export interface CategoryBreakdownDTO {
  category: string;
  totalAmount: number;
  itemCount: number;
  percentageOfTotal: number;
  averageItemPrice: number;
}

export interface PriceDistributionDTO {
  ranges: Array<{
    minPrice: number;
    maxPrice: number;
  lidationErrorDTO[];
  warnings: ValidationWarningDTO[];
  recommendations: string[];
  validationDate: string;
}

export interface ValidationErrorDTO {
  field: string;
  code: string;
  message: string;
  severity: 'error';
  suggestedFix: string;
}

export interface ValidationWarningDTO {
  field: string;
  toStatus: TenderEstimateStatus;
  isAvailable: boolean;
  requirements: string[];
  restrictions: string[];
  estimatedProcessingTime: number; // in hours
}

export interface WorkflowHistoryDTO {
  id: string;
  action: string;
  fromStatus?: TenderEstimateStatus;
  toStatus?: TenderEstimateStatus;
  performedBy: string;
  performedAt: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowActionDTO {
  actionType: 'submit' | 'review' | 'approve' | 'reject' | 'cancel' | 'resubmit';
  descriy' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  end_date: string;
  metrics: {
    totalEstimates: number;
    totalValue: number;
    averageValue: number;
    successRate: number; // accepted / submitted
    averageProcessingTime: number; // in hours
    rejectionRate: number;
    expiryRate: number;
  };
  trends: AnalyticsTrendDTO[];
  forecasts: AnalyticsForecastDTO[];
  i: number;
    upper: number;
  };
  timeHorizon: string;
  accuracyScore: number;
}

export interface AnalyticsInsightDTO {
  type: 'opportunity' | 'risk' | 'efficiency' | 'quality';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  dataPoints: Array<{
    label: string;
    value: number;
    comd' | 'rejected';
export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ========ilters: Record<string, any>;
  advancedFilters?: {
    dateRange?: {
      field: string;
      start: string;
      end: string;
    };
    numberRange?: {
      field: string;
      min: number;
      max: number;
    };
    enumValues?: {
      fielistResponseDTO {
  estimates: TenderEstimateDTO[];
  pagination: PaginationDTO;
  filtersApplied: SearchFiltersDTO;
  sort_options: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface TenderEstimateDetailResponseDTO {
  estimate: TenderEstimateDTO;
  items: TenderEstimateItemDTO[];
  workflow: TenderEstimateWorkflowDTO;
 lean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    operationId: string;
    processingTime: number;
    affectedR