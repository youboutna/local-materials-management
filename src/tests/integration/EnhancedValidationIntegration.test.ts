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
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  InMemoryProjectRepository, 
  InMemoryRiskRepository, 
  InMemoryComplianceRepository, 
  InMemoryInspectionRepository, 
  InMemoryDocumentRepository, 
  InMemoryEmployeeRepository,
  InMemoryReceptionRepository,
  InMemoryValidationRepository
} from '../fakes/InMemoryRepositories';
import { Employee } from '@/domain/entities/Employee';

describe('Enhanced Validation Integration', () => {
  let validationService: EnhancedValidationService;
  let receptionService: ReceptionService;
  let riskService: RiskService;
  let complianceService: ComplianceService;
  
  let projectRepo: InMemoryProjectRepository;
  let riskRepo: InMemoryRiskRepository;
  let complianceRepo: InMemoryComplianceRepository;
  let inspectionRepo: InMemoryInspectionRepository;
  let documentRepo: InMemoryDocumentRepository;
  let employeeRepo: InMemoryEmployeeRepository;
  let receptionRepo: InMemoryReceptionRepository;
  let validationRepo: InMemoryValidationRepository;

  let testProjectId: string;

  beforeEach(async () => {
    // Initialize fakes
    projectRepo = new InMemoryProjectRepository();
    riskRepo = new InMemoryRiskRepository();
    complianceRepo = new InMemoryComplianceRepository();
    inspectionRepo = new InMemoryInspectionRepository();
    documentRepo = new InMemoryDocumentRepository();
    employeeRepo = new InMemoryEmployeeRepository();
    receptionRepo = new InMemoryReceptionRepository();
    validationRepo = new InMemoryValidationRepository();

    // Initialize services with repositories
    validationService = new EnhancedValidationService(
      projectRepo,
      riskRepo,
      inspectionRepo,
      documentRepo
    );
    // Inject validation repository fake (it's optional/private in the service)
    (validationService as any).validationRepository = validationRepo;

    receptionService = new ReceptionService(
      receptionRepo,
      documentRepo,
      inspectionRepo,
      employeeRepo
    );

    riskService = new RiskService(riskRepo);
    complianceService = new ComplianceService(complianceRepo);

    testProjectId = 'test-project-' + Date.now();

    // Setup required data: a chairman for receptions
    await employeeRepo.save(Employee.create({
      id: 'chairman-1',
      employeeId: 'EMP001',
      fullName: 'John Chairman',
      isActive: true,
      role: 'inspector'
    }));
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
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test provisional reception'
      };

      const provisionalReception = await receptionService.createProvisionalReception(testProjectId, '', receptionData);
      
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
      } as any;

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
        probability: 7, // Will be converted to 0.7 by service
        impact: 8,      // Will be converted to 0.8 by service
        mitigation_plan: 'Test mitigation plan',
        contingency_plan: 'Test contingency plan',
        status: 'identified',
        owner_id: 'risk-owner',
        review_date: '2024-12-15',
        costs: 5000,
        timeline_impact: 5
      };

      const result = await riskService.createRisk(riskData as any);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Risk');
      expect(result.category).toBe('technical');
      // The domain entity uses 0-1 scale
      expect(result.probability).toBe(0.7);
      expect(result.impact).toBe(0.8);
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
      const projectData: Partial<ProjectDTO> = {
        id: testProjectId,
        title: 'Test Project',
        description: 'Test project for validation',
        status: ProjectStatus.EN_COURS,
        budget: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        location: 'Test Location',
        progress: 50
      };

      const project = await projectRepo.create(projectData as any);
      expect(project).toBeDefined();

      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
      expect(validationResult).toBeDefined();
      expect(validationResult.validationDate).toBeDefined();
      expect(validationResult.validatedBy).toBe('test-validator');
      expect(validationResult.categories).toHaveLength(10);
      expect(validationResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(validationResult.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate validation scores correctly', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);

      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
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

      validationResult.categories.forEach(category => {
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(100);
        expect(['passed', 'failed', 'warning', 'pending']).toContain(category.status);
      });
    });

    it('should generate appropriate recommendations', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'test-validator');
      
      expect(validationResult.recommendations).toBeDefined();
      expect(validationResult.recommendations.length).toBeGreaterThan(0);
      expect(validationResult.nextSteps).toBeDefined();
      expect(validationResult.nextSteps.length).toBeGreaterThan(0);
    });

    it('should track validation history', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      await validationService.validateProjectComplete(testProjectId, 'validator-1');
      await validationService.validateProjectComplete(testProjectId, 'validator-2');
      
      const history = await validationService.getValidationHistory(testProjectId);
      
      expect(history).toHaveLength(2);
      expect(history[0].validatedBy).toBe('validator-1');
      expect(history[1].validatedBy).toBe('validator-2');
    });

    it('should calculate validation trends', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      for (let i = 0; i < 3; i++) {
        await validationService.validateProjectComplete(testProjectId, 'validator');
      }

      const trends = await validationService.getValidationTrends(testProjectId, 3);
      
      expect(trends.dates).toHaveLength(3);
      expect(trends.scores).toHaveLength(3);
      expect(Object.keys(trends.categories)).toHaveLength(10);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should integrate reception with validation', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith'],
        chairmanId: 'chairman-1',
        documents: [],
        notes: 'Test reception'
      };

      await receptionService.createProvisionalReception(testProjectId, '', receptionData);
      
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const receptionCategory = validationResult.categories.find(cat => cat.category === 'reception');
      expect(receptionCategory).toBeDefined();
      expect(receptionCategory!.issues).toBeDefined();
    });

    it('should integrate risks with validation', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
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

      await riskService.createRisk(riskData as any);
      
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const riskCategory = validationResult.categories.find(cat => cat.category === 'risk');
      expect(riskCategory).toBeDefined();
      expect(riskCategory!.issues.length).toBeGreaterThan(0);
      expect(riskCategory!.issues.some(issue => issue.severity === 'high' || issue.severity === 'critical')).toBe(true);
    });

    it('should integrate compliance with validation', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      const complianceData = {
        projectId: testProjectId,
        createdBy: 'test-validator',
        title: 'Overdue Compliance',
        description: 'Overdue compliance description',
        type: 'regulatory' as const,
        status: 'pending' as const,
        priority: 'high' as const,
        responsible: 'compliance-owner',
        // Échéance future : le service refuse toute deadline passée.
        deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        category: 'Regulatory',
        complianceLevel: 'partial' as const,
        riskLevel: 'high' as const,
        mitigationRequired: true
      };

      await complianceService.createComplianceItem(complianceData);
      
      const validationResult = await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const complianceCategory = validationResult.categories.find(cat => cat.category === 'compliance');
      expect(complianceCategory).toBeDefined();
      expect(complianceCategory!.issues.length).toBeGreaterThan(0);
      expect(complianceCategory!.issues.some(issue => issue.severity === 'high' || issue.severity === 'critical')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      await expect(
        validationService.validateProjectComplete('invalid-id', 'validator')
      ).rejects.toThrow();
    });

    it('should handle service errors gracefully', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      vi.spyOn(projectRepo, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(
        validationService.validateProjectComplete(testProjectId, 'validator')
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      const startTime = Date.now();
      
      await validationService.validateProjectComplete(testProjectId, 'validator');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple concurrent validations', async () => {
      await projectRepo.create({ id: testProjectId, title: 'Test' } as any);
      const promises: ReturnType<typeof validationService.validateProjectComplete>[] = [];
      
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
