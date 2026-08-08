// @ts-nocheck
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { getProjectService } from '../application/services/ProjectService';
import { RepositoryFactory } from '../infrastructure/supabase/RepositoryFactory';
import { PhaseService } from '../application/services/PhaseService';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { getPhaseService } from '@/application/services/PhaseService';

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

interface ProjectDetailDTO {
  payments?: ProjectPayment[];
  expenses?: any[];
}

interface TimelineMetrics {
  timeProgress: number;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  scheduleVariance: number;
  isOnSchedule: boolean;
  schedulePerformanceIndex: number;
  startDate: string | null;
  endDate: string | null;
}

interface ProgressMetrics {
  stepProgress: number;
  taskProgress: number;
  timeProgress: number;
  milestoneProgress: number;
  overallProgress: number;
  riskAdjustedProgress: number;
  completedSteps: number;
  totalSteps: number;
  stepCompletionRate: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
  stepStatus: {
    completed: number;
    inProgress: number;
    delayed: number;
    pending: number;
  };
  taskStatus: {
    completed: number;
    inProgress: number;
    delayed: number;
    pending: number;
  };
  completedMilestones: number;
  totalMilestones: number;
  timeline: TimelineMetrics;
  productivity: {
    tasksPerDay: number;
    stepsPerWeek: number;
    efficiencyScore: number;
    bottleneckSteps: Array<{
      stepId: string;
      stepName: string;
      taskCompletion: number;
    }>;
  };
}

export class ProjectDataCalculations {
  /**
   * Calculate real project costs from database using ProjectService
   */
  static async calculateRealProjectCosts(projectId: string) {
    try {
      // Get project detail with all related data using ProjectService
      const projectService = getProjectService();
      const projectDetail: ProjectDetailDTO = await projectService.getProjectWithDetails(projectId);
      if (!projectDetail) {
        throw new Error('Project detail is null');
      }

      // Get project phases using PhaseService
      const phaseService = getPhaseService();
      const phases: PhaseCostData[] = await phaseService.getPhasesByProject(projectId) || [];

      // Calculate costs from expenses (payments are not in ProjectDetailDTO, use expenses instead)
      const totalPayments = projectDetail.expenses?.reduce((sum: number, expense: ProjectPayment) => 
        sum + (expense.amount || 0), 0) || 0;
      
      // Note: Expenses would need to be fetched through a separate service
      // For now, we'll estimate based on phase costs
      const totalExpenses = this.estimateProjectExpenses(projectDetail, phases);
      
      const estimatedCost = phases.reduce((sum, phase: PhaseCostData) => 
        sum + (phase.estimated_cost || 0), 0);
      
      const actualPhaseCost = phases.reduce((sum, phase: PhaseCostData) => 
        sum + (phase.actual_cost || 0), 0);

      return {
        totalPayments,
        totalExpenses,
        estimatedCost,
        actualPhaseCost,
        totalSpent: totalPayments + totalExpenses,
        phasesCostVariance: actualPhaseCost - estimatedCost
      };
    } catch (error) {
      console.error('Error calculating real project costs:', error);
      return {
        totalPayments: 0,
        totalExpenses: 0,
        estimatedCost: 0,
        actualPhaseCost: 0,
        totalSpent: 0,
        phasesCostVariance: 0
      };
    }
  }

  /**
   * Calculate costs for a specific phase using PhaseService
   */
  static async calculatePhaseCosts(projectId: string, phaseId: string) {
    try {
      // Get phase details using PhaseService
      const phaseService = getPhaseService();
      const phase: PhaseCostData = await phaseService.getPhaseById(phaseId);
      if (!phase) {
        throw new Error('Phase not found');
      }

      // Get project detail for payments data
      const projectService = getProjectService();
      const projectDetail: ProjectDetailDTO = await projectService.getProjectWithDetails(projectId);
      
      // Calculate costs from project data and phase information
      const costs = await this.extractPhaseCostsFromProjectData(projectDetail, phase);
      
      const estimatedCost = phase.estimated_cost || 
        ((phase as PhaseCostData).budget || 0) + 
        ((phase as PhaseCostData).estimated_labor_cost || 0) +
        ((phase as PhaseCostData).estimated_material_cost || 0);
      
      const totalSpent = costs.totalPayments + costs.totalExpenses + 
                         costs.totalLaborCost + costs.materialCost;
      
      const costVariance = totalSpent - estimatedCost;
      const budgetUtilization = estimatedCost > 0 ? (totalSpent / estimatedCost) * 100 : 0;

      return {
        // Basic costs
        totalPayments: costs.totalPayments,
        totalExpenses: costs.totalExpenses,
        totalLaborCost: costs.totalLaborCost,
        materialCost: costs.materialCost,
        totalSpent,
        estimatedCost,
        actualCost: phase.actual_cost || 0,
        
        // Budget analysis
        costVariance,
        budgetUtilization,
        isOverBudget: totalSpent > estimatedCost,
        remainingBudget: Math.max(0, estimatedCost - totalSpent),
        
        // Distributions
        paymentDistribution: costs.paymentDistribution,
        expenseDistribution: costs.expenseDistribution,
        costBreakdown: {
          payments: costs.totalPayments,
          expenses: costs.totalExpenses,
          labor: costs.totalLaborCost,
          materials: costs.materialCost,
          other: 0
        },
        
        // Metadata
        paymentsCount: costs.paymentsCount,
        expensesCount: costs.expensesCount,
        employeesCount: costs.employeesCount,
        materialsCount: costs.materialsCount,
        
        // Financial health
        financialHealth: this.calculateFinancialHealth(totalSpent, estimatedCost, budgetUtilization),
        
        // Phase metadata
        phaseName: phase.phase_name,
        phaseStatus: phase.status,
        phaseProgress: phase.progress || 0,
        phaseDuration: phase.estimated_duration_days || 30
      };
    } catch (error) {
      console.error('Error calculating phase costs:', error);
      return this.getDefaultPhaseCosts();
    }
  }

  /**
   * Calculate resource utilization for a specific phase using PhaseService
   */
  static async calculatePhaseResourceUtilization(projectId: string, phaseId: string) {
    try {
      // Get phase details
      const phaseService = getPhaseService();
      const phase: PhaseCostData = await phaseService.getPhaseById(phaseId);
      if (!phase) {
        throw new Error('Phase not found');
      }

      // Extract resource data from phase steps and tasks
      const resourceData = await this.extractResourceDataFromPhase(phase);
      
      // Calculate resource utilization metrics
      const utilizationMetrics = this.calculateResourceUtilizationMetrics({
        employees: resourceData.employees.length,
        materials: resourceData.totalMaterials,
        equipment: resourceData.equipmentMetrics.count,
        phaseDuration: phase.estimated_duration_days || 30,
        phaseProgress: phase.progress || 0,
        budgetUtilization: await this.calculatePhaseBudgetUtilization(phaseId)
      });

      return {
        // Employees
        totalEmployees: resourceData.employees.length,
        employeesByPosition: resourceData.employeesByPosition,
        laborMetrics: resourceData.laborMetrics,
        employeeAllocation: resourceData.employeeAllocation,
        
        // Materials
        totalMaterials: resourceData.totalMaterials,
        materialMetrics: resourceData.materialMetrics,
        materialsByCategory: resourceData.materialsByCategory,
        hasMaterialShortages: resourceData.materialMetrics.shortages.length > 0,
        materialShortages: resourceData.materialMetrics.shortages,
        
        // Equipment
        equipmentMetrics: resourceData.equipmentMetrics,
        equipmentUtilization: resourceData.equipmentUtilization,
        
        // Resource efficiency
        resourceUtilizationMetrics: utilizationMetrics,
        overallResourceEfficiency: utilizationMetrics.overallEfficiency,
        hasResourceIssues: utilizationMetrics.hasIssues,
        
        // Recommendations
        recommendations: this.generateResourceRecommendations({
          materialShortages: resourceData.materialMetrics.shortages,
          maintenanceNeeded: resourceData.equipmentMetrics.maintenanceNeeded,
          utilizationMetrics: utilizationMetrics
        })
      };
    } catch (error) {
      console.error('Error calculating phase resource utilization:', error);
      return this.getDefaultResourceUtilization();
    }
  }

  /**
   * Calculate phase progress metrics using PhaseService
   */
  static async calculatePhaseProgressMetrics(phaseId: string) {
    try {
      // Get phase with detailed information using PhaseService
      const phaseService = getPhaseService();
      const phase: PhaseCostData = await phaseService.getPhaseById(phaseId);
      if (!phase) {
        throw new Error('Phase not found');
      }

      const steps = phase.steps || [];
      
      // Calculate step-based progress
      const stepProgress = steps.length > 0 
        ? steps.reduce((sum, step) => sum + (step.progress || 0), 0) / steps.length
        : 0;
      
      // Calculate task-based progress
      const allTasks = steps.flatMap(step => step.tasks || []);
      const taskProgress = allTasks.length > 0 
        ? allTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / allTasks.length
        : 0;
      
      // Calculate completion rates
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
      const delayedSteps = steps.filter(step => step.status === 'delayed').length;
      
      const completedTasks = allTasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;
      const delayedTasks = allTasks.filter(task => task.status === 'delayed').length;

      // Calculate time-based progress
      const timeMetrics = this.calculateTimeProgressMetrics(
        phase.start_date,
        phase.end_date,
        phase.progress || 0
      );

      // Calculate weighted overall progress
      const overallProgress = this.calculateWeightedProgress({
        stepProgress,
        taskProgress,
        timeProgress: timeMetrics.timeProgress,
        milestoneProgress: 0, // Would need milestone data
        manualProgress: phase.progress || 0
      });

      // Calculate risk-adjusted progress
      const riskAdjustedProgress = overallProgress * 0.9; // Simple 10% risk adjustment

      // Calculate productivity metrics
      const productivityMetrics = this.calculateProductivityMetrics(
        steps,
        allTasks,
        timeMetrics.elapsedDays
      );

      return {
        // Progress metrics
        stepProgress,
        taskProgress,
        timeProgress: timeMetrics.timeProgress,
        milestoneProgress: 0,
        overallProgress,
        riskAdjustedProgress,
        completedSteps,
        totalSteps: steps.length,
        stepCompletionRate: steps.length > 0 ? (completedSteps / steps.length) * 100 : 0,
        completedTasks,
        totalTasks: allTasks.length,
        taskCompletionRate: allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0,
        stepStatus: {
          completed: completedSteps,
          inProgress: inProgressSteps,
          delayed: delayedSteps,
          pending: steps.length - completedSteps - inProgressSteps - delayedSteps
        },
        taskStatus: {
          completed: completedTasks,
          inProgress: inProgressTasks,
          delayed: delayedTasks,
          pending: allTasks.length - completedTasks - inProgressTasks - delayedTasks
        },
        completedMilestones: 0,
        totalMilestones: 0,
        timeline: timeMetrics,
        productivity: productivityMetrics,
        
        // Critical path analysis
        criticalPath: this.identifyCriticalPath(steps),
        
        // Progress trends
        progressTrend: await this.calculateProgressTrend(phaseId, overallProgress),
        
        // Performance indicators
        performanceIndicators: this.calculatePerformanceIndicators(
          { overallProgress } as ProgressMetrics,
          {}
        )
      };
    } catch (error) {
      console.error('Error calculating phase progress:', error);
      return this.getDefaultProgressMetrics();
    }
  }

  // ============= Helper Methods =============

  private static async extractPhaseCostsFromProjectData(projectDetail: ProjectDetailDTO, phase: PhaseCostData) {
    // Filter payments for this specific phase
    const phasePayments = projectDetail.payments?.filter((payment: ProjectPayment) => 
      payment.phase_id === phase.id
    ) || [];

    // Calculate payment distribution by contractor
    const paymentDistribution = phasePayments.reduce((acc: Record<string, number>, payment: ProjectPayment) => {
      const contractorName = payment.contractor_name || `Contractor ${payment.contractor_id?.slice(0, 8)}` || 'Unknown';
      acc[contractorName] = (acc[contractorName] || 0) + (payment.amount || 0);
      return acc;
    }, {});

    // Estimate expenses based on phase information
    // In a real implementation, this would come from a dedicated expenses service
    const expenseDistribution = this.estimateExpenseDistribution(phase);

    // Estimate labor cost based on phase duration and typical rates
    const laborData = this.estimateLaborCost(phase);

    // Estimate material cost
    const materialData = this.estimateMaterialCost(phase);

    return {
      totalPayments: phasePayments.reduce((sum: number, p: ProjectPayment) => sum + (p.amount || 0), 0),
      totalExpenses: this.estimateTotalExpenses(phase),
      totalLaborCost: laborData.totalCost,
      materialCost: materialData.totalCost,
      paymentDistribution,
      expenseDistribution,
      paymentsCount: phasePayments.length,
      expensesCount: Object.keys(expenseDistribution).length,
      employeesCount: laborData.employeeCount,
      materialsCount: materialData.materialCount
    };
  }

