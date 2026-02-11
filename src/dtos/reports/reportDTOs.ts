/**
 * Report DTOs - Data-Centric Reporting Architecture
 * Centralized DTOs for all reporting operations following hexagonal principles
 */

// Import all reporting-related DTOs from entities
import { TenderDTO } from '@/dtos/entities/TenderDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

// Import additional DTOs from ProjectReportDTO
import { 
  CostCalculation,
  EnhancedPhaseDTO,
  NotificationMetadata,
  NotificationType,
  TaskType,
  TaskAssignment,
  Notification,
  RiskItemDTO,
  MilestoneDTO,
  PerformanceMetricsDTO
} from '@/dtos/entities/ProjectReportDTO';

// Import remaining DTOs from ProjectReportDTO
import {
  ProjectAnalyticsDTO,
  ProgressMetricsDTO,
  BudgetMetricsDTO,
  ScheduleMetricsDTO,
  QualityMetricsDTO,
  RiskAssessmentDTO,
  IdentifiedRiskDTO,
  RiskMatrixDTO,
  MitigationStrategyDTO,
  ComplianceReportDTO,
  ComplianceItemDTO,
  ComplianceRecommendationDTO,
  ComplianceHistoryDTO,
  DocumentSummaryDTO,
  DocumentSummaryItemDTO,
  ProjectHealthScoreDTO,
  ConstructionMilestoneDTO,
  PhaseStepDTO,
  PhaseTaskDTO,
  PhaseMilestoneDTO,
  TrendDataDTO,
  ComparisonDataDTO,
  VarianceAnalysisDTO,
  VarianceCauseDTO,
  FinancialProjectionDTO,
  CashFlowDataDTO
} from '@/dtos/entities/ProjectReportDTO';

// =================== BASE REPORT DTOs ===================

export interface ReportData {
  id: string;
  title: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  projectId: string;
  reportType: 'summary' | 'detailed' | 'financial' | 'risk_assessment' | 'compliance' | 'analytics';
  status: 'generating' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
}

export interface ProjectReportDTO {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  generatedAt: string;
  reportType: string;
  version: string;
  
  // Core project data
  projectInfo: {
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate: string;
    endDate?: string;
    budget: number;
    progress: number;
    manager?: string;
    client?: string;
  };
  
  // Phases data
  phases?: EnhancedPhaseDTO[];
  
  // Milestones data
  milestones?: ConstructionMilestoneDTO[];
  
  // Analytics data
  analytics?: {
    progressMetrics: ProgressMetricsDTO;
    budgetMetrics: BudgetMetricsDTO;
    scheduleMetrics: ScheduleMetricsDTO;
    qualityMetrics: QualityMetricsDTO;
    trends?: TrendDataDTO[];
    comparisons?: ComparisonDataDTO;
  };
  
  // Financial data
  financials?: {
    totalBudget: number;
    spentAmount: number;
    remainingBudget: number;
    costVariance: number;
    projectedCompletion?: string;
    projectedOverrun?: number;
    cashFlow?: CashFlowDataDTO[];
    varianceAnalysis?: VarianceAnalysisDTO;
  };
  
  // Risk data
  risks?: {
    identifiedRisks: IdentifiedRiskDTO[];
    riskMatrix: RiskMatrixDTO;
    mitigationStrategies: MitigationStrategyDTO[];
    overallRiskScore: number;
  };
  
  // Documents data
  documents?: {
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsByStatus: Record<string, number>;
    recentDocuments: DocumentSummaryItemDTO[];
    expiredDocuments: DocumentSummaryItemDTO[];
    pendingApproval: DocumentSummaryItemDTO[];
    totalSize: number;
    averageSize: number;
    largestDocument: DocumentSummaryItemDTO[];
    complianceScore: number;
    missingDocuments: string[];
    recommendations: string[];
  };
  
  // Compliance data
  compliance?: {
    overallScore: number;
    grade: string;
    complianceItems: ComplianceItemDTO[];
    recommendations: ComplianceRecommendationDTO[];
    historicalData: ComplianceHistoryDTO[];
  };
}

