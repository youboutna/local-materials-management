/**
 * Reporting Service - Hexagonal Architecture
 * Business logic for comprehensive reporting operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { DeviationEngine, DeviationResult } from '@/application/services/DeviationEngine';
import {
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ReportData,
  CostCalculation
} from '@/dtos/entities/ReportDTO';
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';

// Service DTOs for data exchange
export interface GenerateCompleteProjectReportRequestDto {
  project: ProjectData;
}

export interface GenerateProjectAnalyticsRequestDto {
  projectId: string;
}

export interface CalculateFinancialMetricsRequestDto {
  projectId: string;
}

export interface GenerateRiskAssessmentRequestDto {
  projectId: string;
}

export interface CompleteProjectReportResultDto {
  reportDTO: ProjectReportDTO;
  reportData: ReportData;
  costCalculation: CostCalculation;
  resourceUtilization: unknown;
  healthScore: unknown;
  realCosts: unknown; // Repository-provided real-time project cost data
  deviations: DeviationResult[]; // DeviationEngine output for project scope
}

export class ReportingService {
  constructor(
    private reportingRepository: IReportingRepository = RepositoryFactory.getReportingRepository()
  ) {}

  /**
   * Generate complete project report with all enhanced calculations
   */
  async generateCompleteProjectReport(request: GenerateCompleteProjectReportRequestDto): Promise<CompleteProjectReportResultDto> {
    try {
      if (!request.project) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project data is required');
      }
      if (!request.project.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Fetch all required data in parallel using repository
      const [
        reportDTO,
        realCosts,
        phases,
        inspections
      ] = await Promise.all([
        this.reportingRepository.transformProjectForReport(request.project),
        this.reportingRepository.calculateRealProjectCosts(request.project.id),
        this.reportingRepository.getProjectPhases(request.project.id),
        this.reportingRepository.getProjectInspections(request.project.id)
      ]);

      const phasesData = phases || [];
      const inspectionsData = inspections || [];

      // ---- Métriques dérivées des données réelles (plus de constantes hardcodées) ----
      const budget = request.project.budget || 0;
      const totalSpent = Number((realCosts as any)?.totalSpent ?? 0);
      const actualProgress = request.project.progress || 0;

      // Utilisation budgétaire = % du budget consommé
      const budgetUtilization = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;

      // Performance schedule = ratio progression réelle / progression temporelle attendue
      const startDate = (request.project as any).startDate ?? (request.project as any).start_date ?? null;
      const endDate = (request.project as any).endDate ?? (request.project as any).end_date ?? null;
      let schedulePerformance = 100;
      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const now = Date.now();
        const totalMs = end - start;
        if (totalMs > 0) {
          const expectedProgress = Math.max(0, Math.min(100, ((now - start) / totalMs) * 100));
          schedulePerformance = expectedProgress > 0
            ? Math.min(150, (actualProgress / expectedProgress) * 100)
            : 100;
        }
      }

      // Qualité = inverse du nombre d'alertes critiques (proxy faute de mieux), borné [0,100]
      const alertCount = (request.project as any).alerts?.length ?? 0;
      const qualityScore = Math.max(0, 100 - alertCount * 5);

      const healthScore = ProjectCalculationService.calculateProjectHealthScore(
        actualProgress,
        budgetUtilization,
        schedulePerformance,
        qualityScore,
      );

      // Calculate resource utilization for the first phase if available
      const resourceUtilization = phasesData.length > 0 
        ? await this.reportingRepository.calculatePhaseResourceUtilization(request.project.id, phasesData[0].id)
        : null;

      // Projection de fin basée sur le burn rate réel (au lieu de today + 30j en dur)
      let projectedCompletionIso: string;
      if (endDate) {
        projectedCompletionIso = new Date(endDate).toISOString();
      } else if (totalSpent > 0 && actualProgress > 0 && actualProgress < 100 && startDate) {
        const elapsedMs = Date.now() - new Date(startDate).getTime();
        const projectedTotalMs = (elapsedMs / actualProgress) * 100;
        projectedCompletionIso = new Date(new Date(startDate).getTime() + projectedTotalMs).toISOString();
      } else {
        projectedCompletionIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Calculate comprehensive cost data
      const costCalculation: CostCalculation = {
        totalBudget: budget,
        spentAmount: totalSpent,
        remainingBudget: budget - totalSpent,
        costVariance: totalSpent - budget,
        estimatedCost: (realCosts as any)?.estimatedCost || 0,
        actualCost: (realCosts as any)?.actualPhaseCost || totalSpent,
        efficiency: totalSpent > 0 ? (budget / totalSpent) * 100 : 100,
        projectedCompletion: projectedCompletionIso,
        projectedOverrun: Math.max(0, totalSpent - budget),
      };

      // Create proper ReportData object
      const reportData: ReportData = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        title: `Project Report for ${request.project.title}`,
        description: `Comprehensive report generated on ${new Date().toISOString()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: request.project.createdBy || 'system',
        projectId: request.project.id,
        reportType: 'summary',
        status: 'completed',
        metadata: {
          totalBudget: request.project.budget,
          progress: request.project.progress,
          costData: realCosts
        }
      };

      // Compute project-scope deviations via the DeviationEngine (referentials-driven).
      // Pour les projets in_progress en retard sans actualEndDate, on injecte "today" pour
      // déclencher quand même le calcul de duration_deviation.
      const isInProgress = ['in_progress', 'inspection', 'validation', 'payment_request'].includes(
        String(request.project.status || ''),
      );
      const plannedEndDate = (request.project as any).endDate ?? (request.project as any).end_date ?? null;
      const explicitActualEnd = (request.project as any).actualEndDate ?? null;
      const isOverdue = plannedEndDate && Date.now() > new Date(plannedEndDate).getTime();
      const effectiveActualEnd = explicitActualEnd
        || (isInProgress && isOverdue ? new Date().toISOString() : null);

      const deviations = DeviationEngine.compute(
        {
          plannedEndDate,
          actualEndDate: effectiveActualEnd,
          plannedBudget: request.project.budget ?? null,
          actualCost: (realCosts as any)?.totalSpent ?? null,
          plannedProgress: 100,
          actualProgress: request.project.progress ?? 0,
        },
        'project',
      );

      return {
        reportDTO,
        reportData,
        costCalculation,
        resourceUtilization,
        healthScore,
        realCosts,
        deviations,
      };
    } catch (error) {
      console.error('ReportingService.generateCompleteProjectReport failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate complete project report');
    }
  }

  /**
   * Generate project analytics
   */
  async generateProjectAnalytics(request: GenerateProjectAnalyticsRequestDto): Promise<ProjectAnalyticsDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const [phases, inspections] = await Promise.all([
        this.reportingRepository.getProjectPhases(request.projectId),
        this.reportingRepository.getProjectInspections(request.projectId)
      ]);

      // Implementation continues...
      return {
        totalPhases: phases.length,
        completedPhases: phases.filter(p => p.status === 'completed').length,
        overallProgress: phases.reduce((sum, phase) => sum + (phase.progress || 0), 0) / phases.length,
        budgetUtilization: phases.reduce((sum, phase) => sum + (phase.actualCost || 0), 0) / (phases.reduce((sum, phase) => sum + (phase.budget || 0), 0) || 1),
        healthScore: null // To be implemented
      } as unknown as ProjectAnalyticsDTO;
    } catch (error) {
      console.error('ReportingService.generateProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate project analytics');
    }
  }

  /**
   * Calculate financial metrics
   */
  async calculateFinancialMetrics(request: CalculateFinancialMetricsRequestDto): Promise<FinancialMetricsDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const realCosts = await this.reportingRepository.calculateRealProjectCosts(request.projectId);
      
      // Implementation continues...
      return {
        totalBudget: realCosts.totalBudget || 0,
        spentAmount: realCosts.totalSpent || 0,
        remainingBudget: (realCosts.totalBudget || 0) - (realCosts.totalSpent || 0),
        estimatedCost: realCosts.estimatedCost || 0,
        actualCost: realCosts.actualPhaseCost || 0,
        costEfficiency: realCosts.totalBudget > 0 ? (realCosts.actualPhaseCost || 0) / realCosts.totalBudget : 0,
        costPerformance: realCosts.totalSpent > 0 ? (realCosts.totalBudget / realCosts.totalSpent) : 0
      } as unknown as FinancialMetricsDTO;
    } catch (error) {
      console.error('ReportingService.calculateFinancialMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate financial metrics');
    }
  }

  /**
   * Generate risk assessment
   */
  async generateRiskAssessment(request: GenerateRiskAssessmentRequestDto): Promise<RiskAssessmentDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Implementation continues...
      return {
        riskLevel: 'low' as const,
        riskFactors: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      } as unknown as RiskAssessmentDTO;
    } catch (error) {
      console.error('ReportingService.generateRiskAssessment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate risk assessment');
    }
  }
}
