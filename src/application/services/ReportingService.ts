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

export class ReportingService {
  constructor(private reportingRepository: IReportingRepository) {}

  /**
   * Generate complete project report with all enhanced calculations
   */
  async generateCompleteProjectReport(project: ProjectData): Promise<{
    reportDTO: ProjectReportDTO;
    reportData: ReportData;
    costCalculation: CostCalculation;
    resourceUtilization: any;
    healthScore: any;
  }> {
    try {
      // Fetch all required data in parallel using repository
      const [
        reportDTO,
        realCosts,
        phases,
        inspections
      ] = await Promise.all([
        this.reportingRepository.transformProjectForReport(project),
        this.reportingRepository.calculateRealProjectCosts(project.id),
        this.reportingRepository.getProjectPhases(project.id),
        this.reportingRepository.getProjectInspections(project.id)
      ]);

      const phasesData = phases || [];
      const inspectionsData = inspections || [];
      
      // Calculate resource utilization for the first phase if available
      const resourceUtilization = phasesData.length > 0 
        ? await this.reportingRepository.calculatePhaseResourceUtilization(project.id, phasesData[0].id)
        : null;

      // Calculate comprehensive cost data
      const costCalculation: CostCalculation = {
        totalBudget: project.budget || 0,
        spentAmount: realCosts.totalSpent || 0,
        remainingBudget: (project.budget || 0) - (realCosts.totalSpent || 0),
        costVariance: (realCosts.totalSpent || 0) - (project.budget || 0),
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
      console.error('Error generating complete project report:', error);
      throw error;
    }
  }

  /**
   * Generate project analytics
   */
  async generateProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDTO> {
    try {
      const [phases, inspections] = await Promise.all([
        this.reportingRepository.getProjectPhases(projectId),
        this.reportingRepository.getProjectInspections(projectId)
      ]);

      // Implementation continues...
      return {} as ProjectAnalyticsDTO;
    } catch (error) {
      console.error('Error generating project analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate financial metrics
   */
  async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    try {
      const realCosts = await this.reportingRepository.calculateRealProjectCosts(projectId);
      
      // Implementation continues...
      return {} as FinancialMetricsDTO;
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      throw error;
    }
  }

  /**
   * Generate risk assessment
   */
  async generateRiskAssessment(projectId: string): Promise<RiskAssessmentDTO> {
    try {
      // Implementation continues...
      return {} as RiskAssessmentDTO;
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      throw error;
    }
  }
}
