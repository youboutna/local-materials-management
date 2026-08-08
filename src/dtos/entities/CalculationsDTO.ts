/**
 * Calculations DTOs
 * Migrated from @/dtos/types/calculations
 * Pure data shapes for analytics and EVM computations.
 */

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
  spentAmount: num