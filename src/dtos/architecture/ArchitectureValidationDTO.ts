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
    totalIssues: number;
  };
  recommendations: string[];
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

export interface ConsistencyMonitoringSection {
  score: number;
  totalRecords: number;
  consistentRecords: number;
  inconsistentRecords: number;
  entityScores: EntityScores;
  criticalIssues: number;
  highIssues: number;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
}