// =================== ANALYTICS DTOs ===================

export interface ProjectAnalyticsDTO {
  projectId: string;
  generatedAt: string;
  timeRange: string;
  
  progressMetrics: ProgressMetricsDTO;
  budgetMetrics: BudgetMetricsDTO;
  scheduleMetrics: ScheduleMetricsDTO;
  qualityMetrics: QualityMetricsDTO;
  
  trends?: TrendDataDTO[];
  comparisons?: ComparisonDataDTO;
  filteredData?: any;
}

export interface ProgressMetricsDTO {
  completionRate: number;
  onTimeDeliveryRate: number;
  taskCompletionRate: number;
  phaseProgressRate: number;
  overallProgress: number;
  milestonesCompleted: number;
  milestonesTotal: number;
}

export interface BudgetMetricsDTO {
  utilizationRate: number;
  burnRate: number;
  projectedCompletion?: string;
  projectedOverrun?: number;
  projectionConfidence: number;
  costEfficiency: number;
  variancePercentage: number;
}

export interface ScheduleMetricsDTO {
  adherenceRate: number;
  averageDelay: number;
  onTimeMilestones: number;
  totalMilestones: number;
  criticalPathVariance: number;
  schedulePerformanceIndex: number;
}

export interface QualityMetricsDTO {
  overallScore: number;
  defectRate: number;
  reworkRate: number;
  inspectionPassRate: number;
  customerSatisfactionScore?: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
}

// =================== FINANCIAL DTOs ===================

export interface FinancialMetricsDTO {
  projectId: string;
  generatedAt: string;
  
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
  
  varianceAnalysis?: VarianceAnalysisDTO;
  projections?: FinancialProjectionDTO;
  cashFlow?: CashFlowDataDTO[];
}

export interface VarianceAnalysisDTO {
  budgetVariance: number;
  scheduleVariance: number;
  scopeVariance: number;
  overallVariance: number;
  varianceTrend: 'improving' | 'stable' | 'worsening';
  causes: VarianceCauseDTO[];
}

export interface FinancialProjectionDTO {
  projectedCompletion: string;
  projectedOverrun: number;
  confidence: number;
  bestCase: number;
  worstCase: number;
  expectedCase: number;
}

export interface CashFlowDataDTO {
  period: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeBalance: number;
  projectedVsActual: number;
}

// =================== RISK DTOs ===================

export interface RiskAssessmentDTO {
  projectId: string;
  generatedAt: string;
  assessmentScope: string;
  
  identifiedRisks: IdentifiedRiskDTO[];
  riskMatrix: RiskMatrixDTO;
  mitigationStrategies: MitigationStrategyDTO[];
  overallRiskScore: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface IdentifiedRiskDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  status: 'identified' | 'mitigated' | 'accepted' | 'monitoring';
  identifiedDate: string;
  mitigation?: MitigationStrategyDTO;
}

export interface RiskMatrixDTO {
  low: string[];
  medium: string[];
  high: string[];
  critical: string[];
  overallStrategy: string;
}

export interface MitigationStrategyDTO {
  riskId: string;
  strategy: string;
  description: string;
  estimatedCost: number;
  timeline: string;
  owner: string;
  status: 'planned' | 'in_progress' | 'completed';
  effectiveness?: number;
}

// =================== COMPLIANCE DTOs ===================

export interface ComplianceReportDTO {
  projectId: string;
  generatedAt: string;
  assessmentPeriod: string;
  
  overallScore: number;
  grade: string;
  complianceItems: ComplianceItemDTO[];
  recommendations: ComplianceRecommendationDTO[];
  historicalData: ComplianceHistoryDTO[];
}

export interface ComplianceItemDTO {
  id: string;
  type: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  lastAssessed: string;
  evidence?: string[];
  notes?: string;
}

