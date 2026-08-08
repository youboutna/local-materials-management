//types/reportTypes.ts
// Data Transfer Objects for enhanced project reporting
import { ProjectData } from '@/dtos/types/project';

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
