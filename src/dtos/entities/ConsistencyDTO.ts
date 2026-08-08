/**
 * Consistency Data Transfer Objects
 * For data consistency monitoring and reporting
 */

export interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  recordId: string;
  field: string;
  expectedValue: string | number | boolean | Date;
  actualValue: string | number | boolean | Date;
  suggestedFix: string;
}

gReport {
  summary: MonitoringMetrics;
  reports: ConsistencyReport[];
  recommendations: string[];
}