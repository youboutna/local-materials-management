/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets
 * Following hexagonal architecture and PROMPT.md rules
 * 
 * Hexagonal Flow:
 * UI Component → Transformer → DTO (camelCase) → Service → Domain ← API(call supabase)(snake_case) → DB
 */

import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { DocumentService } from '@/application/services/DocumentService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { InspectionService } from '@/application/services/InspectionService';
import { InsuranceService } from '@/application/services/InsuranceService';
import { MaterialService } from '@/application/services/MaterialService';
import { MilestoneService } from '@/application/services/MilestoneService';
import { PaymentService } from '@/application/services/PaymentService';
import { PhaseService } from '@/application/services/PhaseService';
import { ReceptionService } from '@/application/services/ReceptionService';
import { ReferentialService } from '@/application/services/ReferentialService';
import { SupplierService } from '@/application/services/SupplierService';
import { TaskService } from '@/application/services/TaskService';
import { ReferentialType, getPhasesForReferential, getReferential } from '@/config/referentials';
import { Phase } from '@/domain/entities/Phase';
import { Project } from '@/domain/entities/Project';
import { Risk } from '@/domain/entities/Risk';
import type { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import type { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import type { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import type { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import type { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import type { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceCertificateDTO';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { PhaseDTO, PhasePriority, PhaseStatus, PhaseType } from '@/dtos/entities/PhaseDTO';
import { CreateProjectDTO, ProjectDTO, ProjectStatus, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RiskDTO, RiskStatus } from '@/dtos/entities/RiskDTO';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import { ProjectWorkflowData, SaveResult, StepRelatedDataDTO, ValidationResult, WorkflowStep, WorkflowTransition } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
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
    // ⚠️ requiredFields use dotted paths consumed by getNestedValue → must match ProjectWorkflowData shape.
    return [
      { id: 'project-info', name: 'project_info', title: 'Informations du projet', description: 'Type, budget, dates, référence', order: 1, isCompleted: false, isRequired: true, validation: { rules: ['title_required', 'budget_positive'], requiredFields: ['projectData.title'] } },
      { id: 'stakeholders', name: 'stakeholders', title: 'Parties prenantes', description: 'Bailleurs, Ministères, Entreprises', order: 2, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'location', name: 'location', title: 'Localisation', description: 'Géolocalisation interactive', order: 3, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: ['projectData.location'] } },
      { id: 'phases', name: 'phases', title: 'Planification WBS', description: 'Phase → Step → Task', order: 4, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'risks', name: 'risks', title: 'Risques', description: 'Analyse et gestion des risques', order: 5, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'compliance', name: 'compliance', title: 'Conformité', description: 'Standards SOMELEC et bailleurs', order: 6, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'strategy', name: 'strategy', title: 'Liens stratégiques', description: 'Stratégies & budget', order: 7, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'review', name: 'review', title: 'Validation', description: 'Réception définitive et clôture', order: 8, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } }
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
      const [phases, risks, stakeholders] = await Promise.all([
        this.phaseRepository?.findByProjectId(projectId).catch(() => []) || Promise.resolve([]),
        this.riskRepository?.findByProjectId(projectId).catch(() => []) || Promise.resolve([]),
        this.stakeholderRepository?.findByProjectId(projectId).catch(() => []) || Promise.resolve([]),
      ]);

      // Build complete workflow data
      const workflowData: ProjectWorkflowData = {
        projectId,
        currentStep: 1,
        isDraft: false,
        isComplete: projectDTO.status === ProjectStatus.TERMINE || projectDTO.status === ProjectStatus.COMPLETED,
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
          stakeholders: (stakeholders || []) as any,
        },
        metadata: {
          lastSavedAt: projectDTO.updatedAt || new Date().toISOString(),
          totalSteps: 8,
          completedSteps: 1,
          progressPercentage: 12,
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

  /**
   * Per-step dispatcher. Each UI step only persists the slice it owns.
   * - 1 Project Info → projects (create or update)
   * - 2 Stakeholders → project_stakeholders (upsert)
   * - 3 Location    → projects.update (location + coords)
   * - 4 Phases      → project_phases (upsert)
   * - 5 Risks       → project_risks (upsert)
   * - 6 Compliance  → (no DB target yet — referential-only)
   * - 7 Strategy    → handled by StrategicLinkageStep hooks (no-op here)
   * - 8 Review      → completeWorkflow
   */
  async saveStep(stepNumber: number, data: ProjectWorkflowData, context: any): Promise<SaveResult & { projectId?: string }> {
    try {
      const validation = await this.validateStep(stepNumber, data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }

      // Resolve / ensure projectId (step 1 may create the project)
      let projectId = data.projectId || data.projectData?.id;

      switch (stepNumber) {
        case 1: {
          projectId = await this.upsertProjectFromWorkflow(data);
          break;
        }
        case 2: {
          if (!projectId) return { success: false, errors: ['Projet non créé — complétez l\'étape 1 d\'abord.'] };
          await this.upsertStakeholders(projectId, data.relatedData?.stakeholders || []);
          // promote project manager if provided
          if (data.projectData?.projectManagerId) {
            await this.projectRepository.update(projectId, { projectManagerId: data.projectData.projectManagerId } as any);
          }
          break;
        }
        case 3: {
          if (!projectId) return { success: false, errors: ['Projet non créé — complétez l\'étape 1 d\'abord.'] };
          const pd = data.projectData as any;
          const locUpdate: UpdateProjectDTO = {
            id: projectId,
            location: pd?.location,
            latitude: pd?.latitude,
            longitude: pd?.longitude,
            geographicZone: pd?.geographicZone,
            terrainType: pd?.terrainType,
            interventionZones: pd?.interventionZones,
            interventionZone: pd?.interventionZone,
          };
          const locEntity = ProjectTransformer.fromUpdateDTOToEntity(locUpdate);
          console.debug('[ProjectWorkflowService] saveStep(3) location payload', {
            hasZones: Array.isArray(pd?.interventionZones) && pd.interventionZones.length > 0,
            zonesCount: pd?.interventionZones?.length ?? 0,
          });
          await this.projectRepository.update(projectId, locEntity as any);
          break;
        }
        case 4: {
          if (!projectId) return { success: false, errors: ['Projet non créé — complétez l\'étape 1 d\'abord.'] };
          await this.upsertPhases(projectId, data.relatedData?.phases || []);
          break;
        }
        case 5: {
          if (!projectId) return { success: false, errors: ['Projet non créé — complétez l\'étape 1 d\'abord.'] };
          await this.upsertRisks(projectId, data.relatedData?.risks || []);
          break;
        }
        case 6: {
          // Compliance step is a read-only aggregation view (bank guarantees,
          // insurance, documents). Nothing to persist here.
          break;
        }
        case 7: {
          if (!projectId) return { success: false, errors: ['Projet non créé — complétez l\'étape 1 d\'abord.'] };
          await this.upsertStrategyAndBudgetLinks(
            projectId,
            (data.relatedData as any)?.strategyLinks || [],
            (data.relatedData as any)?.budgetLinks || []
          );
          break;
        }
        case 8: {
          if (projectId) await this.completeWorkflow({ projectId });
          break;
        }
        default:
          return { success: false, errors: [`Étape inconnue: ${stepNumber}`] };
      }

      return { success: true, projectId, warnings: validation.warnings };
    } catch (error) {
      console.error('Step save error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // =================== STEP-SCOPED PERSISTENCE HELPERS ===================

  private async upsertProjectFromWorkflow(data: ProjectWorkflowData): Promise<string> {
    const projectData = data.projectData;
    if (!projectData) throw new AppError(ErrorCode.VALIDATION_ERROR, 'projectData manquant');
    const existingId = data.projectId || projectData.id;

    const mainContractor = typeof projectData.mainContractor === 'string'
      ? projectData.mainContractor
      : (projectData.mainContractor && typeof projectData.mainContractor === 'object' && 'name' in projectData.mainContractor
          ? String((projectData.mainContractor as { name: string }).name)
          : undefined);

    const coords = projectData.coordinates && typeof projectData.coordinates === 'object'
      ? { latitude: (projectData.coordinates as any).latitude, longitude: (projectData.coordinates as any).longitude }
      : { latitude: projectData.latitude, longitude: projectData.longitude };

    // Zones d'intervention (multi-polygones) — propagées jusqu'aux transforms
    // qui les traduisent en `projects.localisation` v3.
    const pdAny = projectData as any;
    const interventionZones = Array.isArray(pdAny?.interventionZones)
      ? pdAny.interventionZones
      : undefined;
    const interventionZone = pdAny?.interventionZone;

    if (existingId) {
      const updateRequest: UpdateProjectDTO = {
        id: existingId,
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        progress: projectData.progress,
        location: projectData.location,
        budget: projectData.budget,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        teamSize: projectData.teamSize,
        thumbnail: projectData.thumbnail,
        financingSource: projectData.financingSource,
        marketType: projectData.marketType,
        selectionMode: projectData.selectionMode,
        projectReference: projectData.projectReference,
        currentPhase: projectData.currentPhase,
        currentStage: projectData.currentStage,
        mainContractor,
        allowsInitialPayment: projectData.allowsInitialPayment as boolean | undefined,
        initialPaymentPercentage: projectData.initialPaymentPercentage as number | undefined,
        projectManagerId: projectData.projectManagerId,
        interventionZones,
        interventionZone,
        ...(coords.latitude != null && coords.longitude != null
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : {}),
      };
      const entity = ProjectTransformer.fromUpdateDTOToEntity(updateRequest);
      await this.projectRepository.update(existingId, entity);
      return existingId;
    }

    const createRequest: CreateProjectDTO = {
      title: projectData.title || 'Nouveau projet',
      description: projectData.description || '',
      location: projectData.location || '',
      budget: projectData.budget || 0,
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      endDate: projectData.endDate,
      status: projectData.status || ProjectStatus.PLANIFIE,
      progress: projectData.progress ?? 0,
      thumbnail: projectData.thumbnail || '',
      teamSize: projectData.teamSize || 1,
      financingSource: projectData.financingSource,
      marketType: projectData.marketType,
      selectionMode: projectData.selectionMode,
      projectReference: projectData.projectReference,
      mainContractor,
      allowsInitialPayment: projectData.allowsInitialPayment as boolean | undefined,
      initialPaymentPercentage: projectData.initialPaymentPercentage as number | undefined,
      currentPhase: projectData.currentPhase,
      currentStage: projectData.currentStage,
      interventionZones,
      interventionZone,
      ...(coords.latitude != null && coords.longitude != null ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    } as CreateProjectDTO;
    const entity = ProjectTransformer.fromCreateDTOToEntity(createRequest);
    const created = await this.projectRepository.create(entity);

    // Generate referential phases only at first creation
    if (projectData.projectReference) {
      const config: ProjectGenerationConfig = {
        referentialType: projectData.projectReference as ReferentialType,
        projectStartDate: projectData.startDate || new Date().toISOString().split('T')[0],
        projectBudget: projectData.budget || 0,
        projectId: created.id,
        generateMilestones: true,
      };
      const generated = await this.generateCompleteProjectStructure(config);
      await this.saveGeneratedPhases(created.id, generated);
    }
    return created.id;
  }

  private async upsertPhases(projectId: string, phases: PhaseDTO[]): Promise<void> {
    if (!phases.length) return;
    const existing = await this.phaseRepository.findByProjectId(projectId).catch(() => [] as any[]);
    const existingIds = new Set(existing.map((p: any) => p.id));
    for (const phase of phases) {
      const payload = { ...phase, projectId, status: phase.status || PhaseStatus.PENDING };
      if (phase.id && existingIds.has(phase.id)) {
        await this.phaseRepository.update(phase.id, payload as unknown as Partial<Phase>);
      } else {
        const { id: _omit, ...toCreate } = payload as any;
        await this.phaseRepository.create(toCreate as unknown as Phase);
      }
    }
  }

  private async upsertRisks(projectId: string, risks: RiskDTO[]): Promise<void> {
    if (!risks.length) return;
    const existing = await this.riskRepository.findByProjectId(projectId).catch(() => [] as any[]);
    const existingIds = new Set(existing.map((r: any) => r.id));
    for (const risk of risks) {
      const payload = { ...risk, projectId, status: risk.status || RiskStatus.IDENTIFIED } as Risk;
      if (risk.id && existingIds.has(risk.id)) {
        await this.riskRepository.update(risk.id, payload);
      } else {
        await this.riskRepository.save(payload);
      }
    }
  }

  private async upsertStakeholders(projectId: string, stakeholders: any[]): Promise<void> {
    if (!stakeholders.length) return;
    const existing = await this.stakeholderRepository.findByProjectId(projectId).catch(() => [] as any[]);
    const existingIds = new Set(existing.map((s: any) => s.id));

    /**
     * Normalize incoming stakeholder (UI/DTO/Entity shape) to the
     * project_stakeholders DB constraints:
     * - stakeholder_entity_type ∈ {'employee','supplier'} (NOT NULL)
     * - employee_id required when 'employee' (and supplier_id NULL)
     * - supplier_id required when 'supplier' (and employee_id NULL)
     * - stakeholder_type NOT NULL
     */
    const normalize = (s: any): any => {
      const employeeId = s.employeeId ?? s.employee_id ?? null;
      const supplierId =
        s.supplierId ?? s.supplier_id ?? s.organizationId ?? s.organization_id ?? null;

      // Resolve entity type from any incoming convention
      let entityType: 'employee' | 'supplier' | 'external' | null =
        (s.stakeholderEntityType ?? s.stakeholder_entity_type ?? s.entityType ?? null) as any;
      if (typeof entityType === 'string') {
        const v = entityType.toLowerCase();
        entityType =
          v === 'employee' || v === 'person' || v === 'team' || v === 'department' ? 'employee'
          : v === 'supplier' || v === 'organization' || v === 'organisation' || v === 'vendor' || v === 'contractor' ? 'supplier'
          : v === 'external' ? 'external'
          : null;
      }
      // Infer from available IDs / external info
      const externalName = s.externalName ?? s.external_name ?? s.name ?? s.contact?.name ?? null;
      const externalEmail = s.externalEmail ?? s.external_email ?? s.email ?? s.contact?.email ?? null;
      const externalPhone = s.externalPhone ?? s.external_phone ?? s.phone ?? s.contact?.phone ?? null;
      if (!entityType) {
        entityType = employeeId ? 'employee'
                   : supplierId ? 'supplier'
                   : (externalName || externalEmail || externalPhone) ? 'external'
                   : null;
      }

      const stakeholderType: string = (
        s.stakeholderType ?? s.stakeholder_type ?? s.type ?? s.role ?? 'external'
      ).toString();

      return {
        projectId,
        stakeholderType,
        stakeholderEntityType: entityType,
        employeeId: entityType === 'employee' ? employeeId : null,
        supplierId: entityType === 'supplier' ? supplierId : null,
        externalName,
        externalEmail,
        externalPhone,
        roleDescription: s.roleDescription ?? s.role_description ?? s.role ?? null,
        responsibilities: s.responsibilities ?? null,
        isActive: s.isActive ?? true,
        startDate: s.startDate ?? s.start_date ?? null,
        endDate: s.endDate ?? s.end_date ?? null,
        hourlyRate: s.hourlyRate ?? s.hourly_rate ?? null,
        contractType: s.contractType ?? s.contract_type ?? null,
        notes: s.notes ?? null,
      };
    };

    for (const s of stakeholders) {
      const payload = normalize(s);
      if (!payload.stakeholderEntityType) {
        console.warn('[upsertStakeholders] skipped: missing entity type', s);
        continue;
      }
      if (payload.stakeholderEntityType === 'employee' && !payload.employeeId) {
        console.warn('[upsertStakeholders] skipped: employee without employeeId', s);
        continue;
      }
      if (payload.stakeholderEntityType === 'supplier' && !payload.supplierId) {
        console.warn('[upsertStakeholders] skipped: supplier without supplierId', s);
        continue;
      }
      if (
        payload.stakeholderEntityType === 'external' &&
        !payload.externalName && !payload.externalEmail && !payload.externalPhone
      ) {
        console.warn('[upsertStakeholders] skipped: external without contact', s);
        continue;
      }
      if (s.id && existingIds.has(s.id)) {
        await this.stakeholderRepository.update(s.id, payload);
      } else {
        await this.stakeholderRepository.create(payload as any);
      }
    }
  }

  /**
   * Replace strategy & budget links for a project (idempotent).
   * Strategy: SCAPP linkages.  Budget: Loi de Finances 2026 lines.
   * Services are instantiated via RepositoryFactory to keep the workflow
   * service constructor signature stable (hexagonal: services orchestrate repos).
   */
  private async upsertStrategyAndBudgetLinks(
    projectId: string,
    strategyLinks: any[],
    budgetLinks: any[]
  ): Promise<void> {
    const [
      { ProjectStrategyLinkService },
      { ProjectBudgetLinkService },
    ] = await Promise.all([
      import('@/application/services/ProjectStrategyLinkService'),
      import('@/application/services/ProjectBudgetLinkService'),
    ]);

    const strategyService = new ProjectStrategyLinkService(
      RepositoryFactory.getProjectStrategyLinkRepository()
    );
    const budgetService = new ProjectBudgetLinkService(
      RepositoryFactory.getProjectBudgetLinkRepository()
    );

    // --- Strategy links: delete-then-recreate (idempotent) ---
    try {
      const existing = await strategyService.getLinksByProjectId(projectId).catch(() => []);
      await Promise.all(
        (existing || []).map((l: any) =>
          l?.id ? strategyService.deleteLink(l.id).catch(() => undefined) : undefined
        )
      );
      if (strategyLinks.length > 0) {
        const normalized = strategyLinks.map((l) => ({
          ...l,
          projectId,
          sourceReferential: l.sourceReferential || 'SCAPP',
          leverCode: l.leverCode ?? null,
          chantierCode: l.chantierCode ?? null,
          interventionCode: l.interventionCode ?? null,
          objectiveCode: l.objectiveCode ?? null,
          contributionPct: Number(l.contributionPct) || 0,
        }));
        await strategyService.batchCreateLinks(projectId, normalized);
      }
    } catch (e) {
      console.error('[upsertStrategyAndBudgetLinks] strategy error:', e);
      throw e;
    }

    // --- Budget links ---
    try {
      const existing = await budgetService.getLinksByProjectId(projectId).catch(() => []);
      await Promise.all(
        (existing || []).map((l: any) =>
          l?.id ? budgetService.deleteLink(l.id).catch(() => undefined) : undefined
        )
      );
      if (budgetLinks.length > 0) {
        const normalized = budgetLinks.map((l) => ({
          ...l,
          projectId,
          ministryCode: l.ministryCode ?? null,
          programCode: l.programCode ?? null,
          actionCode: l.actionCode ?? null,
          lineCode: l.lineCode ?? null,
          allocatedCe: Number(l.allocatedCe) || 0,
          allocatedCp: Number(l.allocatedCp) || 0,
          fiscalYear: l.fiscalYear || 2026,
        }));
        await budgetService.batchCreateLinks(projectId, normalized);
      }
    } catch (e) {
      console.error('[upsertStrategyAndBudgetLinks] budget error:', e);
      throw e;
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
