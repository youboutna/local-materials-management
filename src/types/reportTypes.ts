// Data Transfer Objects for enhanced project reporting
import { ProjectData } from '@/types/project';

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

export interface FinancialMetricsDTO {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costOverrun: number;
  paymentMilestones: PaymentMilestoneDTO[];
  bankGuarantees: BankGuaranteeDTO[];
  insuranceCoverage: InsuranceCoverageDTO[];
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

export interface RiskAssessmentDTO {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: RiskItemDTO[];
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

export interface MitigationStrategyDTO {
  id: string;
  riskId: string;
  strategy: string;
  implementationDate: Date;
  effectiveness: number; // 0-100
  status: 'planned' | 'implementing' | 'completed';
}
// Interfaces for our transformed data
export interface ReportData {
  id: string;
  projectId: string;
  generatedAt: Date;
  financialSummary: FinancialSummary;
  taskProgress: TaskProgress[];
  riskAssessment: RiskAssessment[];
}

interface FinancialSummary {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
}

interface TaskProgress {
  taskId: string;
  name: string;
  progress: number;
  status: string;
}

interface RiskAssessment {
  id: string;
  title: string;
  severity: string;
  status: string;
}

export interface CostCalculation {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
}