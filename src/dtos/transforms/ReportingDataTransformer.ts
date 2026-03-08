/**
 * Reporting Data Transformers
 * Ensures proper UI->DB round-trip for reporting data following hexagonal architecture
 */

import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

// Reporting-specific DTOs
export interface ProjectReportDTO {
  project: ProjectDTO;
  phases: PhaseDTO[];
  constructionMilestones: ConstructionMilestoneDTO[];
  analytics: ProjectAnalyticsDTO;
  financialMetrics: FinancialMetricsDTO;
  riskAssessment: RiskAssessmentDTO;
}

export interface ConstructionMilestoneDTO {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  projectId: string;
  phaseId?: string;
  stage: string;
  priority: 'high' | 'medium' | 'low';
  completionPercentage: number;
  blockers: string[];
  dependencies: string[];
}

export interface ProjectAnalyticsDTO {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
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
  phaseId?: string;
  contractorId?: string;
  contractorName?: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  description: string;
}

export interface BankGuaranteeDTO {
  id: string;
  projectId: string;
  contractorId: string;
  bankName: string;
  guaranteeAmount: number;
  guaranteeType: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'claimed' | 'released' | 'suspended';
  documents: string[];
  notes?: string;
}

export interface InsuranceCoverageDTO {
  id: string;
  projectId: string;
  insuranceType: string;
  provider: string;
  coverageAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  documents: string[];
  notes?: string;
}

export interface RiskAssessmentDTO {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: RiskDTO[];
  mitigationStrategies: MitigationStrategyDTO[];
}

export interface MitigationStrategyDTO {
  riskId: string;
  strategy: string;
  assignedTo?: string;
  dueDate?: Date;
  status: 'planned' | 'in_progress' | 'completed';
}

/**
 * Transformer class for reporting data
 * Converts between different data formats for UI->DB round-trip
 */
export class ReportingDataTransformer {
  /**
   * Transform project data for reporting
   */
  static transformProjectForReport(project: ProjectDTO): ProjectReportDTO {
    // Create default analytics if not available
    const analytics: ProjectAnalyticsDTO = {
      schedulePerformanceIndex: 1.0,
      costPerformanceIndex: 1.0,
      earnedValue: 0,
      plannedValue: project.budget || 0,
      actualCost: 0,
      budgetAtCompletion: project.budget || 0,
      estimateAtCompletion: project.budget || 0,
      estimateToComplete: project.budget || 0,
      varianceAtCompletion: 0,
      onTimePerformance: 100,
      budgetVariance: 0,
      qualityScore: 100,
      teamEfficiency: 100
    };

    // Create default financial metrics
    const financialMetrics: FinancialMetricsDTO = {
      totalBudget: project.budget || 0,
      spentAmount: 0,
      remainingBudget: project.budget || 0,
      costOverrun: 0,
      paymentMilestones: [],
      bankGuarantees: [],
      insuranceCoverage: []
    };

    // Create default risk assessment
    const riskAssessment: RiskAssessmentDTO = {
      overallRiskLevel: 'low',
      risks: [],
      mitigationStrategies: []
    };

    return {
      project,
      phases: [], // Will be populated from repository
      constructionMilestones: [], // Will be populated from repository
      analytics,
      financialMetrics,
      riskAssessment
    };
  }

  /**
   * Transform phases for reporting
   */
  static transformPhasesForReport(phases: PhaseDTO[]): PhaseDTO[] {
    return phases.map(phase => ({
      ...phase,
      // Ensure all required fields are present
      progress: phase.progress || 0,
      estimatedCost: phase.estimatedCost || 0,
      actualCost: phase.actualCost || 0,
      startDate: phase.startDate || new Date().toISOString(),
      endDate: phase.endDate || new Date().toISOString()
    }));
  }

