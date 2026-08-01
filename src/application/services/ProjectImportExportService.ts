/**
 * ProjectImportExportService
 *
 * Service applicatif unifié pour l'import et l'export de projets.
 * Respecte la règle hexagonale : zéro React, zéro `supabase.from(...)`,
 * uniquement orchestration via ProjectService + transformations DTO.
 *
 * - importProjects : valide chaque ligne, déduplique par titre, délègue
 *   la création au ProjectService (qui passe par le repository et les
 *   transformers hexagonaux : référentiel + génération de phases côté
 *   workflow si project_type est mappé).
 * - exportProjects : récupère les DTO et sérialise (JSON / CSV / Excel-ready),
 *   en incluant la zone d'intervention (interventionZone) lorsqu'elle existe.
 */

import { MilestoneService } from '@/application/services/MilestoneService';
import { OrganizationService } from '@/application/services/OrganizationService';
import { PhaseService } from '@/application/services/PhaseService';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { SupplierService } from '@/application/services/SupplierService';
import { TaskPriority, TaskService, TaskStatus } from '@/application/services/TaskService';
import { getReferential, type ReferentialType } from '@/config/referentials';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import { PhasePriority, PhaseStatus, PhaseType, type PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type {
  CreateProjectDTO,
  ProjectDTO,
} from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import type { CreateProjectStakeholderDTO } from '@/dtos/entities/ProjectStakeholderDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';

export interface ProjectImportRow extends Partial<Omit<CreateProjectDTO, 'status' | 'phases' | 'stakeholders' | 'budget' | 'startDate' | 'endDate' | 'projectType'>> {
  id?: string;
  reference?: string;
  title: string;
  description?: string;
  location?: string;
  status?: string;
  progress?: number;
  budget?: number | { total?: number; currency?: string; sources?: Array<Record<string, unknown>> };
  startDate?: string;
  endDate?: string;
  timeline?: { startDate?: string; endDate?: string; durationDays?: number };
  type?: string;
  teamSize?: number;
  latitude?: number;
  longitude?: number;
  /** @deprecated — préférer `interventionZones` (multi). */
  interventionZone?: InterventionZoneDTO;
  /** Zones bénéficiaires (multi-polygones). */
  interventionZones?: InterventionZoneDTO[];
  /** Référentiel projet (ex: 'somelec', 'eter') pour génération de phases. */
  referentialCode?: ReferentialType;
  projectType?: string;
  externalRef?: string;
  organizationId?: string;
  budgetSources?: Array<Record<string, unknown>>;
  dqeLines?: BoqLineDTO[];
  phases?: ProjectImportPhase[];
  stakeholders?: ProjectImportStakeholder[];
}

export interface ProjectImportPhase {
  externalRef?: string;
  name: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  progress?: number;
  order?: number;
  milestones?: ProjectImportMilestone[];
  tasks?: ProjectImportTask[];
  dqeLines?: BoqLineDTO[];
}

export interface ProjectImportMilestone {
  externalRef?: string;
  title?: string;
  name?: string;
  description?: string;
  targetDate?: string;
  target_date?: string;
  status?: string;
  progress?: number;
  progressPercent?: number;
}

export interface ProjectImportTask {
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  due_date?: string;
  assignedTo?: string[];
}

export interface ProjectImportStakeholder extends Partial<CreateProjectStakeholderDTO> {
  organizationId?: string;
  supplierId?: string;
  externalRef?: string;
  role?: string;
}


export interface ProjectImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; title: string; message: string }>;
  createdIds: string[];
  details: { phases: number; milestones: number; tasks: number; dqeLines: number; stakeholders: number };
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

