/**
 * Reporting Service - Hexagonal Architecture
 * Business logic for comprehensive reporting operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectDataCalculations } from '@/utils/projectDataCalculations';
import {
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ReportData,
  CostCalculation
} from '@/types/reportTypes';
import { ProjectData } from '@/types/project';
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
      
      // Calculate resource utilization for the first phase if available
      const resourceUtilization = phasesData.length > 0 
        ? await this.reportingRepository.calculatePhaseResourceUtilization(request.project.id, phasesData[0].id)
        : null;

      // Calculate comprehensive cost data
      const costCalculation: CostCalculation = {
        totalBudget: request.project.budget || 0,
        spentAmount: realCosts.totalSpent || 0,
        remainingBudget: (request.project.budget || 0) - (realCosts.totalSpent || 0),
        costVariance: (realCosts.totalSpent || 0) - (request.project.budget || 0),
        estimatedCost: realCosts.estimatedCost || 0,
        actualCost: realCosts.actualPhaseCost || 0
      };

      return {
        reportDTO,
        reportData: realCosts,
        costCalculation,
        resourceUtilization,
        healthScore: null // To be implemented
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
        budgetUtilization: phases.reduce((sum, phase) => sum + (phase.actual_cost || 0), 0) / (phases.reduce((sum, phase) => sum + (phase.budget || 0), 0) || 1),
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
