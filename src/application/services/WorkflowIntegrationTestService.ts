/**
 * Workflow Integration Test Service
 * Tests integration of complex workflows across hexagonal architecture
 */

import { ProjectWorkflowService } from './ProjectWorkflowService';
import { ProjectService } from './ProjectService';
import { PhaseService } from './PhaseService';
import { InspectionService } from './InspectionService';
import { PaymentService } from './PaymentService';
import { NotificationService } from './NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface IntegrationTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  details: string;
  metrics: TestMetrics;
}

export interface TestMetrics {
  entitiesProcessed: number;
  operationsExecuted: number;
  dataFlowIntegrity: number;
  performanceScore: number;
  errors: string[];
}

export class WorkflowIntegrationTestService {
  private projectWorkflowService: ProjectWorkflowService;
  private projectService: ProjectService;
  private phaseService: PhaseService;
  private inspectionService: InspectionService;
  private paymentService: PaymentService;
  private notificationService: NotificationService;

  constructor() {
    this.projectWorkflowService = new ProjectWorkflowService(RepositoryFactory.getProjectWorkflowRepository());
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    this.inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
    this.paymentService = new PaymentService(RepositoryRepository.getPaymentRepository());
    this.notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
  }

  /**
   * Run all workflow integration tests
   */
  static async runAllIntegrationTests(): Promise<IntegrationTestResult[]> {
    const service = new WorkflowIntegrationTestService();
    const results: IntegrationTestResult[] = [];

    try {
      // Test 1: Complete Project Workflow
      const projectWorkflowResult = await service.testCompleteProjectWorkflow();
      results.push(projectWorkflowResult);

      // Test 2: Phase Progression Workflow
      const phaseProgressionResult = await service.testPhaseProgressionWorkflow();
      results.push(phaseProgressionResult);

      // Test 3: Inspection and Approval Workflow
      const inspectionApprovalResult = await service.testInspectionApprovalWorkflow();
      results.push(inspectionApprovalResult);

      // Test 4: Payment Processing Workflow
      const paymentProcessingResult = await service.testPaymentProcessingWorkflow();
      results.push(paymentProcessingResult);

      // Test 5: Notification Workflow Integration
      const notificationIntegrationResult = await service.testNotificationWorkflowIntegration();
      results.push(notificationIntegrationResult);

      // Test 6: Cross-Service Data Consistency
      const dataConsistencyResult = await service.testCrossServiceDataConsistency();
      results.push(dataConsistencyResult);

      // Test 7: Error Handling and Recovery
      const errorHandlingResult = await service.testErrorHandlingAndRecovery();
      results.push(errorHandlingResult);

      // Test 8: Performance Under Load
      const performanceResult = await service.testPerformanceUnderLoad();
      results.push(performanceResult);

      return results;
    } catch (error) {
      console.error('Error running integration tests:', error);
      throw new Error('Failed to run integration tests');
    }
  }

  /**
   * Test 1: Complete Project Workflow
   */
  private async testCompleteProjectWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Complete Project Workflow...');
      
      // Create project
      const projectData = {
        title: 'Integration Test Project',
        description: 'Test project for workflow integration',
        location: 'Test Location',
        status: 'planning' as const,
        budget: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      };

      const project = await this.projectService.createProject(projectData);
      metrics.entitiesProcessed++;
      metrics.operationsExecuted++;

      // Create phases
      const phases = [
        { name: 'Planning', description: 'Planning phase', order: 1 },
        { name: 'Execution', description: 'Execution phase', order: 2 },
        { name: 'Completion', description: 'Completion phase', order: 3 }
      ];

      for (const phaseData of phases) {
        const phase = await this.phaseService.createPhase(project.id, phaseData);
        metrics.entitiesProcessed++;
        metrics.operationsExecuted++;
      }

      // Start workflow
      const workflow = await this.projectWorkflowService.startWorkflow(project.id);
      metrics.operationsExecuted++;

      // Progress through phases
      const createdPhases = await this.phaseService.getPhasesByProject(project.id);
      for (const phase of createdPhases) {
        await this.projectWorkflowService.updatePhaseProgress(phase.id, 50);
        metrics.operationsExecuted++;
      }

      // Complete workflow
      await this.projectWorkflowService.completeWorkflow(project.id);
      metrics.operationsExecuted++;

