/**
 * Enhanced Validation Integration Test
 * Tests the complete integration of enhanced risk, compliance, and validation management
 */

import { ComplianceService } from '@/application/services/ComplianceService';
import { EnhancedValidationService } from '@/application/services/EnhancedValidationService';
import { ReceptionService } from '@/application/services/ReceptionService';
import { RiskService } from '@/application/services/RiskService';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { ReceptionStatus, ReceptionType } from '@/dtos/entities/ReceptionDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Enhanced Validation Integration', () => {
  let validationService: EnhancedValidationService;
  let receptionService: ReceptionService;
  let riskService: RiskService;
  let complianceService: ComplianceService;
  let testProjectId: string;

  beforeEach(() => {
    // Initialize services with repositories
    validationService = new EnhancedValidationService(
      RepositoryFactory.getProjectRepository(),
      RepositoryFactory.getRiskRepository(),
      RepositoryFactory.getInspectionRepository(),
      RepositoryFactory.getDocumentRepository()
    );

    receptionService = new ReceptionService(
      RepositoryFactory.getReceptionRepository(),
      RepositoryFactory.getDocumentRepository(),
      RepositoryFactory.getInspectionRepository(),
      RepositoryFactory.getEmployeeRepository()
    );

    riskService = new RiskService(RepositoryFactory.getRiskRepository());
    complianceService = new ComplianceService(RepositoryFactory.getComplianceRepository());

    testProjectId = 'test-project-' + Date.now();
  });

  describe('Reception Management Integration', () => {
    it('should create provisional reception', async () => {
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test provisional reception'
      };

      const result = await receptionService.createProvisionalReception(testProjectId, '', receptionData);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(ReceptionType.PROVISIONAL);
      expect(result.status).toBe(ReceptionStatus.PENDING);
      expect(result.receptionCommittee).toEqual(receptionData.committee);
    });

    it('should create definitive reception', async () => {
      const receptionData = {
        scheduledDate: '2024-12-20',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test definitive reception'
      };

      const result = await receptionService.createDefinitiveReception(testProjectId, receptionData);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(ReceptionType.DEFINITIVE);
      expect(result.status).toBe(ReceptionStatus.PENDING);
    });

    it('should approve provisional reception', async () => {
      // First create a provisional reception
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test provisional reception'
      };

      const provisionalReception = await receptionService.createProvisionalReception(testProjectId, '', receptionData);
      
      // Then approve it
      const approvalData = {
        findings: [],
        conditions: [
          {
            id: 'condition-1',
            description: 'Fix minor issues',
            category: 'corrective',
            priority: 'low',
            responsibleParty: 'John Doe',
            status: 'pending'
          }
        ],
        validUntil: '2025-03-15',
        notes: 'Approved with conditions',
        approvedBy: 'approver-1'
      };

      const result = await receptionService.approveProvisionalReception(provisionalReception.id, approvalData);
      
      expect(result.status).toBe(ReceptionStatus.APPROVED);
      expect(result.conditions).toHaveLength(1);
      expect(result.provisionalValidUntil).toBe('2025-03-15');
    });

    it('should get reception workflow', async () => {
      const workflow = await receptionService.getReceptionWorkflow(testProjectId);
      
      expect(workflow).toBeDefined();
      expect(workflow.projectId).toBe(testProjectId);
      expect(workflow.currentStep).toBeGreaterThanOrEqual(0);
      expect(workflow.totalSteps).toBe(2);
    });
  });

  describe('Risk Management Integration', () => {
    it('should create and validate risks', async () => {
      const riskData = {
        project_id: testProjectId,
        title: 'Test Risk',
        description: 'Test risk description',
        category: 'technical',
        probability: 7,
        impact: 8,
        mitigation_plan: 'Test mitigation plan',
        contingency_plan: 'Test contingency plan',
        status: 'identified',
        owner_id: 'risk-owner',
        review_date: '2024-12-15',
        costs: 5000,
        timeline_impact: 5
      };

      const result = await riskService.createRisk(riskData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Risk');
      expect(result.category).toBe('technical');
      expect(result.probability).toBe(7);
      expect(result.impact).toBe(8);
    });

    it('should get risks by project', async () => {
      const risks = await riskService.getProjectRisks(testProjectId);
      
      expect(Array.isArray(risks)).toBe(true);
    });
  });

  describe('Compliance Management Integration', () => {
    it('should create compliance items', async () => {
      const complianceData = {
        projectId: testProjectId,
        createdBy: 'test-validator',
        title: 'Test Compliance',
        description: 'Test compliance description',
        type: 'regulatory' as const,
        status: 'pending' as const,
        priority: 'medium' as const,
        responsible: 'compliance-owner',
        category: 'Regulatory',
        complianceLevel: 'partial' as const,
        riskLevel: 'medium' as const,
        mitigationRequired: false
      };

      const result = await complianceService.createComplianceItem(complianceData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Compliance');
      expect(result.type).toBe('regulatory');
      expect(result.status).toBe('pending');
    });

    it('should get compliance by project', async () => {
      const complianceItems = await complianceService.getComplianceByProject(testProjectId);
      
      expect(Array.isArray(complianceItems)).toBe(true);
    });
  });

  describe('Enhanced Validation Service Integration', () => {
    it('should perform complete project validation', async () => {
      // Create test project data
      const projectData: Partial<ProjectDTO> = {
        id: testProjectId,
        title: 'Test Project',
        description: 'Test project for validation',
        status: 'in_progress',
        budget: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        location: 'Test Location',
        progress: 50
      };

      // Mock project creation
      const project = await RepositoryFactory.getProjectRepository().create(projectData as any);
      expect(project).toBeDefined();

      // Perform validation
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
      expect(validationResult).toBeDefined();
      expect(validationResult.validationDate).toBeDefined();
      expect(validationResult.validatedBy).toBe('test-validator');
      expect(validationResult.categories).toHaveLength(10); // All categories
      expect(validationResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(validationResult.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate validation scores correctly', async () => {
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
      // Check that all categories are present
      const categories = validationResult.categories.map(cat => cat.category);
      expect(categories).toContain('technical');
      expect(categories).toContain('financial');
      expect(categories).toContain('regulatory');
      expect(categories).toContain('safety');
      expect(categories).toContain('quality');
      expect(categories).toContain('environmental');
      expect(categories).toContain('documentation');
      expect(categories).toContain('reception');
      expect(categories).toContain('risk');
      expect(categories).toContain('compliance');

      // Check score calculations
      validationResult.categories.forEach(category => {
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(100);
        expect(['passed', 'failed', 'warning', 'pending']).toContain(category.status);
      });
    });

    it('should generate appropriate recommendations', async () => {
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
      expect(validationResult.recommendations).toBeDefined();
      expect(validationResult.recommendations.length).toBeGreaterThan(0);
      expect(validationResult.nextSteps).toBeDefined();
      expect(validationResult.nextSteps.length).toBeGreaterThan(0);
    });

    it('should track validation history', async () => {
      // Perform multiple validations
      await validationService.validateProjectComplete(testProjectId, 'validator-1');
      await validationService.validateProjectComplete(testProjectId, 'validator-2');
      
      const history = await validationService.getValidationHistory(testProjectId);
      
      expect(history).toHaveLength(2);
      expect(history[0].validatedBy).toBe('validator-1');
      expect(history[1].validatedBy).toBe('validator-2');
    });

    it('should calculate validation trends', async () => {
      // Perform multiple validations over time
      const dates = ['2024-01-01', '2024-02-01', '2024-03-01'];
      for (const date of dates) {
        await validationService.validateProjectComplete(testProjectId, 'validator');
        void date;
      }

      const trends = await validationService.getValidationTrends(testProjectId, 3);
      
      expect(trends.dates).toHaveLength(3);
      expect(trends.scores).toHaveLength(3);
      expect(Object.keys(trends.categories)).toHaveLength(10); // All categories
    });
  });

  describe('Cross-Service Integration', () => {
    it('should integrate reception with validation', async () => {
      // Create reception
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test reception'
      };

      const reception = await receptionService.createProvisionalReception(testProjectId, '', receptionData);
      
      // Validate project (should include reception validation)
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const receptionCategory = validationResult.categories.find(cat => cat.category === 'reception');
      expect(receptionCategory).toBeDefined();
      expect(receptionCategory.issues).toBeDefined();
    });

    it('should integrate risks with validation', async () => {
      // Create high-risk item
      const riskData = {
        project_id: testProjectId,
        title: 'High Risk Item',
        description: 'High risk description',
        category: 'technical',
        probability: 9,
        impact: 9,
        mitigation_plan: '',
        contingency_plan: '',
        status: 'identified',
        owner_id: 'risk-owner',
        review_date: '2024-12-15',
        costs: 10000,
        timeline_impact: 10
      };

      await riskService.createRisk(riskData);
      
      // Validate project (should detect high risk)
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const riskCategory = validationResult.categories.find(cat => cat.category === 'risk');
      expect(riskCategory).toBeDefined();
      expect(riskCategory.issues.length).toBeGreaterThan(0);
      expect(riskCategory.issues.some(issue => issue.severity === 'high' || issue.severity === 'critical')).toBe(true);
    });

    it('should integrate compliance with validation', async () => {
      // Create overdue compliance item
      const complianceData = {
        projectId: testProjectId,
        createdBy: 'test-validator',
        title: 'Overdue Compliance',
        description: 'Overdue compliance description',
        type: 'regulatory' as const,
        status: 'pending' as const,
        priority: 'high' as const,
        responsible: 'compliance-owner',
        deadline: '2024-01-01', // Past date
        category: 'Regulatory',
        complianceLevel: 'partial' as const,
        riskLevel: 'high' as const,
        mitigationRequired: true
      };

      await complianceService.createComplianceItem(complianceData);
      
      // Validate project (should detect overdue compliance)
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const complianceCategory = validationResult.categories.find(cat => cat.category === 'compliance');
      expect(complianceCategory).toBeDefined();
      expect(complianceCategory.issues.length).toBeGreaterThan(0);
      expect(complianceCategory.issues.some(issue => issue.severity === 'high' || issue.severity === 'critical')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Test with invalid project ID
      await expect(
        validationService.validateProjectComplete('invalid-id', 'validator')
      ).rejects.toThrow();
    });

    it('should handle service errors gracefully', async () => {
      // Mock repository error
      vi.spyOn(RepositoryFactory.getProjectRepository(), 'findById').mockRejectedValue(new Error('Database error'));

      await expect(
        validationService.validateProjectComplete(testProjectId, 'validator')
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple concurrent validations', async () => {
      const promises = [];
      
      // Create 5 concurrent validations
      for (let i = 0; i < 5; i++) {
        promises.push(validationService.validateProjectComplete(testProjectId, `validator-${i}`));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.categories).toHaveLength(10);
      });
    });
  });
});
