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
number;
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
  qualityTrend: 'improving' | 'stable' | 'declentAmount: number;
  remainingBudget: number;
  costOverrun: number;
  paymentMilestones: PaymentMilestoneDTO[];
  bankGuarantees: BankGuaranteeDTO[];
  insuranceCoverage: InsuranceCoverageDTO[];
}

export interface VarianceAnalysisDTO {
  bnDTO {
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
  outfloow' | 'medium' | 'high' | 'critical';
  risks: RiskDTO[];
  mitigationStrategies: MitigationStrategyDTO[];
}

export interface RiskItemDTO {
  id: string;
  category: 'financial' | 'technical' | 'environmental' | ory: string;
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
  overallStratess?: number;
  implementationDate: Date;
}

// =================== COMPLIANCE DTOs ===================

export interface ComplianceReportDTO {
  projectId: string;
  generatedAt: string;
  assessmentPeriod: string;
  
  overallScore: number;
  grade: string;
  comptus: 'compliant' | 'nonCompliant' | 'partial';
  score: number;
  lastAssessed: string;
  evidence?: string[];
  notes?: string;
}

export interface ComplianceRecommendationDTO {
  priority: 'low' | 'medium' | 'high' | 'critical';
  ';
}

export interface ComplianceHistoryDTO {
  assessmentDate: string;
  score: number;
  grade: string;
  assessor: string;
  changes: ComplianceChangeDTO[];
}

export interface ComplianceCDTOs ===================

export interface DocumentSummaryDTO {
  projectId: string;
  generatedAt: string;
  
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;er;
  averageSize: number;
  largestDocument: DocumentSummaryItemDTO;
  
  complianceScore: number;
  missingDocuments: string[];
  recommendations: string[];
}

 string;
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

exportstoneDTO;
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
  deliring;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimstring;
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
  completionDate?: Date;
  staage: number;
  blockers: string[];
  dependencies: string[];
}

// =================== UTILITY DTOs ===================

export interface VarianceCauseDTO {
  category: 'scope' | 'schedule' | 'budget' | 'resource' | 'quality';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'ct interface ComparisonDataDTO {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  variance: number;
  variancePercentage: number;
  percentile: number;
  comparison: 'aboveAverage' | 'average' | 'below_averaDate;
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

// =========dget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
  efficiency: number;
  projectedCompletion: string;
  projectedOverrun: