/**
 * Report DTOs - Data Transfer Objects for Reporting
 * Centralized types for all reporting operations following hexagonal architecture
 */

// Add imports
import { ProjectData } from './ProjectDTO';
import { RiskDTO } from './RiskDTO';

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

export interface ProjectAnalyticsDTO {
  // EVM Metrics from Waterfall tab
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;

  // Performance indicators
  onTimePerformance: number;
  budgetVariance: number;
  qualityScore: number;
  teamEfficiency: number;
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
  criticalIssuesCount: number;
  resolvedIssuesCount: number;
  averageInspectionScore: number;
}

// =================== FINANCIAL DTOs ===================

export interface FinancialMetricsDTO {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costOverrun: number;
  paymentMilestones: PaymentMilestoneDTO[];
  bankGuarantees: BankGuaranteeDTO[];
  insuranceCoverage: InsuranceCoverageDTO[];
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
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: RiskDTO[];
  mitigationStrategies: MitigationStrategyDTO[];
}

export interface RiskItemDTO {
  id: string;
  category: 'financial' | 'technical' | 'environmental' | 'regulatory' | 'schedule';
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
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
  id: string;
  riskId: string;
  strategy: string;
  description: string;
  estimatedCost: number;
  timeline: string;
  owner: string;
  status: 'planned' | 'in_progress' | 'completed';
  effectiveness?: number;
  implementationDate: Date;
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

// =================== ENHANCED PHASE DTOs ===================

export interface EnhancedPhaseDTO {
  id: string;
  name: string;
  plannedProgress: number;
  actualProgress: number;
  budget: number;
  actualCost: number;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  procurementStep: string;
  projectId: string;

  // Enhanced data
  milestone?: ConstructionMilestoneDTO;
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: string[];
  assignedTeam: string[];
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
  status: string;
  targetDate: string;
  actualDate?: string;
  completedAt?: string;
  
  deliverables?: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

// =================== CONSTRUCTION MILESTONE DTOs ===================

export interface ConstructionMilestoneDTO {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  projectId: string;
  phaseId?: string;

  // Enhanced milestone data
  stage: 'conception' | 'preparation' | 'execution' | 'validation' | 'livraison';
  priority: 'low' | 'medium' | 'high' | 'critical';
  completionPercentage: number;
  blockers: string[];
  dependencies: string[];
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

export interface PaymentMilestoneDTO {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

export interface BankGuaranteeDTO {
  id: string;
  type: string;
  amount: number;
  issueDate: Date;
  expiryDate: Date;
  bankName: string;
  status: 'active' | 'expired' | 'claimed';
}

export interface InsuranceCoverageDTO {
  id: string;
  type: string;
  coverage: number;
  provider: string;
  validFrom: Date;
  validUntil: Date;
  status: 'active' | 'expired';
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
