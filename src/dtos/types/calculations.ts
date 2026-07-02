// Types for calculations and analytics
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

export interface TimelineAnalytics {
  projectDuration: number;
  elapsedDays: number;
  remainingDays: number;
  scheduleVariance: number;
  criticalPathTasks: string[];
  delayedTasks: string[];
  upcomingDeadlines: Array<{
    taskId: string;
    taskName: string;
    deadline: string;
    daysRemaining: number;
  }>;
}

export interface QualityMetrics {
  inspectionPassRate: number;
  criticalIssuesCount: number;
  resolvedIssuesCount: number;
  averageInspectionScore: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  reworkCount: number;
}

export interface RiskAnalytics {
  totalRisks: number;
  highRisks: number;
  mitigatedRisks: number;
  riskScore: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  topRisks: Array<{
    id: string;
    title: string;
    riskScore: number;
  }>;
}

export interface ResourceUtilization {
  humanResources: Array<{
    id: string;
    name: string;
    utilization: number;
    assignedTasks: string[];
    costPerHour?: number;
  }>;
  materialResources: Array<{
    id: string;
    name: string;
    quantityUsed: number;
    quantityAvailable: number;
    utilizationRate: number;
  }>;
  equipmentResources: Array<{
    id: string;
    name: string;
    utilizationRate: number;
    assignedTasks: string[];
  }>;
}

export interface ProjectHealthScore {
  overall: number;
  schedule: number;
  budget: number;
  quality: number;
  risk: number;
  scope: number;
  stakeholderSatisfaction: number;
}

export interface TrendAnalysis {
  progressTrend: Array<{
    date: string;
    progress: number;
  }>;
  budgetTrend: Array<{
    date: string;
    spentAmount: number;
    plannedAmount: number;
  }>;
  qualityTrend: Array<{
    date: string;
    qualityScore: number;
  }>;
  riskTrend: Array<{
    date: string;
    riskScore: number;
  }>;
}

export interface Forecasting {
  predictedCompletionDate: string;
  predictedFinalCost: number;
  probabilityOfOnTimeDelivery: number;
  probabilityOfOnBudgetDelivery: number;
  recommendedActions: string[];
}

export interface BenchmarkComparisons {
  industryAverage: {
    schedulePerformance: number;
    budgetPerformance: number;
    qualityScore: number;
  };
  organizationalAverage: {
    schedulePerformance: number;
    budgetPerformance: number;
    qualityScore: number;
  };
  projectRanking: {
    scheduleRank: number;
    budgetRank: number;
    qualityRank: number;
    overallRank: number;
  };
}