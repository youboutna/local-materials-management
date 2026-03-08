// @ts-nocheck
// Business logic and calculations service - Hexagonal Architecture
// Following Rule #1: Service orchestrates business logic
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

// Local interfaces to avoid legacy imports
interface PhaseCostData {
  id: string;
  name: string;
  phase_name?: string;
  status: string;
  progress?: number;
  actual_cost?: number;
  project_id?: string;
  estimated_cost?: number;
  budget?: number;
  estimated_labor_cost?: number;
  estimated_material_cost?: number;
  estimated_duration_days?: number;
  start_date?: string;
  end_date?: string;
  steps?: Array<{
    id: string;
    name: string;
    status: string;
    progress?: number;
    tasks?: Array<{
      id: string;
      status: string;
      progress?: number;
      description?: string;
    }>;
    description?: string;
  }>;
}

interface ProjectPayment {
  amount: number;
  phase_id?: string;
  contractor_id?: string;
  contractor_name?: string;
}

interface PhaseCostsResult {
  totalPayments: number;
  totalExpenses: number;
  budgetUtilization: number;
  costVariance: number;
  estimatedVsActual: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  overheadCost: number;
}

interface ResourceUtilization {
  totalEmployees: number;
  employeesByPosition: Record<string, number>;
  totalMaterials: number;
  materialsByType: Record<string, number>;
  equipmentUtilization: number;
  efficiency: number;
}

interface ProgressMetrics {
  stepProgress: number;
  taskProgress: number;
  timeProgress: number;
  weightedProgress: number;
  schedulePerformanceIndex: number;
  productivityIndex: number;
  efficiencyScore: number;
  criticalPath: string[];
  progressTrend: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  performanceIndicators: {
    schedulePerformanceIndex: number;
    costPerformanceIndex: number;
    qualityIndex: number;
    resourceEfficiency: number;
  };
  recommendations: string[];
}

interface ProjectHealthMetrics {
  overallHealth: number;
  scheduleHealth: number;
  budgetHealth: number;
  qualityHealth: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trendDirection: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

// Type definitions to replace legacy imports
interface ProgressAnalytics {
  overallProgress: number;
  phaseProgress: Record<string, number>;
  taskProgress: Record<string, number>;
  delayedTasksCount: number;
  completedTasksCount: number;
  tasksInProgressCount: number;
  pendingTasksCount: number;
}

interface BudgetAnalytics {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  costVariance: number;
}

interface TimelineAnalytics {
  startDate: string;
  endDate: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  timeProgress: number;
  isOnTime: boolean;
}

interface QualityMetrics {
  totalInspections: number;
  completedInspections: number;
  passedInspections: number;
  inspectionPassRate: number;
  qualityScore: number;
}

interface RiskAnalytics {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface EVMCalculations {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
}

interface ProjectHealthScore {
  overallScore: number;
  scheduleScore: number;
  budgetScore: number;
  qualityScore: number;
  riskScore: number;
}

interface PERTAnalysis {
  expectedDurations: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
  };
  expectedDuration: number;
  criticalPath: string[];
  variance: number;
  standardDeviation: number;
}

interface GanttChartData {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
}

interface GanttTask {
  id: string;
  text: string;
  start_date: string;
  duration: number;
  progress: number;
  color: string;
}

interface GanttDependency {
  id: string;
  source: string;
  target: string;
  type: 'finish_to_start';
}

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
    
