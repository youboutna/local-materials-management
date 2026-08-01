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
import { PhaseService } from '@/application/services/PhaseService';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { TaskPriority, TaskService, TaskStatus } from '@/application/services/TaskService';
import { getReferential, type ReferentialType } from '@/config/referentials';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type {
  CreateProjectDTO,
  ProjectDTO,
} from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import type { CreateProjectStakeholderDTO } from '@/dtos/entities/ProjectStakeholderDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import {
  ProjectDatasetTransformer,
  type ProjectDatasetMeta,
} from '@/dtos/transforms/ProjectDatasetTransformer';
import { ProjectImportTransformer } from '@/dtos/transforms/ProjectImportTransformer';

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';

export interface ProjectImportRow extends Partial<Omit<CreateProjectDTO, 'status' | 'phases' | 'stakeholders'>> {
  title: string;
  description?: string;
  location?: string;
  status?: string;
  progress?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
  latitude?: number;
  longitude?: number;
  /** @deprecated — préférer `interventionZones` (multi). */
  interventionZone?: InterventionZoneDTO;
  /** Zones bénéficiaires (multi-polygones). */
  interventionZones?: InterventionZoneDTO[];
  /** Référentiel projet (ex: 'somelec', 'eter') pour génération de phases. */
  referentialCode?: ReferentialType;
  externalRef?: string;
  organizationId?: string;
  budgetSources?: Array<Record<string, unknown>>;
  phases?: ProjectImportPhase[];
  stakeholders?: ProjectImportStakeholder[];
}

export interface ProjectImportPhase {
  name: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  order?: number;
  milestones?: ProjectImportMilestone[];
  tasks?: ProjectImportTask[];
  dqeLines?: BoqLineDTO[];
}

export interface ProjectImportMilestone {
  title?: string;
  name?: string;
  description?: string;
  targetDate?: string;
  target_date?: string;
  status?: string;
  progress?: number;
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
}

