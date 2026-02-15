/**
 * Report Data Transformer Service - Hexagonal Architecture
 * Orchestrates report data transformation operations using the hexagonal architecture
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IReportDataTransformerRepository } from '@/domain/repositories/IReportDataTransformerRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO
} from '@/dtos/entities/ReportDTO';
import { ProjectData } from '@/dtos/entities/ProjectDTO';

// Service DTOs for data exchange
export interface TransformProjectForReportRequestDto {
  projectData: ProjectData;
}

export interface CalculateProjectAnalyticsRequestDto {
  projectData: ProjectData;
}

export interface AssessProjectRisksRequestDto {
  projectData: ProjectData;
}

export class ReportDataTransformerService {
  constructor(
    private reportDataTransformerRepository: IReportDataTransformerRepository = RepositoryFactory.getReportDataTransformerRepository()
  ) {}

  /**
   * Transform project data for reporting
   */
  async transformProjectForReport(request: TransformProjectForReportRequestDto): Promise<ProjectReportDTO> {
    try {
      if (!request.projectData) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project data is required');
      }
      if (!request.projectData.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.transformProjectForReport(request.projectData);
    } catch (error) {
      console.error('ReportDataTransformerService.transformProjectForReport failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to transform project for report');
    }
  }

  /**
   * Fetch enhanced project phases data
   */
  async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.fetchEnhancedPhases(projectId);
    } catch (error) {
      console.error('ReportDataTransformerService.fetchEnhancedPhases failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch enhanced phases');
    }
  }

  /**
   * Fetch construction milestones data
   */
  async fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.fetchConstructionMilestones(projectId);
    } catch (error) {
      console.error('ReportDataTransformerService.fetchConstructionMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch construction milestones');
    }
  }

  /**
   * Calculate project analytics
   */
  async calculateProjectAnalytics(request: CalculateProjectAnalyticsRequestDto): Promise<ProjectAnalyticsDTO> {
    try {
      if (!request.projectData) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project data is required');
      }
      if (!request.projectData.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.calculateProjectAnalytics(request.projectData);
    } catch (error) {
      console.error('ReportDataTransformerService.calculateProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate project analytics');
    }
  }

  /**
   * Calculate financial metrics
   */
  async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.calculateFinancialMetrics(projectId);
    } catch (error) {
      console.error('ReportDataTransformerService.calculateFinancialMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate financial metrics');
    }
  }

  /**
   * Assess project risks
   */
  async assessProjectRisks(request: AssessProjectRisksRequestDto): Promise<RiskAssessmentDTO> {
    try {
      if (!request.projectData) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project data is required');
      }
      if (!request.projectData.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportDataTransformerRepository.assessProjectRisks(request.projectData);
    } catch (error) {
      console.error('ReportDataTransformerService.assessProjectRisks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to assess project risks');
    }
  }
}

// Factory function for creating the service
export function createReportDataTransformerService(): ReportDataTransformerService {
  return new ReportDataTransformerService();
};