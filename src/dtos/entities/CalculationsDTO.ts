/**
 * Calculations DTOs
 * Migrated from @/types/calculations
 * Pure data shapes for analytics and EVM computations.
 */

export interface EVMCalculations {
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

export interface ProgressAnalytics {
  overallProgress: number;
  phaseProgress: { [phaseId: string]: number };
  taskProgress: { [taskId: string]: number };
  delayedTasksCount: number;
  completedTasksCount: number;
  tasksInProgressCount: number;
  pendingTasksCount: number;
}

export interface BudgetAnalytics {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  budgetUtilization: number;
  estimatedTotalCost: number;
  costVariance: number;
  tasksOverBudget: string[];
  averageCostPerTask: number;
}
