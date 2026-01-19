/**
 * Report Data Transformer Application Service
 * Orchestrates report data transformation operations using the hexagonal architecture
 */
import { IReportDataTransformerRepository } from '@/domain/repositories/IReportDataTransformerRepository';
import { 
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO
} from '@/types/reportTypes';
import { ProjectData } from '@/types/project';

export class ReportDataTransformerService {
  constructor(
    private reportDataTransformerRepository: IReportDataTransformerRepository
  ) {}

  /**
   * Transform project data for reporting
   */
  async transformProjectForReport(project: ProjectData): Promise<ProjectReportDTO> {
    return await this.reportDataTransformerRepository.transformProjectForReport(project);
  }

  /**
   * Fetch enhanced project phases data
   */
  async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    return await this.reportDataTransformerRepository.fetchEnhancedPhases(projectId);
  }

  /**
   * Fetch construction milestones data
   */
  async fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]> {
    return await this.reportDataTransformerRepository.fetchConstructionMilestones(projectId);
  }

  /**
   * Calculate project analytics
   */
  async calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO> {
    return await this.reportDataTransformerRepository.calculateProjectAnalytics(project);
  }

  /**
   * Calculate financial metrics
   */
  async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    return await this.reportDataTransformerRepository.calculateFinancialMetrics(projectId);
  }

  /**
   * Assess project risks
   */
  async assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO> {
    return await this.reportDataTransformerRepository.assessProjectRisks(project);
  }
}

// Factory pour créer le service
export const createReportDataTransformerService = () => {
  // Import différé pour éviter les dépendances circulaires
  const RepositoryFactory = require('@/infrastructure/supabase/RepositoryFactory');
  const repository = RepositoryFactory.getReportDataTransformerRepository();
  return new ReportDataTransformerService(repository);
};