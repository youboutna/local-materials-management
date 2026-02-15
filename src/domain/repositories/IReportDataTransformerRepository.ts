/**
 * Report Data Transformer Repository Interface
 * Defines the contract for report data transformation operations
 */
import { ProjectDetailDTO, ProjectData } from '@/dtos/entities/ProjectDTO';
import { 
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO
} from '@/dtos/entities/ReportDTO';

export interface IReportDataTransformerRepository {
  /**
   * Transform project data for reporting
   */
  transformProjectForReport(project: ProjectData): Promise<ProjectReportDTO>;

  /**
   * Fetch enhanced project phases data
   */
  fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]>;

  /**
   * Fetch construction milestones data
   */
  fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]>;

  /**
   * Calculate project analytics
   */
  calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO>;

  /**
   * Calculate financial metrics
   */
  calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO>;

  /**
   * Assess project risks
   */
  assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO>;
}
