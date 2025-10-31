// Business logic and calculations service
import { ProjectDetailDTO, TaskDTO, InspectionDTO, PaymentDTO, RiskDTO } from '@/types/dto';
import { EVMCalculations, ProgressAnalytics, BudgetAnalytics, TimelineAnalytics, QualityMetrics, RiskAnalytics, ProjectHealthScore } from '@/types/calculations';
import { GanttChartData, PERTAnalysis, EVMData } from '@/types/project';

export class ProjectCalculationService {
  // ============= Progress Calculations =============

  static calculateProgressAnalytics(project: ProjectDetailDTO): ProgressAnalytics {
    const tasks = project.tasks || [];
    
    const delayedTasksCount = tasks.filter(task => 
      task.status === 'delayed' || 
      (task.status !== 'completed' && new Date(task.endDate) < new Date())
    ).length;
    
    const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
    const tasksInProgressCount = tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasksCount = tasks.filter(task => task.status === 'not_started').length;

    const overallProgress = tasks.length > 0 
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
      : 0;

    const phaseProgress: { [phaseId: string]: number } = {};
    const taskProgress: { [taskId: string]: number } = {};

    tasks.forEach(task => {
      taskProgress[task.id] = task.progress;
    });

    return {
      overallProgress,
      phaseProgress,
      taskProgress,
      delayedTasksCount,
      completedTasksCount,
      tasksInProgressCount,
      pendingTasksCount
    };
  }

  // ============= Budget Calculations =============

  static calculateBudgetAnalytics(project: ProjectDetailDTO): BudgetAnalytics {
    const tasks = project.tasks || [];
    const payments = project.expenses || [];
    
    const spentAmount = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const remainingBudget = project.budget - spentAmount;
    const budgetUtilization = project.budget > 0 ? (spentAmount / project.budget) * 100 : 0;
    
    const estimatedTotalCost = tasks.reduce((sum, task) => sum + task.costEstimate, 0);
    const actualTotalCost = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
    const costVariance = estimatedTotalCost - actualTotalCost;
    
    const tasksOverBudget = tasks
      .filter(task => task.actualCost && task.actualCost > task.costEstimate)
      .map(task => task.id);
    
    const averageCostPerTask = tasks.length > 0 ? estimatedTotalCost / tasks.length : 0;

    return {
      totalBudget: project.budget,
      spentAmount,
      remainingBudget,
      budgetUtilization,
      estimatedTotalCost,
      costVariance,
      tasksOverBudget,
      averageCostPerTask
    };
  }

  // ============= Timeline Calculations =============