export class ProjectImportExportService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly phaseService = new PhaseService(),
    private readonly milestoneService = new MilestoneService(),
    private readonly taskService = new TaskService(RepositoryFactory.getTaskRepository()),
    private readonly stakeholderService = new ProjectStakeholderService(),
    private readonly organizationService = new OrganizationService(),
    private readonly supplierService = new SupplierService(RepositoryFactory.getSupplierRepository()),
  ) {}

  static default(): ProjectImportExportService {
    return new ProjectImportExportService(
      new ProjectService(RepositoryFactory.getProjectRepository()),
    );
  }

  // ============= IMPORT =============
 

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
    // NOUVEAU: Vérifier location
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

  async importDataset(dataset: ProjectImportDataset): Promise<ProjectImportResult> {
    if (!dataset || !Array.isArray(dataset.projects)) {
      throw new Error('Invalid import dataset: projects must be an array');
    }
    try {
      const references = {
        organizations: await this.importOrganizations(dataset.organizations ?? []),
        suppliers: await this.importSuppliers(dataset.suppliers ?? []),
      };
      return await this.importProjects(dataset.projects, references);
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

  async importProjects(
    rows: ProjectImportRow[],
    references: { organizations?: Map<string, string>; suppliers?: Map<string, string> } = {},
  ): Promise<ProjectImportResult> {
    const result: ProjectImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      createdIds: [],
      details: { phases: 0, milestones: 0, tasks: 0, dqeLines: 0, stakeholders: 0 },
    };

    const validationErrors = this.validateImportRows(rows);
    const invalidRows = new Set(validationErrors.map((error) => error.row));
    result.errors.push(...validationErrors);
    result.failed += invalidRows.size;

    let existingProjects: ProjectDTO[] = [];
    try {
      existingProjects = await this.projectService.getAllProjects();
    } catch (e) {
      // non-blocking; we still attempt import. Errors will surface per-row if any.
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
         const existing = this.findExistingProject(existingProjects, externalRef, row.reference, row.title);
        const dto = this.mapImportRowToCreateDTO(row, references.organizations);
        const project = existing
          ? await this.projectService.updateProject(existing.id, dto as never)
          : await this.projectService.createProject(dto);
        await this.importRelations(project.id, row, result.details, references.suppliers, references.organizations);
        result.imported += 1;
        if (project?.id) result.createdIds.push(project.id);
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
      }
    }

    return result;
  }

  private async importOrganizations(rows: ProjectImportOrganization[]): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;
      const organization = await this.organizationService.upsert({
        id: this.isUUID(row.id) ? row.id : undefined,
        name: row.name.trim(),
        code: row.code,
        orgType: row.type,
        description: row.description,
        address: row.address,
        phone: row.phone,
        email: row.email,
        isActive: row.isActive ?? true,
        externalRef: this.isUUID(row.id) ? undefined : row.id,
      });
      references.set(row.id, organization.id);
    }
    return references;
  }

  private async importSuppliers(rows: ProjectImportSupplier[]): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.supplierService.getAllSuppliers();
    const supplierRepository = RepositoryFactory.getSupplierRepository();
    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;
      const current = await supplierRepository.findByExternalRef(row.id) ?? existing.find((supplier) =>
        (row.contactEmail && supplier.email === row.contactEmail) ||
        (row.nif && supplier.nif === row.nif) ||
        supplier.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
      );
      const rating = row.rating == null ? undefined : {
        quality: row.rating,
        delivery: row.rating,
        price: row.rating,
        communication: row.rating,
        overall: row.rating,
      };
      const supplier = current
        ? await this.supplierService.updateSupplier(current.id, {
          name: row.name.trim(), email: row.contactEmail, phone: row.contactPhone,
          address: row.address, nif: row.nif, rating,
          status: row.isActive === false ? 'inactive' : 'active',
          externalRef: row.id,
        })
        : await this.supplierService.createSupplier({
          name: row.name.trim(), email: row.contactEmail, phone: row.contactPhone,
          address: row.address, nif: row.nif, rating,
          status: row.isActive === false ? 'inactive' : 'active',
          externalRef: row.id,
        });
      references.set(row.id, supplier.id);
      existing.push(supplier);
    }
    return references;
  }

  private isUUID(value?: string): boolean {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private getExternalRef(row: ProjectImportRow): string | undefined {
    return row.externalRef || row.id || row.projectReference || row.reference;
  }

  private findExistingProject(projects: ProjectDTO[], externalRef?: string, reference?: string, title?: string): ProjectDTO | null {
    return projects.find((project) => {
      const candidate = project as ProjectDTO & { reference?: string };
      return (externalRef && candidate.externalRef === externalRef) ||
        (reference && candidate.projectReference === reference) ||
        (reference && candidate.reference === reference) ||
        (title && candidate.title?.trim().toLowerCase() === title.trim().toLowerCase());
    }) ?? null;
  }

  /** Mapping pur et testable du format d'échange vers le contrat de création. */
  public mapImportRowToCreateDTO(row: ProjectImportRow, organizations?: Map<string, string>): CreateProjectDTO {
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
      status: (row.status as ProjectStatus) ?? ProjectStatus.DRAFT,
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
      projectReference: input.reference,
      budgetSources: row.budgetSources ?? (typeof input.budget === 'object' ? input.budget.sources : undefined),
      interventionZones: zones,
      interventionZone: firstZone,
    } as CreateProjectDTO;
    return dto;
  }

  /** Persiste les relations après la création du projet, en conservant l’ordre des clés étrangères. */
  private async importRelations(
    projectId: string,
    row: ProjectImportRow,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    organizations?: Map<string, string>,
  ): Promise<void> {
    for (const phase of row.phases ?? []) {
      const phaseConfig = row.referentialCode
        ? getReferential(row.referentialCode)?.phases.find((candidate) => candidate.code === phase.code)
        : undefined;
      const phases = await this.phaseService.getPhasesByProject(projectId);
      const existingPhase = phases.find((candidate) => {
        const phaseRecord = candidate as unknown as PhaseDTO & { phaseCode?: string; phase_code?: string };
        return phaseRecord.phaseCode === phase.code ||
          phaseRecord.phase_code === phase.code ||
          phaseRecord.name === phase.name;
      });
      const phaseData = {
        id: existingPhase?.id ?? '',
        projectId,
        name: phase.name,
        phaseCode: phase.code,
        externalRef: phase.externalRef ?? (phase.code ? `${this.getExternalRef(row) ?? projectId}:${phase.code}` : undefined),
        description: phase.description,
        type: PhaseType.STRUCTURAL,
        status: PhaseStatus.PENDING,
        priority: PhasePriority.MEDIUM,
        progress: phase.progress ?? 0,
        orderIndex: phase.order,
        startDate: phase.startDate,
        endDate: phase.endDate,
        estimatedDuration: phase.durationDays ?? phaseConfig?.defaultDurationDays ?? phaseConfig?.dqeMapping?.defaultDurationDays,
        customPhaseData: phaseConfig?.dqeMapping ? { dqeMapping: phaseConfig.dqeMapping } : undefined,
        createdAt: existingPhase?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies PhaseDTO;
      const createdPhase = existingPhase
        ? await this.phaseService.updatePhase(existingPhase.id, phaseData)
        : await this.phaseService.createPhase(phaseData, projectId);
      details.phases += 1;

      for (const milestone of phase.milestones ?? []) {
        const milestones = await this.milestoneService.getPhaseMilestones(projectId, createdPhase.id);
        const existingMilestone = milestones.find((candidate) => candidate.title === (milestone.title ?? milestone.name));
        const milestoneData = {
          project_id: projectId,
          phase_id: createdPhase.id,
          title: milestone.title ?? milestone.name ?? 'Jalon importé',
          description: milestone.description,
          target_date: milestone.target_date ?? milestone.targetDate ?? row.endDate ?? row.startDate ?? new Date().toISOString(),
          status: this.normalizeMilestoneStatus(milestone.status),
          progress: milestone.progress ?? milestone.progressPercent,
          external_ref: milestone.externalRef,
        };
        if (existingMilestone) await this.milestoneService.updateMilestone(existingMilestone.id, milestoneData);
        else await this.milestoneService.createMilestone(milestoneData);
        details.milestones += 1;
      }

      for (const task of phase.tasks ?? []) {
        const tasks = await this.taskService.getTasksByPhase(createdPhase.id);
        const taskName = task.title ?? task.name ?? 'Tâche importée';
        const existingTask = tasks.find((candidate) => candidate.title === taskName);
        const taskData = {
          projectId,
          phaseId: createdPhase.id,
          title: taskName,
          description: task.description,
          status: task.status as TaskStatus | undefined,
          priority: task.priority as TaskPriority | undefined,
          dueDate: task.due_date ?? task.dueDate,
          assignedTo: task.assignedTo,
        };
        if (existingTask) await this.taskService.updateTask(existingTask.id, taskData);
        else await this.taskService.createTask(taskData);
        details.tasks += 1;
      }

      const dqeLines = (phase.dqeLines ?? []).map((line) => ({
        ...line,
        btpCode: line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
        source: 'dqe' as const,
        contextId: projectId,
        phaseId: createdPhase.id,
      }));
      await this.upsertDqeLines(projectId, createdPhase.id, dqeLines, details);
    }

    // The fixture also carries a project-level DQE list. Reuse the phase
    // association when possible; the external_ref/code makes this idempotent.
    for (const line of row.dqeLines ?? []) {
      const lineCode = this.getDqeCode(line);
      const phase = (row.phases ?? []).find((candidate) =>
        candidate.dqeLines?.some((candidateLine) => this.getDqeCode(candidateLine) === lineCode),
      );
      if (!phase) continue;
      const persistedPhase = (await this.phaseService.getPhasesByProject(projectId)).find((candidate) =>
        (candidate as { name?: string; phaseName?: string }).phaseName === phase.name ||
        (candidate as { name?: string }).name === phase.name,
      );
      if (persistedPhase) {
        await this.upsertDqeLines(projectId, persistedPhase.id, [{
          ...line,
          btpCode: line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
          source: 'dqe' as const,
          contextId: projectId,
          phaseId: persistedPhase.id,
        }], details, false);
      }
    }

    for (const stakeholder of row.stakeholders ?? []) {
      const organizationRef = stakeholder.organizationId;
      const supplierId = stakeholder.supplierId ? suppliers?.get(stakeholder.supplierId) || stakeholder.supplierId : undefined;
      if (!supplierId && !organizationRef && stakeholder.stakeholderEntityType !== 'employee') continue;
      const stakeholders = await this.stakeholderService.getProjectStakeholders(projectId);
      const existingStakeholder = stakeholders.find((candidate) =>
        candidate.supplierId === supplierId ||
        (organizationRef && candidate.roleDescription?.includes(organizationRef)),
      );
      const stakeholderData = {
        projectId,
        stakeholderType: stakeholder.stakeholderType ?? stakeholder.role ?? 'other',
        stakeholderEntityType: (stakeholder.stakeholderEntityType ?? (supplierId ? 'supplier' : 'employee')) as 'employee' | 'supplier',
        supplierId,
        organizationId: organizationRef && organizations?.get(organizationRef),
        externalRef: stakeholder.externalRef || `SH-${projectId}-${organizationRef || stakeholder.supplierId || 'na'}`,
        employeeId: stakeholder.employeeId,
        roleDescription: [stakeholder.roleDescription ?? stakeholder.role, organizationRef].filter(Boolean).join(' - '),
        isPrimary: stakeholder.isPrimary,
      };
      if (existingStakeholder) await this.stakeholderService.updateProjectStakeholder(existingStakeholder.id, stakeholderData);
      else await this.stakeholderService.addStakeholder(stakeholderData);
      details.stakeholders += 1;
    }
  }

  private async upsertDqeLines(
    projectId: string,
    phaseId: string,
    dqeLines: Array<Record<string, unknown>>,
    details: ProjectImportResult['details'],
    count = true,
  ): Promise<void> {
    if (dqeLines.length === 0) return;
    const existingLines = await boqRepository.list({ source: 'dqe', contextId: projectId, projectId, phaseId });
    for (const dqeLine of dqeLines) {
      const existingLine = existingLines.find((line) => line.btpCode === dqeLine.btpCode);
      if (existingLine) await boqRepository.update(existingLine.id as string, dqeLine as Partial<BoqLineDTO>);
      else await boqRepository.create(dqeLine as unknown as BoqLineDTO);
    }
    if (count) details.dqeLines += dqeLines.length;
  }

  private getDqeCode(line: BoqLineDTO): string | undefined {
    const candidate = line as BoqLineDTO & { code?: string };
    return line.btpCode ?? candidate.code;
  }

  private normalizeMilestoneStatus(status?: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined {
    if (!status) return undefined;
    const statuses: Record<string, 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'> = {
      planifie: 'pending',
      planned: 'pending',
      en_cours: 'in_progress',
      'en cours': 'in_progress',
      termine: 'completed',
      terminé: 'completed',
      delayed: 'delayed',
      en_retard: 'delayed',
      annule: 'cancelled',
      annulé: 'cancelled',
    };
    return statuses[status.toLowerCase()] ?? 'pending';
  }

  // ============= EXPORT =============

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
      interventionZones: p.interventionZones,
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
      tasks: await this.taskService.getTasksByPhase(phase.id),
      dqeLines: await boqRepository.list({ source: 'dqe', contextId: p.id, projectId: p.id, phaseId: phase.id }),
    })));
    const dqeLines = phaseRows.flatMap((phase) => phase.dqeLines as BoqLineDTO[]);
    return { ...base, phases: phaseRows, dqeLines, stakeholders };
  }

  private toExportRow(p: ProjectDTO, includeZone: boolean): Record<string, unknown> {
    const base: Record<string, unknown> = {
      id: p.id,
      externalRef: p.externalRef,
      organizationId: p.organizationId,
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
      // Encodage GeoJSON via codec bidirectionnel (round-trip fidèle).
      base.interventionZonesGeoJSON = GeoJsonZoneCodec.toFeatureCollection(zones);
    }
    return base;
  }

  private toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    // Flatten any object/array cells to JSON-stringified scalars.
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
