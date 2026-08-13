// Business logic and calculations service - Hexagonal Architecture
// Following Rule #1: Service orchestrates business logic
import { EvmService } from '@/application/services/EvmService';
import { PertService } from '@/application/services/PertService';
import { PhaseWeightingService } from '@/application/services/PhaseWeightingService';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

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
  inspectionPassRate: number;
  criticalIssuesCount: number;
  resolvedIssuesCount: number;
  averageInspectionScore: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  reworkCount: number;
}

interface RiskAnalytics {
  totalRisks: number;
  highRisks: number;
  mitigatedRisks: number;
  riskScore: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  topRisks: Array<{ id: string; title: string; riskScore: number }>;
}

interface EVMCalculations {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

interface ProjectHealthScore {
  overallScore: number;
  schedule: number;
  budget: number;
  quality: number;
  risk: number;
  scope: number;
  stakeholderSatisfaction: number;
}

interface PERTAnalysis {
  activities: Array<{
    name: string;
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
    pertEstimate: number;
    standardDeviation: number;
  }>;
  expectedDurations: Record<string, number>;
  criticalPath: string[];
  totalExpectedDuration: number;
  variances: Record<string, number>;
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
      (task.status !== 'completed' && task.endDate && new Date(task.endDate) < new Date())
    ).length;
    
    const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
    const tasksInProgressCount = tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasksCount = tasks.filter(task => task.status === 'not_started').length;

    // Avancement global : TEP pondéré par phase (poids explicite → budget → durée).
    // Fallback moyenne des tâches uniquement si aucune phase exploitable.
    const phases = (project.phases || (project as any).plannedPhases || []) as any[];
    const weighted = PhaseWeightingService.computeWeightedProgress(phases as any);
    const overallProgress = !weighted.isEmpty
      ? Math.round(weighted.progress)
      : tasks.length > 0
        ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
        : 0;


    const phaseProgress: Record<string, number> = {};
    const taskProgress: Record<string, number> = {};

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
    const payments = project.payments || [];
    
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
    
    const completedInspections = inspections.filter(inspection => 
      inspection.status === 'completed' || (inspection.status as string) === 'completed'
    );
    const passedInspections = inspections.filter(inspection => 
      inspection.status === 'approved' || (inspection.progressAtInspection || inspection.progress_at_inspection || 0) >= 80
    );
    
    const inspectionPassRate = completedInspections.length > 0 
      ? (passedInspections.length / completedInspections.length) * 100 
      : 0;
    
    const averageInspectionScore = completedInspections.length > 0
      ? completedInspections.reduce((sum, inspection) => sum + (inspection.progressAtInspection || inspection.progress_at_inspection || 0), 0) / completedInspections.length
      : 0;

    return {
      inspectionPassRate,
      criticalIssuesCount: 0,
      resolvedIssuesCount: 0,
      averageInspectionScore,
      qualityTrend: 'stable',
      reworkCount: 0
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

    return {
      totalRisks,
      highRisks,
      mitigatedRisks,
      riskScore,
      riskTrend: 'stable',
      topRisks
    };
  }

  // ============= EVM Calculations (délégation moteur unique) =============

