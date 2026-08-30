// src/application/services/ProjectImportExportService.ts
// VERSION CORRIGÉE v2.0 - Support complet pour l'import 2D3DTECH
// 
// Modifications:
// 1. Ajout du support materialUsage dans les jalons
// 2. Extension de ProjectImportMilestone avec tous les champs (priority, type, weight, notes, etc.)
// 3. Correction de l'import des jalons avec materialUsage
// 4. Ajout de la méthode importMilestoneWithMaterialUsage
// 5. Support des champs supplémentaires dans les phases (estimatedCost, actualCost, budget, weight, dependencies)
// 6. Correction des compteurs détaillés
// 7. Ajout des logs de changement

import { AuthService, getAuthService } from '@/application/services/AuthService';
import { getMilestoneService } from '@/application/services/MilestoneService';
import { getOrganizationService } from '@/application/services/OrganizationService';
import { getPhaseService } from '@/application/services/PhaseService';
import { ProjectService, getProjectService } from '@/application/services/ProjectService';
import { getProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { getSupplierService } from '@/application/services/SupplierService';
import { getTaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { getEmployeeService } from '@/application/services/EmployeeService';
import { getReferential, type ReferentialType } from '@/config/referentials';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import { PhasePriority, PhaseStatus, type PhaseDTO } from '@/dtos/entities/PhaseDTO';
import {
    CreateTaskAssignmentDTO,
    TaskPriority,
    TaskStatus,
    normalizeTaskPriority,
    normalizeTaskStatus
} from '@/dtos/entities/TaskAssignmentDTO';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';
import { ImportDTOTransformer } from '@/dtos/entities/ProjectImportDTO';

import { getDQECategory } from '@/config/referentials/dqe/dqe-categories.referential';
import type {
    CreateProjectDTO,
    ProjectDTO,
} from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import type { CreateProjectStakeholderDTO } from '@/dtos/entities/ProjectStakeholderDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { mapDqeStatus } from '@/utils/dqeStatusMapper';
import { getDQETypeLabel, normalizeDQEType } from '@/utils/dqeTypeMapper';

// =============================================================================
// TYPES - VERSION CORRIGÉE AVEC SUPPORT MATERIALUSAGE
// =============================================================================

export interface ImportOptions {
  mode?: 'create' | 'upsert' | 'partial_update' | 'full_update' | 'skip_existing' | 'merge';
  conflictStrategy?: 'use_import' | 'use_existing' | 'merge' | 'manual';
  continueOnError?: boolean;
  dryRun?: boolean;
  validateOnly?: boolean;
  preserveRelations?: boolean;
  batchSize?: number;
  ignoredFields?: string[];
  employeeResolution?: 'email' | 'externalRef' | 'both';
  supplierResolution?: 'name' | 'externalRef' | 'both';
  organizationResolution?: 'name' | 'code' | 'externalRef' | 'both';
}

export interface ProjectImportRow {
  id?: string;
  externalRef?: string;
  projectReference?: string;
  reference?: string;
  title: string;
  description?: string;
  location?: string;
  status?: string;
  progress?: number;
  budget?: number | { total?: number; currency?: string; sources?: Array<Record<string, unknown>> };
  currency?: string;
  startDate?: string;
  endDate?: string;
  timeline?: { startDate?: string; endDate?: string; durationDays?: number };
  type?: string;
  teamSize?: number;
  latitude?: number;
  longitude?: number;
  interventionZone?: InterventionZoneDTO;
  interventionZones?: InterventionZoneDTO[];
  referentialCode?: string;
  projectType?: string;
  organizationId?: string;
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  completionDate?: string;
  budgetSources?: Array<Record<string, unknown>>;
  dqeLines?: BoqLineDTO[];
  phases?: ProjectImportPhase[];
  tasks?: ProjectImportTask[];
  milestones?: ProjectImportMilestone[];
  stakeholders?: ProjectImportStakeholder[];
  importMode?: 'create' | 'upsert' | 'partial_update' | 'full_update' | 'skip_existing' | 'merge';
  sector?: string;
  priority?: string;
  mainContractor?: string;
  engineeringConsultant?: string;
  clientName?: string;
  donorOrganization?: string;
  areaSqm?: number;
}

export interface ProjectImportPhase {
  id?: string;
  externalRef?: string;
  name: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  progress?: number;
  order?: number;
  status?: string;
  type?: string;
  estimatedCost?: number;
  actualCost?: number;
  budget?: number;
  weight?: number;
  dependencies?: string[];
  milestones?: ProjectImportMilestone[];
  tasks?: ProjectImportTask[];
  dqeLines?: BoqLineDTO[];
}

// =============================================================================
// ProjectImportMilestone - VERSION CORRIGÉE AVEC MATERIALUSAGE
// =============================================================================

export interface ProjectImportMilestone {
  // Identifiants
  externalRef?: string;
  phaseId?: string;
  
  // Informations Générales
  title?: string;
  name?: string;
  description?: string;
  
  // Dates
  targetDate?: string;
  target_date?: string;
  completionDate?: string;
  completion_date?: string;
  
  // Statut et Progression
  status?: string;
  progress?: number;
  progressPercent?: number;
  
  // Priorité et Type
  priority?: string;
  type?: string;
  stageType?: string;
  
  // Poids et Dépendances
  weight?: number;
  dependencies?: string[];
  deliverables?: string[];
  
  // Notes
  notes?: string;
  
  // ============================================
  // NOUVEAU - Support materialUsage
  // ============================================
  materialUsage?: Array<{
    materialId: string;
    plannedQuantity: number;
    usedQuantity: number;
    unitCost?: number;
  }>;
  materialCostEstimate?: number;
  actualMaterialCost?: number;
  
  // Métadonnées
  metadata?: Record<string, unknown>;
}

export interface ProjectImportTask {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  due_date?: string;
  phaseId?: string;
  assignedTo?: string | string[];
  assigneeName?: string;
  assigneeEmail?: string;
  AssignedEmail?: string;
  assignedName?: string;
  assignedID?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface ProjectImportStakeholder {
  externalRef?: string;
  stakeholderType?: string;
  stakeholderEntityType?: 'employee' | 'supplier' | 'organization';
  organizationId?: string;
  supplierId?: string;
  employeeId?: string;
  role?: string;
  roleDescription?: string;
  isPrimary?: boolean;
}

// =============================================================================
// ProjectImportResult - VERSION CORRIGÉE AVEC COMPTEURS DÉTAILLÉS
// =============================================================================

export interface ProjectImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; title: string; message: string }>;
  createdIds: string[];
  details: {
    phases: number;
    milestones: number;
    tasks: number;
    dqeLines: number;
    stakeholders: number;
    employees: number;
    organizations: number;
    suppliers: number;
  };
  changes?: Array<{
    entityType: string;
    entityId: string;
    entityName: string;
    operation: 'created' | 'updated' | 'skipped' | 'merged' | 'failed';
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
}

export type ProjectExportFormat = 'json' | 'csv' | 'excel-rows';

export interface ProjectExportOptions {
  format: ProjectExportFormat;
  includeInterventionZone?: boolean;
  includeRelations?: boolean;
  ids?: string[];
}

export interface ProjectImportDataset {
  projects: ProjectImportRow[];
  organizations?: ProjectImportOrganization[];
  suppliers?: ProjectImportSupplier[];
  employees?: ProjectImportEmployee[];
  options?: ImportOptions;
}

export interface ProjectImportOrganization {
  id: string;
  name: string;
  code?: string;
  type?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface ProjectImportSupplier {
  id: string;
  name: string;
  type?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  isActive?: boolean;
  nif?: string;
  bankInfo?: { bank?: string; account?: string; iban?: string };
}

export interface ProjectImportEmployee {
  id: string;
  employeeId?: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string;
  type?: string;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
    certificateId?: string;
  }>;
  isActive?: boolean;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ProjectImportExportService {
  private authService: AuthService;
  private currentUserId?: string;
  private currentUserName?: string;
  private currentUserEmail?: string;
  private employeeService: ReturnType<typeof getEmployeeService>;

  constructor(
    private readonly projectService: ProjectService,
    private readonly phaseService = getPhaseService(),
    private readonly milestoneService = getMilestoneService(),
    private readonly taskAssignmentService = getTaskAssignmentService(),
    private readonly stakeholderService = getProjectStakeholderService(),
    private readonly organizationService = getOrganizationService(),
    private readonly supplierService = getSupplierService(),
    authService?: AuthService,
  ) {
    this.authService = authService || getAuthService();
    this.employeeService = getEmployeeService();
  }

  static default(): ProjectImportExportService {
    return new ProjectImportExportService(
      getProjectService(),
    );
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.currentUserId = user.id;
        this.currentUserName = user.fullName || user.email?.split('@')[0] || 'Utilisateur';
        this.currentUserEmail = user.email || '';
      }
    } catch (error) {
      console.warn('[ProjectImportExportService] Cannot get current user:', error);
    }
  }

  private isUUID(value?: string): boolean {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private getExternalRef(row: ProjectImportRow): string | undefined {
    return row.externalRef || row.id || row.projectReference || row.reference;
  }

  private resolveReference(reference?: string, map?: Map<string, string>): string | undefined {
    if (!reference) return undefined;
    const mapped = map?.get(reference);
    if (mapped) return mapped;
    return this.isUUID(reference) ? reference : undefined;
  }

  private getDqeCode(line: BoqLineDTO): string | undefined {
    const candidate = line as BoqLineDTO & { code?: string };
    return line.btpCode ?? candidate.code;
  }

  private normalizeStatus(status?: string): string {
    if (!status) return 'DRAFT';
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'en cours': 'IN_PROGRESS',
      'en_cours': 'IN_PROGRESS',
      'in_progress': 'IN_PROGRESS',
      'termine': 'COMPLETED',
      'terminé': 'COMPLETED',
      'completed': 'COMPLETED',
      'en attente': 'PENDING',
      'en_attente': 'PENDING',
      'pending': 'PENDING',
      'suspendu': 'SUSPENDED',
      'suspend': 'SUSPENDED',
      'annule': 'CANCELLED',
      'annulé': 'CANCELLED',
      'cancelled': 'CANCELLED',
      'draft': 'DRAFT',
    };
    return mapping[normalized] || 'DRAFT';
  }

  // ===========================================================================
  // NORMALISE MILESTONE STATUS - CORRIGÉ
  // ===========================================================================

  private normalizeMilestoneStatus(status?: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined {
    if (!status) return undefined;
    const statuses: Record<string, 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'> = {
      planifie: 'pending',
      planned: 'pending',
      en_cours: 'in_progress',
      'en cours': 'in_progress',
      in_progress: 'in_progress',
      termine: 'completed',
      terminé: 'completed',
      completed: 'completed',
      overdue: 'delayed',
      delayed: 'delayed',
      en_retard: 'delayed',
      annule: 'cancelled',
      annulé: 'cancelled',
      cancelled: 'cancelled',
    };
    return statuses[status.toLowerCase()] ?? 'pending';
  }

  // ===========================================================================
  // NORMALISE MILESTONE PRIORITY - NOUVEAU
  // ===========================================================================

  private normalizeMilestonePriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
      'haute': 'high',
      'elevee': 'high',
      'élevée': 'high',
      'moyenne': 'medium',
      'basse': 'low',
    };
    return mapping[normalized] || 'medium';
  }

  // ===========================================================================
  // CRÉE LES DONNÉES DE JALON AVEC MATERIALUSAGE - NOUVEAU
  // ===========================================================================

  private createMilestoneData(
    projectId: string,
    phaseId: string | undefined,
    milestone: ProjectImportMilestone,
    defaultDate: string
  ): any {
    return {
      project_id: projectId,
      phase_id: phaseId || null,
      title: milestone.title ?? milestone.name ?? 'Jalon importé',
      description: milestone.description,
      target_date: milestone.target_date ?? milestone.targetDate ?? defaultDate,
      completion_date: milestone.completion_date ?? milestone.completionDate,
      status: this.normalizeMilestoneStatus(milestone.status) || 'pending',
      progress_percentage: milestone.progress ?? milestone.progressPercent ?? 0,
      external_ref: milestone.externalRef,
      // NOUVEAUX CHAMPS
      priority: this.normalizeMilestonePriority(milestone.priority) || 'medium',
      type: milestone.type,
      weight: milestone.weight,
      notes: milestone.notes,
      stage_type: milestone.stageType,
      deliverables: milestone.deliverables || [],
      dependencies: milestone.dependencies || [],
      // ============================================
      // NOUVEAU - Support materialUsage
      // ============================================
      material_usage: milestone.materialUsage,
      material_cost_estimate: milestone.materialCostEstimate,
      actual_material_cost: milestone.actualMaterialCost,
    };
  }

  // ===========================================================================
  // IMPORT MILESTONE AVEC MATERIALUSAGE - NOUVEAU
  // ===========================================================================

  private async importMilestone(
    projectId: string,
    phaseId: string | undefined,
    milestone: ProjectImportMilestone,
    defaultDate: string,
    details: ProjectImportResult['details'],
    existingMilestones: any[]
  ): Promise<void> {
    const milestoneData = this.createMilestoneData(projectId, phaseId, milestone, defaultDate);
    
    const existingMilestone = existingMilestones.find((candidate) =>
      candidate.title === milestoneData.title ||
      candidate.external_ref === milestoneData.external_ref
    );

    if (existingMilestone) {
      await this.milestoneService.updateMilestone(existingMilestone.id, milestoneData);
      details.milestones += 1;
      // Log du changement
      if (milestoneData.material_usage) {
        console.log(`[Import] Updated milestone ${milestoneData.title} with materialUsage:`, milestoneData.material_usage);
      }
    } else {
      await this.milestoneService.createMilestone(milestoneData);
      details.milestones += 1;
      // Log du changement
      if (milestoneData.material_usage) {
        console.log(`[Import] Created milestone ${milestoneData.title} with materialUsage:`, milestoneData.material_usage);
      }
    }
  }

  // ===========================================================================
  // MAP DTO - CORRIGÉ
  // ===========================================================================

  public mapImportRowToCreateDTO(
    row: ProjectImportRow,
    organizations?: Map<string, string>
  ): CreateProjectDTO {
    const input = row as ProjectImportRow & {
      budget?: number | { total?: number; currency?: string; sources?: Array<Record<string, unknown>> };
      timeline?: { startDate?: string; endDate?: string };
      type?: string;
      reference?: string;
    };

    const zones = row.interventionZones && row.interventionZones.length > 0
      ? row.interventionZones
      : row.interventionZone
      ? [row.interventionZone]
      : undefined;
    const firstZone = zones?.[0];

    const dto: CreateProjectDTO = {
      title: row.title,
      description: row.description ?? '',
      status: this.normalizeStatus(row.status) as ProjectStatus,
      progress: row.progress ?? 0,
      budget: typeof input.budget === 'number' ? input.budget : input.budget?.total ?? 0,
      currency: row.currency ?? (typeof input.budget === 'object' ? input.budget.currency : undefined) ?? 'MRU',
      startDate: row.startDate ?? input.timeline?.startDate ?? new Date().toISOString(),
      endDate: row.endDate ?? input.timeline?.endDate,
      location: row.location?.trim() || firstZone?.address?.trim() || 'Adresse non spécifiée',
      latitude: row.latitude ?? firstZone?.coordinates?.[0]?.lat,
      longitude: row.longitude ?? firstZone?.coordinates?.[0]?.lng,
      teamSize: row.teamSize ?? 0,
      financingSource: row.financingSource,
      marketType: row.marketType,
      selectionMode: row.selectionMode,
      projectType: row.projectType ?? input.type ?? row.referentialCode,
      referentialCode: row.referentialCode,
      attributionDate: row.attributionDate,
      launchDate: row.launchDate,
      completionDate: row.completionDate,
      organizationId: row.organizationId && organizations?.get(row.organizationId) || row.organizationId,
      externalRef: this.getExternalRef(row),
      projectReference: row.projectReference || input.reference,
      budgetSources: row.budgetSources ?? (typeof input.budget === 'object' ? input.budget.sources : undefined),
      interventionZones: zones,
      interventionZone: firstZone,
      sector: row.sector,
      priority: row.priority,
      mainContractor: row.mainContractor,
      engineeringConsultant: row.engineeringConsultant,
      clientName: row.clientName,
      donorOrganization: row.donorOrganization,
      areaSqm: row.areaSqm,
    } as CreateProjectDTO;

    return dto;
  }

  // ===========================================================================
  // IMPORT RELATIONS - VERSION CORRIGÉE AVEC MATERIALUSAGE
  // ===========================================================================

  private async importRelations(
    projectId: string,
    row: ProjectImportRow,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    organizations?: Map<string, string>,
    employees?: Map<string, string>,
  ): Promise<void> {
    const phaseIdMap = new Map<string, string>();

    // 1. IMPORTER LES PHASES
    for (const phase of row.phases ?? []) {
      const phaseConfig = row.referentialCode
        ? getReferential(row.referentialCode as ReferentialType)?.phases.find((candidate) => candidate.code === phase.code)
        : undefined;

      const existingPhases = await this.phaseService.getPhasesByProject(projectId);

      const existingPhase = existingPhases.find((candidate) => {
        const customData = candidate.customPhaseData as { phaseCode?: string } | null;
        return (phase.code && customData?.phaseCode === phase.code) ||
          (phase.name && candidate.phaseName === phase.name) ||
          (phase.externalRef && (candidate as { externalRef?: string }).externalRef === phase.externalRef);
      }) ?? null;

      const phaseCode = phase.code || `phase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const normalizedType = PhaseTransformer.normalizeDbPhaseType(phase.code ?? phase.name);

      const phaseData: Partial<PhaseDTO> = {
        id: existingPhase?.id ?? '',
        projectId,
        name: phase.name,
        phaseCode: phaseCode,
        type: normalizedType as any,
        externalRef: phase.externalRef ?? (phase.code ? `${this.getExternalRef(row) ?? projectId}:${phase.code}` : undefined),
        description: phase.description,
        status: phase.status as PhaseStatus || PhaseStatus.PENDING,
        priority: PhasePriority.MEDIUM,
        progress: phase.progress ?? 0,
        orderIndex: phase.order,
        startDate: phase.startDate,
        endDate: phase.endDate,
        estimatedDuration: phase.durationDays ?? phaseConfig?.defaultDurationDays ?? phaseConfig?.dqeMapping?.defaultDurationDays,
        customPhaseData: phaseConfig?.dqeMapping
          ? { dqeMapping: phaseConfig.dqeMapping, phaseCode: phaseCode }
          : { phaseCode: phaseCode },
        estimatedCost: phase.estimatedCost,
        actualCost: phase.actualCost,
        budget: phase.budget,
        weight: phase.weight,
        dependencies: phase.dependencies,
        createdAt: existingPhase?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let createdPhase;
      if (existingPhase) {
        createdPhase = await this.phaseService.updatePhase(existingPhase.id, phaseData);
        details.phases += 1;
      } else {
        createdPhase = await this.phaseService.createPhase(phaseData as PhaseDTO, projectId);
        details.phases += 1;
      }

      for (const key of [phase.id, phase.code, phase.name, phase.externalRef]) {
        if (key) phaseIdMap.set(key, createdPhase.id);
      }

      // 2. IMPORTER LES JALONS DE LA PHASE - AVEC MATERIALUSAGE
      const existingPhaseMilestones = await this.milestoneService.getPhaseMilestonesRaw(createdPhase.id);
      const defaultDate = row.endDate ?? row.startDate ?? new Date().toISOString();
      
      for (const milestone of phase.milestones ?? []) {
        await this.importMilestone(
          projectId,
          createdPhase.id,
          milestone,
          defaultDate,
          details,
          existingPhaseMilestones
        );
      }

      // 3. IMPORTER LES TÂCHES DE LA PHASE
      for (const task of phase.tasks ?? []) {
        await this.upsertTask(projectId, createdPhase.id, task, details, suppliers, employees);
      }

      // 4. IMPORTER LES DQE LINES DE LA PHASE
      const dqeLines = (phase.dqeLines ?? []).map((line) => ({
        ...line,
        btpCode: line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
        source: 'dqe' as const,
        contextId: projectId,
        phaseId: createdPhase.id,
      }));
      await this.upsertDqeLines(projectId, createdPhase.id, dqeLines, details);
    }

    // 5. IMPORTER LES JALONS PROJET - AVEC MATERIALUSAGE
    const existingProjectMilestones = await this.milestoneService.getMilestonesByProject(projectId);
    const defaultDate = row.endDate ?? row.startDate ?? new Date().toISOString();
    
    for (const milestone of row.milestones ?? []) {
      const targetPhaseId = milestone.phaseId ? phaseIdMap.get(milestone.phaseId) : undefined;
      await this.importMilestone(
        projectId,
        targetPhaseId,
        milestone,
        defaultDate,
        details,
        existingProjectMilestones
      );
    }

    // 6. IMPORTER LES TÂCHES PROJET
    for (const task of row.tasks ?? []) {
      const targetPhaseId = task.phaseId ? phaseIdMap.get(task.phaseId) : undefined;
      await this.upsertTask(projectId, targetPhaseId, task, details, suppliers, employees);
    }

    // 7. IMPORTER LES DQE LINES PROJET
    for (const line of row.dqeLines ?? []) {
      const targetPhaseId = line.phaseId ? phaseIdMap.get(line.phaseId) : undefined;
      const dqeLine = {
        ...line,
        btpCode: line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
        source: 'dqe' as const,
        contextId: projectId,
        phaseId: targetPhaseId,
      };
      await this.upsertDqeLines(projectId, targetPhaseId, [dqeLine], details);
    }

    // 8. IMPORTER LES STAKEHOLDERS
    for (const stakeholder of row.stakeholders ?? []) {
      const organizationRef = stakeholder.organizationId;
      const supplierId = this.resolveReference(stakeholder.supplierId, suppliers);
      const organizationId = this.resolveReference(organizationRef, organizations);
      const employeeId = this.resolveReference(stakeholder.employeeId, employees);

      if (!supplierId && !organizationId && !employeeId && stakeholder.stakeholderEntityType !== 'employee') continue;

      const stakeholders = await this.stakeholderService.getProjectStakeholders(projectId);
      const existingStakeholder = stakeholders.find((candidate) =>
        (supplierId && candidate.supplierId === supplierId) ||
        (organizationRef && candidate.roleDescription?.includes(organizationRef)) ||
        (employeeId && candidate.employeeId === employeeId)
      );

      const stakeholderData = {
        projectId,
        stakeholderType: stakeholder.stakeholderType ?? stakeholder.role ?? 'other',
        stakeholderEntityType: (stakeholder.stakeholderEntityType ??
          (employeeId ? 'employee' : supplierId ? 'supplier' : 'organization')) as 'employee' | 'supplier' | 'organization',
        supplierId,
        organizationId,
        employeeId,
        externalRef: stakeholder.externalRef || `SH-${projectId}-${organizationRef || stakeholder.supplierId || stakeholder.employeeId || 'na'}`,
        roleDescription: [stakeholder.roleDescription ?? stakeholder.role, organizationRef].filter(Boolean).join(' - '),
        isPrimary: stakeholder.isPrimary,
      };

      if (existingStakeholder) {
        await this.stakeholderService.updateProjectStakeholder(existingStakeholder.id, stakeholderData);
      } else {
        await this.stakeholderService.addStakeholder(stakeholderData);
      }
      details.stakeholders += 1;
    }
  }

  // ===========================================================================
  // UPSERT TASK - CORRIGÉ
  // ===========================================================================

  private async upsertTask(
    projectId: string,
    phaseId: string | undefined,
    task: ProjectImportTask,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    employees?: Map<string, string>,
  ): Promise<void> {
    const name = task.title ?? task.name ?? 'Tâche importée';
    const existingTasks = phaseId
      ? await this.taskAssignmentService.getByPhase(phaseId)
      : await this.taskAssignmentService.getByProject(projectId);
    const existingTask = existingTasks.find((candidate) => candidate.name === name);

    let assignees: string[] = [];

    if (task.assignedTo) {
      const raw = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      assignees = raw
        .map((a) => {
          const supRef = this.resolveReference(a, suppliers);
          if (supRef) return supRef;
          const empRef = this.resolveReference(a, employees);
          if (empRef) return empRef;
          return undefined;
        })
        .filter((a): a is string => !!a);
    }

    if (assignees.length === 0 && this.currentUserId) {
      assignees = [this.currentUserId];
    }

    let assigneeName = task.assigneeName || task.assignedName;
    let assigneeEmail = task.assigneeEmail || task.AssignedEmail;

    if (!assigneeName && this.currentUserName) {
      assigneeName = this.currentUserName;
    }
    if (!assigneeEmail && this.currentUserEmail) {
      assigneeEmail = this.currentUserEmail;
    }

    let assigneeType: 'supplier' | 'employee' | 'user' | undefined;
    if (assignees.length > 0) {
      const isSupplier = assignees.some((id) => suppliers?.has(id));
      const isEmployee = assignees.some((id) => employees?.has(id));
      if (isSupplier && !isEmployee) assigneeType = 'supplier';
      else if (isEmployee && !isSupplier) assigneeType = 'employee';
      else assigneeType = 'user';
    }

    let normalizedStatus = normalizeTaskStatus(task.status);
    if (task.progress !== undefined) {
      if (task.progress >= 100) {
        normalizedStatus = TaskStatus.COMPLETED;
      } else if (task.progress > 0 && normalizedStatus !== TaskStatus.COMPLETED) {
        normalizedStatus = TaskStatus.IN_PROGRESS;
      }
    }

    const taskData: Partial<CreateTaskAssignmentDTO> = {
      projectId,
      phaseId: phaseId || undefined,
      name,
      description: task.description,
      status: normalizedStatus || TaskStatus.PENDING,
      priority: normalizeTaskPriority(task.priority) || TaskPriority.MEDIUM,
      dueDate: task.due_date ?? task.dueDate ?? task.endDate,
      assigneeId: assignees.length > 0 ? assignees[0] : undefined,
      assigneeName,
      assigneeEmail,
      startDate: task.startDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      metadata: {
        assignedBy: this.currentUserId,
        assignedTo: assignees,
        assigneeType,
        importProgress: task.progress,
        importId: task.id,
      },
    };

    if (existingTask) {
      await this.taskAssignmentService.update(existingTask.id, taskData);
    } else {
      await this.taskAssignmentService.create(taskData as CreateTaskAssignmentDTO);
    }
    details.tasks += 1;
  }

  // ===========================================================================
  // UPSERT DQE LINES - CORRIGÉ
  // ===========================================================================

  private async upsertDqeLines(
    projectId: string,
    phaseId: string | undefined,
    dqeLines: Array<Record<string, unknown>>,
    details: ProjectImportResult['details'],
    count = true,
  ): Promise<void> {
    if (dqeLines.length === 0) return;

    const existingLines = await boqRepository.list({
      source: 'dqe',
      contextId: projectId,
      projectId,
      phaseId: phaseId || undefined,
    });

    for (const dqeLine of dqeLines) {
      const categoryCode = (dqeLine.category ?? dqeLine.dqeCategory) as string | undefined;
      const dqeCategory = categoryCode ? getDQECategory(categoryCode) : undefined;
      const dqeType = normalizeDQEType(dqeLine.dqeType as string | undefined);
      const mappedStatus = mapDqeStatus(dqeLine.status as string | undefined);
      const code = (dqeLine.code ?? dqeLine.btpCode) as string | undefined;
      const quantity = Number(dqeLine.quantity ?? 0);
      const unitPrice =
        dqeLine.unitPrice != null ? Number(dqeLine.unitPrice) : null;

      const boqData: BoqLineDTO = {
        source: 'dqe',
        contextId: projectId,
        projectId,
        phaseId: phaseId || undefined,
        designation: String(dqeLine.designation ?? code ?? 'Ligne DQE'),
        unit: String(dqeLine.unit ?? dqeCategory?.unit ?? 'unité'),
        quantity,
        unitPrice,
        totalHt:
          dqeLine.totalPrice != null
            ? Number(dqeLine.totalPrice)
            : unitPrice != null
              ? quantity * unitPrice
              : null,
        code: code ?? null,
        btpCode: (dqeLine.btpCode as string | undefined) ?? code ?? null,
        category: categoryCode ?? null,
        dqeType,
        status: mappedStatus,
        sourceType: 'import',
        taxRate: dqeLine.taxRate as number | undefined,
        discount: dqeLine.discount as number | undefined,
        metadata: {
          dqeCategory: categoryCode ?? null,
          dqeCategoryLabel: dqeCategory?.label?.fr ?? categoryCode ?? null,
          originalCode: dqeLine.code ?? null,
          originalStatus: dqeLine.status ?? null,
          originalDQEType: dqeLine.dqeType ?? null,
          dqeTypeLabel: getDQETypeLabel(dqeType, 'fr'),
          targetMargin: dqeCategory?.targetMargin ?? null,
        },
      } as BoqLineDTO;

      const existingLine = existingLines.find(
        (line) =>
          (boqData.btpCode && line.btpCode === boqData.btpCode) ||
          (boqData.code && line.code === boqData.code),
      );

      if (existingLine?.id) {
        await boqRepository.update(existingLine.id, boqData);
      } else {
        await boqRepository.create(boqData);
      }
    }

    if (count) details.dqeLines += dqeLines.length;
  }

  // ===========================================================================
  // MAIN IMPORT METHOD - CORRIGÉ
  // ===========================================================================

  async importDataset(
    dataset: ProjectImportDataset,
    options: ImportOptions = {}
  ): Promise<ProjectImportResult> {
    if (!dataset || !Array.isArray(dataset.projects)) {
      throw new Error('Invalid import dataset: projects must be an array');
    }

    try {
      await this.loadCurrentUser();

      const mergedOptions: ImportOptions = {
        mode: 'upsert',
        continueOnError: false,
        dryRun: false,
        validateOnly: false,
        preserveRelations: true,
        batchSize: 50,
        employeeResolution: 'both',
        supplierResolution: 'both',
        organizationResolution: 'both',
        ...dataset.options,
        ...options,
      };

      if (mergedOptions.validateOnly || mergedOptions.dryRun) {
        const validationResult = await this.validateDataset(dataset, mergedOptions);
        return {
          total: dataset.projects.length,
          imported: 0,
          skipped: 0,
          failed: validationResult.errors.length,
          errors: validationResult.errors,
          createdIds: [],
          details: {
            phases: 0, milestones: 0, tasks: 0, dqeLines: 0, stakeholders: 0,
            employees: 0, organizations: 0, suppliers: 0
          },
          changes: [],
        };
      }

      const references = await this.importDependencies(dataset, mergedOptions);
      const result = await this.importProjects(
        dataset.projects,
        references,
        mergedOptions
      );

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/row-level security|permission denied|403/i.test(message)) {
        throw new Error(
          'Import complet refusé par la sécurité Supabase. Appliquez la migration 20260801000004_allow_full_dataset_import.sql et utilisez un compte admin, director ou manager.',
        );
      }
      throw error;
    }
  }

  // ===========================================================================
  // IMPORT PROJECTS - CORRIGÉ
  // ===========================================================================

  async importProjects(
    rows: ProjectImportRow[],
    references: {
      organizations?: Map<string, string>;
      suppliers?: Map<string, string>;
      employees?: Map<string, string>;
    } = {},
    options: ImportOptions = {}
  ): Promise<ProjectImportResult> {
    const result: ProjectImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      createdIds: [],
      details: {
        phases: 0, milestones: 0, tasks: 0, dqeLines: 0, stakeholders: 0,
        employees: references.employees?.size || 0,
        organizations: references.organizations?.size || 0,
        suppliers: references.suppliers?.size || 0,
      },
      changes: [],
    };

    const mode = options.mode || 'upsert';
    const continueOnError = options.continueOnError || false;

    const validationErrors = this.validateImportRows(rows);
    const invalidRows = new Set(validationErrors.map((error) => error.row));
    result.errors.push(...validationErrors);
    result.failed += invalidRows.size;

    if (validationErrors.length > 0 && !continueOnError) {
      return result;
    }

    let existingProjects: ProjectDTO[] = [];
    try {
      existingProjects = await this.projectService.getAllProjects();
    } catch (e) {
      console.warn('[ProjectImportExportService] Cannot list existing projects:', e);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const titleKey = (row.title || '').trim().toLowerCase();

      if (invalidRows.has(i + 1)) continue;
      if (!titleKey) {
        result.failed += 1;
        result.errors.push({ row: i + 1, title: '(empty)', message: 'Missing title' });
        continue;
      }

      try {
        const externalRef = this.getExternalRef(row);
        const existing = this.findExistingProject(existingProjects, externalRef, row.projectReference || row.reference, row.title);
        const rowMode = row.importMode || mode;
        const operation = this.determineOperation(existing, rowMode);

        let project: ProjectDTO;

        switch (operation) {
          case 'skip':
            result.skipped += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: existing?.id || '',
              entityName: row.title,
              operation: 'skipped',
              timestamp: new Date().toISOString(),
            });
            continue;

          case 'create':
            const dto = this.mapImportRowToCreateDTO(row, references.organizations);
            project = await this.projectService.createProject(dto);
            result.imported += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: project.id,
              entityName: project.title,
              operation: 'created',
              timestamp: new Date().toISOString(),
            });
            break;

          case 'update_full':
            const updateFullDto = this.mapImportRowToCreateDTO(row, references.organizations);
            project = await this.projectService.updateProject(existing!.id, updateFullDto as never);
            result.imported += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: project.id,
              entityName: project.title,
              operation: 'updated',
              timestamp: new Date().toISOString(),
            });
            break;

          case 'update_partial':
            const updatePartialDto = this.mapPartialUpdateDTO(row, references.organizations);
            project = await this.projectService.updateProject(existing!.id, updatePartialDto as never);
            result.imported += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: project.id,
              entityName: project.title,
              operation: 'updated',
              timestamp: new Date().toISOString(),
            });
            break;

          case 'merge':
            const mergeDto = this.mapMergeDTO(row, existing!, references.organizations);
            project = await this.projectService.updateProject(existing!.id, mergeDto as never);
            result.imported += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: project.id,
              entityName: project.title,
              operation: 'merged',
              timestamp: new Date().toISOString(),
            });
            break;

          default:
            const upsertDto = this.mapImportRowToCreateDTO(row, references.organizations);
            project = existing
              ? await this.projectService.updateProject(existing.id, upsertDto as never)
              : await this.projectService.createProject(upsertDto);
            result.imported += 1;
            result.changes?.push({
              entityType: 'project',
              entityId: project.id,
              entityName: project.title,
              operation: existing ? 'updated' : 'created',
              timestamp: new Date().toISOString(),
            });
        }

        if (project?.id) {
          result.createdIds.push(project.id);

          // Importer les relations avec materialUsage
          await this.importRelations(
            project.id,
            row,
            result.details,
            references.suppliers,
            references.organizations,
            references.employees
          );
        }

        const existingIndex = existingProjects.findIndex((candidate) => candidate.id === project.id);
        if (existingIndex >= 0) existingProjects[existingIndex] = project;
        else existingProjects.push(project);

      } catch (e) {
        result.failed += 1;
        result.errors.push({
          row: i + 1,
          title: row.title,
          message: e instanceof Error ? e.message : String(e),
        });
        if (!continueOnError) break;
      }
    }

    return result;
  }

  // ===========================================================================
  // AUTRES MÉTHODES (validateImportRows, importDependencies, importOrganizations, 
  // importSuppliers, importEmployees, mapPartialUpdateDTO, mapMergeDTO, 
  // findExistingProject, determineOperation, validateDataset, 
  // toImportRow, toExportRowWithRelations, toExportRow, toCSV, exportProjects)
  // ===========================================================================
  
  // ... (Ces méthodes restent inchangées, identiques à la version précédente)

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  validateImportRows(rows: ProjectImportRow[]): Array<{ row: number; title: string; message: string }> {
    const errors: Array<{ row: number; title: string; message: string }> = [];
    const keys = new Set<string>();

    rows.forEach((row, index) => {
      const title = row.title?.trim() || '(empty)';
      const key = (row.externalRef || title).toLowerCase();

      if (!row.title?.trim()) {
        errors.push({ row: index + 1, title, message: 'Missing title' });
      } else if (keys.has(key)) {
        errors.push({ row: index + 1, title, message: `Duplicate import key: ${key}` });
      } else {
        keys.add(key);
      }

      if (!row.location?.trim() && !row.interventionZone?.address && !row.interventionZones?.length) {
        errors.push({ row: index + 1, title, message: 'Missing location or intervention zone' });
      }

      (row.phases ?? []).forEach((phase, phaseIndex) => {
        if (!phase.name?.trim()) {
          errors.push({ row: index + 1, title, message: `Phase ${phaseIndex + 1} is missing a name` });
        }
      });
    });

    return errors;
  }

  // ===========================================================================
  // IMPORT DEPENDENCIES
  // ===========================================================================

  private async importDependencies(
    dataset: ProjectImportDataset,
    options: ImportOptions
  ): Promise<{
    organizations: Map<string, string>;
    suppliers: Map<string, string>;
    employees: Map<string, string>;
  }> {
    const result = {
      organizations: new Map<string, string>(),
      suppliers: new Map<string, string>(),
      employees: new Map<string, string>(),
    };

    if (dataset.organizations?.length) {
      result.organizations = await this.importOrganizations(dataset.organizations, options);
    }

    if (dataset.suppliers?.length) {
      result.suppliers = await this.importSuppliers(dataset.suppliers, options);
    }

    if (dataset.employees?.length) {
      result.employees = await this.importEmployees(dataset.employees, options);
    }

    return result;
  }

  private async importOrganizations(
    rows: ProjectImportOrganization[],
    options: ImportOptions
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.organizationService.list();

    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;

      const strategy = options.organizationResolution || 'both';
      const current = existing.find((org) => {
        if (strategy === 'externalRef' || strategy === 'both') {
          if (row.id && org.externalRef === row.id) return true;
        }
        if (strategy === 'name' || strategy === 'both') {
          if (org.name?.trim().toLowerCase() === row.name.trim().toLowerCase()) return true;
        }
        if (strategy === 'code' || strategy === 'both') {
          if (row.code && org.code === row.code) return true;
        }
        return false;
      });

      const payload = {
        name: row.name.trim(),
        code: row.code,
        orgType: row.type,
        description: row.description,
        address: row.address,
        phone: row.phone,
        email: row.email,
        isActive: row.isActive ?? true,
        externalRef: this.isUUID(row.id) ? undefined : row.id,
      };

      const organization = current
        ? await this.organizationService.update(current.id, payload)
        : await this.organizationService.upsert({
            ...payload,
            id: this.isUUID(row.id) ? row.id : undefined,
          });

      references.set(row.id, organization.id);

      const existingIndex = existing.findIndex((candidate) => candidate.id === organization.id);
      if (existingIndex >= 0) existing[existingIndex] = organization;
      else existing.push(organization);
    }

    return references;
  }

  private async importSuppliers(
    rows: ProjectImportSupplier[],
    options: ImportOptions
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.supplierService.getAllSuppliers();
    const supplierRepository = RepositoryFactory.getSupplierRepository();

    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;

      const strategy = options.supplierResolution || 'both';
      const current = await supplierRepository.findByExternalRef(row.id) ?? existing.find((supplier) => {
        if (strategy === 'externalRef' || strategy === 'both') {
          if (row.id && supplier.externalRef === row.id) return true;
        }
        if (strategy === 'name' || strategy === 'both') {
          if (supplier.name?.trim().toLowerCase() === row.name.trim().toLowerCase()) return true;
        }
        if (row.contactEmail && supplier.email === row.contactEmail) return true;
        if (row.nif && supplier.nif === row.nif) return true;
        return false;
      });

      const rating = row.rating == null ? undefined : {
        quality: row.rating,
        delivery: row.rating,
        price: row.rating,
        communication: row.rating,
        overall: row.rating,
      };

      const supplier = current
        ? await this.supplierService.updateSupplier(current.id, {
            name: row.name.trim(),
            email: row.contactEmail,
            phone: row.contactPhone,
            address: row.address,
            nif: row.nif,
            rating,
            status: row.isActive === false ? 'inactive' : 'active',
            externalRef: row.id,
          })
        : await this.supplierService.createSupplier({
            name: row.name.trim(),
            email: row.contactEmail,
            phone: row.contactPhone,
            address: row.address,
            nif: row.nif,
            rating,
            status: row.isActive === false ? 'inactive' : 'active',
            externalRef: row.id,
          });

      references.set(row.id, supplier.id);
      existing.push(supplier);
    }

    return references;
  }

  private async importEmployees(
    rows: ProjectImportEmployee[],
    options: ImportOptions
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.employeeService.getAllEmployees();

    for (const row of rows) {
      if (!row.id || !row.email?.trim()) continue;

      const strategy = options.employeeResolution || 'both';
      const current = existing.find((emp) => {
        if (strategy === 'email' || strategy === 'both') {
          if (emp.email?.toLowerCase() === row.email.toLowerCase()) return true;
        }
        if (strategy === 'externalRef' || strategy === 'both') {
          if (row.id && emp.externalRef === row.id) return true;
          if (row.employeeId && emp.employeeId === row.employeeId) return true;
        }
        return false;
      });

      const employeeData = {
        employeeId: row.employeeId || row.id || `EMP${Date.now().toString().slice(-6)}`,
        email: row.email,
        fullName: row.fullName || row.firstName || row.email.split('@')[0],
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        position: row.position,
        department: row.department as any,
        role: row.role as any || 'employee',
        type: row.type as any || 'internal',
        skills: row.skills || [],
        certifications: row.certifications || [],
        isActive: row.isActive !== false,
        externalRef: row.id,
      };

      let employee;
      if (current) {
        const updates: any = {};
        if (row.fullName) updates.fullName = row.fullName;
        if (row.firstName) updates.firstName = row.firstName;
        if (row.lastName) updates.lastName = row.lastName;
        if (row.phone) updates.phone = row.phone;
        if (row.position) updates.position = row.position;
        if (row.department) updates.department = row.department;
        if (row.role) updates.role = row.role;
        if (row.type) updates.type = row.type;
        if (row.skills) updates.skills = row.skills;
        if (row.certifications) updates.certifications = row.certifications;
        if (row.isActive !== undefined) updates.isActive = row.isActive;
        if (row.id) updates.externalRef = row.id;

        if (Object.keys(updates).length > 0) {
          employee = await this.employeeService.updateEmployee(current.id, updates);
        } else {
          employee = current;
        }
      } else {
        employee = await this.employeeService.createEmployee({
          status: EmployeeStatus.ACTIVE,
          ...employeeData,
        });
      }

      references.set(row.id, employee.id);
    }

    return references;
  }

  // ===========================================================================
  // MAP PARTIAL UPDATE DTO
  // ===========================================================================

  private mapPartialUpdateDTO(
    row: ProjectImportRow,
    organizations?: Map<string, string>
  ): Partial<CreateProjectDTO> {
    const dto: Partial<CreateProjectDTO> = {};
    const ignoredFields = ['externalRef', 'id', 'reference', 'projectReference', 'timeline', 'type', 'importMode'];
    const fields = Object.keys(row).filter(key => !ignoredFields.includes(key));

    for (const key of fields) {
      const value = (row as any)[key];
      if (value !== undefined && value !== null) {
        switch (key) {
          case 'title': dto.title = value; break;
          case 'description': dto.description = value; break;
          case 'status': dto.status = this.normalizeStatus(value) as ProjectStatus; break;
          case 'progress': dto.progress = value; break;
          case 'budget': dto.budget = typeof value === 'number' ? value : value?.total; break;
          case 'currency': dto.currency = value; break;
          case 'startDate': dto.startDate = value; break;
          case 'endDate': dto.endDate = value; break;
          case 'location': dto.location = value; break;
          case 'latitude': dto.latitude = value; break;
          case 'longitude': dto.longitude = value; break;
          case 'teamSize': dto.teamSize = value; break;
          case 'financingSource': dto.financingSource = value; break;
          case 'marketType': dto.marketType = value; break;
          case 'selectionMode': dto.selectionMode = value; break;
          case 'projectType': dto.projectType = value; break;
          case 'referentialCode': dto.referentialCode = value; break;
          case 'organizationId':
            dto.organizationId = organizations?.get(value) || value;
            break;
          case 'launchDate': dto.launchDate = value; break;
          case 'attributionDate': dto.attributionDate = value; break;
          case 'completionDate': dto.completionDate = value; break;
          case 'externalRef': dto.externalRef = value; break;
          case 'projectReference': dto.projectReference = value; break;
          case 'budgetSources': dto.budgetSources = value; break;
          case 'interventionZones': dto.interventionZones = value; break;
          case 'interventionZone': dto.interventionZone = value; break;
          case 'sector': dto.sector = value; break;
          case 'priority': dto.priority = value; break;
          case 'mainContractor': dto.mainContractor = value; break;
          case 'engineeringConsultant': dto.engineeringConsultant = value; break;
          case 'clientName': dto.clientName = value; break;
          case 'donorOrganization': dto.donorOrganization = value; break;
          case 'areaSqm': dto.areaSqm = value; break;
        }
      }
    }

    return dto;
  }

  // ===========================================================================
  // MAP MERGE DTO
  // ===========================================================================

  private mapMergeDTO(
    row: ProjectImportRow,
    existing: ProjectDTO,
    organizations?: Map<string, string>
  ): Partial<CreateProjectDTO> {
    const dto: Partial<CreateProjectDTO> = {};
    const fields = ['title', 'description', 'status', 'progress', 'budget', 'currency',
      'startDate', 'endDate', 'location', 'teamSize', 'financingSource',
      'marketType', 'selectionMode', 'projectType', 'referentialCode',
      'sector', 'priority', 'mainContractor', 'engineeringConsultant',
      'clientName', 'donorOrganization', 'areaSqm'];

    for (const field of fields) {
      const importValue = (row as any)[field];
      const existingValue = existing[field as keyof ProjectDTO];

      if (importValue !== undefined && importValue !== null && importValue !== existingValue) {
        (dto as any)[field] = importValue;
      }
    }

    if (row.organizationId) {
      const resolvedOrg = organizations?.get(row.organizationId) || row.organizationId;
      if (resolvedOrg !== existing.organizationId) {
        dto.organizationId = resolvedOrg;
      }
    }

    return dto;
  }

  // ===========================================================================
  // FIND EXISTING PROJECT
  // ===========================================================================

  private findExistingProject(
    projects: ProjectDTO[],
    externalRef?: string,
    reference?: string,
    title?: string
  ): ProjectDTO | null {
    return projects.find((project) => {
      const candidate = project as ProjectDTO & { reference?: string };
      return (externalRef && candidate.externalRef === externalRef) ||
        (reference && candidate.projectReference === reference) ||
        (reference && candidate.reference === reference) ||
        (title && candidate.title?.trim().toLowerCase() === title.trim().toLowerCase());
    }) ?? null;
  }

  // ===========================================================================
  // DETERMINE OPERATION
  // ===========================================================================

  private determineOperation(
    existing: ProjectDTO | null,
    mode: string
  ): 'create' | 'update_full' | 'update_partial' | 'merge' | 'skip' {
    if (!existing) return 'create';

    switch (mode) {
      case 'create': return 'create';
      case 'upsert': return 'update_full';
      case 'partial_update': return 'update_partial';
      case 'full_update': return 'update_full';
      case 'skip_existing': return 'skip';
      case 'merge': return 'merge';
      default: return 'update_full';
    }
  }

  // ===========================================================================
  // VALIDATE DATASET
  // ===========================================================================

  private async validateDataset(
    dataset: ProjectImportDataset,
    options: ImportOptions
  ): Promise<{ errors: Array<{ row: number; title: string; message: string }>; warnings: string[] }> {
    const errors: Array<{ row: number; title: string; message: string }> = [];
    const warnings: string[] = [];

    for (let i = 0; i < dataset.projects.length; i++) {
      const row = dataset.projects[i];
      const rowNum = i + 1;

      if (!row.title?.trim()) {
        errors.push({ row: rowNum, title: '(empty)', message: 'Le titre du projet est requis' });
      }

      if (!row.location?.trim() && !row.interventionZone?.address && !row.interventionZones?.length) {
        errors.push({ row: rowNum, title: row.title || '(empty)', message: 'La localisation est requise' });
      }

      if (row.organizationId) {
        const orgExists = dataset.organizations?.some(o => o.id === row.organizationId);
        if (!orgExists) {
          warnings.push(`L'organisation "${row.organizationId}" référencée dans le projet "${row.title}" n'existe pas dans les organisations partagées`);
        }
      }

      if (row.phases) {
        for (let p = 0; p < row.phases.length; p++) {
          const phase = row.phases[p];
          if (!phase.name?.trim()) {
            errors.push({ row: rowNum, title: row.title || '(empty)', message: `Phase ${p + 1}: nom requis` });
          }
        }
      }
    }

    if (dataset.employees) {
      const emails = new Set<string>();
      for (const emp of dataset.employees) {
        if (!emp.email?.trim()) {
          errors.push({ row: 0, title: 'Employee', message: `L'email est requis pour l'employé ${emp.id || 'sans ID'}` });
        } else if (emails.has(emp.email.toLowerCase())) {
          warnings.push(`Email en double: ${emp.email}`);
        } else {
          emails.add(emp.email.toLowerCase());
        }
      }
    }

    return { errors, warnings };
  }

  // ===========================================================================
  // EXPORT METHODS
  // ===========================================================================

  async exportProjects(opts: ProjectExportOptions): Promise<{
    payload: string;
    mimeType: string;
    extension: string;
    rows?: Record<string, unknown>[];
  }> {
    const all = await this.projectService.getAllProjects();
    const selected = opts.ids?.length
      ? all.filter((p) => opts.ids!.includes(p.id))
      : all;

    const includeZone = opts.includeInterventionZone ?? true;
    const enriched = opts.includeRelations
      ? await Promise.all(selected.map((p) => this.toExportRowWithRelations(p, includeZone)))
      : selected.map((p) => this.toExportRow(p, includeZone));

    switch (opts.format) {
      case 'json':
        return {
          payload: JSON.stringify(enriched, null, 2),
          mimeType: 'application/json',
          extension: 'json',
          rows: enriched,
        };
      case 'csv':
        return {
          payload: this.toCSV(enriched),
          mimeType: 'text/csv',
          extension: 'csv',
          rows: enriched,
        };
      case 'excel-rows':
      default:
        return {
          payload: JSON.stringify(enriched),
          mimeType: 'application/json',
          extension: 'json',
          rows: enriched,
        };
    }
  }

  public toImportRow(p: ProjectDTO): ProjectImportRow {
    return {
      id: p.id,
      externalRef: p.externalRef,
      projectReference: p.projectReference,
      reference: p.projectReference,
      title: p.title,
      description: p.description,
      status: p.status,
      progress: p.progress,
      budget: p.budget,
      currency: p.currency,
      startDate: p.startDate,
      endDate: p.endDate,
      location: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      teamSize: p.teamSize,
      projectType: p.subCategory,
      referentialCode: p.referentialCode,
      organizationId: p.organizationId,
      financingSource: p.financingSource,
      marketType: p.marketType,
      selectionMode: p.selectionMode,
      launchDate: p.launchDate,
      attributionDate: p.attributionDate,
      completionDate: p.completionDate,
      interventionZones: p.interventionZones,
      sector: p.sector,
      priority: p.priority,
      mainContractor: p.mainContractor,
      engineeringConsultant: p.engineeringConsultant,
      clientName: p.clientName,
      donorOrganization: p.donorOrganization,
      areaSqm: p.areaSqm,
    };
  }

  private async toExportRowWithRelations(p: ProjectDTO, includeZone: boolean): Promise<Record<string, unknown>> {
    const base = this.toExportRow(p, includeZone);
    const [phases, stakeholders] = await Promise.all([
      this.phaseService.getPhasesByProject(p.id),
      this.stakeholderService.getProjectStakeholders(p.id),
    ]);
    const phaseRows = await Promise.all(phases.map(async (phase) => ({
      ...phase,
      milestones: await this.milestoneService.getPhaseMilestones(p.id, phase.id),
      tasks: await this.taskAssignmentService.getByPhase(phase.id),
      dqeLines: await boqRepository.list({ source: 'dqe', contextId: p.id, projectId: p.id, phaseId: phase.id }),
    })));
    const dqeLines = phaseRows.flatMap((phase) => phase.dqeLines as BoqLineDTO[]);
    const projectMilestones = await this.milestoneService.getMilestonesByProject(p.id);
    return { ...base, phases: phaseRows, dqeLines, stakeholders, milestones: projectMilestones };
  }

  private toExportRow(p: ProjectDTO, includeZone: boolean): Record<string, unknown> {
    const base: Record<string, unknown> = {
      id: p.id,
      externalRef: p.externalRef,
      organizationId: p.organizationId,
      projectReference: p.projectReference,
      reference: p.projectReference,
      title: p.title,
      description: p.description,
      status: p.status,
      progress: p.progress,
      budget: p.budget,
      currency: p.currency,
      startDate: p.startDate,
      endDate: p.endDate,
      location: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      teamSize: p.teamSize,
      financingSource: p.financingSource,
      marketType: p.marketType,
      selectionMode: p.selectionMode,
      projectType: p.subCategory,
      referentialCode: p.referentialCode,
      sector: p.sector,
      priority: p.priority,
      mainContractor: p.mainContractor,
      engineeringConsultant: p.engineeringConsultant,
      clientName: p.clientName,
      donorOrganization: p.donorOrganization,
      areaSqm: p.areaSqm,
      launchDate: p.launchDate,
      attributionDate: p.attributionDate,
      completionDate: p.completionDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
    const zones = p.interventionZones && p.interventionZones.length > 0
      ? p.interventionZones
      : p.interventionZone
      ? [p.interventionZone]
      : [];
    if (includeZone && zones.length > 0) {
      base.interventionZones = zones;
      base.interventionZoneCount = zones.length;
      base.interventionZoneTotalAreaSqm = zones.reduce(
        (sum, z) => sum + (z.areaSqm ?? 0),
        0,
      );
      base.interventionZonesGeoJSON = GeoJsonZoneCodec.toFeatureCollection(zones);
    }
    return base;
  }

  private toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const flat = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        o[k] = v && typeof v === 'object' ? JSON.stringify(v) : v;
      }
      return o;
    });
    const headers = Array.from(
      flat.reduce<Set<string>>((acc, r) => {
        Object.keys(r).forEach((k) => acc.add(k));
        return acc;
      }, new Set()),
    );
    const escape = (val: unknown) => {
      if (val == null) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of flat) lines.push(headers.map((h) => escape(r[h])).join(','));
    return lines.join('\n');
  }
}

export default ProjectImportExportService;