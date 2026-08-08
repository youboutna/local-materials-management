/**
 * Canonical base DTOs for the "project-centric" report cluster.
 * These are the shared sub-types that were previously duplicated
 * identically (or near-identically) across:
 *  - src/dtos/entities/ReportDTO.ts
 *  - src/dtos/types/reportTypes.ts
 *
 * Both of the above now re-export these canonical types for
 * backward compatibility (Rule R014 — de-duplication).
 */

import { RiskDTO } from '@/dtos/entities/RiskDTO';

// =================== PROJECT REPORT DTOs ===================

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
  completionDate?: Date;
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

// =================== FINANCIAL DTOs ===================

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

export interface FinancialMetricsDTO {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costOverrun: number;
  paymentMilestones: PaymentMilestoneDTO[];
  bankGuarantees: BankGuaranteeDTO[];
  insuranceCoverage: InsuranceCoverageDTO[];
}

// =================== RISK DTOs ===================

export interface RiskItemDTO {
  id: string;
  category: 'financial' | 'technical' | 'environmental' | 'regulatory' | 'schedule';
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
}

// Superset: allow either the legacy domain RiskDTO or the lighter
// RiskItemDTO shape produced by report transformers.
export interface RiskAssessmentDTO {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: RiskDTO[] | RiskItemDTO[];
  mitigationStrategies: MitigationStrategyDTO[];
}

// Superset of the two previously-duplicated MitigationStrategyDTO shapes.
export interface MitigationStrategyDTO {
  id: string;
  riskId: string;
  strategy: string;
  implementationDate: Date;
  effectiveness?: number; // 0-100
  status: 'planned' | 'implementing' | 'in_progress' | 'completed';

  // Extra fields present in the richer variant
  description?: string;
  estimatedCost?: number;
  timeline?: string;
  owner?: string;
}

// =================== PROJECT REPORT DTO ===================

export interface ProjectReportDTOBase {
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

// =================== COST CALCULATION ===================

// Superset of the two previously-duplicated CostCalculation shapes.
export interface CostCalculation {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
  // Extra fields present in the richer variant
  efficiency?: number;
  projectedCompletion?: string;
  projectedOverrun?: number;
}