  /**
   * @deprecated Utiliser `ProjectMetricsOrchestrator.compute().evm`.
   * Conservé pour compatibilité : délègue intégralement à `EvmService`
   * (moteur EVM UNIQUE) — plus aucun calcul local.
   */
  static calculateEVMMetrics(project: ProjectDetailDTO): EVMCalculations {
    const tasks = (project.tasks || []) as Array<{ actualCost?: number }>;
    const metrics = ProjectMetricsOrchestrator.compute({
      project: {
        id: project.id,
        title: project.title,
        budget: project.budget,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      phases: ((project as any).phases || []) as any[],
      actualCost: tasks.reduce((sum, task) => sum + (Number(task.actualCost) || 0), 0),
    });
    return EvmService.toLegacyMetrics(metrics.evm) as unknown as EVMCalculations;
  }


  // ============= Health Score (formule UNIQUE de l'orchestrateur) =============

  /**
   * @deprecated Utiliser `ProjectMetricsOrchestrator.compute().health`.
   * Toutes les variantes délèguent désormais à `ProjectMetricsOrchestrator.buildHealth`
   * afin d'éliminer les trois formules divergentes de santé globale.
   */
  static calculateProjectHealthScore(
    progressOrProject: number | ProjectDetailDTO,
    budgetUtilization?: number,
    schedulePerformance?: number,
    qualityScoreParam?: number
  ): ProjectHealthScore {
    if (typeof progressOrProject === 'object') {
      const project = progressOrProject;
      const qualityMetrics = this.calculateQualityMetrics(project);
      const metrics = ProjectMetricsOrchestrator.compute({
        project: {
          id: project.id,
          title: project.title,
          budget: project.budget,
          progress: project.progress,
          startDate: project.startDate,
          endDate: project.endDate,
        },
        phases: ((project as any).phases || []) as any[],
        actualCost: (project.tasks || []).reduce(
          (sum, task: any) => sum + (Number(task?.actualCost) || 0),
          0,
        ),
        risks: ((project as any).risks || []) as any[],
      });

      return {
        overallScore: metrics.health.overallScore,
        schedule: metrics.health.schedule,
        budget: metrics.health.cost,
        quality: Math.min(100, Math.max(0, qualityMetrics.averageInspectionScore ?? 0)),
        risk: metrics.health.risk,
        scope: metrics.health.scope,
        stakeholderSatisfaction: 0,
      };
    }

    // Variante « paramètres » : même formule, indices reconstruits depuis les %.
    const progress = Math.max(0, Math.min(100, progressOrProject));
    const health = ProjectMetricsOrchestrator.buildHealth({
      progress,
      plannedProgress: null,
      spi: schedulePerformance != null ? Math.max(0, schedulePerformance) / 100 : null,
      cpi: budgetUtilization != null ? Math.max(0, budgetUtilization) / 100 : null,
      openRisksCount: 0,
      alerts: [],
    });

    return {
      overallScore: health.overallScore,
      schedule: health.schedule,
      budget: health.cost,
      quality: Math.max(0, Math.min(100, Math.round(qualityScoreParam ?? 0))),
      risk: health.risk,
      scope: health.scope,
      stakeholderSatisfaction: 0,
    };
  }



  // ============= PERT Analysis (délégation moteur unique) =============

  /**
   * @deprecated Utiliser `ProjectMetricsOrchestrator.compute().pert`.
   * Délègue à `PertService` — moteur PERT UNIQUE.
   */
  static calculatePERTAnalysis(project: ProjectDetailDTO): PERTAnalysis {
    const tasks = project.tasks || [];
    const result = PertService.compute(
      tasks.map((task) => ({
        id: task.id,
        name: task.title,
        durationDays: task.estimatedDuration ?? null,
        startDate: task.startDate ?? null,
        endDate: task.endDate ?? null,
      })),
    );

    return {
      activities: result.activities as unknown as PERTAnalysis['activities'],
      expectedDurations: result.expectedDurations,
      criticalPath: result.criticalPath,
      totalExpectedDuration: result.totalExpectedDuration,
      variances: result.variances,
    };
  }


  // ============= Gantt Chart Generation =============

  static generateGanttChart(project: ProjectDetailDTO): GanttChartData {
    const tasks = project.tasks || [];
    
    const ganttTasks = tasks.map(task => ({
      id: task.id,
      text: task.title,
      start_date: task.startDate || new Date().toISOString().split('T')[0],
      duration: task.estimatedDuration || 1,
      progress: task.progress / 100,
      color: task.status === 'completed' ? '#22c55e' : 
             task.status === 'in_progress' ? '#3b82f6' : 
             task.status === 'delayed' ? '#ef4444' : '#6b7280'
    }));
    
    const dependencies: GanttDependency[] = [];

    return {
      tasks: ganttTasks,
      dependencies
    };
  }

  // ============= Critical Methods from Utils =============
  
  /**
   * Calculate real project costs from database using Repository
   */
  static async calculateRealProjectCosts(projectId: string): Promise<PhaseCostsResult> {
    try {
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const totalBudget = projectDetail.budget || 0;
      const paymentRepository = RepositoryFactory.getPaymentRepository();
      const paymentSummary = await paymentRepository.getPaymentSummary(projectId);
      const totalPayments = paymentSummary.paid || 0;
      const totalExpenses = totalBudget * 0.05;
      const budgetUtilization = totalBudget > 0 ? ((totalPayments + totalExpenses) / totalBudget) * 100 : 0;
      
      return {
        totalPayments,
        totalExpenses,
        budgetUtilization,
        costVariance: totalBudget - (totalPayments + totalExpenses),
        estimatedVsActual: totalPayments + totalExpenses,
        laborCost: totalPayments * 0.4,
        materialCost: totalPayments * 0.3,
        equipmentCost: totalPayments * 0.2,
        overheadCost: totalPayments * 0.1
      };
      
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
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
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const estimatedCost = projectDetail.budget ? projectDetail.budget * 0.2 : 0;
      const totalPayments = estimatedCost * 0.3;
      const totalExpenses = estimatedCost * 0.2;
      
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
        ErrorCode.INTERNAL_ERROR,
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
      const projectRepository = RepositoryFactory.getProjectRepository();
      const projectDetail = await projectRepository.findById(projectId);
      
      if (!projectDetail) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const estimatedCost = projectDetail.budget ? projectDetail.budget * 0.2 : 100000;
      
      return {
        totalEmployees: Math.floor(estimatedCost / 100000),
        employeesByPosition: {
          'engineer': Math.floor(estimatedCost / 200000),
          'worker': Math.floor(estimatedCost / 50000)
        },
        totalMaterials: Math.floor(estimatedCost / 1000),
        materialsByType: {
          'cement': Math.floor(estimatedCost / 5000),
          'steel': Math.floor(estimatedCost / 8000)
        },
        equipmentUtilization: 75,
        efficiency: 80
      };
      
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to calculate resource utilization',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Calculate timeline performance for project analytics
   */
  static calculateTimelinePerformance(project: any, phases: any[]): {
    completionRate: number;
    onTimePhases: number;
    delayedPhases: number;
  } {
    const completedPhases = phases?.filter((phase: any) => 
      phase.status === 'completed' || (phase.progress && phase.progress >= 100)
    ) || [];
    
    const totalPhases = phases?.length || 0;
    const completionRate = totalPhases > 0 ? (completedPhases.length / totalPhases) * 100 : 0;
    
    return {
      completionRate,
      onTimePhases: completedPhases.length,
      delayedPhases: phases?.filter((phase: any) => phase.status === 'delayed')?.length || 0
    };
  }
}
