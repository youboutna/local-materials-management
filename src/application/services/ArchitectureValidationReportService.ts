/**
 * Architecture Validation Report Service
 * Generates comprehensive validation reports for hexagonal architecture
 */

import { DataPersistenceValidationService } from './DataPersistenceValidationService';
import { WorkflowIntegrationTestService } from './WorkflowIntegrationTestService';
import { DataConsistencyMonitoringService } from './DataConsistencyMonitoringService';

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

export class ArchitectureValidationReportService {
  /**
   * Generate comprehensive architecture validation report
   */
  static async generateValidationReport(): Promise<ArchitectureValidationReport> {
    try {
      console.log('🔍 Generating comprehensive architecture validation report...');

      // Run all validations
      const [persistenceReport, integrationReport, consistencyReport] = await Promise.all([
        DataPersistenceValidationService.generateValidationReport(),
        WorkflowIntegrationTestService.generateIntegrationTestReport(),
        DataConsistencyMonitoringService.generateMonitoringReport()
      ]);

      // Calculate section scores
      const persistenceSection = this.processPersistenceValidation(persistenceReport);
      const integrationSection = this.processIntegrationTests(integrationReport);
      const consistencySection = this.processConsistencyMonitoring(consistencyReport);

      // Calculate overall score
      const overallScore = (
        persistenceSection.score * 0.3 +
        integrationSection.score * 0.4 +
        consistencySection.score * 0.3
      );

      // Determine architecture status
      const architectureStatus = this.determineArchitectureStatus(overallScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        persistenceSection,
        integrationSection,
        consistencySection
      );

      // Generate next steps
      const nextSteps = this.generateNextSteps(architectureStatus, recommendations);

      // Calculate metrics
      const metrics = {
        totalEntities: persistenceReport.summary.totalValidations,
        validatedEntities: persistenceReport.summary.passedValidations,
        testedWorkflows: integrationReport.summary.totalTests,
        passedTests: integrationReport.summary.passedTests,
        consistencyScore: consistencyReport.summary.overallConsistencyScore
      };

      return {
        timestamp: new Date(),
        overallScore,
        architectureStatus,
        sections: {
          persistenceValidation: persistenceSection,
          integrationTests: integrationSection,
          consistencyMonitoring: consistencySection
        },
        metrics,
        recommendations,
        nextSteps
      };
    } catch (error) {
      console.error('Error generating validation report:', error);
      throw new Error('Failed to generate validation report');
    }
  }

  /**
   * Process persistence validation results
   */
  private static processPersistenceValidation(report: any): PersistenceValidationSection {
    const score = report.summary.overallScore;
    const keyIssues = report.details
      .filter((d: any) => !d.isValid)
      .map((d: any) => `${d.entity}: ${d.issues.map((i: any) => i.message).join(', ')}`);

    return {
      score,
      totalValidations: report.summary.totalValidations,
      passedValidations: report.summary.passedValidations,
      failedValidations: report.summary.failedValidations,
      keyIssues,
      recommendations: report.recommendations
    };
  }

  /**
   * Process integration test results
   */
  private static processIntegrationTests(report: any): IntegrationTestSection {
    const score = report.summary.overallScore;
    const keyFailures = report.details
      .filter((d: any) => d.status === 'failed')
      .map((d: any) => `${d.testName}: ${d.details}`);

    const performanceMetrics = {
      averageDuration: report.summary.totalDuration / report.summary.totalTests,
      operationsPerSecond: report.details.reduce((sum: number, d: any) => sum + d.metrics.operationsExecuted, 0) / (report.summary.totalDuration / 1000),
      dataFlowIntegrity: report.details.reduce((sum: number, d: any) => sum + d.metrics.dataFlowIntegrity, 0) / report.details.length
    };

    return {
      score,
      totalTests: report.summary.totalTests,
      passedTests: report.summary.passedTests,
      failedTests: report.summary.failedTests,
      skippedTests: report.summary.skippedTests,
      performanceMetrics,
      keyFailures,
      recommendations: report.recommendations
    };
  }

