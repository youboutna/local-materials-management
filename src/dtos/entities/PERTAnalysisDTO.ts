// Auto-generated DTO

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface PERTAnalysis {
  activities: PERTActivity[];
  expectedDurations: { [taskId: string]: number };
  criticalPath: string[];
  totalExpectedDuration: number;
  variances: { [taskId: string]: number };
}