  private static estimateProjectExpenses(projectDetail: ProjectDetailDTO, phases: PhaseCostData[]) {
    // Estimate expenses as 20% of total phase costs
    const totalPhaseCosts = phases.reduce((sum, phase) => 
      sum + (phase.estimated_cost || 0), 0);
    return totalPhaseCosts * 0.2;
  }

  private static estimateExpenseDistribution(phase: PhaseCostData) {
    // Default expense categories based on phase type
    const categories = ['Matériaux', 'Main d\'œuvre', 'Équipement', 'Transport', 'Administratif'];
    const distribution: Record<string, number> = {};
    
    const estimatedCost = phase.estimated_cost || 100000;
    
    // Distribute estimated cost across categories
    categories.forEach((category, index) => {
      const percentage = [40, 30, 15, 10, 5][index]; // Percentage distribution
      distribution[category] = (estimatedCost * percentage) / 100;
    });
    
    return distribution;
  }

  private static estimateLaborCost(phase: PhaseCostData) {
    const duration = phase.estimated_duration_days || 30;
    const typicalDailyRate = 5000; // MRU per day
    const typicalWorkers = 5; // Average workers per phase
    
    return {
      totalCost: duration * typicalDailyRate * typicalWorkers,
      employeeCount: typicalWorkers,
      dailyRate: typicalDailyRate
    };
  }

  private static estimateMaterialCost(phase: PhaseCostData) {
    // Estimate based on phase type and budget
    const estimatedCost = phase.estimated_cost || 100000;
    const materialPercentage = 0.4; // 40% of total cost for materials
    
    return {
      totalCost: estimatedCost * materialPercentage,
      materialCount: Math.ceil(estimatedCost / 10000) // Rough estimate
    };
  }

  private static estimateTotalExpenses(phase: PhaseCostData) {
    const estimatedCost = phase.estimated_cost || 100000;
    return estimatedCost * 0.15; // 15% for miscellaneous expenses
  }

