/**
 * Report DTOs - Data Transfer Objects for Reporting
 * Centralized types for all reporting operations following hexagonal architecture
 */

// Add imports
import { ProjectData } from './ProjectDTO';

// =================== CANONICAL SHARED TYPES (re-exported) ===================
export type {
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  PaymentMilestoneDTO,
  BankGuaranteeDTO,
  InsuranceCoverageDTO,
  RiskItemDTO,
  RiskAssessmentDTO,
  MitigationStrategyDTO,
  CostCalculation,
} from '@/dtos/reports/reportBaseDTOs';

import type {
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
} from '@/dtos/reports/reportBaseDTOs';

// =================== BASE REPORT TYPES ===================

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
  // Core project data
  project: ProjectData;

  // Enhanced phases data
  phases: EnhancedPhaseDTO[];

  // Construction milestones data
  constructionMilestones: ConstructionMilestoneDTO[];

  // Analytics data from Waterfall components
  analytics: ProjectAnalyticsDTO;

  // Financial metrics
  financialMetrics: FinancialMetricsDTO;

  // Risk assessment
  riskAssessment: RiskAssessmentDTO;
}

// =================== ANALYTICS DTOs ===================

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
  criticalIssuesCount: number;
  resolvedIssuesCount: number;
  averageInspectionScore: number;
}

// =================== FINANCIAL DTOs ===================

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
  mitigation?: import('@/dtos/reports/reportBaseDTOs').MitigationStrategyDTO;
}

export interface RiskMatrixDTO {
  low: string[];
  medium: string[];
  high: string[];
  critical: string[];
  overallStrategy: string;
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
  largestDocument: DocumentSummaryItemDTO;
  
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

// =================== PHASE STEP/TASK/MILESTONE DTOs ===================

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
  status: string;
  targetDate: string;
  actualDate?: string;
  completedAt?: string;
  
  deliverables?: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

// =================== UTILITY DTOs ===================

export interface VarianceCauseDTO {
  category: 'scope' | 'schedule' | 'budget' | 'resource' | 'quality';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  rootCause: string;
  correctiveAction: string;
}

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
