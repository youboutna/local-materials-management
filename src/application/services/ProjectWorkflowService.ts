// ============================================================
// src/application/services/ProjectWorkflowService.ts
// ============================================================
/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets
 * Following hexagonal architecture
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
import { getProjectBudgetLinkService } from '@/application/services/ProjectBudgetLinkService';
import { getProjectStrategyLinkService } from '@/application/services/ProjectStrategyLinkService';
import { ReceptionService } from '@/application/services/ReceptionService';
import { ReferentialService } from '@/application/services/ReferentialService';
import { SupplierService } from '@/application/services/SupplierService';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { getAlertService } from '@/application/services/AlertService';
import { ReferentialType, getPhasesForReferential, getReferential } from '@/config/referentials';

// Repository Ports
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import type { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import type { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import type { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import type { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import type { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import type { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import type { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';

// Domain Entities
import { Phase } from '@/domain/entities/Phase';
import { Project } from '@/domain/entities/Project';
import { Risk } from '@/domain/entities/Risk';

// DTOs
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { PhaseDTO, PhasePriority, PhaseStatus, PhaseType } from '@/dtos/entities/PhaseDTO';
import { CreateProjectDTO, ProjectDTO, ProjectStatus, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RiskDTO, RiskStatus } from '@/dtos/entities/RiskDTO';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import {
  ProjectWorkflowData,
  SaveResult,
  StepRelatedDataDTO,
  ValidationResult,
  WorkflowStep,
  WorkflowTransition,
  WorkflowMetadataDTO,
  ComplianceDataDTO,
} from '@/dtos/workflows/ProjectWorkflowDTOs';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { addDays, format, parseISO } from 'date-fns';

// ============================================================
// Types exportés
// ============================================================
export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit',
  COMPLETE = 'complete',
  CANCEL = 'cancel'
}

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

// ============================================================
// Configuration des alertes
// ============================================================
interface AlertConfig {
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  debounceMs: number;
  rateLimit: number;
  actions: string[];
  recipients?: string[];
}

const ALERT_CONFIGS: Record<string, AlertConfig> = {
  'project.creation': { enabled: true, severity: 'low', priority: 1, debounceMs: 0, rateLimit: 10, actions: ['view', 'edit'] },
  'project.status_change': { enabled: true, severity: 'medium', priority: 2, debounceMs: 5000, rateLimit: 20, actions: ['view', 'acknowledge'] },
  'project.completion': { enabled: true, severity: 'high', priority: 3, debounceMs: 10000, rateLimit: 5, actions: ['view', 'acknowledge', 'report'] },
  'progress.milestone': { enabled: true, severity: 'low', priority: 1, debounceMs: 10000, rateLimit: 5, actions: ['view'] },
  'progress.delay': { enabled: true, severity: 'high', priority: 3, debounceMs: 30000, rateLimit: 3, actions: ['view', 'acknowledge', 'assign', 'escalate'], recipients: ['project_manager', 'director'] },
  'progress.critical': { enabled: true, severity: 'critical', priority: 4, debounceMs: 60000, rateLimit: 2, actions: ['view', 'acknowledge', 'assign', 'escalate', 'notify'], recipients: ['project_manager', 'director', 'ceo'] },
  'risk.detection': { enabled: true, severity: 'high', priority: 3, debounceMs: 30000, rateLimit: 5, actions: ['view', 'acknowledge', 'mitigate'] },
  'risk.escalation': { enabled: true, severity: 'critical', priority: 4, debounceMs: 60000, rateLimit: 2, actions: ['view', 'acknowledge', 'escalate'], recipients: ['director', 'ceo'] },
  'phase.completion': { enabled: true, severity: 'medium', priority: 2, debounceMs: 10000, rateLimit: 10, actions: ['view', 'acknowledge'] },
};

function getAlertConfig(type: string): AlertConfig {
  return ALERT_CONFIGS[type] || { enabled: true, severity: 'medium', priority: 2, debounceMs: 5000, rateLimit: 10, actions: ['view'] };
}

/** Déduplique une collection par `id` */
function dedupeById<T extends { id?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item?.id ? String(item.id) : '';
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}

// ============================================================
// Service
// ============================================================
export class ProjectWorkflowService {
  private referentialService: ReferentialService;
  private alertService = getAlertService();
  private alertCache = new Map<string, { timestamp: number; count: number }>();
  private readonly CACHE_TTL = 60000;
  private readonly MAX_ALERTS_PER_MINUTE = 10;

  private phaseService: PhaseService;
  private milestoneService?: MilestoneService;
  private taskAssignmentService?: TaskAssignmentService;
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
    private taskAssignmentRepository?: ITaskAssignmentRepository,
    private materialRepository?: IMaterialRepository,
    private inspectionRepository?: IInspectionRepository,
    private documentRepository?: IDocumentRepository,
    private paymentRepository?: IPaymentRepository,
    private employeeRepository?: IEmployeeRepository,
    private supplierRepository?: ISupplierRepository,
    private receptionRepository?: IReceptionRepository
  ) {
    this.referentialService = ReferentialService.getInstance();
    this.phaseService = new PhaseService(phaseRepository);
    this.milestoneService = milestoneRepository ? new MilestoneService(milestoneRepository) : undefined;
    this.taskAssignmentService = taskAssignmentRepository ? new TaskAssignmentService(taskAssignmentRepository) : undefined;
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

  static default(): ProjectWorkflowService {
    return new ProjectWorkflowService(
      RepositoryFactory.getProjectRepository(),
      RepositoryFactory.getPhaseRepository(),
      RepositoryFactory.getRiskRepository(),
      RepositoryFactory.getProjectStakeholderRepository(),
      RepositoryFactory.getMilestoneRepository(),
      RepositoryFactory.getTaskAssignmentRepository(),
      RepositoryFactory.getMaterialRepository(),
      RepositoryFactory.getInspectionRepository(),
      RepositoryFactory.getDocumentRepository(),
      RepositoryFactory.getPaymentRepository(),
      RepositoryFactory.getEmployeeRepository(),
      RepositoryFactory.getSupplierRepository(),
    );
  }

  // ============================================================
  // ALERTES
  // ============================================================

  private canCreateAlert(key: string): boolean {
    const now = Date.now();
    const cached = this.alertCache.get(key);
    if (cached) {
      if (now - cached.timestamp < this.CACHE_TTL) {
        if (cached.count >= this.MAX_ALERTS_PER_MINUTE) return false;
        this.alertCache.set(key, { timestamp: now, count: cached.count + 1 });
      } else {
        this.alertCache.set(key, { timestamp: now, count: 1 });
      }
    } else {
      this.alertCache.set(key, { timestamp: now, count: 1 });
    }
    return true;
  }

  private createAlertBackground(projectId: string, type: string, data: any): void {
    setImmediate(async () => {
      try {
        const config = getAlertConfig(type);
        if (!config.enabled) return;

        const cacheKey = `${projectId}-${type}`;
        if (!this.canCreateAlert(cacheKey)) return;

        const existing = await this.checkExistingAlert(projectId, type, data);
        if (existing) return;

        await this.alertService.createAlert({
          projectId,
          projectTitle: data.projectTitle || 'Projet',
          type: 'system' as any,
          severity: config.severity,
          title: this.getAlertTitle(type, data),
          message: this.getAlertMessage(type, data),
          source: 'system' as any,
          delayDays: data.delayPercentage || 0,
          actionRequired: this.isActionRequired(type, data),
          availableActions: config.actions,
          deadline: data.deadline,
          metadata: { workflowType: type, triggeredAt: new Date().toISOString(), data },
        });
      } catch (error) {
        console.warn('[Alert] Background creation failed:', error);
      }
    });
  }

  private async checkExistingAlert(projectId: string, type: string, data: any): Promise<boolean> {
    try {
      const alerts = await this.alertService.getAlertsByProjectId(projectId);
      const now = new Date();
      const recent = alerts.filter(a => {
        const created = new Date(a.createdAt);
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60) < 24 && a.type === type;
      });
      const message = this.getAlertMessage(type, data);
      return recent.some(a => a.message === message);
    } catch { return false; }
  }

  private getAlertTitle(type: string, data: any): string {
    const titles: Record<string, string> = {
      'project.creation': `Nouveau projet: ${data.projectTitle}`,
      'project.status_change': `Statut modifié: ${data.projectTitle}`,
      'project.completion': `Projet complété: ${data.projectTitle}`,
      'progress.milestone': `Jalon atteint: ${data.progress}%`,
      'progress.delay': `Retard détecté: ${data.delayPercentage}%`,
      'progress.critical': `⚠️ Retard critique: ${data.delayPercentage}%`,
      'risk.detection': `Risque détecté: ${data.riskTitle}`,
      'risk.escalation': `⚠️ Risque escaladé: ${data.riskTitle}`,
      'phase.completion': `Phase terminée: ${data.phaseTitle}`,
    };
    return titles[type] || `Alerte: ${data.projectTitle}`;
  }

  private getAlertMessage(type: string, data: any): string {
    const messages: Record<string, string> = {
      'project.creation': `Le projet "${data.projectTitle}" a été créé avec succès.`,
      'project.status_change': `Le projet "${data.projectTitle}" est passé de "${data.oldStatus}" à "${data.newStatus}".`,
      'project.completion': `Le projet "${data.projectTitle}" est terminé à 100%.`,
      'progress.milestone': `Le projet "${data.projectTitle}" a atteint ${data.progress}% de progression.`,
      'progress.delay': `Le projet "${data.projectTitle}" accuse un retard de ${data.delayPercentage}%.`,
      'progress.critical': `⚠️ Le projet "${data.projectTitle}" accuse un retard critique de ${data.delayPercentage}%.`,
      'risk.detection': `Un risque "${data.riskTitle}" a été détecté sur le projet "${data.projectTitle}".`,
      'risk.escalation': `⚠️ Le risque "${data.riskTitle}" a été escaladé sur le projet "${data.projectTitle}".`,
      'phase.completion': `La phase "${data.phaseTitle}" du projet "${data.projectTitle}" est terminée.`,
    };
    return messages[type] || `Alerte pour le projet "${data.projectTitle}"`;
  }

  private isActionRequired(type: string, data: any): boolean {
    return type.includes('critical') || type.includes('delay') || type.includes('risk') || type.includes('completion');
  }

  private getSignificantChanges(current: any, updated: any): Array<{ type: string; data: any }> {
    const changes: Array<{ type: string; data: any }> = [];
    if (current.status !== updated.status) {
      changes.push({ type: 'project.status_change', data: { oldStatus: current.status, newStatus: updated.status, projectTitle: updated.title } });
    }
    const progressDelta = Math.floor(updated.progress / 25) - Math.floor((current.progress || 0) / 25);
    if (progressDelta > 0) {
      changes.push({ type: 'progress.milestone', data: { progress: updated.progress, previousProgress: current.progress || 0, projectTitle: updated.title } });
    }
    if (updated.progress >= 100 && (current.progress || 0) < 100) {
      changes.push({ type: 'project.completion', data: { progress: updated.progress, projectTitle: updated.title } });
    }
    return changes;
  }

  // ============================================================
  // WORKFLOW
  // ============================================================

  /**
   * Étapes du workflow — dérivées du référentiel unique
   * `src/config/referentials/projects/project-workflow-steps.referential.ts`
   * afin que l'UI (stepper) et la validation applicative partagent la même vérité.
   */
  getWorkflowSteps(): WorkflowStep[] {
    const REQUIRED_FIELDS: Record<string, string[]> = {
      project_info: ['projectData.title'],
      stakeholders: [],
      location: [],
      wbs: [],
      risks: [],
      compliance: [],
      strategic_linkage: [],
      validation: [],
    };
    const MANDATORY_CODES = new Set(['project_info', 'location', 'wbs', 'validation']);

    return PROJECT_WORKFLOW_STEPS.map((step) => ({
      id: step.code.replace(/_/g, '-'),
      name: step.code,
      title: step.title,
      description: step.description,
      order: step.id,
      isCompleted: false,
      isRequired: MANDATORY_CODES.has(step.code),
      validation: {
        rules: step.code === 'project_info' ? ['title_required', 'budget_positive'] : [],
        requiredFields: REQUIRED_FIELDS[step.code] ?? [],
      },
    })) as WorkflowStep[];
  }


  getEditWorkflowSteps(): WorkflowStep[] {
    return this.getWorkflowSteps();
  }

  getWorkflowStep(order: number): WorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.order === order);
  }

  /**
   * Initialise un contexte de workflow (création ou édition).
   * Retourne le contexte passé à `saveStep`.
   */
  initializeWorkflow(workflowType: 'creation' | 'edit' = 'creation', projectId?: string): {
    workflowType: 'creation' | 'edit';
    projectId?: string;
    currentStep: number;
    totalSteps: number;
    startedAt: string;
  } {
    return {
      workflowType,
      projectId,
      currentStep: 1,
      totalSteps: this.getWorkflowSteps().length,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Progression consolidée du projet (recalculée depuis les phases/tâches).
   */
  async calculateProjectProgress(projectId: string): Promise<number> {
    if (!projectId) return 0;
    try {
      return await this.projectRepository.synchronizeProgress(projectId);
    } catch (error) {
      console.error('ProjectWorkflowService.calculateProjectProgress failed:', error);
      const project = await this.projectRepository.findById(projectId);
      return project?.progress ?? 0;
    }
  }

  async initializeEditWorkflow(projectId: string): Promise<ProjectWorkflowData> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');

      const projectDTO = ProjectTransformer.toDTO(project);
      const [phases, risks, stakeholders] = await Promise.all([
        this.phaseRepository.findByProjectId(projectId).catch(() => []),
        this.riskRepository.findByProjectId(projectId).catch(() => []),
        this.stakeholderRepository.findByProjectId(projectId).catch(() => []),
      ]);

      const phaseData = await Promise.all((phases || []).map(async (phase: any) => ({
        id: phase.id,
        projectId: phase.projectId || projectId,
        name: phase.name || phase.phaseName || '',
        phaseCode: phase.phaseCode || phase.phase_code,
        description: phase.description || '',
        startDate: phase.startDate,
        endDate: phase.endDate,
        progress: phase.progress || 0,
        status: phase.status || 'not_started',
        type: phase.type || 'custom',
        priority: phase.priority || 'medium',
        orderIndex: phase.orderIndex ?? phase.order ?? 0,
        estimatedCost: phase.estimatedCost || 0,
        estimatedDuration: phase.estimatedDuration || 0,
        constructionStage: phase.constructionStage || '',
        milestones: this.milestoneService ? await this.milestoneService.getPhaseMilestones(projectId, phase.id).catch(() => []) : [],
        tasks: this.taskAssignmentService ? await this.taskAssignmentService.getByPhase(phase.id).catch(() => []) : [],
        dqeLines: await boqRepository.list({ source: 'dqe', contextId: projectId, projectId, phaseId: phase.id }).catch(() => []),
      }))) as unknown as PhaseDTO[];

      return {
        projectId,
        currentStep: 1,
        isDraft: false,
        isComplete: projectDTO.status === ProjectStatus.TERMINE || projectDTO.status === ProjectStatus.COMPLETED,
        projectData: projectDTO,
        relatedData: {
          phases: phaseData,
          milestones: dedupeById([...phaseData.flatMap(p => p.milestones ?? []), ...(projectDTO as any).milestones || []]),
          tasks: dedupeById([...phaseData.flatMap((p: any) => p.tasks ?? []), ...(projectDTO as any).tasks || []]),
          dqeLines: phaseData.flatMap(p => p.dqeLines ?? []) as BoqLineDTO[],
          risks: (risks || []).map((r: any) => ({ id: r.id, projectId: r.projectId || projectId, title: r.title || r.riskTitle || '', description: r.description || r.riskDescription || '', probability: r.probability || 0, impact: r.impact || 0, riskScore: r.riskScore || 0, status: r.status || 'identified', mitigationPlan: r.mitigationPlan || r.mitigationStrategy || '' })) as RiskDTO[],
          stakeholders: (stakeholders || []) as any,
        },
        metadata: { lastSavedAt: projectDTO.updatedAt || new Date().toISOString(), totalSteps: 8, completedSteps: 1, progressPercentage: 12.5 },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to initialize workflow');
    }
  }

  async validateStep(stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<ValidationResult & { warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const step = this.getWorkflowStep(stepNumber);
    if (!step) return { isValid: false, errors: ['Invalid step number'], warnings: [] };

    for (const field of step.validation?.requiredFields || []) {
      const value = field.split('.').reduce<any>((acc, part) => acc && (acc as any)[part], data as any);
      if (value === undefined || value === null || value === '') {
        errors.push(`Le champ "${field}" est obligatoire`);
      }
    }

    if (data.projectData?.projectReference) {
      const ref = await this.referentialService.getReferential(data.projectData.projectReference as ReferentialType);
      if (!ref) warnings.push(`Le référentiel "${data.projectData.projectReference}" n'existe pas.`);
    }

    if (stepNumber === 1) {
      if (data.projectData?.budget && data.projectData.budget <= 0) warnings.push('Le budget devrait être supérieur à 0');
      if (data.projectData?.startDate && data.projectData?.endDate) {
        const start = new Date(data.projectData.startDate);
        const end = new Date(data.projectData.endDate);
        if (end < start) errors.push('La date de fin doit être après la date de début');
      }
    }
    if (stepNumber === 4 && (!data.relatedData?.phases || data.relatedData.phases.length === 0)) {
      warnings.push('Aucune phase définie. Utilisez un référentiel pour générer les phases.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  async saveStep(stepNumber: number, data: ProjectWorkflowData, context: any): Promise<SaveResult & { projectId?: string }> {
    try {
      const validation = await this.validateStep(stepNumber, data);
      if (!validation.isValid) return { success: false, errors: validation.errors, warnings: validation.warnings };

      let projectId = data.projectId || data.projectData?.id;

      switch (stepNumber) {
        case 1:
          projectId = await this.upsertProjectFromWorkflow(data);
          this.createAlertBackground(projectId, 'project.creation', { projectTitle: data.projectData?.title });
          break;
        case 2:
          if (!projectId) return { success: false, errors: ['Projet non créé'] };
          await this.upsertStakeholders(projectId, data.relatedData?.stakeholders || []);
          break;
        case 3:
          if (!projectId) return { success: false, errors: ['Projet non créé'] };
          const locUpdate: UpdateProjectDTO = { id: projectId, location: data.projectData?.location, latitude: data.projectData?.latitude, longitude: data.projectData?.longitude };
          await this.projectRepository.update(projectId, ProjectTransformer.fromUpdateDTOToEntity(locUpdate) as any);
          break;
        case 4:
          if (!projectId) return { success: false, errors: ['Projet non créé'] };
          await this.upsertPhases(projectId, data.relatedData?.phases || []);
          await this.upsertPhaseRelations(projectId, data.relatedData?.phases || [], data.relatedData?.dqeLines || []);
          break;
        case 5:
          if (!projectId) return { success: false, errors: ['Projet non créé'] };
          await this.upsertRisks(projectId, data.relatedData?.risks || []);
          break;
        case 6:
          break;
        case 7:
          if (!projectId) return { success: false, errors: ['Projet non créé'] };
          await this.upsertStrategyAndBudgetLinks(projectId, (data.relatedData as any)?.strategyLinks || [], (data.relatedData as any)?.budgetLinks || []);
          break;
        case 8:
          if (projectId) await this.completeWorkflow({ projectId });
          break;
        default:
          return { success: false, errors: [`Étape inconnue: ${stepNumber}`] };
      }

      return { success: true, projectId, warnings: validation.warnings };
    } catch (error) {
      return { success: false, errors: [(error instanceof Error && error.message.trim()) ? error.message : 'Erreur inattendue lors de la sauvegarde de l\'étape'] };
    }
  }

  async saveWorkflowData(data: ProjectWorkflowData): Promise<ProjectWorkflowData> {
    try {
      const projectData = data.projectData;
      let savedProjectId = projectData?.id;

      if (!savedProjectId && projectData?.title) {
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
          mainContractor: typeof projectData.mainContractor === 'string' ? projectData.mainContractor : '',
          allowsInitialPayment: projectData.allowsInitialPayment as boolean | undefined,
          initialPaymentPercentage: projectData.initialPaymentPercentage as number | undefined,
          currentPhase: projectData.currentPhase,
          currentStage: projectData.currentStage,
        };
        const projectEntity = ProjectTransformer.fromCreateDTOToEntity(createRequest);
        const createdProject = await this.projectRepository.create(projectEntity);
        savedProjectId = createdProject.id;

        this.createAlertBackground(savedProjectId, 'project.creation', { projectTitle: projectData.title });

        if (projectData.projectReference) {
          const config: ProjectGenerationConfig = {
            referentialType: projectData.projectReference as ReferentialType,
            projectStartDate: projectData.startDate || new Date().toISOString().split('T')[0],
            projectBudget: projectData.budget || 0,
            projectId: savedProjectId,
            generateMilestones: true
          };
          const generated = await this.generateCompleteProjectStructure(config);
          await this.saveGeneratedPhases(savedProjectId, generated);
        }
      } else if (savedProjectId) {
        const current = await this.projectRepository.findById(savedProjectId);
        if (current) {
          const changes = this.getSignificantChanges(current, projectData);
          for (const change of changes) {
            this.createAlertBackground(savedProjectId, change.type, change.data);
          }
        }
        const updateRequest: UpdateProjectDTO = { id: savedProjectId, title: projectData.title, description: projectData.description, location: projectData.location, budget: projectData.budget, startDate: projectData.startDate, endDate: projectData.endDate, teamSize: projectData.teamSize, thumbnail: projectData.thumbnail };
        await this.projectRepository.update(savedProjectId, ProjectTransformer.fromUpdateDTOToEntity(updateRequest) as any);
      }

      return { ...data, projectId: savedProjectId, metadata: { ...data.metadata, lastSavedAt: new Date().toISOString() } };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save workflow data');
    }
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private async upsertProjectFromWorkflow(data: ProjectWorkflowData): Promise<string> {
    const projectData = data.projectData;
    if (!projectData) throw new AppError(ErrorCode.VALIDATION_ERROR, 'projectData manquant');
    const existingId = data.projectId || projectData.id;

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
        projectReference: projectData.projectReference,
      };
      await this.projectRepository.update(existingId, ProjectTransformer.fromUpdateDTOToEntity(updateRequest) as any);
      return existingId;
    }

    const createRequest: CreateProjectDTO = {
      title: projectData.title || 'Nouveau projet',
      description: projectData.description || '',
      location: projectData.location || '',
      budget: projectData.budget || 0,
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      endDate: projectData.endDate,
      status: ProjectStatus.PLANIFIE,
      thumbnail: projectData.thumbnail || '',
      teamSize: projectData.teamSize || 1,
      projectReference: projectData.projectReference,
    };
    const created = await this.projectRepository.create(ProjectTransformer.fromCreateDTOToEntity(createRequest));
    return created.id;
  }

  private async upsertPhases(projectId: string, phases: PhaseDTO[]): Promise<void> {
    if (!phases.length) return;
    const existing = await this.phaseRepository.findByProjectId(projectId).catch(() => []);
    for (const phase of phases) {
      const payload = { ...phase, projectId, status: phase.status || PhaseStatus.PENDING };
      const existingPhase = existing.find((c: any) => c.id === phase.id || c.phaseCode === phase.phaseCode || c.name === phase.name);
      if (existingPhase) {
        await this.phaseRepository.update(existingPhase.id, payload as unknown as Partial<Phase>);
      } else {
        const { id: _omit, ...toCreate } = payload as any;
        await this.phaseRepository.create(toCreate as unknown as Phase);
      }
    }
  }

  private async upsertPhaseRelations(projectId: string, phases: PhaseDTO[], dqeLines: BoqLineDTO[]): Promise<void> {
    // Implementation simplifiée
    for (const phase of phases) {
      if (phase.id && this.milestoneService) {
        for (const milestone of phase.milestones || []) {
          await this.milestoneService.createMilestone({ project_id: projectId, phase_id: phase.id, title: milestone.title, description: milestone.description, target_date: milestone.targetDate || new Date().toISOString(), status: milestone.status, progress: (milestone as any).progress || 0 } as any).catch(() => {});
        }
      }
      if (phase.id && this.taskAssignmentService) {
        for (const task of phase.tasks || []) {
          await this.taskAssignmentService.create({ projectId, phaseId: phase.id, name: task.title || task.name || 'Tâche', title: task.title || task.name || 'Tâche', description: task.description, status: task.status || 'PENDING', priority: task.priority || 'MEDIUM', dueDate: task.dueDate || task.due_date, assigneeId: task.assignedTo } as any).catch(() => {});
        }
      }
    }
  }

  private async upsertRisks(projectId: string, risks: RiskDTO[]): Promise<void> {
    if (!risks.length) return;
    const existing = await this.riskRepository.findByProjectId(projectId).catch(() => []);
    for (const risk of risks) {
      const payload = { ...risk, projectId, status: risk.status || RiskStatus.IDENTIFIED } as unknown as Risk;
      const existingRisk = existing.find((r: any) => r.id === risk.id || r.title === risk.title);
      if (existingRisk) {
        await this.riskRepository.update(existingRisk.id, payload);
      } else {
        await this.riskRepository.save(payload);
      }
    }
  }

  private async upsertStakeholders(projectId: string, stakeholders: any[]): Promise<void> {
    if (!stakeholders.length) return;
    const existing = await this.stakeholderRepository.findByProjectId(projectId).catch(() => []);
    for (const s of stakeholders) {
      const payload = { projectId, ...s };
      const existingStakeholder = existing.find((e: any) => e.id === s.id || e.externalName === s.externalName);
      if (existingStakeholder) {
        await this.stakeholderRepository.update(existingStakeholder.id, payload);
      } else {
        await this.stakeholderRepository.create(payload as any);
      }
    }
  }

  private async upsertStrategyAndBudgetLinks(projectId: string, strategyLinks: any[], budgetLinks: any[]): Promise<void> {
    try {
      const strategyService = getProjectStrategyLinkService();
      const budgetService = getProjectBudgetLinkService();
      
      const existingStrategy = await strategyService.getLinksByProjectId(projectId).catch(() => []);
      for (const link of existingStrategy || []) {
        if (link?.id) await strategyService.deleteLink(link.id).catch(() => {});
      }
      if (strategyLinks.length > 0) {
        await strategyService.batchCreateLinks(projectId, strategyLinks.map(l => ({ ...l, projectId }))).catch(() => {});
      }

      const existingBudget = await budgetService.getLinksByProjectId(projectId).catch(() => []);
      for (const link of existingBudget || []) {
        if (link?.id) await budgetService.deleteLink(link.id).catch(() => {});
      }
      if (budgetLinks.length > 0) {
        await budgetService.batchCreateLinks(projectId, budgetLinks.map(l => ({ ...l, projectId }))).catch(() => {});
      }
    } catch (e) {
      console.error('[upsertStrategyAndBudgetLinks] error:', e);
    }
  }

  async completeWorkflow(data: any): Promise<any> {
    try {
      if (data.projectId) {
        await this.projectRepository.update(data.projectId, { status: 'en_cours' as any });
        this.createAlertBackground(data.projectId, 'project.completion', { projectTitle: data.projectTitle || 'Projet' });
      }
      return { ...data, status: 'completed', completedAt: new Date().toISOString() };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to complete workflow');
    }
  }

  async generateCompleteProjectStructure(config: ProjectGenerationConfig): Promise<GeneratedPhaseData[]> {
    try {
      const phases = getPhasesForReferential(config.referentialType, 'fr');
      if (!phases.length) return [];

      const generated: GeneratedPhaseData[] = [];
      let cumulativeStartDays = 0;
      const projectStart = parseISO(config.projectStartDate);
      const budgetPerPhase = config.projectBudget / phases.length;

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseId = `phase-${Date.now()}-${i}`;
        const { steps, totalDuration } = this.generateStepsWithTasks(phase.steps || [], phaseId);
        const phaseStartDate = addDays(projectStart, cumulativeStartDays);
        const phaseEndDate = addDays(phaseStartDate, totalDuration);

        const milestones: GeneratedMilestoneDTO[] = config.generateMilestones ? phase.steps.map((step, idx) => ({
          title: `Jalon - ${step.label}`,
          description: `Jalon pour l'étape ${step.label}`,
          target_date: format(addDays(phaseStartDate, idx * 7), 'yyyy-MM-dd'),
          type: 'checkpoint',
          priority: 'normal',
          weight: 1,
          deliverables: ['Rapport'],
          dependencies: [],
          requiresInspection: step.tasks.some(t => t.requiresInspection),
          inspectionType: step.tasks.some(t => t.requiresInspection) ? 'technical' : '',
          phaseCode: phase.code,
        })) : [];

        generated.push({
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
      return generated;
    } catch (error) {
      console.error('Error generating project structure:', error);
      return [];
    }
  }

  private generateStepsWithTasks(stepsData: any[], phaseId: string): { steps: GeneratedStepData[]; totalDuration: number } {
    const steps: GeneratedStepData[] = [];
    let totalDuration = 0;
    for (let i = 0; i < stepsData.length; i++) {
      const step = stepsData[i];
      const stepId = `step-${phaseId}-${i}`;
      const tasks: GeneratedTaskData[] = (step.tasks || []).map((task: any, j: number) => ({
        id: `task-${stepId}-${j}`,
        taskCode: task.code || `T${j+1}`,
        name: task.label || `Tâche ${j+1}`,
        description: task.description,
        estimatedDurationDays: task.estimatedDurationDays || 7,
        requiresInspection: task.requiresInspection || false,
        requiresEngineerApproval: task.requiresEngineerApproval || false,
        status: 'not_started'
      }));
      const stepDuration = tasks.reduce((sum, t) => sum + (t.estimatedDurationDays || 7), 14);
      totalDuration += stepDuration;
      steps.push({ id: stepId, stepCode: step.code || `S${i+1}`, name: step.label || `Étape ${i+1}`, order: step.order || i + 1, tasks });
    }
    return { steps, totalDuration: Math.max(totalDuration, 30) };
  }

  async saveGeneratedPhases(projectId: string, generatedPhases: GeneratedPhaseData[]): Promise<void> {
    try {
      for (const phaseData of generatedPhases) {
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
        
        if (this.taskAssignmentService) {
          for (const stepData of phaseData.steps) {
            const stepEntity = { projectId, phaseId: createdPhase.id, name: stepData.name, description: `Step: ${stepData.name}`, orderIndex: stepData.order, status: 'pending', progress: 0 };
            const createdStep = await this.taskAssignmentRepository?.save(stepEntity as any).then(() => stepEntity) as any;
            for (const taskData of stepData.tasks) {
              await this.taskAssignmentRepository?.save({ projectId, phaseId: createdPhase.id, stepId: createdStep?.id, name: taskData.name, description: taskData.description, status: 'PENDING', priority: 'MEDIUM', estimatedHours: taskData.estimatedDurationDays, metadata: { requiresInspection: taskData.requiresInspection, requiresEngineerApproval: taskData.requiresEngineerApproval, taskCode: taskData.taskCode } } as any);
            }
          }
        }
        if (this.milestoneService && phaseData.milestones.length) {
          for (const milestoneData of phaseData.milestones) {
            await this.milestoneService.createMilestone({ projectId, phaseId: createdPhase.id, title: milestoneData.title, description: milestoneData.description, targetDate: milestoneData.target_date, type: milestoneData.type, priority: milestoneData.priority, weight: milestoneData.weight, deliverables: milestoneData.deliverables, dependencies: milestoneData.dependencies, requiresInspection: milestoneData.requiresInspection, inspectionType: milestoneData.inspectionType } as any).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error saving generated phases:', error);
    }
  }

  async getGenerationSummary(referentialType: ReferentialType): Promise<GenerationSummary> {
    const phases = getPhasesForReferential(referentialType, 'fr');
    let totalSteps = 0, totalTasks = 0, totalMilestones = 0, estimatedDurationDays = 0;
    for (const phase of phases) {
      totalSteps += phase.steps.length;
      for (const step of phase.steps) {
        totalTasks += step.tasks.length;
        for (const task of step.tasks) {
          estimatedDurationDays += task.estimatedDurationDays || 7;
        }
      }
      totalMilestones += phase.steps.length;
    }
    return { totalPhases: phases.length, totalSteps, totalTasks, totalMilestones, estimatedDurationDays: Math.max(estimatedDurationDays, 30) };
  }

  async createProject(data: ProjectWorkflowData): Promise<ProjectDTO> {
    const saved = await this.saveWorkflowData(data);
    return saved.projectData;
  }
}

// ============================================================
// Factory
// ============================================================
export function getProjectWorkflowService(): ProjectWorkflowService {
  return ProjectWorkflowService.default();
}

/** Alias historique : crée/retourne une instance du service workflow */
export function createProjectWorkflowService(): ProjectWorkflowService {
  return ProjectWorkflowService.default();
}