export class ProjectImportExportService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly phaseService = new PhaseService(),
    private readonly milestoneService = new MilestoneService(),
    private readonly taskService = new TaskService(RepositoryFactory.getTaskRepository()),
    private readonly stakeholderService = new ProjectStakeholderService(),
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

  /**
   * Normalise un payload d'import : accepte soit un `ProjectImportDataset` déjà
   * camelCase, soit le dataset brut hiérarchique « HADRATECH-GPI »
   * (cf. `src/data/json_project.json`), soit un simple tableau de lignes.
   * La normalisation est déléguée aux Transformers (règle #1).
   */
  normalizeDataset(raw: unknown): ProjectImportDataset {
    if (Array.isArray(raw)) {
      return { projects: ProjectImportTransformer.fromRows(raw as Record<string, unknown>[]) };
    }
    if (ProjectDatasetTransformer.isRawDataset(raw)) {
      return ProjectDatasetTransformer.fromRawDataset(raw);
    }
    const dataset = raw as ProjectImportDataset | null;
    if (!dataset || !Array.isArray(dataset.projects)) {
      throw new Error('Invalid import dataset: projects must be an array');
    }
    return dataset;
  }

  /** Métadonnées (organisations / fournisseurs / codes budgétaires) d'un dataset brut. */
  extractDatasetMeta(raw: unknown): ProjectDatasetMeta {
    return ProjectDatasetTransformer.extractMeta(raw);
  }

  async importDataset(dataset: ProjectImportDataset | unknown): Promise<ProjectImportResult> {
    const normalized = this.normalizeDataset(dataset);
    return this.importProjects(normalized.projects);
  }


  async importProjects(rows: ProjectImportRow[]): Promise<ProjectImportResult> {
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
    result.failed += validationErrors.length;

    let existingTitles = new Set<string>();
    try {
      const existing = await this.projectService.getAllProjects();
      existingTitles = new Set(existing.map((p) => p.title?.trim().toLowerCase()));
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
      if (existingTitles.has(titleKey)) {
        result.skipped += 1;
        continue;
      }

      try {
        const dto = this.toCreateDTO(row);
        const created = await this.projectService.createProject(dto);
        await this.importRelations(created.id, row, result.details);
        result.imported += 1;
        if (created?.id) result.createdIds.push(created.id);
        existingTitles.add(titleKey);
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

  private toCreateDTO(row: ProjectImportRow): CreateProjectDTO {
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
      budget: row.budget ?? 0,
      currency: row.currency ?? 'MRU',
      startDate: row.startDate ?? new Date().toISOString(),
      endDate: row.endDate,
      location: row.location?.trim() || firstZone?.address?.trim() || 'Adresse non spécifiée',
      latitude: row.latitude ?? firstZone?.coordinates?.[0]?.lat,
      longitude: row.longitude ?? firstZone?.coordinates?.[0]?.lng,
      teamSize: row.teamSize ?? 0,
      financingSource: row.financingSource,
      marketType: row.marketType,
      selectionMode: row.selectionMode,
      projectType: row.projectType ?? row.referentialCode,
      attributionDate: row.attributionDate,
      launchDate: row.launchDate,
      completionDate: row.completionDate,
      organizationId: row.organizationId,
      externalRef: row.externalRef,
      budgetSources: row.budgetSources,
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
  ): Promise<void> {
    for (const phase of row.phases ?? []) {
      const phaseConfig = row.referentialCode
        ? getReferential(row.referentialCode)?.phases.find((candidate) => candidate.code === phase.code)
        : undefined;
      const createdPhase = await this.phaseService.createPhase({
        id: crypto.randomUUID(),
        projectId,
        name: phase.name,
        description: phase.description,
        type: 'execution' as PhaseDTO['type'],
        orderIndex: phase.order,
        startDate: phase.startDate,
        endDate: phase.endDate,
        estimatedDuration: phase.durationDays ?? phaseConfig?.defaultDurationDays ?? phaseConfig?.dqeMapping?.defaultDurationDays,
        customPhaseData: phaseConfig?.dqeMapping ? { dqeMapping: phaseConfig.dqeMapping } : undefined,
      } as PhaseDTO, projectId);
      details.phases += 1;

      for (const milestone of phase.milestones ?? []) {
        await this.milestoneService.createMilestone({
          project_id: projectId,
          phase_id: createdPhase.id,
          title: milestone.title ?? milestone.name ?? 'Jalon importé',
          description: milestone.description,
          target_date: milestone.target_date ?? milestone.targetDate ?? row.endDate ?? row.startDate ?? new Date().toISOString(),
          status: milestone.status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined,
          progress: milestone.progress,
        });
        details.milestones += 1;
      }

      for (const task of phase.tasks ?? []) {
        await this.taskService.createTask({
          projectId,
          phaseId: createdPhase.id,
          title: task.title ?? task.name ?? 'Tâche importée',
          description: task.description,
          status: task.status as TaskStatus | undefined,
          priority: task.priority as TaskPriority | undefined,
          dueDate: task.due_date ?? task.dueDate,
          assignedTo: task.assignedTo,
        });
        details.tasks += 1;
      }

      const dqeLines = (phase.dqeLines ?? []).map((line) => ({
        ...line,
        source: 'dqe' as const,
        contextId: projectId,
        phaseId: createdPhase.id,
      }));
      if (dqeLines.length > 0) {
        await boqRepository.bulkCreate(dqeLines);
        details.dqeLines += dqeLines.length;
      }
    }

    for (const stakeholder of row.stakeholders ?? []) {
      if (!stakeholder.supplierId && stakeholder.stakeholderEntityType !== 'employee') continue;
      await this.stakeholderService.addStakeholder({
        projectId,
        stakeholderType: stakeholder.stakeholderType ?? stakeholder.role ?? 'other',
        stakeholderEntityType: stakeholder.stakeholderEntityType ?? 'supplier',
        supplierId: stakeholder.supplierId,
        employeeId: stakeholder.employeeId,
        roleDescription: stakeholder.roleDescription ?? stakeholder.role,
        isPrimary: stakeholder.isPrimary,
      });
      details.stakeholders += 1;
    }
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
      interventionZones: p.interventionZones,
    };
  }

  private async toExportRowWithRelations(p: ProjectDTO, includeZone: boolean): Promise<Record<string, unknown>> {
    const base = this.toExportRow(p, includeZone);
    const phases = await this.phaseService.getPhasesByProject(p.id);
    const phaseRows = await Promise.all(phases.map(async (phase) => ({
      ...phase,
      milestones: await this.milestoneService.getPhaseMilestones(p.id, phase.id),
      tasks: await this.taskService.getTasksByPhase(phase.id),
      dqeLines: await boqRepository.list({ source: 'dqe', contextId: p.id, projectId: p.id, phaseId: phase.id }),
    })));
    return { ...base, phases: phaseRows };
  }

  private toExportRow(p: ProjectDTO, includeZone: boolean): Record<string, unknown> {
    const base: Record<string, unknown> = {
      id: p.id,
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
