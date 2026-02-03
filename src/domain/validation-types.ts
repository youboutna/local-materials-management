export interface ValidationRule {
  id: string;
  description: string;
  severity: 'error' | 'warning';
}

export interface ValidationIssue {
  rule: string;
  location: string;
  message: string;
  severity?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary?: {
    errorCount: number;
    warningCount: number;
  };
}

// PersistenceValidationReport pour ArchitectureValidationReportService
export interface PersistenceValidationReport {
  status: 'passed' | 'failed';
  summary: {
    totalValidations: number;
    passedValidations: number;
    overallScore: number;
  };
  details: ValidationResult[];
  recommendations: string[];
}

// IntegrationTestReport pour ArchitectureValidationReportService
export interface IntegrationTestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
  };
  details: Array<{
    status: 'passed' | 'failed';
    rule?: string;
    location?: string;
    message?: string;
    severity?: string;
    metrics?: {
      operationsExecuted?: number;
      dataFlowIntegrity?: number;
    };
  }>;
  recommendations: string[];
}

// ConsistencyMonitoringReport pour ArchitectureValidationReportService
export interface ConsistencyMonitoringReport {
  summary: {
    overallConsistencyScore: number;
    alerts: {
      critical: Array<{ id: string; message: string; entity: string }>;
      high: Array<{ id: string; message: string; entity: string }>;
    };
    entityScores: Record<string, number>;
    totalIssues: number;
  };
  recommendations: string[];
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}