  static calculateTimelineAnalytics(project: ProjectDetailDTO): TimelineAnalytics {
    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const currentDate = new Date();
    
    const projectDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const scheduleVariance = ((project.progress / 100) * projectDuration) - elapsedDays;
    
    const tasks = project.tasks || [];
    const delayedTasks = tasks
      .filter(task => task.status !== 'completed' && new Date(task.endDate) < currentDate)
      .map(task => task.id);
    
    const upcomingDeadlines = tasks
      .filter(task => {
        const taskEndDate = new Date(task.endDate);
        const daysToDeadline = Math.ceil((taskEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        return task.status !== 'completed' && daysToDeadline <= 7 && daysToDeadline >= 0;
      })
      .map(task => ({
        taskId: task.id,
        taskName: task.name,
        deadline: task.endDate,
        daysRemaining: Math.ceil((new Date(task.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      projectDuration,
      elapsedDays,
      remainingDays,
      scheduleVariance,
      criticalPathTasks: [], // Would need critical path calculation
      delayedTasks,
      upcomingDeadlines
    };
  }

  // ============= Quality Calculations =============

  static calculateQualityMetrics(project: ProjectDetailDTO): QualityMetrics {
    const inspections = project.inspections || [];
    
    const completedInspections = inspections.filter(inspection => inspection.status === 'completed');
    const passedInspections = inspections.filter(inspection => 
      inspection.status === 'approved' || inspection.progress_at_inspection >= 80
    );
    
    const inspectionPassRate = completedInspections.length > 0 
      ? (passedInspections.length / completedInspections.length) * 100 
      : 0;
    
    const criticalIssuesCount = inspections.reduce((count, inspection) => {
      const issuesList = inspection.issues || [];
      const validIssues = Array.isArray(issuesList) 
        ? issuesList.filter(issue => typeof issue === 'object' && issue !== null)
        : [];
      const criticalIssues = validIssues.filter((issue: any) => 
        issue.severity === 'high' || issue.severity === 'critical'
      );
      return count + criticalIssues.length;
    }, 0);
    
    const resolvedIssuesCount = inspections.reduce((count, inspection) => {
      const issuesList = inspection.issues || [];
      const validIssues = Array.isArray(issuesList) 
        ? issuesList.filter(issue => typeof issue === 'object' && issue !== null)
        : [];
      const resolvedIssues = validIssues.filter((issue: any) => issue.status === 'resolved');
      return count + resolvedIssues.length;
    }, 0);
    
    const averageInspectionScore = completedInspections.length > 0
      ? completedInspections.reduce((sum, inspection) => sum + inspection.progress_at_inspection, 0) / completedInspections.length
      : 0;
    
    const qualityTrend: 'improving' | 'stable' | 'declining' = 'stable'; // Would need historical data
    const reworkCount = 0; // Would need additional data

    return {
      inspectionPassRate,
      criticalIssuesCount,
      resolvedIssuesCount,
      averageInspectionScore,
      qualityTrend,
      reworkCount
    };
  }

  // ============= Risk Calculations =============

  static calculateRiskAnalytics(project: ProjectDetailDTO): RiskAnalytics {
    const risks = project.risks || [];
    
    const totalRisks = risks.length;
    const highRisks = risks.filter(risk => 
      (risk.probability * risk.impact) >= 15 || risk.impact >= 4 || risk.probability >= 4
    ).length;
    
    const mitigatedRisks = risks.filter(risk => 
      risk.status === 'mitigated' || risk.status === 'resolved'
    ).length;
    
    const riskScore = risks.reduce((sum, risk) => sum + (risk.probability * risk.impact), 0) / Math.max(risks.length, 1);
    
    const topRisks = risks
      .map(risk => ({
        id: risk.id,
        title: risk.title,
        riskScore: risk.probability * risk.impact
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
    
    const riskTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'; // Would need historical data

    return {
      totalRisks,
      highRisks,
      mitigatedRisks,
      riskScore,
      riskTrend,
      topRisks
    };
  }

  // ============= EVM Calculations =============

  static calculateEVMMetrics(project: ProjectDetailDTO): EVMCalculations {
    const tasks = project.tasks || [];
    const currentDate = new Date();
    const projectStartDate = new Date(project.startDate);
    const projectEndDate = project.endDate ? new Date(project.endDate) : new Date();
    
    const totalDuration = Math.max(1, (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDuration = Math.max(0, (currentDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const plannedValue = project.budget * Math.min(1, elapsedDuration / totalDuration);
    const earnedValue = project.budget * (project.progress / 100);
    const actualCost = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
    
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
    
    const budgetAtCompletion = project.budget;
    const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;

    return {
      plannedValue,
      earnedValue,
      actualCost,
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex,
      budgetAtCompletion,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion
    };
  }

  // ============= Health Score Calculation =============

  static calculateProjectHealthScore(project: ProjectDetailDTO): ProjectHealthScore {
    const progressAnalytics = this.calculateProgressAnalytics(project);
    const budgetAnalytics = this.calculateBudgetAnalytics(project);
    const timelineAnalytics = this.calculateTimelineAnalytics(project);
    const qualityMetrics = this.calculateQualityMetrics(project);
    const riskAnalytics = this.calculateRiskAnalytics(project);
    
    // Schedule score (0-100)
    const schedule = Math.max(0, 100 - (progressAnalytics.delayedTasksCount * 10));
    
    // Budget score (0-100)
    const budget = Math.max(0, 100 - Math.max(0, budgetAnalytics.budgetUtilization - 80) * 2);
    
    // Quality score (0-100)
    const quality = Math.min(100, qualityMetrics.averageInspectionScore);
    
    // Risk score (0-100)
    const risk = Math.max(0, 100 - (riskAnalytics.riskScore * 10));
    
    // Scope score (based on progress)
    const scope = progressAnalytics.overallProgress;
    
    // Stakeholder satisfaction (default to 75, would need actual data)
    const stakeholderSatisfaction = 75;
    
    // Overall score
    const overall = Math.round((schedule + budget + quality + risk + scope + stakeholderSatisfaction) / 6);

    return {
      overall,
      schedule,
      budget,
      quality,
      risk,
      scope,
      stakeholderSatisfaction
    };
  }

  // ============= PERT Analysis =============

  static calculatePERTAnalysis(project: ProjectDetailDTO): PERTAnalysis {
    const tasks = project.tasks || [];
    
    const activities = tasks.map(task => ({
      name: task.name,
      optimistic: task.estimatedDuration * 0.8,
      mostLikely: task.estimatedDuration,
      pessimistic: task.estimatedDuration * 1.5,
      pertEstimate: (task.estimatedDuration * 0.8 + 4 * task.estimatedDuration + task.estimatedDuration * 1.5) / 6,
      standardDeviation: (task.estimatedDuration * 1.5 - task.estimatedDuration * 0.8) / 6
    }));
    
    const expectedDurations: { [taskId: string]: number } = {};
    const variances: { [taskId: string]: number } = {};
    
    tasks.forEach((task, index) => {
      expectedDurations[task.id] = activities[index].pertEstimate;
      variances[task.id] = Math.pow(activities[index].standardDeviation, 2);
    });
    
    const criticalPath = tasks.map(task => task.id); // Simplified, would need proper critical path algorithm
    const totalExpectedDuration = activities.reduce((sum, activity) => sum + activity.pertEstimate, 0);

    return {
      activities,
      expectedDurations,
      criticalPath,
      totalExpectedDuration,
      variances
    };
  }

  // ============= Gantt Chart Generation =============

  static generateGanttChart(project: ProjectDetailDTO): GanttChartData {
    const tasks = project.tasks || [];
    
    const ganttTasks = tasks.map(task => ({
      id: task.id,
      text: task.name,
      start_date: task.startDate,
      duration: task.estimatedDuration,
      progress: task.progress / 100,
      color: task.status === 'completed' ? '#22c55e' : 
             task.status === 'in_progress' ? '#3b82f6' : 
             task.status === 'delayed' ? '#ef4444' : '#6b7280'
    }));
    
    const dependencies: any[] = []; // Would need dependency data from tasks
    
    return {
      tasks: ganttTasks,
      dependencies
    };
  }
}