    const totalBudget = project.budget || 0;
    const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return {
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      budgetUtilization,
      costVariance: totalBudget - totalSpent
    };
  }

  // ============= Timeline Calculations =============

  static calculateTimelineAnalytics(project: ProjectDetailDTO): TimelineAnalytics {
    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const currentDate = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const timeProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    
    return {
      startDate: project.startDate,
      endDate: project.endDate || '',
      totalDays,
      elapsedDays,
      remainingDays,
      timeProgress,
      isOnTime: currentDate <= endDate
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

  // ============= Critical Methods from Utils =============
  
  /**
   * Calculate real project costs from database using Repository
   * Following Rule #1: Service orchestrates business logic
   */
  static async calculateRealProjectCosts(projectId: string): Promise<PhaseCostsResult> {
    try {
      // Get project detail using repository pattern
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      // Extract phases from project detail
      const phases = projectDetail.plannedPhases || [];
      
      // Calculate total costs from phases
      let totalPayments = 0;
      let totalExpenses = 0;
      
      phases.forEach(phase => {
        const phasePayments = projectDetail.expenses?.filter((payment: ProjectPayment) => 
          payment.phase_id === phase.id
        ) || [];
        
        totalPayments += phasePayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Estimate expenses as 20% of phase costs
        const phaseCost = phase.estimated_cost || 0;
        totalExpenses += phaseCost * 0.2;
      });
      
      const totalBudget = projectDetail.budget || 0;
      const budgetUtilization = totalBudget > 0 ? ((totalPayments + totalExpenses) / totalBudget) * 100 : 0;
      
      return {
        totalPayments,
        totalExpenses,
        budgetUtilization,
        costVariance: totalBudget - (totalPayments + totalExpenses),
        estimatedVsActual: totalPayments + totalExpenses,
        laborCost: totalPayments * 0.4, // 40% labor
        materialCost: totalPayments * 0.3, // 30% materials
        equipmentCost: totalPayments * 0.2, // 20% equipment
        overheadCost: totalPayments * 0.1 // 10% overhead
      };
      
    } catch (error) {
      throw new AppError(
        ErrorCode.CALCULATION_ERROR,
        'Failed to calculate project costs',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Calculate costs for a specific phase using Repository
   */
  static async calculatePhaseCosts(projectId: string, phaseId: string): Promise<PhaseCostsResult> {
    try {
      // Get project and phase details using repositories
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const phase = projectDetail.plannedPhases?.find(p => p.id === phaseId);
      if (!phase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }
      
      // Calculate phase-specific costs
      const phasePayments = projectDetail.expenses?.filter((payment: ProjectPayment) => 
        payment.phase_id === phaseId
      ) || [];
      
      const totalPayments = phasePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const estimatedCost = phase.estimated_cost || 0;
      const totalExpenses = estimatedCost * 0.2; // 20% expenses
      
      return {
        totalPayments,
        totalExpenses,
        budgetUtilization: estimatedCost > 0 ? ((totalPayments + totalExpenses) / estimatedCost) * 100 : 0,
        costVariance: estimatedCost - (totalPayments + totalExpenses),
        estimatedVsActual: totalPayments + totalExpenses,
        laborCost: totalPayments * 0.4,
        materialCost: totalPayments * 0.3,
        equipmentCost: totalPayments * 0.2,
        overheadCost: totalPayments * 0.1
      };
      
    } catch (error) {
      throw new AppError(
        ErrorCode.CALCULATION_ERROR,
        'Failed to calculate phase costs',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Calculate resource utilization for a specific phase
   */
  static async calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<ResourceUtilization> {
    try {
      // Get project and phase details
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const phase = projectDetail.plannedPhases?.find(p => p.id === phaseId);
      if (!phase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }
      
      // Calculate resource utilization based on phase data
      const estimatedCost = phase.estimated_cost || 0;
      const actualCost = phase.actual_cost || 0;
      
      return {
        totalEmployees: Math.floor(estimatedCost / 100000), // Simplified calculation
        employeesByPosition: {
          'engineer': Math.floor(estimatedCost / 200000),
          'worker': Math.floor(estimatedCost / 50000)
        },
        totalMaterials: Math.floor(estimatedCost / 1000),
        materialsByType: {
          'cement': Math.floor(estimatedCost / 5000),
          'steel': Math.floor(estimatedCost / 8000)
        },
        equipmentUtilization: actualCost > 0 ? (actualCost / estimatedCost) * 100 : 0,
        efficiency: actualCost > 0 ? Math.min(100, (estimatedCost / actualCost) * 100) : 0
      };
      
    } catch (error) {
      throw new AppError(
        ErrorCode.CALCULATION_ERROR,
        'Failed to calculate resource utilization',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Calculate timeline performance for project analytics
   */
  static calculateTimelinePerformance(project: any, phases: any[]): any {
    // Simplified timeline performance calculation
    const completedPhases = phases?.filter((phase: any) => 
      phase.status === 'completed' || phase.progress >= 100
    ) || [];
    
    const totalPhases = phases?.length || 0;
    const completionRate = totalPhases > 0 ? (completedPhases.length / totalPhases) * 100 : 0;
    
    return {
      completionRate,
      onTimePhases: completedPhases.length,
      delayedPhases: phases?.filter((phase: any) => phase.status === 'delayed')?.length || 0
    };
  }
  
  /**
   * Calculate project health score for analytics
   */
  static calculateProjectHealthScore(progress: number, budgetUtilization: number, schedulePerformance: number, qualityScore?: number): any {
    const overallScore = (
      (progress * 0.3) + 
      (budgetUtilization * 0.3) + 
      (schedulePerformance * 0.2) + 
      ((qualityScore || 85) * 0.2)
    );
    
    return {
      overallScore: Math.round(overallScore),
      scheduleScore: Math.round(schedulePerformance),
      budgetScore: Math.round(budgetUtilization),
      qualityScore: Math.round(qualityScore || 85),
      riskScore: Math.round(100 - overallScore)
    };
  }
}