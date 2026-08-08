/**
 * Architecture Validation Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

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

export interfaer;
  highIssues: number;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
}