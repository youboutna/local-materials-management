// Service for comprehensive project analytics
import { ProjectDetailDTO } from '@/types/dto';
import { ProjectCalculationService } from './ProjectCalculationService';

export class ProjectAnalyticsService {
  
  /**
   * Get all analytics data for a project
   */
  static async getComprehensiveAnalytics(project: ProjectDetailDTO) {
    const progressAnalytics = ProjectCalculationService.calculateProgressAnalytics(project);
    const budgetAnalytics = ProjectCalculationService.calculateBudgetAnalytics(project);
    const timelineAnalytics = ProjectCalculationService.calculateTimelineAnalytics(project);
    const qualityMetrics = ProjectCalculationService.calculateQualityMetrics(project);
    const riskAnalytics = ProjectCalculationService.calculateRiskAnalytics(project);
    const healthScore = ProjectCalculationService.calculateProjectHealthScore(project);
    const evmMetrics = ProjectCalculationService.calculateEVMMetrics(project);

    return {
      progress: progressAnalytics,
      budget: budgetAnalytics,
      timeline: timelineAnalytics,
      quality: qualityMetrics,
      risk: riskAnalytics,
      health: healthScore,
      evm: evmMetrics
    };
  }

  /**
   * Get KPI metrics for a project
   */
  static async getKPIMetrics(project: ProjectDetailDTO) {
    const analytics = await this.getComprehensiveAnalytics(project);
    
    return {
      // Progress KPIs
      overallProgress: analytics.progress.overallProgress,
      completedTasks: analytics.progress.completedTasksCount,
      delayedTasks: analytics.progress.delayedTasksCount,
      
      // Budget KPIs
      budgetUtilization: analytics.budget.budgetUtilization,
      costVariance: analytics.budget.costVariance,
      remainingBudget: analytics.budget.remainingBudget,
      
      // Timeline KPIs
      scheduleVariance: analytics.timeline.scheduleVariance,
      elapsedDays: analytics.timeline.elapsedDays,
      remainingDays: analytics.timeline.remainingDays,
      
      // Quality KPIs
      inspectionPassRate: analytics.quality.inspectionPassRate,
      criticalIssues: analytics.quality.criticalIssuesCount,
      qualityTrend: analytics.quality.qualityTrend,
      
      // Risk KPIs
      totalRisks: analytics.risk.totalRisks,
      highRisks: analytics.risk.highRisks,
      mitigatedRisks: analytics.risk.mitigatedRisks,
      
      // EVM KPIs
      spi: analytics.evm.schedulePerformanceIndex,
      cpi: analytics.evm.costPerformanceIndex,
      earnedValue: analytics.evm.earnedValue,
      
      // Health Score
      healthScore: analytics.health.overall,
      healthBudget: analytics.health.budget,
      healthSchedule: analytics.health.schedule,
      healthQuality: analytics.health.quality
    };
  }

  /**
   * Get compliance data for a project
   */
  static async getComplianceData(project: ProjectDetailDTO) {
    const inspections = project.inspections || [];
    
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => 
      i.status === 'approved' || i.status === 'completed'
    ).length;
    const failedInspections = inspections.filter(i => 
      i.status === 'rejected' || i.status === 'requires_changes'
    ).length;
    const pendingInspections = inspections.filter(i => 
      i.status === 'scheduled' || i.status === 'pending'
    ).length;

    const issues = inspections.flatMap(i => {
      const issuesList = i.issues || [];
      // Filter only InspectionIssue objects, not strings
      return Array.isArray(issuesList) 
        ? issuesList.filter(issue => typeof issue === 'object' && issue !== null)
        : [];
    });
    const openIssues = issues.filter((issue: any) => issue.status === 'open').length;
    const criticalIssues = issues.filter((issue: any) => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    return {
      totalInspections,
      passedInspections,
      failedInspections,
      pendingInspections,
      complianceRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
      openIssues,
      criticalIssues,
      resolvedIssues: issues.filter((issue: any) => issue.status === 'resolved').length,
      inspectionHistory: inspections.map(i => ({
        id: i.id,
        date: i.date,
        status: i.status,
        progress: i.progress_at_inspection,
        inspector: i.inspector,
        issuesCount: (i.issues || []).length
      }))
    };
  }

  /**
   * Get team data for a project
   */
  static getTeamData(project: ProjectDetailDTO, resources: any[]) {
    const humanResources = resources.filter(r => r.type === 'human');
    const materialResources = resources.filter(r => r.type === 'material');

    return {
      teamSize: humanResources.length,
      materialCount: materialResources.length,
      projectManager: project.projectResponsableId,
      mainContractor: project.mainContractor,
      resources: {
        human: humanResources,
        materials: materialResources
      },
      availability: {
        average: humanResources.length > 0 
          ? humanResources.reduce((sum, r) => sum + (r.availability || 0), 0) / humanResources.length 
          : 0
      }
    };
  }

  /**
   * Get financial overview data
   */
  static getFinancialData(project: ProjectDetailDTO) {
    const payments = project.inspections || [];
    const totalPaid = payments.reduce((sum, p) => sum + (p.progress_at_inspection || 0), 0);
    
    return {
      budget: project.budget,
      spent: totalPaid,
      remaining: project.budget - totalPaid,
      utilizationRate: project.budget > 0 ? (totalPaid / project.budget) * 100 : 0,
      payments: payments.map(p => ({
        id: p.id,
        date: p.date,
        amount: p.progress_at_inspection,
        status: p.status
      }))
    };
  }
}
