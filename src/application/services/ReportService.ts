/**
 * Report Service - Hexagonal Architecture
 * Comprehensive data-centric reporting service following hexagonal principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';

// Use local DTOs to avoid re-export alias conflicts from reportDTOs
export interface ReportServiceProjectReportDTO {
  projectId: string;
  projectName: string;
  generatedAt: string;
  reportType: string;
  version: string;
  projectInfo: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate?: string;
    budget: number;
    progress: number;
  };
  phases?: any[];
  milestones?: any[];
  analytics?: Record<string, any>;
  financials?: Record<string, any>;
}

export interface ReportServiceHealthScoreDTO {
  projectId: string;
  calculatedAt: string;
  overallScore: number;
  progressScore: number;
  budgetScore: number;
  scheduleScore: number;
  qualityScore: number;
  grade: string;
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

// =================== SERVICE DTOs ===================

export interface GenerateProjectReportRequestDto {
  projectId: string;
  includeFinancials?: boolean;
  includeAnalytics?: boolean;
  includeRisks?: boolean;
  includeDocuments?: boolean;
  includeCompliance?: boolean;
  reportType?: 'summary' | 'detailed' | 'financial' | 'risk_assessment' | 'compliance';
}

export interface GenerateProjectAnalyticsRequestDto {
  projectId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  includeTrends?: boolean;
  includeComparisons?: boolean;
}

export interface GenerateFinancialMetricsRequestDto {
  projectId: string;
  includeVariance?: boolean;
  includeProjections?: boolean;
  includeCashFlow?: boolean;
}

export interface GenerateRiskAssessmentRequestDto {
  projectId: string;
  riskCategories?: string[];
  includeMitigation?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface GenerateComplianceReportRequestDto {
  projectId: string;
  complianceTypes?: string[];
  includeRecommendations?: boolean;
  includeHistory?: boolean;
}

export interface ProjectReportResultDto {
  reportData: ReportServiceProjectReportDTO;
  metadata: {
    generatedAt: string;
    reportType: string;
    version: string;
    dataPoints: number;
    processingTime: number;
  };
  analytics?: any;
  financials?: any;
  risks?: any;
  documents?: any;
  compliance?: any;
  healthScore?: ReportServiceHealthScoreDTO;
}

// =================== MAIN SERVICE CLASS ===================

export class ReportService {
  constructor(
    private reportRepository: IReportingRepository = RepositoryFactory.getReportingRepository()
  ) {}

  async generateProjectReport(request: GenerateProjectReportRequestDto): Promise<ProjectReportResultDto> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const startTime = Date.now();
      
      // Fetch phases data from repository
      const phases = await this.reportRepository.getProjectPhases(request.projectId);

      const reportData: ReportServiceProjectReportDTO = {
        projectId: request.projectId,
        projectName: '',
        generatedAt: new Date().toISOString(),
        reportType: request.reportType || 'detailed',
        version: '1.0.0',
        projectInfo: {
          id: request.projectId,
          name: '',
          status: 'active',
          startDate: new Date().toISOString(),
          budget: 0,
          progress: 0
        },
        phases
      };

      const result: ProjectReportResultDto = {
        reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: request.reportType || 'detailed',
          version: '1.0.0',
          dataPoints: phases.length + 1,
          processingTime: Date.now() - startTime
        }
      };

      if (request.includeFinancials || request.reportType === 'financial') {
        result.financials = await this.reportRepository.calculateRealProjectCosts(request.projectId);
      }

      return result;
    } catch (error) {
      console.error('ReportService.generateProjectReport failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate project report'
      );
    }
  }

  async generateProjectAnalytics(request: GenerateProjectAnalyticsRequestDto): Promise<any> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const phases = await this.reportRepository.getProjectPhases(request.projectId);
      
      return {
        projectId: request.projectId,
        generatedAt: new Date().toISOString(),
        timeRange: request.timeRange || '90d',
        totalPhases: phases.length,
        completedPhases: phases.filter(p => p.status === 'completed').length,
        overallProgress: phases.length > 0 
          ? phases.reduce((sum, phase) => sum + (phase.progress || 0), 0) / phases.length 
          : 0
      };
    } catch (error) {
      console.error('ReportService.generateProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate project analytics'
      );
    }
  }

  async generateFinancialMetrics(request: GenerateFinancialMetricsRequestDto): Promise<any> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }
      return await this.reportRepository.calculateRealProjectCosts(request.projectId);
    } catch (error) {
      console.error('ReportService.generateFinancialMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate financial metrics'
      );
    }
  }

  private getHealthGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getHealthRecommendations(score: number): string[] {
    const recommendations: string[] = [];
    if (score < 70) {
      recommendations.push('Immediate attention required - project health is critical');
    } else if (score < 80) {
      recommendations.push('Monitor closely - project health needs improvement');
    } else if (score < 90) {
      recommendations.push('Good progress - continue current practices');
    } else {
      recommendations.push('Excellent performance - maintain current standards');
    }
    return recommendations;
  }
}

// =================== FACTORY FUNCTION ===================

export function getReportService(): ReportService {
  return new ReportService();
}