export interface ComplianceRecommendationDTO {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommendation: string;
  description: string;
  estimatedEffort: string;
  dueDate?: string;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ComplianceHistoryDTO {
  assessmentDate: string;
  score: number;
  grade: string;
  assessor: string;
  changes: ComplianceChangeDTO[];
}

export interface ComplianceChangeDTO {
  field: string;
  oldValue: string | number;
  newValue: string | number;
  changeDate: string;
  reason: string;
}

// =================== DOCUMENT DTOs ===================

export interface DocumentSummaryDTO {
  projectId: string;
  generatedAt: string;
  
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  
  recentDocuments: DocumentSummaryItemDTO[];
  expiredDocuments: DocumentSummaryItemDTO[];
  pendingApproval: DocumentSummaryItemDTO[];
  
  totalSize: number;
  averageSize: number;
  largestDocument: DocumentSummaryItemDTO[];
  
  complianceScore: number;
  missingDocuments: string[];
  recommendations: string[];
}

export interface DocumentSummaryItemDTO {
  id: string;
  title: string;
  type: string;
  status: string;
  size: number;
  createdAt: string;
  lastModified: string;
  owner?: string;
  url?: string;
}

// =================== HEALTH SCORE DTOs ===================

export interface ProjectHealthScoreDTO {
  projectId: string;
  calculatedAt: string;
  
  overallScore: number;
  grade: string;
  
  progressScore: number;
  budgetScore: number;
  scheduleScore: number;
  qualityScore: number;
  
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

// =================== ENHANCED PHASE DTOs ===================

export interface EnhancedPhaseDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  
  steps?: PhaseStepDTO[];
  tasks?: PhaseTaskDTO[];
  milestones?: PhaseMilestoneDTO[];
  
  metrics: {
    completionRate: number;
    averageDuration: number;
    onTimeDelivery: boolean;
    qualityScore: number;
  };
}

export interface PhaseStepDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string[];
  dependencies?: string[];
  
  tasks?: PhaseTaskDTO[];
  deliverables?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface PhaseTaskDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  
  dependencies?: string[];
  deliverables?: string[];
  qualityScore?: number;
}

export interface PhaseMilestoneDTO {
  id: string;
  title: string;
  description?: string;
  type: 'project' | 'phase' | 'delivery' | 'acceptance' | 'payment';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  
  targetDate: string;
  actualDate?: string;
  completedAt?: string;
  
  progress: number;
  budget?: number;
  actualCost?: number;
  
  dependencies?: string[];
  deliverables?: string[];
  acceptanceCriteria?: string[];
  
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  
  metadata?: Record<string, unknown>;
}

// =================== UTILITY DTOs ===================

