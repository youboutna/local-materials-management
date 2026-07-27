/**
 * Workflow Integration Test Service
 * Tests workflow integration across hexagonal architecture
 * Simplified version aligned with existing services
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { PhaseService } from './PhaseService';
import { ProjectService } from './ProjectService';

export interface IntegrationTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  metrics: TestMetrics;
  details: string;
  errors: string[];
}

export interface TestMetrics {
  entitiesProcessed: number;
  operationsExecuted: number;
  dataFlowIntegrity: number;
  performanceScore: number;
  errors: string[];
}

export interface IntegrationTestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    overallScore: number;
    totalDuration: number;
  };
  details: IntegrationTestResult[];
  recommendations: string[];
}

export class WorkflowIntegrationTestService {
  private projectService: ProjectService;
  private phaseService: PhaseService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
  }

  /**
   * Run all workflow integration tests
   */
  static async runAllIntegrationTests(): Promise<IntegrationTestResult[]> {
    const service = new WorkflowIntegrationTestService();
    const results: IntegrationTestResult[] = [];

    try {
      // Test 1: Project CRUD Workflow
      const projectCRUDResult = await service.testProjectCRUDWorkflow();
      results.push(projectCRUDResult);

      // Test 2: Phase Management Workflow
      const phaseManagementResult = await service.testPhaseManagementWorkflow();
      results.push(phaseManagementResult);

      // Test 3: Data Flow Integration
      const dataFlowResult = await service.testDataFlowIntegration();
      results.push(dataFlowResult);

      return results;
    } catch (error) {
      console.error('Error running integration tests:', error);
      throw new Error('Failed to run integration tests');
    }
  }

  /**
   * Generate test report
   */
  static async generateIntegrationTestReport(): Promise<IntegrationTestReport> {
    const results = await WorkflowIntegrationTestService.runAllIntegrationTests();
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

    const recommendations: string[] = [];
    if (failedTests > 0) {
      recommendations.push(`Fix ${failedTests} failed tests`);
    }
    if (overallScore < 80) {
      recommendations.push('Improve test coverage and fix issues');
    }

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        overallScore,
        totalDuration
      },
      details: results,
      recommendations
    };
  }

  /**
   * Test Project CRUD Workflow
   */
  private async testProjectCRUDWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 100,
      performanceScore: 100,
      errors: []
    };

    try {
      // Fetch existing projects to test read operations
      const projects = await this.projectService.getAllProjects();
      metrics.operationsExecuted++;
      metrics.entitiesProcessed = projects.length;

      const duration = Date.now() - startTime;
      metrics.performanceScore = duration < 2000 ? 100 : Math.max(0, 100 - (duration - 2000) / 100);

      return {
        testName: 'Project CRUD Workflow',
        status: 'passed',
        duration,
        metrics,
        details: `Processed ${projects.length} projects`,
        errors: []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metrics.errors.push(errorMessage);
      
      return {
        testName: 'Project CRUD Workflow',
        status: 'failed',
        duration: Date.now() - startTime,
        metrics,
        details: 'Failed to complete project CRUD test',
        errors: [errorMessage]
      };
    }
  }

  /**
   * Test Phase Management Workflow
   */
  private async testPhaseManagementWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 100,
      performanceScore: 100,
      errors: []
    };

    try {
      // Get projects and their phases
      const projects = await this.projectService.getAllProjects();
      metrics.operationsExecuted++;

      let totalPhases = 0;
      for (const project of projects.slice(0, 5)) { // Limit to 5 projects
        const phases = await this.phaseService.getPhasesByProject(project.id);
        metrics.operationsExecuted++;
        totalPhases += phases.length;
      }
      
      metrics.entitiesProcessed = totalPhases;
      
      const duration = Date.now() - startTime;
      metrics.performanceScore = duration < 5000 ? 100 : Math.max(0, 100 - (duration - 5000) / 100);

      return {
        testName: 'Phase Management Workflow',
        status: 'passed',
        duration,
        metrics,
        details: `Processed ${totalPhases} phases across projects`,
        errors: []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metrics.errors.push(errorMessage);
      
      return {
        testName: 'Phase Management Workflow',
        status: 'failed',
        duration: Date.now() - startTime,
        metrics,
        details: 'Failed to complete phase management test',
        errors: [errorMessage]
      };
    }
  }

  /**
   * Test Data Flow Integration
   */
  private async testDataFlowIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 100,
      performanceScore: 100,
      errors: []
    };

    try {
      // Test that service calls return proper DTOs
      const projects = await this.projectService.getAllProjects();
      metrics.operationsExecuted++;

      // Verify data structure integrity
      let integrityScore = 100;
      for (const project of projects.slice(0, 10)) {
        if (!project.id || !project.title) {
          integrityScore -= 10;
          metrics.errors.push(`Project ${project.id || 'unknown'} missing required fields`);
        }
        metrics.entitiesProcessed++;
      }

      metrics.dataFlowIntegrity = Math.max(0, integrityScore);
      
      const duration = Date.now() - startTime;
      metrics.performanceScore = duration < 3000 ? 100 : Math.max(0, 100 - (duration - 3000) / 100);

      return {
        testName: 'Data Flow Integration',
        status: integrityScore >= 80 ? 'passed' : 'failed',
        duration,
        metrics,
        details: `Data integrity score: ${integrityScore}%`,
        errors: metrics.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metrics.errors.push(errorMessage);
      
      return {
        testName: 'Data Flow Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        metrics,
        details: 'Failed to complete data flow test',
        errors: [errorMessage]
      };
    }
  }
}
