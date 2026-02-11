/**
 * Report Service - Hexagonal Architecture
 * Comprehensive data-centric reporting service following hexagonal principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { 
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ReportData,
  CostCalculation,
  DocumentSummaryDTO,
  ComplianceReportDTO,
  ProjectHealthScoreDTO
} from '@/dtos/reports/reportDTOs';
import { ProjectData } from '@/types/project';

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
  reportData: ProjectReportDTO;
  metadata: {
    generatedAt: string;
    reportType: string;
    version: string;
    dataPoints: number;
    processingTime: number;
  };
  analytics?: ProjectAnalyticsDTO;
  financials?: FinancialMetricsDTO;
  risks?: RiskAssessmentDTO;
  documents?: DocumentSummaryDTO;
  compliance?: ComplianceReportDTO;
  healthScore?: ProjectHealthScoreDTO;
}

// =================== MAIN SERVICE CLASS ===================

export class ReportService {
  constructor(
    private reportRepository: IReportRepository = RepositoryFactory.getReportRepository()
  ) {}

  // =================== CORE REPORTING METHODS ===================

  /**
   * Generate comprehensive project report
   * Data-centric approach with configurable sections
   */
  async generateProjectReport(request: GenerateProjectReportRequestDto): Promise<ProjectReportResultDto> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const startTime = Date.now();

      // Generate base report data
      const reportData = await this.reportRepository.generateProjectReport(request.projectId);
      
      // Initialize result with base data
      const result: ProjectReportResultDto = {
        reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: request.reportType || 'detailed',
          version: '1.0.0',
          dataPoints: this.calculateDataPoints(reportData),
          processingTime: Date.now() - startTime
        }
      };

      // Add optional sections based on request
      if (request.includeAnalytics || request.reportType === 'detailed') {
        result.analytics = await this.generateProjectAnalytics({
          projectId: request.projectId,
          timeRange: '90d',
          includeTrends: true,
          includeComparisons: true
        });
      }

      if (request.includeFinancials || request.reportType === 'financial') {
        result.financials = await this.generateFinancialMetrics({
          projectId: request.projectId,
          includeVariance: true,
          includeProjections: true,
          includeCashFlow: true
        });
      }

      if (request.includeRisks || request.reportType === 'risk_assessment') {
        result.risks = await this.generateRiskAssessment({
          projectId: request.projectId,
          includeMitigation: true,
          severity: 'medium'
        });
      }

      if (request.includeDocuments) {
        result.documents = await this.generateDocumentSummary(request.projectId);
      }

      if (request.includeCompliance || request.reportType === 'compliance') {
        result.compliance = await this.generateComplianceReport({
          projectId: request.projectId,
          includeRecommendations: true,
          includeHistory: true
        });
      }

      // Calculate overall health score if analytics available
      if (result.analytics) {
        result.healthScore = this.calculateProjectHealthScore(result.analytics);
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

  /**
   * Generate project analytics with trends and comparisons
   */
  async generateProjectAnalytics(request: GenerateProjectAnalyticsRequestDto): Promise<ProjectAnalyticsDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const analytics = await this.reportRepository.getProjectAnalytics(request.projectId);
      
      // Enhance with trend analysis if requested
      if (request.includeTrends) {
        analytics.trends = await this.calculateTrends(request.projectId, request.timeRange || '90d');
      }

      // Add comparative data if requested
      if (request.includeComparisons) {
        analytics.comparisons = await this.generateComparisons(request.projectId);
      }

      // Add time-based filtering
      if (request.timeRange) {
        analytics.filteredData = this.filterAnalyticsByTimeRange(analytics, request.timeRange);
      }

      return analytics;
    } catch (error) {
      console.error('ReportService.generateProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate project analytics'
      );
    }
  }

  /**
   * Generate comprehensive financial metrics
   */
  async generateFinancialMetrics(request: GenerateFinancialMetricsRequestDto): Promise<FinancialMetricsDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const financials = await this.reportRepository.getFinancialMetrics(request.projectId);
      
      // Add variance analysis if requested
      if (request.includeVariance) {
        financials.varianceAnalysis = await this.calculateVarianceAnalysis(request.projectId);
      }

      // Add projections if requested
      if (request.includeProjections) {
        financials.projections = await this.generateFinancialProjections(financials);
      }

      // Add cash flow analysis if requested
      if (request.includeCashFlow) {
        financials.cashFlow = await this.generateCashFlowAnalysis(request.projectId);
      }

      return financials;
    } catch (error) {
      console.error('ReportService.generateFinancialMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate financial metrics'
      );
    }
  }

  /**
   * Generate risk assessment with mitigation strategies
   */
  async generateRiskAssessment(request: GenerateRiskAssessmentRequestDto): Promise<RiskAssessmentDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const risks = await this.reportRepository.getRiskAssessment(request.projectId);
      
      // Filter by risk categories if specified
      if (request.riskCategories && request.riskCategories.length > 0) {
        risks.identifiedRisks = risks.identifiedRisks.filter(risk => 
          request.riskCategories!.includes(risk.category)
        );
      }

      // Filter by severity if specified
      if (request.severity) {
        risks.identifiedRisks = risks.identifiedRisks.filter(risk => 
          risk.severity === request.severity
        );
      }

      // Add mitigation strategies if requested
      if (request.includeMitigation) {
        risks.mitigationStrategies = await this.generateMitigationStrategies(risks.identifiedRisks);
      }

      return risks;
    } catch (error) {
      console.error('ReportService.generateRiskAssessment failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate risk assessment'
      );
    }
  }

  /**
   * Generate compliance report with recommendations
   */
  async generateComplianceReport(request: GenerateComplianceReportRequestDto): Promise<ComplianceReportDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const compliance = await this.reportRepository.getComplianceReport(request.projectId);
      
      // Filter by compliance types if specified
      if (request.complianceTypes && request.complianceTypes.length > 0) {
        compliance.complianceItems = compliance.complianceItems.filter(item => 
          request.complianceTypes!.includes(item.type)
        );
      }

      // Add recommendations if requested
      if (request.includeRecommendations) {
        compliance.recommendations = await this.generateComplianceRecommendations(compliance);
      }

      // Add historical data if requested
      if (request.includeHistory) {
        compliance.historicalData = await this.getComplianceHistory(request.projectId);
      }

      return compliance;
    } catch (error) {
      console.error('ReportService.generateComplianceReport failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate compliance report'
      );
    }
  }

  // =================== HELPER METHODS ===================

  /**
   * Generate document summary for reporting
   */
  async generateDocumentSummary(projectId: string): Promise<DocumentSummaryDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.reportRepository.getDocumentSummary(projectId);
    } catch (error) {
      console.error('ReportService.generateDocumentSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate document summary'
      );
    }
  }

  /**
   * Calculate project health score
   */
  private calculateProjectHealthScore(analytics: ProjectAnalyticsDTO): ProjectHealthScoreDTO {
    const progressScore = analytics.progressMetrics?.completionRate || 0;
    const budgetScore = analytics.budgetMetrics?.utilizationRate || 0;
    const scheduleScore = analytics.scheduleMetrics?.adherenceRate || 0;
    const qualityScore = analytics.qualityMetrics?.overallScore || 0;

    const overallScore = (progressScore + budgetScore + scheduleScore + qualityScore) / 4;

    return {
      overallScore,
      progressScore,
      budgetScore,
      scheduleScore,
      qualityScore,
      grade: this.getHealthGrade(overallScore),
      recommendations: this.getHealthRecommendations(overallScore)
    };
  }

  /**
   * Calculate data points for metadata
   */
  private calculateDataPoints(reportData: ProjectReportDTO): number {
    let count = 1; // Base report
    
    if (reportData.phases) count += reportData.phases.length;
    if (reportData.milestones) count += reportData.milestones.length;
    if (reportData.analytics) count += Object.keys(reportData.analytics).length;
    if (reportData.financials) count += Object.keys(reportData.financials).length;
    
    return count;
  }

  /**
   * Calculate trends for analytics
   */
  private async calculateTrends(projectId: string, timeRange: string): Promise<any[]> {
    // Implementation would calculate trends based on historical data
    return await this.reportRepository.getTrends(projectId, timeRange);
  }

  /**
   * Generate comparative analysis
   */
  private async generateComparisons(projectId: string): Promise<any> {
    // Implementation would compare with similar projects
    return await this.reportRepository.getComparisons(projectId);
  }

  /**
   * Filter analytics by time range
   */
  private filterAnalyticsByTimeRange(analytics: ProjectAnalyticsDTO, timeRange: string): any {
    // Implementation would filter data based on time range
    return analytics; // Placeholder
  }

  /**
   * Calculate variance analysis
   */
  private async calculateVarianceAnalysis(projectId: string): Promise<any> {
    return await this.reportRepository.getVarianceAnalysis(projectId);
  }

  /**
   * Generate financial projections
   */
  private async generateFinancialProjections(financials: FinancialMetricsDTO): Promise<any> {
    // Implementation would project future financials based on current trends
    return {
      projectedCompletion: financials.budgetMetrics?.projectedCompletion,
      projectedOverrun: financials.budgetMetrics?.projectedOverrun,
      confidence: financials.budgetMetrics?.projectionConfidence || 0.8
    };
  }

  /**
   * Generate cash flow analysis
   */
  private async generateCashFlowAnalysis(projectId: string): Promise<any> {
    return await this.reportRepository.getCashFlowAnalysis(projectId);
  }

  /**
   * Generate mitigation strategies
   */
  private async generateMitigationStrategies(risks: any[]): Promise<any[]> {
    // Implementation would generate specific mitigation strategies for each risk
    return risks.map(risk => ({
      riskId: risk.id,
      strategy: this.getMitigationStrategy(risk),
      estimatedCost: risk.impact * 0.1, // 10% of impact
      timeline: `${risk.severity === 'high' ? '2 weeks' : risk.severity === 'medium' ? '4 weeks' : '8 weeks'}`,
      owner: 'Project Manager'
    }));
  }

  /**
   * Generate compliance recommendations
   */
  private async generateComplianceRecommendations(compliance: ComplianceReportDTO): Promise<any[]> {
    // Implementation would generate specific recommendations based on compliance gaps
    const recommendations = [];
    
    if (compliance.overallScore < 80) {
      recommendations.push({
        priority: 'high',
        category: 'documentation',
        recommendation: 'Update missing documentation to improve compliance score',
        estimatedEffort: '2-4 hours'
      });
    }

    return recommendations;
  }

  /**
   * Get compliance history
   */
  private async getComplianceHistory(projectId: string): Promise<any[]> {
    return await this.reportRepository.getComplianceHistory(projectId);
  }

  /**
   * Get health grade based on score
   */
  private getHealthGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get health recommendations based on score
   */
  private getHealthRecommendations(score: number): string[] {
    const recommendations = [];
    
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

/**
 * Factory function for creating ReportService instance
 */
export function getReportService(): ReportService {
  return new ReportService();
}

// =================== EXPORTS ===================

export type {
  GenerateProjectReportRequestDto,
  GenerateProjectAnalyticsRequestDto,
  GenerateFinancialMetricsRequestDto,
  GenerateRiskAssessmentRequestDto,
  GenerateComplianceReportRequestDto,
  ProjectReportResultDto
};
