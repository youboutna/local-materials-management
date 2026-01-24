// Data Transformer Service for Project Reports - Migrated to Hexagonal Architecture
import { ProjectData } from '@/types/project';
import { ReportDataTransformerService, createReportDataTransformerService } from '@/application/services/ReportDataTransformerService';
import { 
  ProjectReportDTO, 
  EnhancedPhaseDTO, 
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO
} from '@/types/reportTypes';

// Create singleton instance of the hexagonal service using the factory
const reportDataTransformerService = createReportDataTransformerService();

export class ReportDataTransformer {
  /**
   * Transform project data into enriched DTO for reporting
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async transformProjectForReport(project: ProjectData): Promise<ProjectReportDTO> {
    return await reportDataTransformerService.transformProjectForReport(project);
  }

  /**
   * Fetch and enhance project phases data
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    return await reportDataTransformerService.fetchEnhancedPhases(projectId);
  }

  /**
   * Fetch construction milestones with enhanced data
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]> {
    return await reportDataTransformerService.fetchConstructionMilestones(projectId);
  }

  /**
   * Calculate enhanced project analytics from real database data
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO> {
    return await reportDataTransformerService.calculateProjectAnalytics(project);
  }

  /**
   * Calculate comprehensive financial metrics for the project
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    return await reportDataTransformerService.calculateFinancialMetrics(projectId);
  }

  /**
   * Assess project risks
   * Now uses hexagonal architecture via ReportDataTransformerService
   */
  static async assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO> {
    return await reportDataTransformerService.assessProjectRisks(project);
  }
}