  /**
   * Transform milestones for reporting
   */
  static transformMilestonesForReport(milestones: any[]): ConstructionMilestoneDTO[] {
    return milestones.map(milestone => ({
      id: milestone.id || '',
      title: milestone.title || 'Untitled Milestone',
      description: milestone.description || '',
      targetDate: new Date(milestone.targetDate || Date.now()),
      completedDate: milestone.completedDate ? new Date(milestone.completedDate) : undefined,
      status: milestone.status || 'pending',
      projectId: milestone.projectId || '',
      phaseId: milestone.phaseId,
      stage: milestone.stage || 'unknown',
      priority: milestone.priority || 'medium',
      completionPercentage: milestone.completionPercentage || 0,
      blockers: milestone.blockers || [],
      dependencies: milestone.dependencies || []
    }));
  }

  /**
   * Transform financial metrics for reporting
   */
  static transformFinancialMetricsForReport(
    payments: PaymentDTO[],
    budget: number
  ): FinancialMetricsDTO {
    const spentAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
      totalBudget: budget,
      spentAmount,
      remainingBudget: budget - spentAmount,
      costOverrun: spentAmount > budget ? spentAmount - budget : 0,
      paymentMilestones: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount || 0,
        phaseId: payment.phaseId,
        contractorId: payment.contractorId,
        contractorName: payment.contractorName,
        status: this.mapPaymentStatus(payment.status || 'pending'),
        dueDate: new Date(payment.paymentDate || Date.now()),
        paidDate: payment.status === 'paid' ? new Date(payment.paymentDate) : undefined,
        description: `Payment for ${payment.contractorName}`
      })),
      bankGuarantees: [], // Will be populated from bank guarantee repository
      insuranceCoverage: [] // Will be populated from insurance repository
    };
  }

  /**
   * Transform risk assessment for reporting
   */
  static transformRiskAssessmentForReport(risks: RiskDTO[]): RiskAssessmentDTO {
    const overallRiskLevel = this.calculateOverallRiskLevel(risks);
    
    return {
      overallRiskLevel,
      risks,
      mitigationStrategies: risks.map(risk => ({
        riskId: risk.id,
        strategy: risk.mitigationStrategy || 'No mitigation strategy defined',
        assignedTo: risk.owner,
        dueDate: risk.identifiedDate ? new Date(risk.identifiedDate) : undefined,
        status: risk.status === RiskStatus.RESOLVED ? 'completed' as const : 'planned' as const
      }))
    };
  }

  /**
   * Map payment status to reporting status
   */
  private static mapPaymentStatus(status: string): 'pending' | 'approved' | 'paid' | 'overdue' {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'paid';
      case 'approved':
        return 'approved';
      case 'overdue':
        return 'overdue';
      default:
        return 'pending';
    }
  }

  /**
   * Calculate overall risk level from individual risks
   */
  private static calculateOverallRiskLevel(risks: RiskDTO[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';
    
    const highRiskCount = risks.filter(risk => 
      (risk.probability || 0) > 0.7 || (risk.impact || 0) > 0.7
    ).length;
    
    const totalRisk = risks.reduce((sum, risk) => {
      const probability = risk.probability || 0.5;
      const impact = risk.impact || 0.5;
      return sum + (probability * impact);
    }, 0);
    
    const averageRisk = totalRisk / risks.length;
    
    if (highRiskCount > 0 || averageRisk > 0.75) return 'critical';
    if (averageRisk > 0.5) return 'high';
    if (averageRisk > 0.25) return 'medium';
    return 'low';
  }

  /**
   * Transform report data back to UI format
   */
  static transformReportToUI(reportData: ProjectReportDTO): any {
    return {
      id: `report-${reportData.project.id}-${Date.now()}`,
      projectId: reportData.project.id,
      generatedAt: new Date(),
      financialSummary: {
        totalBudget: reportData.financialMetrics.totalBudget,
        spentAmount: reportData.financialMetrics.spentAmount,
        remainingBudget: reportData.financialMetrics.remainingBudget,
        costVariance: reportData.financialMetrics.costOverrun
      },
      taskProgress: reportData.phases.flatMap(phase => 
        phase.steps?.flatMap(step => 
          step.tasks?.map(task => ({
            taskId: task.id,
            name: task.name,
            progress: task.progress,
            status: task.status
          })) || []
        ) || []
      ),
      riskAssessment: reportData.riskAssessment.risks.map(risk => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        severity: String(risk.priority),
        status: risk.status
      }))
    };
  }
}
