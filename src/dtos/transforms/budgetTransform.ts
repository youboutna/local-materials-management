/**
 * Budget Transformations
 * Centralized DTO definitions and transformations for budget calculations
 */

export interface BudgetCalculationDto {
  projectId: string;
  initialBudget: number;
  currentSpent: number;
  remainingBudget: number;
  budgetUtilizationPercentage: number;
  projectedTotalCost: number;
  costVariance: number;
  costVariancePercentage: number;
  estimatedCompletionCost: number;
  budgetStatus: 'healthy' | 'warning' | 'critical' | 'over_budget';
  warnings: BudgetWarningDto[];
  recommendations: string[];
}

export interface BudgetWarningDto {
  type: 'budget_exceeded' | 'budget_warning' | 'cost_variance' | 'cash_flow' | 'timeline_delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  thresholdValue: number;
  recommendation: string;
}