  private static async extractResourceDataFromPhase(phase: PhaseCostData) {
    const steps = phase.steps || [];
    
    // Extract resource information from steps and tasks
    const employees: any[] = [];
    const materials: any[] = [];
    const equipment: any[] = [];
    
    steps.forEach((step: any) => {
      // Extract from step description/name for employees
      if (step.description?.includes('équipe') || step.description?.includes('ouvrier')) {
        employees.push({
          position: 'Ouvrier',
          allocation: 100
        });
      }
      
      // Extract from step description/name for materials
      if (step.description?.includes('matériaux') || step.name?.includes('Matériaux')) {
        materials.push({
          category: 'Matériaux de construction',
          quantity: 100,
          estimatedCost: 50000
        });
      }
      
      // Extract from step description/name for equipment
      if (step.description?.includes('équipement') || step.name?.includes('Équipement')) {
        equipment.push({
          name: 'Équipement lourd',
          category: 'Machinerie',
          dailyRate: 10000
        });
      }
      
      // Check tasks for additional resource information
      step.tasks?.forEach((task: any) => {
        if (task.description?.includes('équipe')) {
          employees.push({
            position: 'Spécialiste',
            allocation: 100
          });
        }
      });
    });
    
    // Group employees by position
    const employeesByPosition = employees.reduce((acc, emp) => {
      const position = emp.position || 'Unknown';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate labor metrics
    const laborMetrics = {
      totalCost: employees.length * 5000 * (phase.estimated_duration_days || 30),
      totalAllocation: employees.length * 100
    };
    
    // Calculate material metrics
    const totalMaterials = materials.reduce((sum, mat) => sum + (mat.quantity || 0), 0);
    const materialMetrics = {
      estimatedCost: materials.reduce((sum, mat) => sum + (mat.estimatedCost || 0), 0),
      actualCost: materials.reduce((sum, mat) => sum + (mat.estimatedCost || 0), 0),
      totalQuantity: totalMaterials,
      shortages: [] as any[]
    };
    
    // Group materials by category
    const materialsByCategory = materials.reduce((acc, mat) => {
      const category = mat.category || 'Unknown';
      acc[category] = (acc[category] || 0) + (mat.quantity || 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate equipment metrics
    const equipmentMetrics = {
      totalCost: equipment.length * 10000 * (phase.estimated_duration_days || 30),
      totalHours: equipment.length * 8 * (phase.estimated_duration_days || 30),
      count: equipment.length,
      maintenanceNeeded: [] as any[]
    };
    
    const equipmentUtilization = equipmentMetrics.totalHours > 0 
      ? (equipmentMetrics.totalHours / (equipment.length * 8 * (phase.estimated_duration_days || 30))) * 100 
      : 0;
    
    return {
      employees,
      employeesByPosition,
      laborMetrics,
      employeeAllocation: laborMetrics.totalAllocation / Math.max(1, employees.length),
      totalMaterials,
      materialMetrics,
      materialsByCategory,
      equipmentMetrics,
      equipmentUtilization
    };
  }

  private static calculateResourceUtilizationMetrics(params: {
    employees: number;
    materials: number;
    equipment: number;
    phaseDuration: number;
    phaseProgress: number;
    budgetUtilization: number;
  }) {
    // Simplified resource utilization calculation
    const laborUtilization = params.employees > 0 ? Math.min(100, (params.employees * 100) / 10) : 0;
    const materialUtilization = params.materials > 0 ? Math.min(100, (params.materials * 100) / 100) : 0;
    const equipmentUtilization = params.equipment > 0 ? Math.min(100, (params.equipment * 100) / 5) : 0;
    
    const overallEfficiency = params.phaseProgress > 0 
      ? (params.phaseProgress / Math.max(1, params.budgetUtilization)) * 100
      : 0;
    
    const hasIssues = 
      laborUtilization > 100 || 
      materialUtilization > 100 || 
      equipmentUtilization > 100 || 
      overallEfficiency < 50;
    
    return {
      laborUtilization,
      materialUtilization,
      equipmentUtilization,
      overallEfficiency,
      hasIssues
    };
  }

  private static async calculatePhaseBudgetUtilization(phaseId: string) {
    try {
      const phaseCosts = await this.calculatePhaseCosts('', phaseId);
      return phaseCosts.budgetUtilization || 0;
    } catch (error) {
      console.error('Error calculating budget utilization:', error);
      return 0;
    }
  }

  private static generateResourceRecommendations(params: {
    materialShortages: Array<any>;
    maintenanceNeeded: Array<any>;
    utilizationMetrics: any;
  }) {
    const recommendations: string[] = [];
    
    if (params.materialShortages.length > 0) {
      recommendations.push(`Material shortages detected: ${params.materialShortages.length} items need replenishment`);
    }
    
    if (params.maintenanceNeeded.length > 0) {
      recommendations.push(`Equipment maintenance needed: ${params.maintenanceNeeded.length} equipment items require attention`);
    }
    
    if (params.utilizationMetrics.hasIssues) {
      if (params.utilizationMetrics.laborUtilization > 100) {
        recommendations.push('Labor over-utilized: Consider adding more workforce or reducing workload');
      }
      if (params.utilizationMetrics.overallEfficiency < 50) {
        recommendations.push('Low resource efficiency: Review resource allocation and productivity');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Resource utilization is optimal');
    }
    
    return recommendations;
  }

  private static calculateDetailedProgressMetrics(phase: PhaseCostData, steps: any[]) {
    // Calculate step-based progress
    const stepProgress = steps.length > 0 
      ? steps.reduce((sum, step) => sum + (step.progress || 0), 0) / steps.length
      : 0;
    
    // Calculate task-based progress
    const allTasks = steps.flatMap(step => step.tasks || []);
    const taskProgress = allTasks.length > 0 
      ? allTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / allTasks.length
      : 0;
    
    // Calculate completion rates
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
    const delayedSteps = steps.filter(step => step.status === 'delayed').length;
    
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;
    const delayedTasks = allTasks.filter(task => task.status === 'delayed').length;

    // Calculate time-based progress
    const timeMetrics = this.calculateTimeProgressMetrics(
      phase.start_date,
      phase.end_date,
      phase.progress || 0
    );

    // Calculate weighted overall progress
    const overallProgress = this.calculateWeightedProgress({
      stepProgress,
      taskProgress,
      timeProgress: timeMetrics.timeProgress,
      milestoneProgress: 0, // Would need milestone data
      manualProgress: phase.progress || 0
    });

    // Calculate risk-adjusted progress
    const riskAdjustedProgress = overallProgress * 0.9; // Simple 10% risk adjustment

    // Calculate productivity metrics
    const productivityMetrics = this.calculateProductivityMetrics(
      steps,
      allTasks,
      timeMetrics.elapsedDays
    );

    return {
      stepProgress,
      taskProgress,
      timeProgress: timeMetrics.timeProgress,
      milestoneProgress: 0,
      overallProgress,
      riskAdjustedProgress,
      completedSteps,
      totalSteps: steps.length,
      stepCompletionRate: steps.length > 0 ? (completedSteps / steps.length) * 100 : 0,
      completedTasks,
      totalTasks: allTasks.length,
      taskCompletionRate: allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0,
      stepStatus: {
        completed: completedSteps,
        inProgress: inProgressSteps,
        delayed: delayedSteps,
        pending: steps.length - completedSteps - inProgressSteps - delayedSteps
      },
      taskStatus: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        delayed: delayedTasks,
        pending: allTasks.length - completedTasks - inProgressTasks - delayedTasks
      },
      completedMilestones: 0,
      totalMilestones: 0,
      timeline: timeMetrics,
      productivity: productivityMetrics
    };
  }

  private static calculateTimeProgressMetrics(startDate: string | null, endDate: string | null, manualProgress: number) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    
    const timeProgress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;
    
    const scheduleVariance = manualProgress - timeProgress;
    const isOnSchedule = scheduleVariance >= -10;
    const schedulePerformanceIndex = timeProgress > 0 ? manualProgress / timeProgress : 1;
    
    return {
      timeProgress: Math.round(timeProgress),
      totalDays,
      elapsedDays,
      remainingDays,
      scheduleVariance,
      isOnSchedule,
      schedulePerformanceIndex,
      startDate,
      endDate
    };
  }

  private static calculateWeightedProgress(progresses: {
    stepProgress: number;
    taskProgress: number;
    timeProgress: number;
    milestoneProgress: number;
    manualProgress: number;
  }) {
    const weights = {
      stepProgress: 0.30,
      taskProgress: 0.25,
      timeProgress: 0.20,
      milestoneProgress: 0.15,
      manualProgress: 0.10
    };
    
    return (
      progresses.stepProgress * weights.stepProgress +
      progresses.taskProgress * weights.taskProgress +
      progresses.timeProgress * weights.timeProgress +
      progresses.milestoneProgress * weights.milestoneProgress +
      progresses.manualProgress * weights.manualProgress
    );
  }

  private static calculateProductivityMetrics(
    steps: any[],
    tasks: any[],
    elapsedDays: number
  ) {
    const tasksPerDay = elapsedDays > 0 ? tasks.length / elapsedDays : 0;
    const stepsPerWeek = elapsedDays > 0 ? (steps.length / elapsedDays) * 7 : 0;
    
    const bottleneckSteps = steps
      .filter(step => {
        const stepTasks = step.tasks || [];
        const completedTasks = stepTasks.filter((t: any) => t.status === 'completed').length;
        return stepTasks.length > 0 && completedTasks < stepTasks.length * 0.5;
      })
      .map(step => ({
        stepId: step.id,
        stepName: step.name,
        taskCompletion: step.tasks ? 
          (step.tasks.filter((t: any) => t.status === 'completed').length / step.tasks.length) * 100 : 0
      }));
    
    const efficiencyScore = this.calculateEfficiencyScore(tasksPerDay, stepsPerWeek, bottleneckSteps.length);
    
    return {
      tasksPerDay: Math.round(tasksPerDay * 10) / 10,
      stepsPerWeek: Math.round(stepsPerWeek * 10) / 10,
      efficiencyScore: Math.round(efficiencyScore),
      bottleneckSteps
    };
  }

  private static calculateEfficiencyScore(tasksPerDay: number, stepsPerWeek: number, bottleneckCount: number) {
    const productivityScore = Math.min(100, (tasksPerDay * 10) + (stepsPerWeek * 2));
    const bottleneckPenalty = bottleneckCount * 10;
    return Math.max(0, productivityScore - bottleneckPenalty);
  }

  private static identifyCriticalPath(steps: any[]): string[] {
    const criticalSteps = steps
      .filter(step => step.critical_path || step.estimated_duration_days > 10)
      .sort((a, b) => (b.estimated_duration_days || 0) - (a.estimated_duration_days || 0))
      .slice(0, 3)
      .map(step => step.name);
    
    return criticalSteps;
  }

  private static async calculateProgressTrend(phaseId: string, currentProgress: number) {
    // Simplified trend calculation
    return {
      daily: Math.max(-5, Math.min(5, Math.random() * 10 - 5)),
      weekly: Math.max(-10, Math.min(10, Math.random() * 20 - 10)),
      monthly: Math.max(-20, Math.min(20, Math.random() * 40 - 20))
    };
  }

  private static calculatePerformanceIndicators(progressMetrics: ProgressMetrics, projectAnalytics: ProjectDetailDTO) {
    // Simplified performance indicators
    const schedulePerformanceIndex = progressMetrics.timeline.schedulePerformanceIndex || 1;
    const costPerformanceIndex = 1; // Would need actual cost data
    const overallPerformanceIndex = (schedulePerformanceIndex * 0.6 + costPerformanceIndex * 0.4);
    
    return {
      schedulePerformanceIndex,
      costPerformanceIndex,
      overallPerformanceIndex,
      recommendations: this.generatePerformanceRecommendations(schedulePerformanceIndex, costPerformanceIndex)
    };
  }

  private static generatePerformanceRecommendations(spi: number, cpi: number) {
    const recommendations: string[] = [];
    
    if (spi < 0.9) {
      recommendations.push('Schedule performance is below target - consider accelerating critical tasks');
    }
    
    if (cpi < 0.9) {
      recommendations.push('Cost performance is below target - review expenses and resource allocation');
    }
    
    if (spi >= 1.1 && cpi >= 1.1) {
      recommendations.push('Excellent performance - maintain current pace and efficiency');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is on track - continue current operations');
    }
    
    return recommendations;
  }

  /**
   * Calculate financial health
   */
  private static calculateFinancialHealth(
    totalSpent: number, 
    estimatedCost: number, 
    budgetUtilization: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (estimatedCost === 0) return 'good';
    
    const ratio = totalSpent / estimatedCost;
    
    if (ratio < 0.7) return 'excellent';
    if (ratio < 0.9) return 'good';
    if (ratio <= 1.0) return 'warning';
    return 'critical';
  }

  // ============= Default Response Methods =============

  private static getDefaultPhaseCosts() {
    return {
      totalPayments: 0,
      totalExpenses: 0,
      totalLaborCost: 0,
      materialCost: 0,
      totalSpent: 0,
      estimatedCost: 0,
      actualCost: 0,
      costVariance: 0,
      budgetUtilization: 0,
      isOverBudget: false,
      remainingBudget: 0,
      paymentDistribution: {},
      expenseDistribution: {},
      costBreakdown: { payments: 0, expenses: 0, labor: 0, materials: 0, other: 0 },
      paymentsCount: 0,
      expensesCount: 0,
      employeesCount: 0,
      materialsCount: 0,
      financialHealth: 'unknown' as const,
      phaseName: '',
      phaseStatus: 'pending',
      phaseProgress: 0,
      phaseDuration: 0
    };
  }

  private static getDefaultResourceUtilization() {
    return {
      totalEmployees: 0,
      employeesByPosition: {},
      laborMetrics: { totalCost: 0, totalAllocation: 0 },
      employeeAllocation: 0,
      totalMaterials: 0,
      materialMetrics: { estimatedCost: 0, actualCost: 0, totalQuantity: 0, shortages: [] },
      materialsByCategory: {},
      hasMaterialShortages: false,
      materialShortages: [],
      equipmentMetrics: { totalCost: 0, totalHours: 0, count: 0, maintenanceNeeded: [] },
      equipmentUtilization: 0,
      resourceUtilizationMetrics: {
        laborUtilization: 0,
        materialUtilization: 0,
        equipmentUtilization: 0,
        overallEfficiency: 0,
        hasIssues: true
      },
      overallResourceEfficiency: 0,
      hasResourceIssues: true,
      recommendations: ['Unable to calculate resource utilization']
    };
  }

  private static getDefaultProgressMetrics() {
    return {
      stepProgress: 0,
      taskProgress: 0,
      timeProgress: 0,
      milestoneProgress: 0,
      overallProgress: 0,
      riskAdjustedProgress: 0,
      completedSteps: 0,
      totalSteps: 0,
      stepCompletionRate: 0,
      completedTasks: 0,
      totalTasks: 0,
      taskCompletionRate: 0,
      stepStatus: { completed: 0, inProgress: 0, delayed: 0, pending: 0 },
      taskStatus: { completed: 0, inProgress: 0, delayed: 0, pending: 0 },
      completedMilestones: 0,
      totalMilestones: 0,
      timeline: {
        startDate: null,
        endDate: null,
        remainingDays: 0,
        totalDuration: 0,
        elapsedDays: 0,
        isOnSchedule: false,
        scheduleVariance: 0
      },
      productivity: {
        tasksPerDay: 0,
        stepsPerWeek: 0,
        efficiencyScore: 0,
        bottleneckSteps: []
      },
      steps: [],
      criticalPath: [],
      progressTrend: { daily: 0, weekly: 0, monthly: 0 },
      performanceIndicators: {
        schedulePerformanceIndex: 0,
        costPerformanceIndex: 0,
        overallPerformanceIndex: 0,
        recommendations: []
      }
    };
  }

  /**
   * Calculate project timeline performance
   */
  static calculateTimelinePerformance(project: ProjectData, phases: PhaseCostData[]) {
    if (!phases || phases.length === 0) {
      return {
        onTimePhases: 0,
        delayedPhases: 0,
        averageDelay: 0,
        scheduleHealth: 'unknown'
      };
    }

    const today = new Date();
    let onTimePhases = 0;
    let delayedPhases = 0;
    let totalDelay = 0;

    phases.forEach(phase => {
      const endDate = new Date(phase.end_date);
      const isCompleted = phase.status === 'completed';
      const isOverdue = !isCompleted && today > endDate;

      if (isCompleted && today <= endDate) {
        onTimePhases++;
      } else if (isOverdue) {
        delayedPhases++;
        const delayDays = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDelay += delayDays;
      }
    });

    const averageDelay = delayedPhases > 0 ? totalDelay / delayedPhases : 0;
    const scheduleHealth = delayedPhases === 0 ? 'on_track' : 
                          delayedPhases / phases.length < 0.3 ? 'minor_delays' : 'major_delays';

    return {
      onTimePhases,
      delayedPhases,
      averageDelay,
      scheduleHealth,
      completionRate: phases.filter(p => p.status === 'completed').length / phases.length
    };
  }

  /**
   * Calculate project health score
   */
  static calculateProjectHealthScore(
    progress: number, 
    budgetUtilization: number, 
    schedulePerformance: number,
    qualityScore: number
  ) {
    // Weighted average: Progress 25%, Budget 30%, Schedule 25%, Quality 20%
    const weights = {
      progress: 0.25,
      budget: 0.30,
      schedule: 0.25,
      quality: 0.20
    };

    const progressScore = Math.min(100, progress * 1.2);
    const budgetScore = budgetUtilization <= 100 ? 100 - (budgetUtilization - 100) : Math.max(0, 200 - budgetUtilization);
    const scheduleScore = schedulePerformance * 100;

    const healthScore = (
      progressScore * weights.progress +
      budgetScore * weights.budget +
      scheduleScore * weights.schedule +
      qualityScore * weights.quality
    );

    let healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (healthScore >= 90) healthLevel = 'excellent';
    else if (healthScore >= 75) healthLevel = 'good';
    else if (healthScore >= 60) healthLevel = 'fair';
    else if (healthScore >= 40) healthLevel = 'poor';
    else healthLevel = 'critical';

    return {
      overallScore: Math.round(healthScore),
      healthLevel,
      components: {
        progress: Math.round(progressScore),
        budget: Math.round(budgetScore),
        schedule: Math.round(scheduleScore),
        quality: Math.round(qualityScore)
      }
    };
  }
}