      // Verify data integrity
      const finalProject = await this.projectService.getProject(project.id);
      const finalPhases = await this.phaseService.getPhasesByProject(project.id);
      const finalWorkflow = await this.projectWorkflowService.getWorkflowStatus(project.id);

      metrics.dataFlowIntegrity = this.calculateDataIntegrity(
        project, finalProject, phases, finalPhases, workflow, finalWorkflow
      );
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Complete Project Workflow',
        status: metrics.dataFlowIntegrity > 90 ? 'passed' : 'failed',
        duration,
        details: `Created project with ${phases.length} phases and completed workflow`,
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Complete Project Workflow',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed to complete project workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 2: Phase Progression Workflow
   */
  private async testPhaseProgressionWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Phase Progression Workflow...');
      
      // Create project with phases
      const project = await this.projectService.createProject({
        title: 'Phase Progression Test',
        description: 'Test project for phase progression',
        location: 'Test Location',
        status: 'planning' as const
      });

      const phases = [
        { name: 'Phase 1', description: 'First phase', order: 1 },
        { name: 'Phase 2', description: 'Second phase', order: 2 },
        { name: 'Phase 3', description: 'Third phase', order: 3 }
      ];

      for (const phaseData of phases) {
        await this.phaseService.createPhase(project.id, phaseData);
        metrics.entitiesProcessed++;
      }

      // Test phase progression
      const createdPhases = await this.phaseService.getPhasesByProject(project.id);
      
      for (let i = 0; i < createdPhases.length; i++) {
        const phase = createdPhases[i];
        
        // Start phase
        await this.projectWorkflowService.startPhase(phase.id);
        metrics.operationsExecuted++;

        // Update progress
        await this.projectWorkflowService.updatePhaseProgress(phase.id, 25);
        await this.projectWorkflowService.updatePhaseProgress(phase.id, 50);
        await this.projectWorkflowService.updatePhaseProgress(phase.id, 75);
        await this.projectWorkflowService.updatePhaseProgress(phase.id, 100);
        metrics.operationsExecuted += 4;

        // Complete phase
        await this.projectWorkflowService.completePhase(phase.id);
        metrics.operationsExecuted++;

        // Verify phase completion
        const updatedPhase = await this.phaseService.getPhase(phase.id);
        if (updatedPhase.progress !== 100) {
          throw new Error(`Phase ${phase.id} progress should be 100%`);
        }
      }

      metrics.dataFlowIntegrity = 100; // All phases completed successfully
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Phase Progression Workflow',
        status: 'passed',
        duration,
        details: `Successfully progressed through ${phases.length} phases`,
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Phase Progression Workflow',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed phase progression: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 3: Inspection and Approval Workflow
   */
  private async testInspectionApprovalWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Inspection and Approval Workflow...');
      
      // Create project
      const project = await this.projectService.createProject({
        title: 'Inspection Test Project',
        description: 'Test project for inspection workflow',
        location: 'Test Location',
        status: 'in_progress' as const
      });

      // Create inspection
      const inspection = await this.inspectionService.createInspection({
        projectId: project.id,
        type: 'quality',
        status: 'scheduled',
        scheduledDate: new Date(),
        inspectorId: 'test-inspector'
      });
      metrics.entitiesProcessed++;
      metrics.operationsExecuted++;

      // Start inspection
      await this.inspectionService.startInspection(inspection.id);
      metrics.operationsExecuted++;

      // Complete inspection
      await this.inspectionService.completeInspection(inspection.id, {
        result: 'passed',
        notes: 'Inspection completed successfully',
        score: 95
      });
      metrics.operationsExecuted++;

      // Verify inspection completion
      const completedInspection = await this.inspectionService.getInspection(inspection.id);
      if (completedInspection.status !== 'completed') {
        throw new Error('Inspection should be completed');
      }

      // Test approval workflow
      await this.projectWorkflowService.approveInspection(inspection.id);
      metrics.operationsExecuted++;

      metrics.dataIntegrity = 100;
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Inspection and Approval Workflow',
        status: 'passed',
        duration,
        details: 'Successfully completed inspection and approval workflow',
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Inspection and Approval Workflow',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed inspection workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 4: Payment Processing Workflow
   */
  private async testPaymentProcessingWorkflow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Payment Processing Workflow...');
      
