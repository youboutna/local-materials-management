/**
 * Advanced Tender Estimate DTOs - Sophisticated Data Transfer Objects
 * Following hexagonal architecture with comprehensive business logic
 */

// ============= Core DTOs =============
export interface TenderEstimateDTO {
  // Core fields
  id: string;
  tenderId: string;
  submittedBy: string;
  submissionDate: string;
  status: TenderEstimateStatus;
  totalAmount: number;
  currency: CurrencyCode;
  validityPeriod: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Computed fields (calculated by domain)
  displayName: string;
  formattedTotalAmount: string;
  expiryDate: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  canBeEdited: boolean;
  canBeSubmitted: boolean;
  canBeReviewed: boolean;
  canBeAccepted: boolean;
  canBeRejected: boolean;
  isFinalized: boolean;

  // Business metrics
  riskAssessment: TenderEstimateRiskDTO;
  metrics: TenderEstimateMetricsDTO;
}

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
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  specifications?: string;
}

export interface UpdateTenderEstimateRequestDTO {
  status?: TenderEstimateStatus;
  currency?: CurrencyCode;
  validityPeriod?: number;
  notes?: string;
  rejectionReason?: string;
}

export interface UpdateTenderEstimateItemRequestDTO {
  itemCode?: string;
  description?: string;
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
export interface GetTenderEstimatesQueryDTO {
  tenderId?: string;
  submittedBy?: string;
  status?: TenderEstimateStatus | TenderEstimateStatus[];
  submissionDateFrom?: string;
  submissionDateTo?: string;
  amountMin?: number;
  amountMax?: number;
  currency?: CurrencyCode;
  isExpired?: boolean;
  riskLevel?: RiskLevel;
  includeItems?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'submissionDate' | 'totalAmount' | 'expiryDate' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
}

export interface GetTenderEstimateItemsQueryDTO {
  estimateId: string;
  category?: string;
  itemCode?: string;
  minTotalPrice?: number;
  maxTotalPrice?: number;
  sortBy?: 'totalPrice' | 'quantity' | 'unitPrice' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// ============= Response DTOs =============
export interface TenderEstimateStatsDTO {
  totalEstimates: number;
  estimatesByStatus: Record<TenderEstimateStatus, number>;
  totalValue: number;
  averageAmount: number;
  medianAmount: number;
  highestAmount: number;
  lowestAmount: number;
  estimatesByCurrency: Record<CurrencyCode, number>;
  estimatesByRiskLevel: Record<RiskLevel, number>;
  expiredEstimates: number;
  expiringSoonEstimates: number; // Within 7 days
  submissionTrend: Array<{
    date: string;
    count: number;
    totalValue: number;
  }>;
}

export interface TenderEstimateComparisonDTO {
  estimate1: TenderEstimateDTO;
  estimate2: TenderEstimateDTO;
  comparisonMetrics: {
    priceDifference: number;
    priceDifferencePercentage: number;
    itemCountDifference: number;
    riskLevelDifference: number;
    validityPeriodDifference: number;
  };
  itemComparisons: TenderEstimateItemComparisonDTO[];
  recommendation: string;
}

export interface TenderEstimateItemComparisonDTO {
  itemCode: string;
  description: string;
  estimate1Item?: TenderEstimateItemDTO;
  estimate2Item?: TenderEstimateItemDTO;
  priceDifference: number;
  priceDifferencePercentage: number;
  availabilityStatus: 'both' | 'estimate1Only' | 'estimate2Only' | 'neither';
}

// ============= Business Logic DTOs =============
export interface TenderEstimateRiskDTO {
  level: RiskLevel;
  score: number;
  factors: RiskFactorDTO[];
  assessmentDate: string;
  recommendedActions: string[];
}

export interface RiskFactorDTO {
  type: 'amount' | 'validityPeriod' | 'itemCount' | 'expiry' | 'currency' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impactScore: number;
  mitigationSuggestion: string;
}

export interface TenderEstimateMetricsDTO {
  totalItems: number;
  totalAmount: number;
  averageItemPrice: number;
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
    itemCount: number;
    percentage: number;
  }>;
  standardDeviation: number;
  variance: number;
}

// ============= Validation DTOs =============
export interface TenderEstimateValidationDTO {
  isValid: boolean;
  validationScore: number;
  errors: ValidationErrorDTO[];
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
  code: string;
  message: string;
  severity: 'warning';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

// ============= Workflow DTOs =============
export interface TenderEstimateWorkflowDTO {
  estimateId: string;
  currentStatus: TenderEstimateStatus;
  availableTransitions: WorkflowTransitionDTO[];
  workflowHistory: WorkflowHistoryDTO[];
  nextActions: WorkflowActionDTO[];
  approvalChain: ApprovalChainDTO[];
}

export interface WorkflowTransitionDTO {
  fromStatus: TenderEstimateStatus;
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
  description: string;
  isAvailable: boolean;
  requirements: string[];
  estimatedTime: number;
}

export interface ApprovalChainDTO {
  level: number;
  role: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  notes?: string;
}

// ============= Analytics DTOs =============
export interface TenderEstimateAnalyticsDTO {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
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
  insights: AnalyticsInsightDTO[];
}

export interface AnalyticsTrendDTO {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  confidence: number;
  factors: string[];
}

export interface AnalyticsForecastDTO {
  metric: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
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
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchFiltersDTO {
  text?: string;
  filters: Record<string, any>;
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
      field: string;
      values: string[];
    };
  };
}

export interface ExportOptionsDTO {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeItems: boolean;
  includeMetrics: boolean;
  includeHistory: boolean;
  language: 'fr' | 'en';
  template?: string;
}

// ============= API Response DTOs =============
export interface TenderEstimateListResponseDTO {
  estimates: TenderEstimateDTO[];
  pagination: PaginationDTO;
  filtersApplied: SearchFiltersDTO;
  sortOptions: {
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
    operationId: string;
    processingTime: number;
    affectedRecords: number;
  };
}
