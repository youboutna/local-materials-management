/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets
 * Following hexagonal architecture and PROMPT.md rules
 * 
 * Hexagonal Flow:
 * UI Component → Transformer → DTO (camelCase) → Service → Domain ← API(call supabase)(snake_case) → DB
 */

import { Project } from '@/domain/entities/Project';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import type { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import type { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import type { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import type { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import type { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import type { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';
import { WorkflowStep, WorkflowState, WorkflowTransition, ProjectWorkflowData, ValidationResult, SaveResult, StepRelatedDataDTO } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO, ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { Phase } from '@/domain/entities/Phase';
import { Risk } from '@/domain/entities/Risk';
import { PhaseDTO, PhaseStatus, PhaseType, PhasePriority } from '@/dtos/entities/PhaseDTO';
import { RiskDTO, RiskStatus } from '@/dtos/entities/RiskDTO';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceCertificateDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { ReferentialService } from '@/application/services/ReferentialService';
import { PhaseService } from '@/application/services/PhaseService';
import { MilestoneService } from '@/application/services/MilestoneService';
import { TaskService } from '@/application/services/TaskService';
import { MaterialService } from '@/application/services/MaterialService';
import { InspectionService } from '@/application/services/InspectionService';
import { DocumentService } from '@/application/services/DocumentService';
import { PaymentService } from '@/application/services/PaymentService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { ReceptionService } from '@/application/services/ReceptionService';
import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { InsuranceService } from '@/application/services/InsuranceService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import { ReferentialType, getReferential, getPhasesForReferential } from '@/config/referentials';
import { addDays, format, parseISO } from 'date-fns';

export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit',
  COMPLETE = 'complete',
  CANCEL = 'cancel'
}

// Export types for hooks
export interface ProjectCreationWorkflowData extends ProjectWorkflowData {
  referentialCode?: ReferentialType;
  generateMilestones?: boolean;
}

// Phase generation interfaces (from PhaseGeneratorService)
export interface GeneratedPhaseData {
  id: string;
  phaseCode: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  progress: number;
  order: number;
  steps: GeneratedStepData[];
  milestones: GeneratedMilestoneDTO[];
}

export interface GeneratedStepData {
  id: string;
  stepCode: string;
  name: string;
  order: number;
  tasks: GeneratedTaskData[];
}

export interface GeneratedTaskData {
  id: string;
  taskCode: string;
  name: string;
  description?: string;
  estimatedDurationDays: number;
  requiresInspection: boolean;
  requiresEngineerApproval: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface ProjectGenerationConfig {
  referentialType: ReferentialType;
  projectStartDate: string;
  projectBudget: number;
  projectId?: string;
  generateMilestones: boolean;
}

export interface GeneratedMilestoneDTO {
  title: string;
  description: string;
  target_date: string;
  type: string;
  priority: string;
  weight: number;
  deliverables: string[];
  dependencies: string[];
  requiresInspection: boolean;
  inspectionType: string;
  templateId?: string;
  phaseCode?: string;
}

export interface GenerationSummary {
  totalPhases: number;
  totalSteps: number;
  totalTasks: number;
  totalMilestones: number;
  estimatedDurationDays: number;
}

export interface WorkflowResult {
  success: boolean;
  projectId?: string;
  data?: ProjectDTO;
  errors?: string[];
  warnings?: string[];
}

export class ProjectWorkflowService {
  private referentialService: ReferentialService;
  
  // Additional services for comprehensive project management (optional)
  private phaseService: PhaseService;
  private milestoneService?: MilestoneService;
  private taskService?: TaskService;
  private materialService?: MaterialService;
  private inspectionService?: InspectionService;
  private documentService?: DocumentService;
  private paymentService?: PaymentService;
  private employeeService?: EmployeeService;
  private supplierService?: SupplierService;
  private receptionService?: ReceptionService;
  private bankGuaranteeService: BankGuaranteeService;
  private insuranceService: InsuranceService;

  constructor(
    private projectRepository: IProjectRepository,
    private phaseRepository: IPhaseRepository,
    private riskRepository: IRiskRepository,
    private stakeholderRepository: IProjectStakeholderRepository,
    private milestoneRepository?: IMilestoneRepository,
    private taskRepository?: ITaskRepository,
    private materialRepository?: IMaterialRepository,
    private inspectionRepository?: IInspectionRepository,
    private documentRepository?: IDocumentRepository,
    private paymentRepository?: IPaymentRepository,
    private employeeRepository?: IEmployeeRepository,
    private supplierRepository?: ISupplierRepository,
    private receptionRepository?: IReceptionRepository
  ) {
    this.referentialService = ReferentialService.getInstance();
    
    // Initialize additional services
    this.phaseService = new PhaseService(phaseRepository);
    this.milestoneService = milestoneRepository ? new MilestoneService(milestoneRepository) : undefined;
    this.taskService = taskRepository ? new TaskService(taskRepository) : undefined;
    this.materialService = materialRepository ? new MaterialService(materialRepository) : undefined;
    this.inspectionService = inspectionRepository ? new InspectionService(inspectionRepository) : undefined;
    this.documentService = documentRepository ? new DocumentService(documentRepository) : undefined;
    this.paymentService = paymentRepository ? new PaymentService(paymentRepository) : undefined;
    this.employeeService = employeeRepository ? new EmployeeService(employeeRepository) : undefined;
    this.supplierService = supplierRepository ? new SupplierService(supplierRepository) : undefined;
    this.receptionService = receptionRepository ? new ReceptionService(receptionRepository, documentRepository || RepositoryFactory.getDocumentRepository(), inspectionRepository || RepositoryFactory.getInspectionRepository(), employeeRepository || RepositoryFactory.getEmployeeRepository()) : undefined;
    this.bankGuaranteeService = new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository());
    this.insuranceService = new InsuranceService(RepositoryFactory.getInsuranceRepository());
  }

  // =================== WORKFLOW INITIALIZATION ===================

  initializeWorkflow(mode: 'creation' | 'edit'): { mode: string; currentStep: number; totalSteps: number } {
    return {
      mode,
      currentStep: 1,
      totalSteps: 9
    };
  }

  getWorkflowSteps(): WorkflowStep[] {
    return [
      { id: 'project-info', name: 'project_info', title: 'Informations du projet', description: 'Type, budget, dates, référence', order: 1, isCompleted: false, isRequired: true, validation: { rules: ['title_required', 'budget_positive'], requiredFields: ['title', 'description', 'budget'] } },
      { id: 'stakeholders', name: 'stakeholders', title: 'Parties prenantes', description: 'Bailleurs, Ministères, Entreprises', order: 2, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: ['projectManagerId'] } },
      { id: 'location', name: 'location', title: 'Localisation', description: 'Géolocalisation interactive', order: 3, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: ['location'] } },
      { id: 'phases', name: 'phases', title: 'Planification WBS', description: 'Phase → Step → Task', order: 4, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'risks', name: 'risks', title: 'Risques', description: 'Analyse et gestion des risques', order: 5, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'compliance', name: 'compliance', title: 'Conformité', description: 'Standards SOMELEC et bailleurs', order: 6, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'review', name: 'review', title: 'Validation', description: 'Réception définitive et clôture', order: 7, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } }
    ];
  }

  getEditWorkflowSteps(): WorkflowStep[] {
    return this.getWorkflowSteps();
  }

  getWorkflowStep(order: number): WorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.order === order);
  }

  // =================== WORKFLOW STATE MANAGEMENT ===================

  async initializeEditWorkflow(projectId: string): Promise<ProjectWorkflowData> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Load project DTO
      const projectDTO = ProjectTransformer.toDTO(project);

      // Load related data in parallel
      const [phases, risks] = await Promise.all([
        this.phaseRepository?.findByProjectId(projectId).catch(() => []) || Promise.resolve([]),
        this.riskRepository?.findByProjectId(projectId).catch(() => []) || Promise.resolve([]),
      ]);

      // Build complete workflow data
      const workflowData: ProjectWorkflowData = {
        projectId,
        currentStep: 1,
        isDraft: false,
        isComplete: projectDTO.status === 'termine' || projectDTO.status === 'completed',
        projectData: projectDTO,
        relatedData: {
          phases: (phases || []).map((p: any) => ({
            id: p.id,
            projectId: p.projectId || projectId,
            name: p.name || p.phaseName || '',
            description: p.description || '',
            startDate: p.startDate,
            endDate: p.endDate,
            progress: p.progress || 0,
            status: p.status || 'not_started',
            type: p.type || p.phaseType || 'custom',
            priority: p.priority || 'medium',
            orderIndex: p.orderIndex || 0,
            estimatedCost: p.estimatedCost || 0,
            estimatedDuration: p.estimatedDuration || 0,
            constructionStage: p.constructionStage || '',
          })) as PhaseDTO[],
          risks: (risks || []).map((r: any) => ({
            id: r.id,
            projectId: r.projectId || projectId,
            title: r.title || r.riskTitle || '',
            description: r.description || r.riskDescription || '',
            probability: r.probability || 0,
            impact: r.impact || 0,
            riskScore: r.riskScore || 0,
            status: r.status || 'identified',
            mitigationPlan: r.mitigationPlan || r.mitigationStrategy || '',
          })) as RiskDTO[],
        },
        metadata: {
          lastSavedAt: projectDTO.updatedAt || new Date().toISOString(),
          totalSteps: 7,
          completedSteps: 1,
          progressPercentage: 14,
        },
      };

      return workflowData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to initialize workflow');
    }
  }

  // =================== STEP VALIDATION ===================

  async validateStep(stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<ValidationResult & { warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const step = this.getWorkflowStep(stepNumber);

    if (!step) {
      return { isValid: false, errors: ['Invalid step number'], warnings: [] };
    }

    // Validate required fields
    const requiredFields = step.validation?.requiredFields || [];
    for (const field of requiredFields) {
      const value = this.getNestedValue(data, field);
      if (value === undefined || value === null || value === '') {
        errors.push(`Le champ "${field}" est obligatoire`);
      }
    }

    // Validate referential if specified
    if (data.projectData?.projectReference) {
      const referential = await this.referentialService.getReferential(
        data.projectData.projectReference as ReferentialType
      );
      if (!referential) {
        warnings.push(`Le référentiel "${data.projectData.projectReference}" n'existe pas. Utilisation des paramètres par défaut.`);
      }
    }

    // Step-specific validations
    switch (stepNumber) {
      case 1: // Project Info
        if (data.projectData?.budget && data.projectData.budget <= 0) {
          warnings.push('Le budget devrait être supérieur à 0');
        }
        if (data.projectData?.startDate && data.projectData?.endDate) {
          const start = new Date(data.projectData.startDate);
          const end = new Date(data.projectData.endDate);
          if (end < start) {
            errors.push('La date de fin doit être après la date de début');
          }
        }
        break;
      case 4: // Phases
        if (!data.relatedData?.phases || data.relatedData.phases.length === 0) {
          warnings.push('Aucune phase définie. Considérez d\'utiliser un référentiel pour générer les phases.');
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // =================== STEP SAVE ===================

  async saveStep(stepNumber: number, data: ProjectWorkflowData, context: any): Promise<SaveResult & { projectId?: string }> {
    try {
      // Validate step first
      const validation = await this.validateStep(stepNumber, data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }

      const result = await this.saveWorkflowData(data);
      
      return {
        success: true,
        projectId: result.projectId,
        data: result,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Step save error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // =================== WORKFLOW DATA PERSISTENCE ===================

  async saveWorkflowData(data: ProjectWorkflowData): Promise<ProjectWorkflowData> {
    try {
      const projectData = data.projectData;
      let savedProjectId = projectData?.id;

      if (!savedProjectId && projectData?.title) {
        // Create new project with all fields
        const createRequest: CreateProjectDTO = {
          title: projectData.title,
          description: projectData.description || '',
          location: projectData.location || '',
          budget: projectData.budget || 0,
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          endDate: projectData.endDate,
          status: ProjectStatus.PLANIFIE,
          thumbnail: projectData.thumbnail || '',
          teamSize: projectData.teamSize || 1,
          financingSource: projectData.financingSource,
          marketType: projectData.marketType,
          selectionMode: projectData.selectionMode,
          projectReference: projectData.projectReference,
          mainContractor: typeof projectData.mainContractor === 'string'
            ? projectData.mainContractor
            : (typeof projectData.mainContractor === 'object' && projectData.mainContractor !== null && 'name' in projectData.mainContractor
              ? String((projectData.mainContractor as { name: string }).name)
              : ''),
          allowsInitialPayment: projectData.allowsInitialPayment as boolean | undefined,
          initialPaymentPercentage: projectData.initialPaymentPercentage as number | undefined,
          currentPhase: projectData.currentPhase,
          currentStage: projectData.currentStage,
          ...(projectData.coordinates ? {
            latitude: typeof projectData.coordinates === 'object' && projectData.coordinates !== null && 'latitude' in projectData.coordinates
              ? (projectData.coordinates as { latitude: number; longitude: number }).latitude
              : undefined,
            longitude: typeof projectData.coordinates === 'object' && projectData.coordinates !== null && 'longitude' in projectData.coordinates
              ? (projectData.coordinates as { latitude: number; longitude: number }).longitude
              : undefined
          } : {})
        };

        const projectEntity = ProjectTransformer.fromCreateDTOToEntity(createRequest);
        const createdProject = await this.projectRepository.create(projectEntity);
        savedProjectId = createdProject.id;

        // If referential is specified, generate enhanced phases from it
        if (projectData.projectReference) {
          const config: ProjectGenerationConfig = {
            referentialType: projectData.projectReference as ReferentialType,
            projectStartDate: projectData.startDate || new Date().toISOString().split('T')[0],
            projectBudget: projectData.budget || 0,
            projectId: savedProjectId,
            generateMilestones: true
          };
          
          const generatedPhases = await this.generateCompleteProjectStructure(config);
          
          // Save the enhanced phase structure
          await this.saveGeneratedPhases(savedProjectId, generatedPhases);
        }
      } else if (savedProjectId) {
        // Update existing project
        const updateRequest: UpdateProjectDTO = {
          id: savedProjectId,
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          budget: projectData.budget,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          teamSize: projectData.teamSize,
          thumbnail: projectData.thumbnail,
        };

        const projectEntity = ProjectTransformer.fromUpdateDTOToEntity(updateRequest);
        await this.projectRepository.update(savedProjectId, projectEntity);
      }

      // Save related data
      if (savedProjectId && data.relatedData) {
        await this.saveRelatedData(savedProjectId, data.relatedData);
      }

      return {
        ...data,
        projectId: savedProjectId,
        metadata: {
          ...data.metadata,
          lastSavedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save workflow data');
    }
  }

  private async saveRelatedData(projectId: string, relatedData: StepRelatedDataDTO & { milestones?: MilestoneDTO[]; documents?: DocumentDTO[]; payments?: PaymentDTO[]; bankGuarantees?: BankGuaranteeDTO[]; insuranceCertificates?: InsuranceCertificateDTO[]; receptions?: any[] }): Promise<void> {
    // Save phases if provided
    if (relatedData.phases && relatedData.phases.length > 0) {
      for (const phase of relatedData.phases) {
        const phaseEntity = {
          ...phase,
          projectId,
          status: phase.status || PhaseStatus.PENDING
        };
        await this.phaseRepository.create(phaseEntity as unknown as Phase);
      }
    }

    // Save risks if provided - using repository save method
    if (relatedData.risks && relatedData.risks.length > 0) {
      for (const risk of relatedData.risks) {
        const riskEntity = {
          ...risk,
          projectId,
          status: risk.status || RiskStatus.IDENTIFIED
        };
        await this.riskRepository.save(riskEntity as Risk);
      }
    }

    // Save milestones if provided
    if (relatedData.milestones && relatedData.milestones.length > 0 && this.milestoneService) {
      for (const milestone of relatedData.milestones) {
        await this.milestoneService.createMilestone({
          ...milestone,
          projectId
        } as any);
      }
    }

    // Save tasks if provided
    if (relatedData.tasks && relatedData.tasks.length > 0 && this.taskService) {
      for (const task of relatedData.tasks) {
        await this.taskService.createTask({
          ...task,
          projectId
        } as any);
      }
    }

    // Save materials if provided
    if (relatedData.materials && relatedData.materials.length > 0 && this.materialService) {
      for (const material of relatedData.materials) {
        await this.materialService.createMaterial({
          ...material,
          projectId
        } as any);
      }
    }

    // Save inspections if provided
    if (relatedData.inspections && relatedData.inspections.length > 0 && this.inspectionService) {
      for (const inspection of relatedData.inspections) {
        await this.inspectionService.createInspection({
          ...inspection,
          projectId
        } as any);
      }
    }

    // Save documents if provided
    if (relatedData.documents && relatedData.documents.length > 0 && this.documentService) {
      for (const document of relatedData.documents) {
        await this.documentService.createDocument({
          ...document,
          projectId
        } as any);
      }
    }

    // Save payments if provided
    if (relatedData.payments && relatedData.payments.length > 0 && this.paymentService) {
      for (const payment of relatedData.payments) {
        await this.paymentService.createPayment({
          ...payment,
          projectId
        } as any);
      }
    }

    // Save stakeholders if provided
    if (relatedData.stakeholders && relatedData.stakeholders.length > 0) {
      for (const stakeholder of relatedData.stakeholders) {
        await this.stakeholderRepository.create({
          ...stakeholder,
          projectId
        } as any);
      }
    }

    // Save bank guarantees if provided
    if (relatedData.bankGuarantees && relatedData.bankGuarantees.length > 0) {
      for (const guarantee of relatedData.bankGuarantees) {
        await this.bankGuaranteeService.createBankGuarantee({
          ...guarantee,
          projectId
        } as any);
      }
    }

    // Save insurance certificates if provided
    if (relatedData.insuranceCertificates && relatedData.insuranceCertificates.length > 0) {
      for (const certificate of relatedData.insuranceCertificates) {
        await this.insuranceService.createInsuranceCertificate({
          ...certificate,
          projectId
        } as any);
      }
    }

    // Save receptions if provided
    if (relatedData.receptions && relatedData.receptions.length > 0 && this.receptionService) {
      for (const reception of relatedData.receptions) {
        await this.receptionService.createReception({
          ...reception,
          projectId
        } as any);
      }
    }
  }

  // =================== ENHANCED PHASE GENERATION (from PhaseGeneratorService) ===================

  /**
   * Generate complete project structure from referential (enhanced version)
   */
  async generateCompleteProjectStructure(config: ProjectGenerationConfig): Promise<GeneratedPhaseData[]> {
    try {
      const referential = getReferential(config.referentialType);
      if (!referential) {
        console.error(`Referential not found: ${config.referentialType}`);
        return [];
      }

      const phases = getPhasesForReferential(config.referentialType, 'fr');
      if (phases.length === 0) {
        console.log(`No phases found for referential: ${config.referentialType}`);
        return [];
      }

      const generatedPhases: GeneratedPhaseData[] = [];
      let cumulativeStartDays = 0;
      const projectStart = parseISO(config.projectStartDate);
      const budgetPerPhase = config.projectBudget / phases.length;

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseId = `phase-${Date.now()}-${i}`;
        
        // Calculate phase duration from steps and tasks
        const { steps, totalDuration } = this.generateStepsWithTasks(phase.steps, phaseId);
        
        // Calculate dates
        const phaseStartDate = addDays(projectStart, cumulativeStartDays);
        const phaseEndDate = addDays(phaseStartDate, totalDuration);

        // Generate milestones if enabled
        let milestones: GeneratedMilestoneDTO[] = [];
        if (config.generateMilestones && config.projectId && this.milestoneService) {
          milestones = await this.generateMilestonesForPhase({
            referentialType: config.referentialType,
            phaseCode: phase.code,
            phaseStartDate: format(phaseStartDate, 'yyyy-MM-dd'),
            projectId: config.projectId,
            phaseId,
            phaseBudget: budgetPerPhase
          });
        }

        generatedPhases.push({
          id: phaseId,
          phaseCode: phase.code,
          title: phase.label,
          description: phase.description || `Phase: ${phase.label}`,
          startDate: format(phaseStartDate, 'yyyy-MM-dd'),
          endDate: format(phaseEndDate, 'yyyy-MM-dd'),
          estimatedDuration: totalDuration,
          status: 'not_started',
          budget: Math.round(budgetPerPhase),
          progress: 0,
          order: phase.order || i + 1,
          steps,
          milestones
        });

        cumulativeStartDays += totalDuration;
      }

      return generatedPhases;
    } catch (error) {
      console.error('Error generating complete project structure:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to generate project structure: ${config.referentialType}`);
    }
  }

  /**
   * Generate steps and tasks from referential (enhanced version)
   */
  private generateStepsWithTasks(
    stepsData: Array<{
      code: string;
      label: string;
      order: number;
      tasks: Array<{
        code: string;
        label: string;
        description?: string;
        requiresInspection?: boolean;
        requiresEngineerApproval?: boolean;
        estimatedDurationDays?: number;
      }>;
    }>,
    phaseId: string
  ): { steps: GeneratedStepData[]; totalDuration: number } {
    const steps: GeneratedStepData[] = [];
    let totalDuration = 0;

    for (let i = 0; i < stepsData.length; i++) {
      const step = stepsData[i];
      const stepId = `step-${phaseId}-${i}`;
      
      const tasks: GeneratedTaskData[] = [];
      let stepDuration = 0;

      for (let j = 0; j < step.tasks.length; j++) {
        const task = step.tasks[j];
        const taskDuration = task.estimatedDurationDays || 7;
        stepDuration += taskDuration;

        tasks.push({
          id: `task-${stepId}-${j}`,
          taskCode: task.code,
          name: task.label,
          description: task.description,
          estimatedDurationDays: taskDuration,
          requiresInspection: task.requiresInspection || false,
          requiresEngineerApproval: task.requiresEngineerApproval || false,
          status: 'not_started'
        });
      }

      // Minimum step duration
      if (stepDuration === 0) stepDuration = 14;
      totalDuration += stepDuration;

      steps.push({
        id: stepId,
        stepCode: step.code,
        name: step.label,
        order: step.order || i + 1,
        tasks
      });
    }

    // Minimum phase duration
    if (totalDuration === 0) totalDuration = 30;

    return { steps, totalDuration };
  }

  /**
   * Get summary of what would be generated for a referential
   */
  async getGenerationSummary(referentialType: ReferentialType): Promise<GenerationSummary> {
    try {
      const phases = getPhasesForReferential(referentialType, 'fr');
      let totalSteps = 0;
      let totalTasks = 0;
      let totalMilestones = 0;
      let estimatedDurationDays = 0;

      for (const phase of phases) {
        totalSteps += phase.steps.length;
        
        for (const step of phase.steps) {
          totalTasks += step.tasks.length;
          for (const task of step.tasks) {
            estimatedDurationDays += task.estimatedDurationDays || 7;
          }
        }

        if (this.milestoneService) {
          // Count milestones for this phase
          totalMilestones += phase.steps.length; // Simplified: one milestone per step
        }
      }

      return {
        totalPhases: phases.length,
        totalSteps,
        totalTasks,
        totalMilestones,
        estimatedDurationDays
      };
    } catch (error) {
      console.error('Error getting generation summary:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get generation summary for: ${referentialType}`);
    }
  }

  /**
   * Get milestones requiring inspection for all phases
   */
  async getInspectionMilestonesForProject(referentialType: ReferentialType): Promise<Map<string, GeneratedMilestoneDTO[]>> {
    try {
      const phases = getPhasesForReferential(referentialType, 'fr');
      const inspectionMilestones = new Map<string, GeneratedMilestoneDTO[]>();

      for (const phase of phases) {
        // Generate inspection milestones for each step that requires inspection
        const milestones: GeneratedMilestoneDTO[] = [];
        
        for (const step of phase.steps) {
          const hasInspectionTasks = step.tasks.some(task => task.requiresInspection);
          
          if (hasInspectionTasks) {
            milestones.push({
              title: `Inspection - ${step.label}`,
              description: `Inspection technique pour l'étape ${step.label}`,
              target_date: '', // Will be calculated at generation time
              type: 'inspection',
              priority: 'high',
              weight: 1.0,
              deliverables: ['Rapport d\'inspection', 'Photos', 'Documents de conformité'],
              dependencies: [],
              requiresInspection: true,
              inspectionType: 'technical',
              phaseCode: phase.code
            });
          }
        }
        
        if (milestones.length > 0) {
          inspectionMilestones.set(phase.code, milestones);
        }
      }

      return inspectionMilestones;
    } catch (error) {
      console.error('Error getting inspection milestones:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get inspection milestones for: ${referentialType}`);
    }
  }

  /**
   * Generate milestones for a specific phase
   */
  private async generateMilestonesForPhase(config: {
    referentialType: ReferentialType;
    phaseCode: string;
    phaseStartDate: string;
    projectId: string;
    phaseId: string;
    phaseBudget: number;
  }): Promise<GeneratedMilestoneDTO[]> {
    try {
      // This would integrate with MilestoneService to generate actual milestones
      // For now, return basic milestone structure
      const phases = getPhasesForReferential(config.referentialType, 'fr');
      const phase = phases.find(p => p.code === config.phaseCode);
      
      if (!phase) return [];
      
      const milestones: GeneratedMilestoneDTO[] = [];
      
      // Generate milestone for each step that requires inspection
      for (const step of phase.steps) {
        const hasInspectionTasks = step.tasks.some(task => task.requiresInspection);
        
        if (hasInspectionTasks) {
          milestones.push({
            title: `Inspection - ${step.label}`,
            description: `Inspection technique pour l'étape ${step.label}`,
            target_date: config.phaseStartDate,
            type: 'inspection',
            priority: 'high',
            weight: 1.0,
            deliverables: ['Rapport d\'inspection', 'Photos', 'Documents de conformité'],
            dependencies: [],
            requiresInspection: true,
            inspectionType: 'technical',
            phaseCode: config.phaseCode
          });
        }
      }
      
      return milestones;
    } catch (error) {
      console.error('Error generating milestones for phase:', error);
      return [];
    }
  }

  /**
   * Save generated phases with enhanced structure (steps → tasks hierarchy)
   */
  private async saveGeneratedPhases(projectId: string, generatedPhases: GeneratedPhaseData[]): Promise<void> {
    try {
      for (const phaseData of generatedPhases) {
        // Create phase entity
        const phaseEntity = {
          projectId,
          name: phaseData.title,
          description: phaseData.description,
          orderIndex: phaseData.order,
          status: PhaseStatus.PENDING,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
          progress: 0,
          startDate: phaseData.startDate,
          endDate: phaseData.endDate,
          budget: phaseData.budget
        };
        
        const createdPhase = await this.phaseRepository.create(phaseEntity as any);
        
        // Save steps and tasks for this phase
        if (this.taskService) {
          for (const stepData of phaseData.steps) {
            // Create step entity
            const stepEntity = {
              projectId,
              phaseId: createdPhase.id,
              name: stepData.name,
              description: `Step: ${stepData.name}`,
              orderIndex: stepData.order,
              status: 'pending' as any,
              progress: 0
            };
            
            const createdStep = await this.taskRepository?.save(stepEntity as any).then(() => stepEntity) as any;
            
            // Save tasks for this step
            for (const taskData of stepData.tasks) {
              const taskEntity = {
                projectId,
                phaseId: createdPhase.id,
                stepId: createdStep?.id,
                name: taskData.name,
                description: taskData.description,
                orderIndex: 0, // Will be set based on array index
                status: 'pending' as any,
                progress: 0,
                estimatedDuration: taskData.estimatedDurationDays,
                requiresInspection: taskData.requiresInspection,
                requiresEngineerApproval: taskData.requiresEngineerApproval
              };
              
              await this.taskRepository?.save(taskEntity as any);
            }
          }
        }
        
        // Save milestones for this phase
        if (this.milestoneService && phaseData.milestones.length > 0) {
          for (const milestoneData of phaseData.milestones) {
            await this.milestoneService.createMilestone({
              projectId,
              phaseId: createdPhase.id,
              title: milestoneData.title,
              description: milestoneData.description,
              targetDate: milestoneData.target_date,
              type: milestoneData.type,
              priority: milestoneData.priority,
              weight: milestoneData.weight,
              deliverables: milestoneData.deliverables,
              dependencies: milestoneData.dependencies,
              requiresInspection: milestoneData.requiresInspection,
              inspectionType: milestoneData.inspectionType
            } as any);
          }
        }
      }
    } catch (error) {
      console.error('Error saving generated phases:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save generated phases');
    }
  }

  // =================== LEGACY REFERENTIAL INTEGRATION ===================

  async generatePhasesFromReferential(projectId: string, referentialCode: ReferentialType): Promise<PhaseDTO[]> {
    try {
      const phases = await this.referentialService.convertToProjectPhases(referentialCode, projectId);
      
      const createdPhases: PhaseDTO[] = [];
      for (const phaseData of phases) {
        const phaseEntity = {
          projectId,
          name: phaseData.name,
          description: phaseData.description,
          orderIndex: phaseData.phase_number,
          status: PhaseStatus.PENDING,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
          progress: 0
        };
        
        const created = await this.phaseRepository.create(phaseEntity as any);
        createdPhases.push({
          id: created.id,
          projectId,
          name: phaseData.name,
          description: phaseData.description,
          status: PhaseStatus.PENDING,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
          progress: 0,
          orderIndex: phaseData.phase_number, // Store referential order
          startDate: phaseData.start_date || undefined,
          endDate: phaseData.end_date || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as PhaseDTO);
      }
      
      return createdPhases;
    } catch (error) {
      console.error('Failed to generate phases from referential:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to generate phases from referential: ${referentialCode}`);
    }
  }

  async getReferentialOptions(): Promise<{ value: string; label: string; description?: string }[]> {
    return this.referentialService.getReferentialOptions();
  }

  // =================== WORKFLOW COMPLETION ===================

  async completeWorkflow(data: any): Promise<any> {
    try {
      if (data.projectId || data.projectData?.id) {
        const projectId = data.projectId || data.projectData?.id;
        await this.projectRepository.update(projectId, { status: 'en_cours' } as any);
      }
      
      return { 
        ...data, 
        status: 'completed', 
        completedAt: new Date().toISOString() 
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to complete workflow');
    }
  }

  // =================== PROGRESS MANAGEMENT ===================

  calculateProgress(completedSteps: number, totalSteps: number = 7): number {
    return Math.round((completedSteps / totalSteps) * 100);
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    try {
      const phases = await this.phaseRepository.findByProjectId(projectId);
      if (!phases || phases.length === 0) return 0;
      
      const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
      return Math.round(totalProgress / phases.length);
    } catch (error) {
      console.error('Failed to calculate project progress:', error);
      return 0;
    }
  }

  canProceedToNextStep(currentStep: number, stepData: ProjectWorkflowData): boolean {
    return true;
  }

  // =================== TRANSITIONS ===================

  private getAvailableTransitions(currentStepId: string): WorkflowTransition[] {
    const steps = this.getWorkflowSteps();
    const currentStep = steps.find(s => s.id === currentStepId);
    
    if (!currentStep) return [];
    
    const nextStep = steps.find(s => s.order === currentStep.order + 1);
    
    if (!nextStep) return [];
    
    return [{
      fromStep: currentStepId,
      toStep: nextStep.id,
      condition: 'step_completed',
      action: 'proceed_to_next'
    }];
  }

  // =================== PROJECT CREATION ===================

  async createProject(data: ProjectWorkflowData): Promise<ProjectDTO> {
    const projectData = data.projectData;
    
    const projectEntity: Partial<Project> = {
      title: projectData?.title || 'New Project',
      description: projectData?.description,
      status: 'planifie' as any,
      location: projectData?.location,
      budget: projectData?.budget || 0,
      progress: 0,
      startDate: projectData?.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData?.endDate ? new Date(projectData.endDate) : null,
      teamSize: projectData?.teamSize || 1,
      thumbnail: projectData?.thumbnail,
      financingSource: projectData?.financingSource,
      mainContractor: typeof projectData?.mainContractor === 'string' 
        ? projectData.mainContractor 
        : (projectData?.mainContractor as any)?.name || '',
      allowsInitialPayment: projectData?.allowsInitialPayment as boolean | undefined,
      initialAdvancePercentage: projectData?.initialPaymentPercentage as number | undefined,
      currentPhase: projectData?.currentPhase,
      currentStage: projectData?.currentStage
    };

    const created = await this.projectRepository.create(projectEntity);
    return ProjectTransformer.toDTO(created);
  }
}

export function createProjectWorkflowService(
  projectRepo: IProjectRepository,
  phaseRepo: IPhaseRepository,
  riskRepo: IRiskRepository,
  stakeholderRepo: IProjectStakeholderRepository,
  milestoneRepo?: IMilestoneRepository,
  taskRepo?: ITaskRepository,
  materialRepo?: IMaterialRepository,
  inspectionRepo?: IInspectionRepository,
  documentRepo?: IDocumentRepository,
  paymentRepo?: IPaymentRepository,
  employeeRepo?: IEmployeeRepository,
  supplierRepo?: ISupplierRepository,
  receptionRepo?: IReceptionRepository
) {
  return new ProjectWorkflowService(
    projectRepo, 
    phaseRepo, 
    riskRepo, 
    stakeholderRepo,
    milestoneRepo,
    taskRepo,
    materialRepo,
    inspectionRepo,
    documentRepo,
    paymentRepo,
    employeeRepo,
    supplierRepo,
    receptionRepo
  );
}