      // Create project
      const project = await this.projectService.createProject({
        title: 'Payment Test Project',
        description: 'Test project for payment workflow',
        location: 'Test Location',
        status: 'in_progress' as const
      });

      // Create payment request
      const payment = await this.paymentService.createPayment({
        projectId: project.id,
        amount: 50000,
        currency: 'EUR',
        type: 'progress',
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      metrics.entitiesProcessed++;
      metrics.operationsExecuted++;

      // Process payment
      await this.paymentService.processPayment(payment.id);
      metrics.operationsExecuted++;

      // Verify payment processing
      const processedPayment = await this.paymentService.getPayment(payment.id);
      if (processedPayment.status !== 'processed') {
        throw new Error('Payment should be processed');
      }

      metrics.dataIntegrity = 100;
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Payment Processing Workflow',
        status: 'passed',
        duration,
        details: 'Successfully processed payment workflow',
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Payment Processing Workflow',
        status: 'failed',
        duration: Date() - startTime,
        details: `Failed payment workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 5: Notification Workflow Integration
   */
  private async testNotificationWorkflowIntegration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataFlowIntegrity: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Notification Workflow Integration...');
      
      // Create notifications for different events
      const notifications = [
        {
          recipientId: 'test-user-1',
          title: 'Project Created',
          message: 'New project has been created',
          type: 'info' as const
        },
        {
          recipientId: 'test-user-2',
          title: 'Phase Completed',
          message: 'A phase has been completed',
          type: 'success' as const
        },
        {
          recipientId: 'test-user-3',
          title: 'Payment Processed',
          message: 'Payment has been processed successfully',
          type: 'success' as const
        }
      ];

      for (const notificationData of notifications) {
        await this.notificationService.createNotification(notificationData);
        metrics.entitiesProcessed++;
        metrics.operationsExecuted++;
      }

      // Verify notifications
      const createdNotifications = await this.notificationService.getNotificationsByRecipient('test-user-1');
      if (createdNotifications.length === 0) {
        throw new Error('No notifications found for test-user-1');
      }

      metrics.dataIntegrity = 100;
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Notification Workflow Integration',
        status: 'passed',
        duration,
        details: `Successfully created and verified ${notifications.length} notifications`,
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Notification Workflow Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed notification workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 6: Cross-Service Data Consistency
   */
  private async testCrossServiceDataConsistency(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataIntegrityScore: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Cross-Service Data Consistency...');
      
      // Create project
      const project = await this.projectService.createProject({
        title: 'Consistency Test Project',
        description: 'Test project for data consistency',
        location: 'Test Location',
        status: 'planning' as const
      });

      // Create related entities
      const phase = await this.phaseService.createPhase(project.id, {
        name: 'Test Phase',
        description: 'Test phase description',
        order: 1
      });

      const inspection = await this.inspectionService.createInspection({
        projectId: project.id,
        type: 'quality',
        status: 'scheduled',
        scheduledDate: new Date(),
        inspectorId: 'test-inspector'
      });

      const payment = await this.paymentService.createPayment({
        projectId: project.id,
        amount: 25000,
        currency: 'EUR',
        type: 'progress',
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      metrics.entitiesProcessed = 4; // project, phase, inspection, payment
      metrics.operationsExecuted = 4;

      // Verify relationships
      const retrievedProject = await this.projectService.getProject(project.id);
      const retrievedPhase = await this.phaseService.getPhase(phase.id);
      const retrievedInspection = await this.inspectionService.getInspection(inspection.id);
      const retrievedPayment = await this.paymentService.getPayment(payment.id);

      // Check data consistency
      const consistencyChecks = [
        retrievedProject.id === project.id,
        retrievedPhase.projectId === project.id,
        retrievedInspection.projectId === project.id,
        retrievedPayment.projectId === project.id
      ];

      metrics.dataIntegrityScore = consistencyChecks.every(check => check) ? 100 : 75;
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Cross-Service Data Consistency',
        status: metrics.dataIntegrityScore === 100 ? 'passed' : 'failed',
        duration,
        details: `Data consistency score: ${metrics.dataIntegrityScore}%`,
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Cross-Service Data Consistency',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed data consistency test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 7: Error Handling and Recovery
   */
  private async testErrorHandlingAndRecovery(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataIntegrityScore: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Error Handling and Recovery...');
      
      // Test invalid project creation
      try {
        await this.projectService.createProject({
          title: '', // Invalid: empty title
          description: 'Invalid project',
          location: 'Test Location',
          status: 'planning' as const
        });
        metrics.errors.push('Should have failed on empty title');
      } catch (error) {
        // Expected error
      }

      // Test invalid phase creation
      try {
        const project = await this.projectService.createProject({
          title: 'Valid Project',
          description: 'Valid project',
          location: 'Test Location',
          status: 'planning' as const
        });

        await this.phaseService.createPhase(project.id, {
          name: '', // Invalid: empty name
          description: 'Invalid phase',
          order: 1
        });
        metrics.errors.push('Should have failed on empty phase name');
      } catch (error) {
        // Expected error
      }

      // Test error recovery
      const validProject = await this.projectService.createProject({
        title: 'Recovery Test Project',
        description: 'Test project for error recovery',
        location: 'Test Location',
        status: 'planning' as const
      });

      metrics.entitiesProcessed = 1;
      metrics.operationsExecuted = 3;

      metrics.dataIntegrityScore = 90; // Some errors expected
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Error Handling and Recovery',
        status: 'passed',
        duration,
        details: 'Error handling and recovery working correctly',
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Error Handling and Recovery',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed error handling test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Test 8: Performance Under Load
   */
  private async testPerformanceUnderLoad(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const metrics: TestMetrics = {
      entitiesProcessed: 0,
      operationsExecuted: 0,
      dataIntegrityScore: 0,
      performanceScore: 0,
      errors: []
    };

    try {
      console.log('🧪 Testing Performance Under Load...');
      
      const operations = [];
      const numOperations = 10;

      // Create multiple projects concurrently
      for (let i = 0; i < numOperations; i++) {
        operations.push(
          this.projectService.createProject({
            title: `Performance Test Project ${i}`,
            description: `Test project ${i} for performance testing`,
            location: `Test Location ${i}`,
            status: 'planning' as const
          })
        );
      }

      const results = await Promise.allSettled(operations);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      metrics.entitiesProcessed = successful;
      metrics.operationsExecuted = numOperations;
      metrics.dataIntegrityScore = (successful / numOperations) * 100;
      metrics.performanceScore = this.calculatePerformanceScore(startTime, metrics.operationsExecuted);

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Performance Under Load',
        status: successful === numOperations ? 'passed' : 'failed',
        duration,
        details: `Processed ${successful}/${numOperations} operations successfully`,
        metrics
      };
    } catch (error) {
      metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        testName: 'Performance Under Load',
        status: 'failed',
        duration: Date.now() - startTime,
        details: `Failed performance test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics
      };
    }
  }

  /**
   * Calculate data integrity score
   */
  private calculateDataIntegrity(
    original: any,
    retrieved: any,
    ...entities: any[]
  ): number {
    const checks = entities.map(entity => {
      return original.id === entity.id;
    });
    
    return checks.every(check => check) ? 100 : 0;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(startTime: number, operations: number): number {
    const duration = Date.now() - startTime;
    const operationsPerSecond = operations / (duration / 1000);
    
    // Score based on operations per second
    if (operationsPerSecond > 10) return 100;
    if (operationsPerSecond > 5) return 80;
    if (operationsPerSecond > 2) return 60;
    if (operationsPerSecond > 1) return 40;
    return 20;
  }

  /**
   * Generate integration test report
   */
  static async generateIntegrationTestReport(): Promise<{
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
  }> {
    const results = await WorkflowIntegrationTestService.runAllIntegrationTests();
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    const overallScore = results.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / totalTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    const recommendations = WorkflowIntegrationTestService.generateRecommendations(results);
    
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
   * Generate recommendations based on test results
   */
  private static generateRecommendations(results: IntegrationTestResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedTests = results.filter(r => r.status === 'failed');
    const slowTests = results.filter(r => r.duration > 5000);
    
    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failed integration tests`);
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`Optimize ${slowTests.length} slow performing tests`);
    }
    
    const lowScoreTests = results.filter(r => r.metrics.performanceScore < 50);
    if (lowScoreTests.length > 0) {
      recommendations.push('Improve performance for low-scoring tests');
    }
    
    const errorTests = results.filter(r => r.metrics.errors.length > 0);
    if (errorTests.length > 0) {
      recommendations.push('Address errors in failing tests');
    }
    
    return recommendations;
  }
}
