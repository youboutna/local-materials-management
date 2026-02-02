export interface AlertSummary {
  critical: {
    id: string;
    message: string;
    entity: string;
  }[];
  high: {
    id: string;
    message: string;
    entity: string;
  }[];
}

export interface EntityScores {
  [entity: string]: number;
}

export interface ConsistencyMonitoringReport {
  summary: {
    overallConsistencyScore: number;
    alerts: AlertSummary;
    entityScores: EntityScores;
  };
  recommendations: string[];
}

export interface ConsistencyMonitoringSection {
  score: number;
  totalRecords: number;
  consistentRecords: number;
}
