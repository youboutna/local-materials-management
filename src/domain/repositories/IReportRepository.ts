/**
 * Report Repository Interface - Hexagonal Architecture
 * Port interface for report data access operations
 */

import { 
  ProjectReportDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ComplianceReportDTO,
  DocumentSummaryDTO
} from '@/dtos/reports/reportDTOs';

// =================== REPOSITORY INTERFACE ===================

export interface IReportRepository {
  /**
   * Generate project report with all sections
   */
  generateProjectReport(projectId: string): Promise<ProjectReportDTO>;

  /**
   * Get project analytics with trends and comparisons
   */
  getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDTO>;

  /**
   * Get financial metrics with variance analysis
   */
  getFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO>;

  /**
   * Get risk assessment with mitigation strategies
   */
  getRiskAssessment(projectId: string): Promise<RiskAssessmentDTO>;

  /**
   * Get compliance report with recommendations
   */
  getComplianceReport(projectId: string): Promise<ComplianceReportDTO>;

  /**
   * Get document summary for reporting
   */
  getDocumentSummary(projectId: string): Promise<DocumentSummaryDTO>;

  /**
   * Get trends data for analytics
   */
  getTrends(projectId: string, timeRange: string): Promise<any[]>;

  /**
   * Get comparative analysis data
   */
  getComparisons(projectId: string): Promise<any>;

  /**
   * Get variance analysis
   */
  getVarianceAnalysis(projectId: string): Promise<any>;

  /**
   * Generate financial projections
   */
  getFinancialProjections(financials: FinancialMetricsDTO): Promise<any>;

  /**
   * Get cash flow analysis
   */
  getCashFlowAnalysis(projectId: string): Promise<any>;

  /**
   * Get compliance history
   */
  getComplianceHistory(projectId: string): Promise<any[]>;
}
