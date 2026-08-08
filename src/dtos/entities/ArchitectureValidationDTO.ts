/**
 * Architecture Validation Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface ArchitectureValidationReport {
  timestamp: Date;
  overallScore: number;
  architectureStatus: 'healthy' | 'warning' | 'critical';
  sections: {
    persistenceValidation: PersistenceValidationSection;
    integrationTests: IntegrationTestSection;
    consistencyMonitoring: ConsistencyMonitoringSection;
  };
  metrics: {
    totalEntities: number;
    validatedEntities: number;
    testedWorkflows: number;
    passedTests: number;
    consistencyScore: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface PersistenceValidationSection {
  score: number;
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  keyIssues: string[];
  recommendations: string[];
}

export interface IntegrationTestSection {
  score: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  performanceMetrics: {
    averageDuration: number;
    operationsPerSecond: number;
    dataFlowIntegrity: number;
  };
  keyFailures: string[];
  recommendations: string[];
}

export interface ConsistencyMonitoringSection {
  score: number;
  totalRecords: number;
  consistentRecords: number;
  inconsistentRecords: number;
  entityScores: Record<string, number>;
  criticalIssues: number;
  highIssues: number;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
}
