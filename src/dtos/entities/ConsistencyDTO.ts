/**
 * Consistency Data Transfer Objects
 * For data consistency monitoring and reporting
 */

export interface ConsistencyReport {
  timestamp: Date;
  entity: string;
  totalRecords: number;
  inconsistentRecords: number;
  consistencyScore: number;
  criticalIssues: number;
  highPriorityIssues: number;
  recommendations: string[];
}

export interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  recordId: string;
  field: string;
  expectedValue: string | number | boolean | Date;
  actualValue: string | number | boolean | Date;
  suggestedFix: string;
}

export interface MonitoringMetrics {
  overallConsistencyScore: number;
  entityScores: Record<string, number>;
  totalIssues: number;
  criticalIssues: number;
  highPriorityIssues: number;
  lastMonitored: Date;
}

export interface MonitoringReport {
  summary: MonitoringMetrics;
  reports: ConsistencyReport[];
  recommendations: string[];
}