  /**
   * Process consistency monitoring results
   */
  private static processConsistencyMonitoring(report: any): ConsistencyMonitoringSection {
    const score = report.summary.overallConsistencyScore;
    const criticalIssues = report.summary.alerts.critical.length;
    const highIssues = report.summary.alerts.high.length;

    const entityScoreValues = Object.values(report.summary.entityScores) as number[];
    const entityScoreKeys = Object.keys(report.summary.entityScores);
    
    return {
      score,
      totalRecords: entityScoreValues.reduce((sum, count) => sum + count, 0),
      consistentRecords: entityScoreKeys.length > 0 
        ? Math.round(entityScoreValues.reduce((sum, s) => sum + s, 0) / entityScoreKeys.length)
        : 0,
      inconsistentRecords: report.summary.totalIssues,
      entityScores: report.summary.entityScores,
      criticalIssues,
      highIssues,
      trends: report.trends,
      recommendations: report.recommendations
    };
  }

  /**
   * Determine architecture status
   */
  private static determineArchitectureStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'warning';
    return 'critical';
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    persistence: PersistenceValidationSection,
    integration: IntegrationTestSection,
    consistency: ConsistencyMonitoringSection
  ): string[] {
    const recommendations: string[] = [];

    // Persistence recommendations
    if (persistence.score < 80) {
      recommendations.push('Address data persistence validation issues');
      recommendations.push(...persistence.recommendations);
    }

    // Integration recommendations
    if (integration.score < 80) {
      recommendations.push('Fix workflow integration test failures');
      recommendations.push(...integration.recommendations);
    }

    // Consistency recommendations
    if (consistency.score < 80) {
      recommendations.push('Resolve data consistency issues');
      recommendations.push(...consistency.recommendations);
    }

    // Performance recommendations
    if (integration.performanceMetrics.averageDuration > 5000) {
      recommendations.push('Optimize workflow performance');
    }

    // Critical issue recommendations
    if (consistency.criticalIssues > 0) {
      recommendations.push('URGENT: Address critical data consistency issues');
    }

    return recommendations;
  }

  /**
   * Generate next steps
   */
  private static generateNextSteps(
    status: 'healthy' | 'warning' | 'critical',
    recommendations: string[]
  ): string[] {
    const nextSteps: string[] = [];

    switch (status) {
      case 'critical':
        nextSteps.push('🚨 IMMEDIATE ACTION REQUIRED');
        nextSteps.push('Address all critical issues within 24 hours');
        nextSteps.push('Schedule emergency architecture review');
        nextSteps.push('Implement data integrity fixes');
        break;

      case 'warning':
        nextSteps.push('⚠️ ADDRESS PRIORITY ISSUES');
        nextSteps.push('Fix high-priority issues within 3 days');
        nextSteps.push('Schedule architecture review within 1 week');
        nextSteps.push('Implement performance optimizations');
        break;

      case 'healthy':
        nextSteps.push('✅ MAINTAIN HEALTHY ARCHITECTURE');
        nextSteps.push('Continue regular monitoring');
        nextSteps.push('Schedule monthly architecture reviews');
        nextSteps.push('Plan for future scalability');
        break;
    }

    // Add specific next steps based on recommendations
    if (recommendations.some(r => r.includes('performance'))) {
      nextSteps.push('Implement performance optimization plan');
    }

    if (recommendations.some(r => r.includes('consistency'))) {
      nextSteps.push('Execute data consistency fixes');
    }

    if (recommendations.some(r => r.includes('validation'))) {
      nextSteps.push('Enhance validation mechanisms');
    }

    return nextSteps;
  }

  /**
   * Generate executive summary
   */
  static async generateExecutiveSummary(): Promise<{
    status: string;
    score: number;
    keyMetrics: string[];
    criticalIssues: string[];
    recommendations: string[];
    timeline: string;
  }> {
    const report = await this.generateValidationReport();

    const keyMetrics = [
      `Overall Architecture Score: ${report.overallScore.toFixed(1)}%`,
      `Persistence Validation: ${report.sections.persistenceValidation.score.toFixed(1)}%`,
      `Integration Tests: ${report.sections.integrationTests.score.toFixed(1)}%`,
      `Data Consistency: ${report.sections.consistencyMonitoring.score.toFixed(1)}%`,
      `Total Entities Validated: ${report.metrics.totalEntities}`,
      `Tests Passed: ${report.metrics.passedTests}/${report.metrics.testedWorkflows}`
    ];

    const criticalIssues = [
      ...report.sections.persistenceValidation.keyIssues,
      ...report.sections.integrationTests.keyFailures,
      ...report.sections.consistencyMonitoring.trends.declining
    ];

    const timeline = report.architectureStatus === 'critical' 
      ? 'Immediate action required (24-48 hours)'
      : report.architectureStatus === 'warning'
      ? 'Address within 3-5 days'
      : 'Continue regular monitoring';

    return {
      status: report.architectureStatus.toUpperCase(),
      score: report.overallScore,
      keyMetrics,
      criticalIssues,
      recommendations: report.recommendations.slice(0, 5),
      timeline
    };
  }

  /**
   * Export report to JSON
   */
  static async exportReportToJSON(): Promise<string> {
    const report = await this.generateValidationReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to CSV
   */
  static async exportReportToCSV(): Promise<string> {
    const report = await this.generateValidationReport();
    
    const csvContent = [
      'Architecture Validation Report',
      `Generated,${report.timestamp.toISOString()}`,
      `Overall Score,${report.overallScore.toFixed(2)}%`,
      `Status,${report.architectureStatus}`,
      '',
      'Section Scores',
      `Persistence Validation,${report.sections.persistenceValidation.score.toFixed(2)}%`,
      `Integration Tests,${report.sections.integrationTests.score.toFixed(2)}%`,
      `Consistency Monitoring,${report.sections.consistencyMonitoring.score.toFixed(2)}%`,
      '',
      'Metrics',
      `Total Entities,${report.metrics.totalEntities}`,
      `Validated Entities,${report.metrics.validatedEntities}`,
      `Tested Workflows,${report.metrics.testedWorkflows}`,
      `Passed Tests,${report.metrics.passedTests}`,
      `Consistency Score,${report.metrics.consistencyScore.toFixed(2)}%`,
      '',
      'Critical Issues',
      ...report.sections.persistenceValidation.keyIssues.map(issue => `Persistence,${issue}`),
      ...report.sections.integrationTests.keyFailures.map(failure => `Integration,${failure}`),
      ...report.sections.consistencyMonitoring.trends.declining.map(trend => `Consistency,${trend}`),
      '',
      'Recommendations',
      ...report.recommendations.map(rec => rec)
    ].join('\n');

    return csvContent;
  }

  /**
   * Schedule periodic validation reports
   */
  static async schedulePeriodicReports(intervalHours: number = 24): Promise<void> {
    try {
      console.log(`📊 Scheduling periodic validation reports every ${intervalHours} hours...`);
      
      const reportInterval = setInterval(async () => {
        try {
          const report = await this.generateValidationReport();
          
          // Log summary
          console.log(`📊 Architecture Validation Report - ${report.overallScore.toFixed(2)}% score`);
          console.log(`📊 Status: ${report.architectureStatus.toUpperCase()}`);
          console.log(`📊 Critical Issues: ${report.sections.persistenceValidation.keyIssues.length + report.sections.integrationTests.keyFailures.length}`);
          
          // Generate executive summary
          const summary = await this.generateExecutiveSummary();
          console.log(`📊 Timeline: ${summary.timeline}`);
          
          // Save report to file system (in production, this would go to a proper logging system)
          const reportJSON = await this.exportReportToJSON();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          
          // In a real implementation, this would save to a file system or database
          console.log(`📊 Report generated: validation-report-${timestamp}.json`);
          
        } catch (error) {
          console.error('Error in periodic validation report:', error);
        }
      }, intervalHours * 60 * 60 * 1000); // Convert hours to milliseconds

      console.log(`✅ Periodic validation reports scheduled successfully`);
    } catch (error) {
      console.error('Failed to schedule periodic validation reports:', error);
      throw new Error('Failed to schedule periodic validation reports');
    }
  }

  /**
   * Generate health check endpoint
   */
  static async generateHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    checks: {
      persistence: boolean;
      integration: boolean;
      consistency: boolean;
    };
    score: number;
    message: string;
  }> {
    try {
      const report = await this.generateValidationReport();
      
      const checks = {
        persistence: report.sections.persistenceValidation.score >= 80,
        integration: report.sections.integrationTests.score >= 80,
        consistency: report.sections.consistencyMonitoring.score >= 80
      };

      const allHealthy = Object.values(checks).every(check => check);
      
      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
        score: report.overallScore,
        message: allHealthy 
          ? 'All architecture validation checks passed'
          : 'Some architecture validation checks failed'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          persistence: false,
          integration: false,
          consistency: false
        },
        score: 0,
        message: 'Failed to generate validation report'
      };
    }
  }
}