export interface TrendDataDTO {
  period: string;
  value: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ComparisonDataDTO {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  variance: number;
  variancePercentage: number;
  percentile: number;
  comparison: 'above_average' | 'average' | 'below_average';
}

export interface VarianceCauseDTO {
  category: 'scope' | 'schedule' | 'budget' | 'resource' | 'quality';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  rootCause: string;
  correctiveAction: string;
}

// =================== COST CALCULATION DTOs ===================

export interface CostCalculation {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
  efficiency: number;
  projectedCompletion: string;
  projectedOverrun: number;
}

// Base DTOs pour les rapports
export interface BaseReportConfig {
  title: string;
  recipientEmail?: string;
  includeHeader: boolean;
  includeFooter: boolean;
  includeSignature: boolean;
  notes?: string;
  template?: string;
  customFields?: Record<string, string | number | boolean>;
}

// DTOs pour les rapports d'inspection
export interface InspectionReportConfig extends BaseReportConfig {
  includeFindings: boolean;
  includeMetrics: boolean;
  includePhotos: boolean;
  includeRecommendations: boolean;
  filterBySeverity?: ('low' | 'medium' | 'high' | 'critical')[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// DTOs pour les rapports de paiements fournisseurs
export interface SupplierPaymentReportConfig extends BaseReportConfig {
  includePaymentDetails: boolean;
  includePaymentHistory: boolean;
  includeOutstandingPayments: boolean;
  includeTaxSummary: boolean;
  groupByCategory?: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  currency?: string;
  includeGraphs?: boolean;
}

export interface PaymentMetricsDTO {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number; // en jours
  paymentRate: number; // pourcentage
  overdueRate: number; // pourcentage
  categoryBreakdown: Record<string, number>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// DTOs pour les rapports d'appels d'offres
export interface TenderReportConfig extends BaseReportConfig {
  includeRequirements: boolean;
  includeEvaluationCriteria: boolean;
  includeSubmissions: boolean;
  includeTimeline: boolean;
  includeBudget: boolean;
  includeStatistics: boolean;
  submissionStatus?: 'all' | 'submitted' | 'evaluated' | 'awarded';
}

export interface TenderMetricsDTO {
  totalSubmissions: number;
  evaluatedSubmissions: number;
  awardedSubmissions: number;
  averageScore: number;
  budgetUtilization?: number;
  submissionRate: number;
  evaluationCompletionRate: number;
  categoryBreakdown?: Record<string, number>;
}

// DTOs pour les devis quantitatifs
export interface TenderEstimateDTO {
  id: string;
  title: string;
  reference?: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  currency: string;
  taxRate: number;
  overheadPercentage: number;
  profitMarginPercentage: number;
  validUntil: Date;
  tenderId: string;
  tender: ApplicationTenderDTO;
  items: TenderEstimateItemDTO[];
  totals: TenderEstimateTotalsDTO;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderEstimateItemDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'material' | 'labor' | 'equipment' | 'other';
  unit?: string;
  materialId?: string;
  specifications?: string;
  notes?: string;
}

export interface TenderEstimateTotalsDTO {
  subtotal: number;
  taxAmount: number;
  overheadAmount: number;
  profitAmount: number;
  finalTotal: number;
  materialsCost: number;
  laborCost: number;
  equipmentCost: number;
  otherCost: number;
}

export interface TenderEstimateConfig extends BaseReportConfig {
  includeCompanyHeader: boolean;
  includeItemDetails: boolean;
  includePriceBreakdown: boolean;
  includeTermsConditions: boolean;
  termsConditions: string;
  recipientEmail?: string;
  notes?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  validityPeriod: number; // en jours
}

// Types d'union pour les props des composants
export type ReportProps = 
  | { type: 'inspection'; data: ApplicationInspectionDTO; config?: InspectionReportConfig }
  | { type: 'payment'; data: ApplicationSupplierDTO; payments: ApplicationPaymentDTO[]; config?: SupplierPaymentReportConfig }
  | { type: 'tender'; data: ApplicationTenderDTO; config?: TenderReportConfig }
  | { type: 'estimate'; data: TenderEstimateDTO; config?: TenderEstimateConfig };

// Types pour les callbacks
export type ReportCallback = (result: ReportGenerationResultDTO) => void;
export type ReportProgressCallback = (progress: number) => void;

// Types pour les résultats de génération
export interface ReportGenerationResultDTO {
  success: boolean;
  reportId?: string;
  fileName?: string;
  blob?: Blob;
  downloadUrl?: string;
  error?: string;
  metadata?: ReportMetadataDTO;
}

export interface ReportMetadataDTO {
  id: string;
  type: 'inspection' | 'payment' | 'tender' | 'estimate';
  title: string;
  description?: string;
  generatedAt: Date;
  generatedBy: string;
  version: string;
  format: 'pdf' | 'excel';
  size?: number; // en bytes
  downloadUrl?: string;
  tags?: string[];
}

// Exportation des DTOs existants - 100% correspondance avec les entités de domaine
export type { ApplicationTenderDTO as TenderDTO };
export type { ApplicationSupplierDTO as SupplierDTO };
export type { ApplicationPaymentDTO as PaymentDTO };
export type { ApplicationInspectionDTO as InspectionDTO };
export type { ApplicationProjectDTO as ProjectDTO };
export type { ApplicationDocumentDTO as DocumentDTO };
export type { ApplicationEmployeeDTO as EmployeeDTO };
export type { ApplicationMaterialDTO as MaterialDTO };
