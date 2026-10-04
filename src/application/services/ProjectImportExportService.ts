// src/application/services/ProjectImportExportService.ts
// VERSION v5.2 - Fix complet
//
// NOUVEAUTÉS v5.2 :
// 1. upsertStakeholder() : applique STRICTEMENT la règle
//    "id non-UUID → genuuid + stock input dans externalRef"
// 2. Gestion complète des cas d'erreur (FK, unique, trigger, réseau)
// 3. Fallback automatique en community si aucune FK résolue
//
// RÈGLE ID :
//   - id = UUID valide (existe en base) → UPDATE
//   - id = UUID valide (inexistant)     → INSERT avec cet UUID
//   - id = non-UUID (ex: "EXT-STK-0001") → genuuid + externalRef = valeur input
//   - id = absent                        → genuuid + externalRef = input
//
// NOUVEAUTÉS v5.1 : upsert manuel sans RPC
// NOUVEAUTÉS v5.0 : resolveIdAndExternalRef + retryWithBackoff
// NOUVEAUTÉS v4.4 : isUUID v1-v8 + validation phaseId

import { AuthService, getAuthService } from '@/application/services/AuthService';
import { getMilestoneService } from '@/application/services/MilestoneService';
import { getOrganizationService } from '@/application/services/OrganizationService';
import { getPhaseService } from '@/application/services/PhaseService';
import { ProjectService, getProjectService } from '@/application/services/ProjectService';
import { getProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { getSupplierService } from '@/application/services/SupplierService';
import { getTaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { TaxService } from '@/application/services/TaxService';

import { getEmployeeService } from '@/application/services/EmployeeService';
import type { ReferentialType } from '@/config/referentials';
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

import { getDQECategory } from '@/config/referentials/dqe/dqe-categories.referential';
import type {
    CreateProjectDTO,
    ProjectDTO,
} from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { mapDqeStatus } from '@/utils/dqeStatusMapper';
import { getDQETypeLabel, normalizeDQEType } from '@/utils/dqeTypeMapper';
import { EmployeeStatus } from '@/dtos/entities/EmployeeDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

// =============================================================================
// TYPES
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
  generateMissingFromReferential?: boolean;
  validateAgainstReferential?: boolean;
  createMissingParents?: boolean;
  maxRetries?: number;
  autoCreateMissingFK?: boolean;
  deduplicateInput?: boolean;
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
  estimatedDuration?: number;
  progress?: number;
  order?: number;
  status?: string;
  type?: string;
  estimatedCost?: number;
  actualCost?: number;
  budget?: number;
  weight?: number;
  dependencies?: string[];
  dqeMapping?: {
    categories?: string[];
    defaultDurationDays?: number;
    [k: string]: unknown;
  };
  steps?: Array<{
    code?: string;
    label?: unknown;
    name?: string;
    order?: number;
    tasks?: ProjectImportTask[];
  }>;
  milestones?: ProjectImportMilestone[];
  tasks?: ProjectImportTask[];
  dqeLines?: BoqLineDTO[];
}

export interface ProjectImportMilestone {
  externalRef?: string;
  phaseId?: string;
  title?: string;
  name?: string;
  description?: string;
  targetDate?: string;
  target_date?: string;
  completionDate?: string;
  completion_date?: string;
  status?: string;
  progress?: number;
  progressPercent?: number;
  priority?: string;
  type?: string;
  stageType?: string;
  weight?: number;
  dependencies?: string[];
  deliverables?: string[];
  isCritical?: boolean;
  order?: number;
  notes?: string;
  materialUsage?: Array<{
    materialId: string;
    plannedQuantity: number;
    usedQuantity: number;
    unitCost?: number;
  }>;
  materialCostEstimate?: number;
  actualMaterialCost?: number;
  metadata?: Record<string, unknown>;
}

export interface ProjectImportTask {
  id?: string;
  title?: string;
  name?: string;
  label?: string;
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
  estimatedDurationDays?: number;
  actualHours?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  actionType?: string;
  action_type?: string;
}

export interface ProjectImportStakeholder {
  id?: string;
  externalRef?: string;
  stakeholderType?: string;
  stakeholderEntityType?: 'employee' | 'supplier' | 'organization' | 'community';
  organizationId?: string | null;
  supplierId?: string | null;
  employeeId?: string | null;
  role?: string;
  roleDescription?: string;
  isPrimary?: boolean;
  communityType?: string;
}

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
    return new ProjectImportExportService(getProjectService());
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private relationIssues: string[] = [];

  private reportRelationIssue(context: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(context, err);
    this.relationIssues.push(
      `${context.replace(/^\[importRelations\]\s*/, '').replace(/:$/, '')} — ${msg}`,
    );
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries = 3,
    initialDelayMs = 300,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);

        const isNonRetryable =
          /23503|23505|23502|42P10|row-level security|permission denied|P0001/i.test(msg);

        if (isNonRetryable || attempt === maxRetries) {
          throw err;
        }

        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[retryWithBackoff] ${context} échec tentative ${attempt}/${maxRetries}, retry dans ${delay}ms: ${msg}`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  private classifyError(err: unknown): {
    code: string | null;
    isFKViolation: boolean;
    isUniqueViolation: boolean;
    isTriggerError: boolean;
    isNetworkError: boolean;
    message: string;
  } {
    const msg = err instanceof Error ? err.message : String(err);
    const codeMatch = msg.match(/\b(\d{5}|P0001|42P10)\b/);
    const code = codeMatch ? codeMatch[1] : null;

    return {
      code,
      isFKViolation: code === '23503' || /foreign key constraint/i.test(msg),
      isUniqueViolation: code === '23505' || /duplicate key|unique constraint/i.test(msg),
      isTriggerError: code === 'P0001' || /must have|doit avoir/i.test(msg),
      isNetworkError: /fetch|network|timeout|ECONNRESET/i.test(msg),
      message: msg,
    };
  }

  private deduplicateBy<T>(items: T[], keyFn: (item: T) => string | undefined): T[] {
    const seen = new Map<string, T>();
    const noKey: T[] = [];

    for (const item of items) {
      const key = keyFn(item);
      if (!key) {
        noKey.push(item);
        continue;
      }
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        console.warn(`[deduplicateBy] Doublon ignoré : ${key}`);
      }
    }

    return [...seen.values(), ...noKey];
  }

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

  private isUUID(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * ✅ v5.2 : RÈGLE ID — si `id` n'est pas un UUID valide,
   * générer un UUID v4 et stocker la valeur input dans `externalRef`.
   */
  private async resolveIdAndExternalRef(
    rawId: string | undefined | null,
    rawExternalRef: string | undefined | null,
    options?: {
      table?: string;
      checkExists?: boolean;
    },
  ): Promise<{ id: string; externalRef: string | undefined; existsInDb: boolean; existingId?: string }> {
    const trimmedId = typeof rawId === 'string' ? rawId.trim() : '';
    const trimmedRef = typeof rawExternalRef === 'string' ? rawExternalRef.trim() : '';

    // Cas 1 : id est un UUID valide
    if (trimmedId && this.isUUID(trimmedId)) {
      if (options?.checkExists && options?.table) {
        try {
          const { data, error } = await supabase
            .from(options.table)
            .select('id')
            .eq('id', trimmedId)
            .maybeSingle();

          if (!error && data?.id) {
            return { id: trimmedId, externalRef: trimmedRef || undefined, existsInDb: true, existingId: data.id };
          }
        } catch (err) {
          console.warn(`[resolveIdAndExternalRef] Lookup ${options.table} échoué:`, err);
        }
      }
      return { id: trimmedId, externalRef: trimmedRef || undefined, existsInDb: false };
    }

    // Cas 2 : id présent mais non-UUID → genuuid + externalRef = id (ou ref)
    if (trimmedId) {
      if (options?.checkExists && options?.table && trimmedRef) {
        try {
          const { data, error } = await supabase
            .from(options.table)
            .select('id')
            .eq('external_ref', trimmedRef)
            .maybeSingle();

          if (!error && data?.id) {
            return { id: data.id, externalRef: trimmedRef, existsInDb: true, existingId: data.id };
          }
        } catch (err) {
          console.warn(`[resolveIdAndExternalRef] Lookup external_ref échoué:`, err);
        }
      }
      return { id: crypto.randomUUID(), externalRef: trimmedRef || trimmedId, existsInDb: false };
    }

    // Cas 3 : id absent → genuuid + externalRef = ref si fourni
    if (options?.checkExists && options?.table && trimmedRef) {
      try {
        const { data, error } = await supabase
          .from(options.table)
          .select('id')
          .eq('external_ref', trimmedRef)
          .maybeSingle();

        if (!error && data?.id) {
          return { id: data.id, externalRef: trimmedRef, existsInDb: true, existingId: data.id };
        }
      } catch (err) {
        console.warn(`[resolveIdAndExternalRef] Lookup external_ref échoué:`, err);
      }
    }

    return { id: crypto.randomUUID(), externalRef: trimmedRef || undefined, existsInDb: false };
  }

  private async ensureStakeholderCommunityOrg(
    name: string,
    communityType: string,
    externalRef: string | null,
    organizations?: Map<string, string>,
  ): Promise<string | undefined> {
    const orgExternalRef =
      externalRef ??
      `COMMUNITY-${communityType.toUpperCase()}-${name.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

    const cached = organizations?.get(name) ?? organizations?.get(orgExternalRef);
    if (cached) return cached;

    try {
      const { data: existing, error: selectError } = await supabase
        .from('organizations')
        .select('id')
        .eq('external_ref', orgExternalRef)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn(`[ensureStakeholderCommunityOrg] SELECT échoué:`, selectError);
      }

      if (existing?.id) {
        organizations?.set(name, existing.id);
        organizations?.set(orgExternalRef, existing.id);
        return existing.id;
      }

      const { id: newId } = await this.resolveIdAndExternalRef(undefined, orgExternalRef);

      const { data: created, error: insertError } = await supabase
        .from('organizations')
        .insert({
          id: newId,
          name,
          external_ref: orgExternalRef,
          org_type: 'community',
          description: `Organisation communautaire (type: ${communityType})`,
          is_active: true,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      organizations?.set(name, created.id);
      organizations?.set(orgExternalRef, created.id);
      console.log(`[ensureStakeholderCommunityOrg] ✅ Créée: "${name}" → ${created.id}`);
      return created.id;
    } catch (err) {
      console.error(`[ensureStakeholderCommunityOrg] ❌ Échec pour "${name}":`, err);
      return undefined;
    }
  }

  private async ensureEntityExists(
    entityType: 'organization' | 'supplier' | 'employee',
    reference: string | null | undefined,
    context: {
      projectId: string;
      name?: string;
      email?: string;
      role?: string;
      externalRef?: string;
      organizations?: Map<string, string>;
      suppliers?: Map<string, string>;
      employees?: Map<string, string>;
    },
  ): Promise<string | undefined> {
    if (!reference || typeof reference !== 'string') return undefined;
    const trimmed = reference.trim();
    if (!trimmed) return undefined;

    const map =
      entityType === 'organization'
        ? context.organizations
        : entityType === 'supplier'
        ? context.suppliers
        : context.employees;

    const cached = map?.get(trimmed);
    if (cached) return cached;

    const table =
      entityType === 'organization'
        ? 'organizations'
        : entityType === 'supplier'
        ? 'suppliers'
        : 'employees';

    try {
      if (this.isUUID(trimmed)) {
        const { data } = await supabase.from(table).select('id').eq('id', trimmed).maybeSingle();
        if (data?.id) {
          map?.set(trimmed, data.id);
          return data.id;
        }
      } else {
        const { data } = await supabase
          .from(table)
          .select('id')
          .eq('external_ref', trimmed)
          .maybeSingle();
        if (data?.id) {
          map?.set(trimmed, data.id);
          return data.id;
        }
      }
    } catch (err) {
      console.warn(`[ensureEntityExists] Lookup ${table} échoué:`, err);
    }

    if (this.isUUID(trimmed)) {
      console.warn(
        `[ensureEntityExists] ⚠️  UUID "${trimmed}" (${entityType}) introuvable — ignoré`,
      );
      return undefined;
    }

    try {
      const { id: newId, externalRef: resolvedExternalRef } =
        await this.resolveIdAndExternalRef(undefined, trimmed);

      if (entityType === 'organization') {
        const { data, error } = await supabase
          .from('organizations')
          .insert({
            id: newId,
            name: context.name ?? trimmed,
            external_ref: resolvedExternalRef,
            org_type: 'autre',
            is_active: true,
          } as any)
          .select()
          .single();
        if (error) throw error;
        map?.set(trimmed, data.id);
        console.log(`[ensureEntityExists] ✅ organization: "${trimmed}" → ${data.id}`);
        return data.id;
      }

      if (entityType === 'supplier') {
        const { data, error } = await supabase
          .from('suppliers')
          .insert({
            id: newId,
            name: context.name ?? trimmed,
            email: context.email,
            external_ref: resolvedExternalRef,
            status: 'active',
          } as any)
          .select()
          .single();
        if (error) throw error;
        map?.set(trimmed, data.id);
        console.log(`[ensureEntityExists] ✅ supplier: "${trimmed}" → ${data.id}`);
        return data.id;
      }

      const email =
        context.email ??
        `stakeholder-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}@import.local`;
      const { data, error } = await supabase
        .from('employees')
        .insert({
          id: newId,
          employee_id: trimmed,
          email,
          full_name: context.name ?? trimmed,
          position: context.role,
          external_ref: resolvedExternalRef,
          is_active: true,
        } as any)
        .select()
        .single();
      if (error) throw error;
      map?.set(trimmed, data.id);
      console.log(`[ensureEntityExists] ✅ employee: "${trimmed}" → ${data.id}`);
      return data.id;
    } catch (err) {
      console.error(`[ensureEntityExists] ❌ Création ${entityType} "${trimmed}" échouée:`, err);
      return undefined;
    }
  }

  // ===========================================================================
  // NORMALISATION
  // ===========================================================================

  normalizeImportRow(input: unknown): ProjectImportRow {
    const raw = (input ?? {}) as Record<string, unknown>;
    const envelope = (raw.project ?? raw.projet) as Record<string, unknown> | undefined;
    const base: Record<string, unknown> = envelope ? { ...envelope } : { ...raw };

    const pick = <T,>(key: string, altKey?: string): T | undefined => {
      const fromEnvelope = envelope ? (raw[key] ?? (altKey ? raw[altKey] : undefined)) : undefined;
      const fromBase = base[key] ?? (altKey ? base[altKey] : undefined);
      return (fromEnvelope ?? fromBase) as T | undefined;
    };

    const row = base as ProjectImportRow & Record<string, unknown>;

    row.title = String(
      (base.title ?? base.name ?? base.nom ?? base.intitule ?? '') as string,
    ).trim();
    row.description = (base.description ?? base.desc ?? undefined) as string | undefined;
    row.projectReference = (base.projectReference ?? base.reference ?? base.ref) as string | undefined;
    row.externalRef = (base.externalRef ?? base.id ?? row.projectReference) as string | undefined;
    row.location = (base.location ?? base.lieu ?? base.localisation ?? base.address) as string | undefined;

    const timeline = base.timeline as { startDate?: string; endDate?: string } | undefined;
    row.startDate = (base.startDate ?? base.dateDebut ?? base.start_date ?? timeline?.startDate) as string | undefined;
    row.endDate = (base.endDate ?? base.dateFin ?? base.end_date ?? timeline?.endDate) as string | undefined;

    const budget = base.budget as
      | number
      | { total?: number; currency?: string; sources?: Array<Record<string, unknown>> }
      | undefined;
    if (budget !== undefined) row.budget = budget;
    row.currency = (base.currency
      ?? (typeof budget === 'object' ? budget?.currency : undefined)
      ?? undefined) as string | undefined;

    row.phases = pick<ProjectImportPhase[]>('phases', 'plannedPhases') ?? [];
    row.milestones = pick<ProjectImportMilestone[]>('milestones', 'jalons') ?? [];
    row.tasks = pick<ProjectImportTask[]>('tasks', 'taches') ?? [];
    row.dqeLines = pick<BoqLineDTO[]>('dqeLines', 'dqe') ?? [];
    row.stakeholders = pick<ProjectImportStakeholder[]>('stakeholders', 'parties') ?? [];

    const zones = pick<InterventionZoneDTO[]>('interventionZones');
    const zone = pick<InterventionZoneDTO>('interventionZone');
    if (zones?.length) row.interventionZones = zones;
    if (zone) row.interventionZone = zone;

    return row as ProjectImportRow;
  }

  private attachRootCollections(
    projects: ProjectImportRow[],
    raw: Record<string, unknown>,
  ): void {
    const index = new Map<string, ProjectImportRow>();
    for (const project of projects) {
      for (const key of [
        project.id,
        project.externalRef,
        project.projectReference,
        project.reference,
        project.title,
      ]) {
        if (key) index.set(String(key), project);
      }
    }
    if (index.size === 0) return;

    const groupOf = (item: Record<string, unknown>): ProjectImportRow | undefined => {
      for (const key of ['projectId', 'project_id', 'projectRef', 'projectReference', 'project']) {
        const value = item[key];
        if (typeof value === 'string' && index.has(value)) return index.get(value);
      }
      return projects.length === 1 ? projects[0] : undefined;
    };

    const rootArray = (key: string, altKey?: string): Array<Record<string, unknown>> => {
      const value = raw[key] ?? (altKey ? raw[altKey] : undefined);
      return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
    };

    // ----- PHASES -----
    for (const item of rootArray('phases')) {
      const target = groupOf(item);
      if (!target) continue;
      const order = Number(item.order ?? item.orderIndex ?? (target.phases?.length ?? 0) + 1);

      const normalized: ProjectImportPhase = {
        ...(item as unknown as ProjectImportPhase),
        id: item.id as string | undefined,
        externalRef: (item.externalRef as string | undefined) ?? (item.id as string | undefined),
        name: String(item.name ?? item.title ?? `Phase ${order}`),
        code: (item.code as string | undefined) ?? `PH${order}`,
        description: item.description as string | undefined,
        startDate: item.startDate as string | undefined,
        endDate: item.endDate as string | undefined,
        progress: item.progress as number | undefined,
        order,
        status: item.status as string | undefined,
        estimatedCost: item.estimatedCost as number | undefined,
        actualCost: item.actualCost as number | undefined,
        budget: item.budget as number | undefined,
        weight: item.weight as number | undefined,
        durationDays: item.durationDays as number | undefined,
        estimatedDuration: item.estimatedDuration as number | undefined,
        dqeMapping: item.dqeMapping as ProjectImportPhase['dqeMapping'],
        steps: item.steps as ProjectImportPhase['steps'],
      };

      target.phases = [...(target.phases ?? []), normalized];
    }

    // ----- JALONS -----
    for (const item of rootArray('milestones', 'jalons')) {
      const target = groupOf(item);
      if (!target) continue;

      const normalized: ProjectImportMilestone = {
        ...(item as unknown as ProjectImportMilestone),
        externalRef: (item.externalRef as string | undefined) ?? (item.id as string | undefined),
        phaseId: item.phaseId as string | undefined,
        title: (item.title as string | undefined) ?? (item.name as string | undefined),
        name: item.name as string | undefined,
        description: item.description as string | undefined,
        targetDate: (item.targetDate as string | undefined) ?? (item.target_date as string | undefined),
        completionDate: (item.completionDate as string | undefined) ?? (item.completion_date as string | undefined),
        status: item.status as string | undefined,
        progress: item.progress as number | undefined,
        priority: item.priority as string | undefined,
        weight: item.weight as number | undefined,
        type: (item.type as string | undefined) ?? (item.stageType as string | undefined),
        isCritical: item.isCritical as boolean | undefined,
        order: item.order as number | undefined,
        deliverables: item.deliverables as string[] | undefined,
        dependencies: item.dependencies as string[] | undefined,
        notes: item.notes as string | undefined,
      };

      target.milestones = [...(target.milestones ?? []), normalized];
    }

    // ----- TÂCHES -----
    for (const item of rootArray('tasks', 'taches')) {
      const target = groupOf(item);
      if (!target) continue;

      const normalized: ProjectImportTask = {
        ...(item as unknown as ProjectImportTask),
        id: item.id as string | undefined,
        title: (item.title as string | undefined) ?? (item.name as string | undefined),
        name: item.name as string | undefined,
        label: item.label as string | undefined,
        description: item.description as string | undefined,
        status: item.status as string | undefined,
        priority: item.priority as string | undefined,
        progress: item.progress as number | undefined,
        startDate: item.startDate as string | undefined,
        endDate: item.endDate as string | undefined,
        dueDate: (item.dueDate as string | undefined) ?? (item.due_date as string | undefined),
        phaseId: item.phaseId as string | undefined,
        assignedTo: item.assignedTo as string | string[] | undefined,
        assigneeName:
          (item.assigneeName as string | undefined) ??
          (item.assignedName as string | undefined),
        assigneeEmail:
          (item.assigneeEmail as string | undefined) ??
          (item.AssignedEmail as string | undefined),
        estimatedHours: item.estimatedHours as number | undefined,
        estimatedDurationDays: item.estimatedDurationDays as number | undefined,
        actualHours: item.actualHours as number | undefined,
        requiresInspection: item.requiresInspection as boolean | undefined,
        requiresEngineerApproval: item.requiresEngineerApproval as boolean | undefined,
        actionType: item.actionType as string | undefined,
        action_type: item.action_type as string | undefined,
      };

      target.tasks = [...(target.tasks ?? []), normalized];
    }

    // ----- DQE DOCUMENTS -----
    const dqeDocByProject = new Map<ProjectImportRow, Record<string, unknown>>();
    for (const item of rootArray('dqeDocuments', 'dqe_documents')) {
      const target = groupOf(item);
      if (target && !dqeDocByProject.has(target)) dqeDocByProject.set(target, item);
    }

    // ----- LIGNES DQE -----
    for (const item of rootArray('boqLines', 'dqeLines')) {
      const target = groupOf(item);
      if (!target) continue;
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : null;
      const totalHt =
        item.totalHt != null
          ? Number(item.totalHt)
          : item.totalHT != null
          ? Number(item.totalHT)
          : unitPrice != null
          ? quantity * unitPrice
          : null;
      const doc = dqeDocByProject.get(target);
      target.dqeLines = [
        ...(target.dqeLines ?? []),
        {
          phaseId: item.phaseId as string | undefined,
          designation: String(item.designation ?? item.description ?? item.label ?? 'Ligne DQE'),
          unit: String(item.unit ?? 'unité'),
          quantity,
          unitPrice,
          totalPrice: totalHt,
          code: (item.code as string | undefined) ?? (item.id as string | undefined),
          btpCode: item.btpCode as string | undefined,
          category:
            (item.category as string | undefined) ?? (item.dqeCategory as string | undefined),
          taxRate: item.taxRate as number | undefined,
          vatRate:
            item.vatRate != null
              ? Number(item.vatRate)
              : item.taxRate != null
              ? Number(item.taxRate) / 100
              : undefined,
          taxRegimeCode: item.taxRegimeCode as string | undefined,
          accountCode: item.accountCode as string | undefined,
          status: item.status as string | undefined,
          documentRef: doc?.reference ?? doc?.id,
          documentTitle: doc?.title,
        } as unknown as BoqLineDTO,
      ];
    }

    // ----- STAKEHOLDERS -----
    for (const item of rootArray('stakeholders', 'parties')) {
      const target = groupOf(item);
      if (!target) continue;

      const roleStr = (item.role as string | undefined) ?? '';
      const typeStr = item.type as string | undefined;

      const isCommunity =
        !item.organizationId &&
        !item.supplierId &&
        !item.employeeId &&
        (roleStr === 'communautes_locales' ||
          roleStr === 'autorite_regionale' ||
          roleStr === 'autorite_locale' ||
          typeStr === 'community' ||
          !!item.communityType);

      const entityType =
        (item.stakeholderEntityType as
          | 'employee'
          | 'supplier'
          | 'organization'
          | 'community'
          | undefined) ??
        (item.employeeId
          ? 'employee'
          : item.supplierId
          ? 'supplier'
          : item.organizationId
          ? 'organization'
          : undefined) ??
        (isCommunity ? 'community' : undefined) ??
        (typeof typeStr === 'string' &&
        ['employee', 'supplier', 'organization', 'community'].includes(typeStr)
          ? (typeStr as 'employee' | 'supplier' | 'organization' | 'community')
          : undefined);

      target.stakeholders = [
        ...(target.stakeholders ?? []),
        {
          id: item.id as string | undefined,
          externalRef:
            (item.externalRef as string | undefined) ?? (item.id as string | undefined),
          stakeholderType: (item.stakeholderType as string | undefined) ?? roleStr,
          stakeholderEntityType: entityType,
          organizationId: (item.organizationId as string | null | undefined) ?? null,
          supplierId: (item.supplierId as string | null | undefined) ?? null,
          employeeId: (item.employeeId as string | null | undefined) ?? null,
          role: item.role as string | undefined,
          roleDescription:
            (item.roleDescription as string | undefined) ?? (item.name as string | undefined),
          isPrimary: item.isPrimary as boolean | undefined,
          communityType:
            (item.communityType as string | undefined) ?? (isCommunity ? roleStr : undefined),
        },
      ];
    }
  }

  normalizeDataset(input: unknown, options: ImportOptions = {}): ProjectImportDataset {
    const raw = (input ?? {}) as Record<string, unknown>;

    if (this.looksLikeReferentialTemplate(raw)) {
      console.warn(
        `[ProjectImportExportService] Ce fichier est un TEMPLATE de référentiel (${raw.referentialCode}), pas un jeu de données. Import annulé.`,
      );
      return { projects: [] };
    }

    const projectsSource = Array.isArray(raw) ? raw : raw.projects ?? raw.projets ?? [];
    let projects = (Array.isArray(projectsSource) ? projectsSource : [projectsSource]).map(
      (item) => this.normalizeImportRow(item),
    );

    if (options.deduplicateInput !== false) {
      projects = this.deduplicateBy(
        projects,
        (p) => p.externalRef ?? p.id ?? p.title?.toLowerCase(),
      );
    }

    if (!Array.isArray(raw)) {
      this.attachRootCollections(projects, raw);
    }

    for (const project of projects) {
      if (project.phases) {
        project.phases = this.deduplicateBy(
          project.phases,
          (ph) => ph.externalRef ?? ph.id ?? ph.code ?? ph.name?.toLowerCase(),
        );
        for (const phase of project.phases) {
          if (phase.tasks) {
            phase.tasks = this.deduplicateBy(
              phase.tasks,
              (t) => t.id ?? this.resolveTaskTitle(t)?.toLowerCase(),
            );
          }
          if (phase.milestones) {
            phase.milestones = this.deduplicateBy(
              phase.milestones,
              (m) => m.externalRef ?? m.title?.toLowerCase(),
            );
          }
        }
      }
      if (project.tasks) {
        project.tasks = this.deduplicateBy(
          project.tasks,
          (t) => t.id ?? this.resolveTaskTitle(t)?.toLowerCase(),
        );
      }
      if (project.milestones) {
        project.milestones = this.deduplicateBy(
          project.milestones,
          (m) => m.externalRef ?? m.title?.toLowerCase(),
        );
      }
      if (project.stakeholders) {
        project.stakeholders = this.deduplicateBy(
          project.stakeholders,
          (s) => s.externalRef ?? s.roleDescription?.toLowerCase() ?? s.role,
        );
      }
    }

    if (typeof raw.referentialCode === 'string') {
      for (const project of projects) {
        if (!project.referentialCode) project.referentialCode = raw.referentialCode;
      }
    }

    return {
      projects,
      organizations: raw.organizations as ProjectImportOrganization[] | undefined,
      suppliers: raw.suppliers as ProjectImportSupplier[] | undefined,
      employees: raw.employees as ProjectImportEmployee[] | undefined,
      options: raw.options as ImportOptions | undefined,
    };
  }

  private looksLikeReferentialTemplate(raw: Record<string, unknown>): boolean {
    return (
      typeof raw.referentialCode === 'string' &&
      !('projects' in raw) &&
      !('projets' in raw) &&
      !Array.isArray(raw)
    );
  }

  private resolveTaskTitle(task: ProjectImportTask | null | undefined): string | undefined {
    if (!task) return undefined;
    const raw = (task.title ?? task.name ?? task.label ?? '') as string;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    return trimmed || undefined;
  }

  private resolveActionType(task: ProjectImportTask | null | undefined): string {
    if (!task) return 'task_assignment';
    const fromCamel = (task as { actionType?: string }).actionType;
    const fromSnake = (task as { action_type?: string }).action_type;
    const raw = (fromCamel ?? fromSnake ?? '') as string;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    return trimmed || 'task_assignment';
  }

  private getExternalRef(row: ProjectImportRow): string | undefined {
    return row.externalRef || row.id || row.projectReference || row.reference;
  }

  private resolveReference(
    reference?: string | null,
    map?: Map<string, string>,
  ): string | undefined {
    if (!reference || typeof reference !== 'string') return undefined;
    const trimmed = reference.trim();
    if (!trimmed) return undefined;

    const mapped = map?.get(trimmed);
    if (mapped) return mapped;

    return this.isUUID(trimmed) ? trimmed : undefined;
  }

  private resolveTaskAssignees(
    raw: string | string[] | undefined,
    suppliers?: Map<string, string>,
    employees?: Map<string, string>,
  ): {
    ids: string[];
    names: string[];
    emails: string[];
    source: 'supplier' | 'employee' | 'user' | 'mixed' | 'fallback';
  } {
    const refs = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const ids: string[] = [];
    const sources = new Set<'supplier' | 'employee' | 'user'>();

    for (const ref of refs) {
      if (!ref || typeof ref !== 'string') continue;
      const trimmed = ref.trim();
      if (!trimmed) continue;

      const supId = this.resolveReference(trimmed, suppliers);
      if (supId) {
        ids.push(supId);
        sources.add('supplier');
        continue;
      }

      const empId = this.resolveReference(trimmed, employees);
      if (empId) {
        ids.push(empId);
        sources.add('employee');
        continue;
      }

      if (this.isUUID(trimmed)) {
        ids.push(trimmed);
        sources.add('user');
      }
    }

    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0 && this.currentUserId) {
      return {
        ids: [this.currentUserId],
        names: this.currentUserName ? [this.currentUserName] : [],
        emails: this.currentUserEmail ? [this.currentUserEmail] : [],
        source: 'fallback',
      };
    }

    let aggregateSource: 'supplier' | 'employee' | 'user' | 'mixed' | 'fallback' = 'fallback';
    if (sources.size === 1) {
      aggregateSource = [...sources][0];
    } else if (sources.size > 1) {
      aggregateSource = 'mixed';
    }

    return {
      ids: uniqueIds,
      names: [],
      emails: [],
      source: aggregateSource,
    };
  }

  private normalizeStatus(status?: string): string {
    if (!status) return 'DRAFT';
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'en cours': 'IN_PROGRESS',
      en_cours: 'IN_PROGRESS',
      in_progress: 'IN_PROGRESS',
      termine: 'COMPLETED',
      'terminé': 'COMPLETED',
      completed: 'COMPLETED',
      'en attente': 'PENDING',
      en_attente: 'PENDING',
      pending: 'PENDING',
      not_started: 'PENDING',
      suspendu: 'SUSPENDED',
      suspend: 'SUSPENDED',
      annule: 'CANCELLED',
      'annulé': 'CANCELLED',
      cancelled: 'CANCELLED',
      draft: 'DRAFT',
    };
    return mapping[normalized] || 'DRAFT';
  }

  private normalizeMilestoneStatus(
    status?: string,
  ): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined {
    if (!status) return undefined;
    const statuses: Record<
      string,
      'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
    > = {
      planifie: 'pending',
      planned: 'pending',
      not_started: 'pending',
      en_cours: 'in_progress',
      'en cours': 'in_progress',
      in_progress: 'in_progress',
      termine: 'completed',
      'terminé': 'completed',
      completed: 'completed',
      overdue: 'delayed',
      delayed: 'delayed',
      en_retard: 'delayed',
      annule: 'cancelled',
      'annulé': 'cancelled',
      cancelled: 'cancelled',
    };
    return statuses[status.toLowerCase()] ?? 'pending';
  }

  private normalizeMilestonePriority(
    priority?: string,
  ): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
      haute: 'high',
      elevee: 'high',
      'élevée': 'high',
      moyenne: 'medium',
      basse: 'low',
    };
    return mapping[normalized] || 'medium';
  }

  private async createMilestoneData(
    projectId: string,
    phaseId: string | undefined,
    milestone: ProjectImportMilestone,
    defaultDate: string,
  ): Promise<any> {
    const { id: resolvedId, externalRef: resolvedExternalRef } =
      await this.resolveIdAndExternalRef(undefined, milestone.externalRef, {
        table: 'project_milestones',
        checkExists: true,
      });

    return {
      id: resolvedId,
      project_id: projectId,
      phase_id: phaseId || null,
      title: milestone.title ?? milestone.name ?? 'Jalon importé',
      description: milestone.description,
      target_date: milestone.target_date ?? milestone.targetDate ?? defaultDate,
      completion_date: milestone.completion_date ?? milestone.completionDate,
      status: this.normalizeMilestoneStatus(milestone.status) || 'pending',
      progress_percentage: milestone.progress ?? milestone.progressPercent ?? 0,
      external_ref: resolvedExternalRef,
      priority: this.normalizeMilestonePriority(milestone.priority) || 'medium',
      type: milestone.type,
      weight: milestone.weight,
      notes: milestone.notes,
      stage_type: milestone.stageType,
      deliverables: milestone.deliverables || [],
      dependencies: milestone.dependencies || [],
      is_critical: milestone.isCritical ?? false,
      order_index: milestone.order,
      material_usage: milestone.materialUsage,
      material_cost_estimate: milestone.materialCostEstimate,
      actual_material_cost: milestone.actualMaterialCost,
    };
  }

  private async importMilestone(
    projectId: string,
    phaseId: string | undefined,
    milestone: ProjectImportMilestone,
    defaultDate: string,
    details: ProjectImportResult['details'],
    existingMilestones: any[],
  ): Promise<void> {
    const milestoneData = await this.createMilestoneData(projectId, phaseId, milestone, defaultDate);

    const existingMilestone = existingMilestones.find(
      (candidate) =>
        candidate.id === milestoneData.id ||
        (milestoneData.external_ref && candidate.external_ref === milestoneData.external_ref) ||
        candidate.title === milestoneData.title,
    );

    try {
      if (existingMilestone) {
        await this.retryWithBackoff(
          () => this.milestoneService.updateMilestone(existingMilestone.id, milestoneData),
          `updateMilestone ${existingMilestone.id}`,
        );
        details.milestones += 1;
      } else {
        await this.retryWithBackoff(
          () => this.milestoneService.createMilestone(milestoneData),
          `createMilestone ${milestoneData.title}`,
        );
        details.milestones += 1;
      }
    } catch (err) {
      this.reportRelationIssue(
        `[importMilestone] Échec pour "${milestoneData.title}" :`,
        err,
      );
    }
  }

  public async mapImportRowToCreateDTO(
    row: ProjectImportRow,
    organizations?: Map<string, string>,
  ): Promise<CreateProjectDTO> {
    const { id: resolvedId, externalRef: resolvedExternalRef } =
      await this.resolveIdAndExternalRef(row.id, this.getExternalRef(row), {
        table: 'projects',
        checkExists: true,
      });

    const input = row as ProjectImportRow & {
      budget?:
        | number
        | { total?: number; currency?: string; sources?: Array<Record<string, unknown>> };
      timeline?: { startDate?: string; endDate?: string };
      type?: string;
      reference?: string;
    };

    const zones =
      row.interventionZones && row.interventionZones.length > 0
        ? row.interventionZones
        : row.interventionZone
        ? [row.interventionZone]
        : undefined;
    const firstZone = zones?.[0];

    const dto: CreateProjectDTO = {
      id: resolvedId,
      title: row.title,
      description: row.description ?? '',
      status: this.normalizeStatus(row.status) as ProjectStatus,
      progress: row.progress ?? 0,
      budget:
        typeof input.budget === 'number' ? input.budget : input.budget?.total ?? 0,
      currency:
        row.currency ??
        (typeof input.budget === 'object' ? input.budget.currency : undefined) ??
        'MRU',
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
      organizationId: row.organizationId && organizations?.get(row.organizationId)
        ? organizations.get(row.organizationId)
        : row.organizationId,
      externalRef: resolvedExternalRef,
      projectReference: row.projectReference || input.reference,
      budgetSources:
        row.budgetSources ??
        (typeof input.budget === 'object' ? input.budget.sources : undefined),
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
  // IMPORT RELATIONS
  // ===========================================================================

  private async importRelations(
    projectId: string,
    row: ProjectImportRow,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    organizations?: Map<string, string>,
    employees?: Map<string, string>,
    options: ImportOptions = {},
    changes?: ProjectImportResult['changes'],
  ): Promise<void> {
    const phaseIdMap = new Map<string, string>();

    if (!(row.phases ?? []).length) {
      if (options.generateMissingFromReferential === true && row.referentialCode) {
        const existing = await this.phaseService.getPhasesByProject(projectId);
        if (!existing.length) {
          try {
            const generated = await this.phaseService.createPhasesFromReferential(
              projectId,
              row.referentialCode as ReferentialType,
            );
            details.phases += generated.length;
          } catch (error) {
            console.warn('[ProjectImport] auto-génération des phases impossible', error);
          }
        }
      }
    }

    for (const phase of row.phases ?? []) {
      try {
        const existingPhases = await this.phaseService.getPhasesByProject(projectId);

        const existingPhase =
          existingPhases.find((candidate) => {
            const customData = candidate.customPhaseData as { phaseCode?: string } | null;
            const candidateCode = customData?.phaseCode
              ?? (candidate as any).phaseCode
              ?? (candidate as any).phase_code;
            const candidateName = (candidate as any).name ?? (candidate as any).phaseName;
            const candidateExternalRef = (candidate as { externalRef?: string }).externalRef
              ?? (candidate as any).external_ref;
            return (
              (phase.id && candidate.id === phase.id) ||
              (phase.code && candidateCode === phase.code) ||
              (phase.name && candidateName === phase.name) ||
              (phase.externalRef && candidateExternalRef === phase.externalRef)
            );
          }) ?? null;

        const phaseCode =
          phase.code || `phase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const normalizedType = PhaseTransformer.normalizeDbPhaseType(phase.code ?? phase.name);

        const estimatedDuration =
          phase.durationDays ??
          phase.estimatedDuration ??
          phase.dqeMapping?.defaultDurationDays ??
          this.computeDurationFromDates(phase.startDate, phase.endDate) ??
          this.sumTaskDurations(phase.tasks) ??
          this.sumStepDurations(phase.steps) ??
          0;

        const { id: resolvedPhaseId, externalRef: resolvedPhaseExternalRef } =
          await this.resolveIdAndExternalRef(
            phase.id,
            phase.externalRef ??
              (phase.code ? `${this.getExternalRef(row) ?? projectId}:${phase.code}` : undefined),
            { table: 'project_phases', checkExists: true },
          );

        const phaseData: Partial<PhaseDTO> = {
          id: existingPhase?.id ?? resolvedPhaseId,
          projectId,
          name: phase.name,
          phaseCode: phaseCode,
          type: normalizedType as any,
          externalRef: resolvedPhaseExternalRef,
          description: phase.description,
          status: (phase.status as PhaseStatus) || PhaseStatus.PENDING,
          priority: PhasePriority.MEDIUM,
          progress: phase.progress ?? 0,
          orderIndex: phase.order,
          startDate: phase.startDate,
          endDate: phase.endDate,
          estimatedDuration,
          customPhaseData: phase.dqeMapping
            ? { dqeMapping: phase.dqeMapping, phaseCode: phaseCode }
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
          createdPhase = await this.retryWithBackoff(
            () => this.phaseService.updatePhase(existingPhase.id, phaseData),
            `updatePhase ${existingPhase.id}`,
          );
          details.phases += 1;
        } else {
          createdPhase = await this.retryWithBackoff(
            () => this.phaseService.createPhase(phaseData as PhaseDTO, projectId),
            `createPhase ${phase.name}`,
          );
          details.phases += 1;
        }

        for (const key of [phase.id, phase.code, phase.name, phase.externalRef]) {
          if (key) phaseIdMap.set(String(key).trim(), createdPhase.id);
        }

        try {
          const existingPhaseMilestones = await this.milestoneService.getPhaseMilestonesRaw(
            createdPhase.id,
          );
          const defaultDate = row.endDate ?? row.startDate ?? new Date().toISOString();

          for (const milestone of phase.milestones ?? []) {
            await this.importMilestone(
              projectId,
              createdPhase.id,
              milestone,
              defaultDate,
              details,
              existingPhaseMilestones,
            );
          }
        } catch (err) {
          this.reportRelationIssue(
            `[importRelations] Phase milestones failed for phase ${createdPhase.id}:`,
            err,
          );
        }

        try {
          for (const task of phase.tasks ?? []) {
            const resolvedTitle = this.resolveTaskTitle(task);
            if (!resolvedTitle) continue;

            await this.upsertTask(
              projectId,
              createdPhase.id,
              task,
              details,
              suppliers,
              employees,
            );
          }
        } catch (err) {
          this.reportRelationIssue(
            `[importRelations] Phase tasks failed for phase ${createdPhase.id}:`,
            err,
          );
        }

        try {
          const dqeLines = (phase.dqeLines ?? []).map((line) => ({
            ...line,
            btpCode:
              line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
            source: 'dqe' as const,
            contextId: projectId,
            phaseId: createdPhase.id,
          }));
          await this.upsertDqeLines(projectId, createdPhase.id, dqeLines, details);
        } catch (err) {
          this.reportRelationIssue(
            `[importRelations] Phase DQE failed for phase ${createdPhase.id}:`,
            err,
          );
        }
      } catch (err) {
        this.reportRelationIssue(`[importRelations] Phase failed:`, err);
      }
    }

    try {
      const freshPhases = await this.phaseService.getPhasesByProject(projectId);
      for (const freshPhase of freshPhases) {
        const customData = freshPhase.customPhaseData as { phaseCode?: string } | null;
        const keys = [
          freshPhase.id,
          (freshPhase as any).name,
          (freshPhase as any).phaseName,
          customData?.phaseCode,
          (freshPhase as any).phaseCode,
          (freshPhase as any).phase_code,
          (freshPhase as any).externalRef,
          (freshPhase as any).external_ref,
        ];
        for (const key of keys) {
          if (key && typeof key === 'string' && key.trim()) {
            phaseIdMap.set(key.trim(), freshPhase.id);
          }
        }
      }
    } catch (err) {
      console.warn(`[importRelations] Reconstruction phaseIdMap échouée:`, err);
    }

    try {
      const existingProjectMilestones = await this.milestoneService.getMilestonesByProject(
        projectId,
      );
      const defaultDate = row.endDate ?? row.startDate ?? new Date().toISOString();

      for (const milestone of row.milestones ?? []) {
        let targetPhaseId: string | undefined;
        if (milestone.phaseId) {
          targetPhaseId =
            phaseIdMap.get(milestone.phaseId) ??
            (this.isUUID(milestone.phaseId) ? milestone.phaseId : undefined);
        }

        await this.importMilestone(
          projectId,
          targetPhaseId,
          milestone,
          defaultDate,
          details,
          existingProjectMilestones,
        );
      }
    } catch (err) {
      this.reportRelationIssue('[importRelations] Project milestones failed:', err);
    }

    try {
      for (const task of row.tasks ?? []) {
        const resolvedTitle = this.resolveTaskTitle(task);
        if (!resolvedTitle) continue;

        let targetPhaseId: string | undefined;
        if (task.phaseId) {
          targetPhaseId =
            phaseIdMap.get(task.phaseId) ??
            (this.isUUID(task.phaseId) ? task.phaseId : undefined);
        }

        await this.upsertTask(projectId, targetPhaseId, task, details, suppliers, employees);
      }
    } catch (err) {
      this.reportRelationIssue('[importRelations] Project tasks failed:', err);
    }

    try {
      let fallbackDqePhaseId: string | undefined;
      for (const line of row.dqeLines ?? []) {
        let targetPhaseId: string | undefined;
        if (line.phaseId) {
          targetPhaseId =
            phaseIdMap.get(line.phaseId) ??
            (this.isUUID(line.phaseId) ? line.phaseId : undefined);
        }

        if (!targetPhaseId) {
          fallbackDqePhaseId =
            fallbackDqePhaseId ?? (await this.ensureImportDqePhase(projectId, row, details));
          targetPhaseId = fallbackDqePhaseId;
        }

        const dqeLine = {
          ...line,
          btpCode:
            line.btpCode ?? (line as BoqLineDTO & { code?: string }).code ?? undefined,
          source: 'dqe' as const,
          contextId: projectId,
          phaseId: targetPhaseId,
        };
        await this.upsertDqeLines(projectId, targetPhaseId, [dqeLine], details);
      }
    } catch (err) {
      this.reportRelationIssue('[importRelations] Project DQE failed:', err);
    }

    try {
      for (const stakeholder of row.stakeholders ?? []) {
        await this.upsertStakeholder(
          projectId,
          stakeholder,
          details,
          suppliers,
          organizations,
          employees,
        );
      }
    } catch (err) {
      this.reportRelationIssue('[importRelations] Stakeholders failed:', err);
    }
  }

  private async ensureImportDqePhase(
    projectId: string,
    row: ProjectImportRow,
    details: ProjectImportResult['details'],
  ): Promise<string> {
    const phaseCode = 'IMPORT_DQE';
    const existingPhases = await this.phaseService.getPhasesByProject(projectId);
    const existing = existingPhases.find((candidate) => {
      const customData = candidate.customPhaseData as { phaseCode?: string } | null;
      return customData?.phaseCode === phaseCode || (candidate as any).name === 'DQE importé';
    });
    if (existing) return existing.id;

    const { id: resolvedId } = await this.resolveIdAndExternalRef(undefined, undefined);

    const created = await this.phaseService.createPhase(
      {
        id: resolvedId,
        projectId,
        name: 'DQE importé',
        phaseCode,
        type: PhaseTransformer.normalizeDbPhaseType(phaseCode) as never,
        description:
          'Phase générée automatiquement pour les lignes DQE importées sans phase.',
        status: PhaseStatus.PENDING,
        priority: PhasePriority.MEDIUM,
        progress: 0,
        startDate: row.startDate,
        endDate: row.endDate,
        customPhaseData: { phaseCode },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PhaseDTO,
      projectId,
    );

    details.phases += 1;
    return created.id;
  }

  private async upsertTask(
    projectId: string,
    phaseId: string | undefined,
    task: ProjectImportTask,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    employees?: Map<string, string>,
  ): Promise<void> {
    const resolvedTitle = this.resolveTaskTitle(task);
    const name = resolvedTitle ?? 'Tâche importée';

    let validPhaseId: string | undefined;
    if (phaseId && this.isUUID(phaseId)) {
      try {
        const freshPhases = await this.phaseService.getPhasesByProject(projectId);
        const exists = freshPhases.some((p) => p.id === phaseId);
        if (exists) validPhaseId = phaseId;
      } catch {
        /* ignore */
      }
    }

    const existingTasks = validPhaseId
      ? await this.taskAssignmentService.getByPhase(validPhaseId)
      : await this.taskAssignmentService.getByProject(projectId);
    const existingTask = existingTasks.find((candidate) => candidate.title === name);

    const resolved = this.resolveTaskAssignees(task.assignedTo, suppliers, employees);

    let assigneeName = task.assigneeName || task.assignedName || resolved.names[0];
    let assigneeEmail = task.assigneeEmail || task.AssignedEmail || resolved.emails[0];

    if (!assigneeName && this.currentUserName) assigneeName = this.currentUserName;
    if (!assigneeEmail && this.currentUserEmail) assigneeEmail = this.currentUserEmail;

    const assignees = resolved.ids;
    const assigneeType = resolved.source;

    let normalizedStatus = normalizeTaskStatus(task.status);
    if (!normalizedStatus || normalizedStatus === TaskStatus.PENDING) {
      normalizedStatus = assignees.length > 0 ? TaskStatus.ASSIGNED : TaskStatus.PENDING;
    }
    if (task.progress !== undefined) {
      if (task.progress >= 100) {
        normalizedStatus = TaskStatus.COMPLETED;
      } else if (task.progress > 0 && normalizedStatus !== TaskStatus.COMPLETED) {
        normalizedStatus = TaskStatus.IN_PROGRESS;
      }
    }

    const actionType = this.resolveActionType(task);

    const { id: resolvedTaskId, externalRef: resolvedTaskExternalRef } =
      await this.resolveIdAndExternalRef(task.id, task.id, {
        table: 'task_assignments',
        checkExists: true,
      });

    const taskData: Partial<CreateTaskAssignmentDTO> & {
      id?: string;
      title?: string;
      name?: string;
      action_type?: string;
      externalRef?: string;
    } = {
      id: existingTask?.id ?? resolvedTaskId,
      projectId,
      phaseId: validPhaseId,
      title: name,
      name,
      action_type: actionType,
      description: task.description,
      status: normalizedStatus,
      priority: normalizeTaskPriority(task.priority) || TaskPriority.MEDIUM,
      dueDate: task.due_date ?? task.dueDate ?? task.endDate,
      assigneeId: assignees.length > 0 ? assignees[0] : undefined,
      assigneeName,
      assigneeEmail,
      startDate: task.startDate,
      estimatedHours:
        task.estimatedHours ??
        (typeof task.estimatedDurationDays === 'number'
          ? task.estimatedDurationDays * 8
          : undefined),
      actualHours: task.actualHours,
      metadata: {
        assignedBy: this.currentUserId,
        assignedTo: assignees,
        assigneeType,
        assigneeSource: resolved.source,
        importProgress: task.progress,
        importId: task.id,
        externalRef: resolvedTaskExternalRef,
        requiresInspection: task.requiresInspection,
        requiresEngineerApproval: task.requiresEngineerApproval,
      },
    };

    try {
      if (existingTask) {
        await this.retryWithBackoff(
          () => this.taskAssignmentService.update(existingTask.id, taskData),
          `updateTask ${existingTask.id}`,
        );
      } else {
        await this.retryWithBackoff(
          () => this.taskAssignmentService.create(taskData as CreateTaskAssignmentDTO),
          `createTask ${name}`,
        );
      }
      details.tasks += 1;
    } catch (err) {
      const classification = this.classifyError(err);

      if (classification.isFKViolation && validPhaseId) {
        console.warn(`[upsertTask] FK violation — retry sans phase pour "${name}"`);
        try {
          const fallbackData = { ...taskData, phaseId: undefined };
          if (existingTask) {
            await this.taskAssignmentService.update(existingTask.id, fallbackData);
          } else {
            await this.taskAssignmentService.create(fallbackData as CreateTaskAssignmentDTO);
          }
          details.tasks += 1;
          return;
        } catch (retryErr) {
          console.error(`[upsertTask] Retry sans phase échoué:`, retryErr);
        }
      }

      this.reportRelationIssue(`[upsertTask] Échec pour "${name}":`, err);
    }
  }

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
      const unitPrice = dqeLine.unitPrice != null ? Number(dqeLine.unitPrice) : null;

      const { id: resolvedLineId } = await this.resolveIdAndExternalRef(
        dqeLine.id as string | undefined,
        (dqeLine.id ?? dqeLine.code) as string | undefined,
      );

      const rawBoqData: BoqLineDTO = {
        id: resolvedLineId,
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
        vatRate: (dqeLine.vatRate as number | undefined) ?? null,
        taxRegimeCode: (dqeLine.taxRegimeCode as string | undefined) ?? null,
        accountCode: (dqeLine.accountCode as string | undefined) ?? null,
        discount: dqeLine.discount as number | undefined,
        metadata: {
          dqeCategory: categoryCode ?? null,
          dqeCategoryLabel: dqeCategory?.label?.fr ?? categoryCode ?? null,
          originalCode: dqeLine.code ?? null,
          originalStatus: dqeLine.status ?? null,
          originalDQEType: dqeLine.dqeType ?? null,
          dqeTypeLabel: getDQETypeLabel(dqeType, 'fr'),
          targetMargin: dqeCategory?.targetMargin ?? null,
          documentRef: (dqeLine.documentRef as string | undefined) ?? null,
          documentTitle: (dqeLine.documentTitle as string | undefined) ?? null,
        },
      } as BoqLineDTO;

      let tax;
      try {
        tax = TaxService.resolve(rawBoqData as never);
      } catch (err) {
        tax = { vatRate: 0, origin: 'fallback', vatAmount: 0, totalTtc: rawBoqData.totalHt };
      }

      const boqData: BoqLineDTO = {
        ...rawBoqData,
        vatRate: tax.vatRate,
        taxRegimeCode: rawBoqData.taxRegimeCode ?? (tax as any).regimeCode ?? null,
        accountCode: rawBoqData.accountCode ?? (tax as any).accountCode ?? null,
        metadata: {
          ...(rawBoqData.metadata as Record<string, unknown>),
          taxOrigin: (tax as any).origin,
          vatAmount: (tax as any).vatAmount,
          totalTtc: (tax as any).totalTtc,
        },
      } as BoqLineDTO;

      const existingLine = existingLines.find(
        (line) =>
          (boqData.btpCode && line.btpCode === boqData.btpCode) ||
          (boqData.code && line.code === boqData.code),
      );

      try {
        if (existingLine?.id) {
          await this.retryWithBackoff(
            () => boqRepository.update(existingLine.id, boqData),
            `updateBoqLine ${existingLine.id}`,
          );
        } else {
          await this.retryWithBackoff(
            () => boqRepository.create(boqData),
            `createBoqLine ${boqData.code}`,
          );
        }
      } catch (err) {
        this.reportRelationIssue(`[upsertDqeLines] Échec pour "${boqData.code}":`, err);
      }
    }

    if (count) details.dqeLines += dqeLines.length;
  }

  // ===========================================================================
  // ✅ v5.2 : UPSERT STAKEHOLDER — RÈGLE ID APPLIQUÉE
  // ===========================================================================
  private async upsertStakeholder(
    projectId: string,
    stakeholder: ProjectImportStakeholder,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    organizations?: Map<string, string>,
    employees?: Map<string, string>,
  ): Promise<void> {
    // ---------------------------------------------------------------------------
    // 1. Résoudre external_ref (source de vérité pour la recherche)
    // ---------------------------------------------------------------------------
    const rawExternalRef = stakeholder.externalRef ?? stakeholder.id ?? null;

    const { externalRef: resolvedExternalRef } = await this.resolveIdAndExternalRef(
      rawExternalRef,
      rawExternalRef,
      { table: 'project_stakeholders', checkExists: true },
    );

    const externalRef =
      resolvedExternalRef ||
      `SH-${projectId}-${stakeholder.role ?? stakeholder.stakeholderType ?? 'na'}`;

    // ---------------------------------------------------------------------------
    // 2. Résoudre les FK (création auto si besoin)
    // ---------------------------------------------------------------------------
    let organizationId: string | undefined;
    let supplierId: string | undefined;
    let employeeId: string | undefined;

    try {
      organizationId = await this.ensureEntityExists('organization', stakeholder.organizationId, {
        projectId, role: stakeholder.role, organizations, suppliers, employees,
      });
    } catch (err) {
      console.warn(`[upsertStakeholder] organization non résolu pour ${externalRef}:`, err);
    }

    try {
      supplierId = await this.ensureEntityExists('supplier', stakeholder.supplierId, {
        projectId, role: stakeholder.role, organizations, suppliers, employees,
      });
    } catch (err) {
      console.warn(`[upsertStakeholder] supplier non résolu pour ${externalRef}:`, err);
    }

    try {
      employeeId = await this.ensureEntityExists('employee', stakeholder.employeeId, {
        projectId, role: stakeholder.role, organizations, suppliers, employees,
      });
    } catch (err) {
      console.warn(`[upsertStakeholder] employee non résolu pour ${externalRef}:`, err);
    }

    // ---------------------------------------------------------------------------
    // 3. Détection community
    // ---------------------------------------------------------------------------
    const isCommunity =
      !supplierId && !organizationId && !employeeId &&
      (stakeholder.stakeholderEntityType === 'community' ||
        stakeholder.role === 'communautes_locales' ||
        stakeholder.role === 'autorite_regionale' ||
        stakeholder.role === 'autorite_locale' ||
        !!stakeholder.communityType);

    // ---------------------------------------------------------------------------
    // 4. Déterminer l'entityType STRICTEMENT (en fonction des FK résolues)
    // ---------------------------------------------------------------------------
    let entityType: 'employee' | 'supplier' | 'organization' | 'community';
    let finalCommunityType: string | null = null;

    const hasEmployee = employeeId && this.isUUID(employeeId);
    const hasSupplier = supplierId && this.isUUID(supplierId);
    const hasOrganization = organizationId && this.isUUID(organizationId);

    if (hasEmployee) {
      entityType = 'employee';
    } else if (hasSupplier) {
      entityType = 'supplier';
    } else if (hasOrganization) {
      entityType = isCommunity ? 'community' : 'organization';
      if (isCommunity) finalCommunityType = stakeholder.communityType ?? 'communaute';
    } else {
      entityType = 'community';
      finalCommunityType = stakeholder.communityType ?? 'autre';

      console.warn(
        `[upsertStakeholder] ⚠️  Aucune FK résolue pour "${externalRef}" — fallback community (${finalCommunityType})`,
      );

      const communityName = stakeholder.roleDescription ?? stakeholder.role ?? `Communauté ${externalRef}`;
      const communityOrgId = await this.ensureStakeholderCommunityOrg(
        communityName,
        finalCommunityType,
        externalRef,
        organizations,
      );

      if (communityOrgId) organizationId = communityOrgId;
    }

    // ---------------------------------------------------------------------------
    // 5. Payload final
    // ---------------------------------------------------------------------------
    const stakeholderData = {
      project_id: projectId,
      external_ref: externalRef,
      stakeholder_type: stakeholder.stakeholderType ?? stakeholder.role ?? 'other',
      stakeholder_entity_type: entityType,
      organization_id:
        entityType === 'organization' || entityType === 'community'
          ? organizationId ?? null
          : null,
      supplier_id: entityType === 'supplier' ? supplierId ?? null : null,
      employee_id: entityType === 'employee' ? employeeId ?? null : null,
      community_type: finalCommunityType,
      role_description: [stakeholder.roleDescription ?? stakeholder.role]
        .filter(Boolean)
        .join(' - '),
      is_primary: stakeholder.isPrimary ?? false,
      metadata: {},
    };

    // ---------------------------------------------------------------------------
    // 6. Upsert MANUEL : SELECT → UPDATE ou INSERT
    //    ✅ RÈGLE : si `id` n'est pas un UUID valide → genuuid + externalRef
    // ---------------------------------------------------------------------------
    try {
      // 6.1 : chercher l'existant par external_ref
      const { data: existing, error: selectError } = await supabase
        .from('project_stakeholders')
        .select('id, external_ref')
        .eq('external_ref', externalRef)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn(`[upsertStakeholder] SELECT échoué pour ${externalRef}:`, selectError);
      }

      if (existing?.id) {
        // 6.2 : UPDATE — conserver l'id existant
        const { error: updateError } = await supabase
          .from('project_stakeholders')
          .update(stakeholderData as any)
          .eq('id', existing.id);

        if (updateError) throw updateError;

        console.log(
          `[upsertStakeholder] ♻️  Updated: ${externalRef} → ${existing.id} (${entityType})`,
        );
        details.stakeholders += 1;
      } else {
        // 6.3 : INSERT — appliquer la RÈGLE ID
        //       - id brut du JSON peut être un UUID (gardé) ou non-UUID (genuuid)
        const rawId = stakeholder.id; // id brut du JSON
        const { id: newId, externalRef: finalExternalRef } =
          await this.resolveIdAndExternalRef(
            rawId,
            externalRef,
            { table: 'project_stakeholders', checkExists: true },
          );

        const insertPayload = {
          ...stakeholderData,
          id: newId,
          external_ref: finalExternalRef ?? externalRef,
        };

        const { error: insertError } = await supabase
          .from('project_stakeholders')
          .insert(insertPayload as any);

        if (insertError) throw insertError;

        console.log(
          `[upsertStakeholder] ✅ Created: ${externalRef} → ${newId} (${entityType})`,
        );
        details.stakeholders += 1;
      }
    } catch (err) {
      const classification = this.classifyError(err);
      console.error(
        `[upsertStakeholder] ❌ Failed for "${externalRef}":`,
        classification.message,
      );
      console.error(
        `[upsertStakeholder] Payload rejeté : entityType=${entityType}, ` +
        `orgId=${organizationId ?? 'NULL'}, supId=${supplierId ?? 'NULL'}, ` +
        `empId=${employeeId ?? 'NULL'}, commType=${finalCommunityType ?? 'NULL'}`,
      );

      // Fallback FK violation → retry sans FK en community
      if (classification.isFKViolation) {
        try {
          console.warn(`[upsertStakeholder] FK violation — fallback community pour ${externalRef}`);
          const fallbackData = {
            ...stakeholderData,
            organization_id: null,
            supplier_id: null,
            employee_id: null,
            stakeholder_entity_type: 'community',
            community_type: finalCommunityType ?? 'autre',
          };

          const { data: existingRetry } = await supabase
            .from('project_stakeholders')
            .select('id')
            .eq('external_ref', externalRef)
            .maybeSingle();

          if (existingRetry?.id) {
            await supabase
              .from('project_stakeholders')
              .update(fallbackData as any)
              .eq('id', existingRetry.id);
          } else {
            const { id: fallbackId } = await this.resolveIdAndExternalRef(
              undefined,
              externalRef,
            );
            await supabase
              .from('project_stakeholders')
              .insert({ ...fallbackData, id: fallbackId } as any);
          }

          console.log(`[upsertStakeholder] ✅ ${externalRef} → fallback community`);
          details.stakeholders += 1;
          return;
        } catch (fallbackErr) {
          console.error(`[upsertStakeholder] Fallback échoué:`, fallbackErr);
        }
      }

      this.reportRelationIssue(
        `[importRelations] Stakeholder "${externalRef}" (${entityType}) : ${classification.message}`,
        err,
      );
    }
  }

  // ===========================================================================
  // MAIN IMPORT METHOD
  // ===========================================================================

  async importDataset(
    input: ProjectImportDataset | unknown,
    options: ImportOptions = {},
  ): Promise<ProjectImportResult> {
    const dataset = this.normalizeDataset(input, options);
    if (dataset.projects.length === 0) {
      throw new Error('Invalid import dataset: projects must be a non-empty array');
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
        generateMissingFromReferential: false,
        validateAgainstReferential: false,
        createMissingParents: true,
        maxRetries: 3,
        autoCreateMissingFK: true,
        deduplicateInput: true,
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
            phases: 0, milestones: 0, tasks: 0, dqeLines: 0,
            stakeholders: 0, employees: 0, organizations: 0, suppliers: 0,
          },
          changes: [],
        };
      }

      const references = await this.importDependencies(dataset, mergedOptions);

      const referentialWarnings: Array<{ row: number; title: string; message: string }> = [];
      if (mergedOptions.validateAgainstReferential) {
        for (let i = 0; i < dataset.projects.length; i++) {
          const row = dataset.projects[i];
          if (!row.referentialCode || !(row.phases ?? []).length) continue;
          const report = await this.validateRowAgainstReferential(row);
          if (report.length > 0) {
            referentialWarnings.push(
              ...report.map((msg) => ({ row: i + 1, title: row.title, message: msg })),
            );
          }
        }
      }

      this.relationIssues = [];
      const result = await this.importProjects(dataset.projects, references, mergedOptions);
      for (const message of this.relationIssues) {
        result.errors.push({ row: 0, title: 'Sous-objets', message });
      }
      this.relationIssues = [];

      if (referentialWarnings.length > 0) {
        result.errors.push(...referentialWarnings);
      }

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

  async importProjects(
    rows: ProjectImportRow[],
    references: {
      organizations?: Map<string, string>;
      suppliers?: Map<string, string>;
      employees?: Map<string, string>;
    } = {},
    options: ImportOptions = {},
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

    rows = rows.map((row) => this.normalizeImportRow(row));
    result.total = rows.length;

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
        const existing = this.findExistingProject(
          existingProjects,
          externalRef,
          row.projectReference || row.reference,
          row.title,
        );
        const rowMode = row.importMode || mode;
        const operation = this.determineOperation(existing, rowMode);

        let project: ProjectDTO;

        switch (operation) {
          case 'skip':
            result.skipped += 1;
            continue;

          case 'create': {
            const dto = await this.mapImportRowToCreateDTO(row, references.organizations);
            project = await this.retryWithBackoff(
              () => this.projectService.createProject(dto),
              `createProject ${dto.title}`,
            );
            result.imported += 1;
            break;
          }

          case 'update_full': {
            const updateFullDto = await this.mapImportRowToCreateDTO(row, references.organizations);
            project = await this.retryWithBackoff(
              () => this.projectService.updateProject(existing!.id, updateFullDto as never),
              `updateProject ${existing!.id}`,
            );
            result.imported += 1;
            break;
          }

          case 'update_partial': {
            const updatePartialDto = this.mapPartialUpdateDTO(row, references.organizations);
            project = await this.retryWithBackoff(
              () => this.projectService.updateProject(existing!.id, updatePartialDto as never),
              `updatePartialProject ${existing!.id}`,
            );
            result.imported += 1;
            break;
          }

          case 'merge': {
            const mergeDto = this.mapMergeDTO(row, existing!, references.organizations);
            project = await this.retryWithBackoff(
              () => this.projectService.updateProject(existing!.id, mergeDto as never),
              `mergeProject ${existing!.id}`,
            );
            result.imported += 1;
            break;
          }

          default: {
            const upsertDto = await this.mapImportRowToCreateDTO(row, references.organizations);
            project = existing
              ? await this.retryWithBackoff(
                  () => this.projectService.updateProject(existing.id, upsertDto as never),
                  `upsertProject ${existing.id}`,
                )
              : await this.retryWithBackoff(
                  () => this.projectService.createProject(upsertDto),
                  `createProject ${upsertDto.title}`,
                );
            result.imported += 1;
          }
        }

        if (project?.id) {
          result.createdIds.push(project.id);

          await this.importRelations(
            project.id,
            row,
            result.details,
            references.suppliers,
            references.organizations,
            references.employees,
            options,
            result.changes,
          );
        }

        const existingIndex = existingProjects.findIndex(
          (candidate) => candidate.id === project.id,
        );
        if (existingIndex >= 0) existingProjects[existingIndex] = project;
        else existingProjects.push(project);
      } catch (e) {
        console.error('[importProjects] Error on row', i + 1, ':', e);
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
  // VALIDATION
  // ===========================================================================

  validateImportRows(
    rows: ProjectImportRow[],
  ): Array<{ row: number; title: string; message: string }> {
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

      if (
        !row.location?.trim() &&
        !row.interventionZone?.address &&
        !row.interventionZones?.length
      ) {
        errors.push({ row: index + 1, title, message: 'Missing location or intervention zone' });
      }

      (row.phases ?? []).forEach((phase, phaseIndex) => {
        if (!phase.name?.trim()) {
          errors.push({
            row: index + 1,
            title,
            message: `Phase ${phaseIndex + 1} is missing a name`,
          });
        }
      });

      const allTasks = [
        ...(row.tasks ?? []),
        ...(row.phases ?? []).flatMap((p) => p.tasks ?? []),
      ];
      allTasks.forEach((task, taskIndex) => {
        const resolvedTitle = this.resolveTaskTitle(task);
        if (!resolvedTitle) {
          errors.push({
            row: index + 1,
            title,
            message: `Task ${taskIndex + 1} is missing title/name/label`,
          });
        }
      });
    });

    return errors;
  }

  private async validateRowAgainstReferential(row: ProjectImportRow): Promise<string[]> {
    const referentialCode = row.referentialCode;
    if (!referentialCode) return [];

    const messages: string[] = [];

    try {
      const { getReferential } = await import('@/config/referentials');
      const referential = getReferential(referentialCode as never) as
        | { phases?: Array<{ code?: string; id?: string }> }
        | null
        | undefined;

      if (!referential) {
        messages.push(`Référentiel "${referentialCode}" introuvable — validation ignorée.`);
        return messages;
      }

      const templateCodes = new Set(
        (referential.phases ?? [])
          .map((p) => p.code ?? p.id)
          .filter((c): c is string => !!c),
      );
      const jsonCodes = new Set(
        (row.phases ?? []).map((p) => p.code).filter((c): c is string => !!c),
      );

      const unknown = [...jsonCodes].filter((c) => !templateCodes.has(c));
      const missing = [...templateCodes].filter((c) => !jsonCodes.has(c));

      if (unknown.length > 0) {
        messages.push(
          `Phases inconnues du référentiel "${referentialCode}": ${unknown.join(', ')}`,
        );
      }
      if (missing.length > 0 && jsonCodes.size > 0) {
        messages.push(
          `Phases standard manquantes pour "${referentialCode}": ${missing.join(', ')}`,
        );
      }
    } catch (err) {
      messages.push(
        `Validation référentielle impossible pour "${referentialCode}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return messages;
  }

  // ===========================================================================
  // IMPORT DEPENDENCIES
  // ===========================================================================

  private async importDependencies(
    dataset: ProjectImportDataset,
    options: ImportOptions,
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
    options: ImportOptions,
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.organizationService.list();

    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;

      const { id: resolvedId, externalRef: resolvedExternalRef } =
        await this.resolveIdAndExternalRef(row.id, row.id, {
          table: 'organizations',
          checkExists: true,
        });

      const strategy = options.organizationResolution || 'both';
      const current = existing.find((org) => {
        if (this.isUUID(row.id) && org.id === row.id) return true;
        if (strategy === 'externalRef' || strategy === 'both') {
          if (resolvedExternalRef && (org as any).externalRef === resolvedExternalRef) return true;
          if (row.id && (org as any).externalRef === row.id) return true;
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
        externalRef: resolvedExternalRef,
      };

      let organization;
      try {
        organization = current
          ? await this.retryWithBackoff(
              () => this.organizationService.update(current.id, payload),
              `updateOrg ${current.id}`,
            )
          : await this.retryWithBackoff(
              () => this.organizationService.upsert({ ...payload, id: resolvedId }),
              `upsertOrg ${row.name}`,
            );
      } catch (err) {
        console.error(`[importOrganizations] Échec pour "${row.name}":`, err);
        continue;
      }

      references.set(row.id, organization.id);
      if (resolvedExternalRef && resolvedExternalRef !== row.id) {
        references.set(resolvedExternalRef, organization.id);
      }

      const existingIndex = existing.findIndex(
        (candidate) => candidate.id === organization.id,
      );
      if (existingIndex >= 0) existing[existingIndex] = organization;
      else existing.push(organization);
    }

    return references;
  }

  private async importSuppliers(
    rows: ProjectImportSupplier[],
    options: ImportOptions,
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.supplierService.getAllSuppliers();
    const supplierRepository = RepositoryFactory.getSupplierRepository();

    for (const row of rows) {
      if (!row.id || !row.name?.trim()) continue;

      const { id: resolvedId, externalRef: resolvedExternalRef } =
        await this.resolveIdAndExternalRef(row.id, row.id, {
          table: 'suppliers',
          checkExists: true,
        });

      const strategy = options.supplierResolution || 'both';
      const current =
        (await supplierRepository.findByExternalRef(row.id)) ??
        existing.find((supplier) => {
          if (this.isUUID(row.id) && supplier.id === row.id) return true;
          if (strategy === 'externalRef' || strategy === 'both') {
            if (resolvedExternalRef && supplier.externalRef === resolvedExternalRef) return true;
            if (row.id && supplier.externalRef === row.id) return true;
          }
          if (strategy === 'name' || strategy === 'both') {
            if (supplier.name?.trim().toLowerCase() === row.name.trim().toLowerCase())
              return true;
          }
          if (row.contactEmail && supplier.email === row.contactEmail) return true;
          if (row.nif && supplier.nif === row.nif) return true;
          return false;
        });

      const rating =
        row.rating == null
          ? undefined
          : {
              quality: row.rating,
              delivery: row.rating,
              price: row.rating,
              communication: row.rating,
              overall: row.rating,
            };

      let supplier;
      try {
        supplier = current
          ? await this.retryWithBackoff(
              () =>
                this.supplierService.updateSupplier(current.id, {
                  name: row.name.trim(),
                  email: row.contactEmail,
                  phone: row.contactPhone,
                  address: row.address,
                  nif: row.nif,
                  rating,
                  status: row.isActive === false ? 'inactive' : 'active',
                  externalRef: resolvedExternalRef,
                }),
              `updateSupplier ${current.id}`,
            )
          : await this.retryWithBackoff(
              () =>
                this.supplierService.createSupplier({
                  id: resolvedId,
                  name: row.name.trim(),
                  email: row.contactEmail,
                  phone: row.contactPhone,
                  address: row.address,
                  nif: row.nif,
                  rating,
                  status: row.isActive === false ? 'inactive' : 'active',
                  externalRef: resolvedExternalRef,
                } as any),
              `createSupplier ${row.name}`,
            );
      } catch (err) {
        console.error(`[importSuppliers] Échec pour "${row.name}":`, err);
        continue;
      }

      references.set(row.id, supplier.id);
      if (resolvedExternalRef && resolvedExternalRef !== row.id) {
        references.set(resolvedExternalRef, supplier.id);
      }

      existing.push(supplier);
    }

    return references;
  }

  private async importEmployees(
    rows: ProjectImportEmployee[],
    options: ImportOptions,
  ): Promise<Map<string, string>> {
    const references = new Map<string, string>();
    const existing = await this.employeeService.getAllEmployees();

    for (const row of rows) {
      if (!row.id || !row.email?.trim()) continue;

      const { id: resolvedId, externalRef: resolvedExternalRef } =
        await this.resolveIdAndExternalRef(row.id, row.id, {
          table: 'employees',
          checkExists: true,
        });

      const strategy = options.employeeResolution || 'both';
      const current = existing.find((emp) => {
        if (this.isUUID(row.id) && emp.id === row.id) return true;
        if (strategy === 'email' || strategy === 'both') {
          if (emp.email?.toLowerCase() === row.email.toLowerCase()) return true;
        }
        if (strategy === 'externalRef' || strategy === 'both') {
          if (resolvedExternalRef && emp.externalRef === resolvedExternalRef) return true;
          if (row.id && emp.externalRef === row.id) return true;
          if (row.employeeId && emp.employeeId === row.employeeId) return true;
        }
        return false;
      });

      const employeeData = {
        id: resolvedId,
        employeeId: row.employeeId || row.id || `EMP${Date.now().toString().slice(-6)}`,
        email: row.email,
        fullName: row.fullName || row.firstName || row.email.split('@')[0],
        firstName:
          row.firstName || (row.fullName || '').split(' ')[0] || row.email.split('@')[0],
        lastName:
          row.lastName || (row.fullName || '').split(' ').slice(1).join(' ') || '-',
        phone: row.phone,
        position: row.position,
        department: row.department as any,
        role: (row.role as any) || 'employee',
        type: (row.type as any) || 'internal',
        skills: row.skills || [],
        certifications: row.certifications || [],
        isActive: row.isActive !== false,
        externalRef: resolvedExternalRef,
      };

      let employee;
      try {
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
          if (resolvedExternalRef) updates.externalRef = resolvedExternalRef;

          if (Object.keys(updates).length > 0) {
            employee = await this.retryWithBackoff(
              () => this.employeeService.updateEmployee(current.id, updates),
              `updateEmployee ${current.id}`,
            );
          } else {
            employee = current;
          }
        } else {
          employee = await this.retryWithBackoff(
            () =>
              this.employeeService.createEmployee({
                status: EmployeeStatus.ACTIVE,
                ...employeeData,
              } as any),
            `createEmployee ${row.email}`,
          );
        }
      } catch (err) {
        console.error(`[importEmployees] Échec pour "${row.email}":`, err);
        continue;
      }

      references.set(row.id, employee.id);
      if (resolvedExternalRef && resolvedExternalRef !== row.id) {
        references.set(resolvedExternalRef, employee.id);
      }
    }

    return references;
  }

  // ===========================================================================
  // PARTIAL UPDATE / MERGE / FIND / DETERMINE
  // ===========================================================================

  private mapPartialUpdateDTO(
    row: ProjectImportRow,
    organizations?: Map<string, string>,
  ): Partial<CreateProjectDTO> {
    const dto: Partial<CreateProjectDTO> = {};
    const ignoredFields = [
      'externalRef',
      'id',
      'reference',
      'projectReference',
      'timeline',
      'type',
      'importMode',
    ];
    const fields = Object.keys(row).filter((key) => !ignoredFields.includes(key));

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
          case 'organizationId': dto.organizationId = organizations?.get(value) || value; break;
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

  private mapMergeDTO(
    row: ProjectImportRow,
    existing: ProjectDTO,
    organizations?: Map<string, string>,
  ): Partial<CreateProjectDTO> {
    const dto: Partial<CreateProjectDTO> = {};
    const fields = [
      'title', 'description', 'status', 'progress', 'budget', 'currency',
      'startDate', 'endDate', 'location', 'teamSize', 'financingSource',
      'marketType', 'selectionMode', 'projectType', 'referentialCode',
      'sector', 'priority', 'mainContractor', 'engineeringConsultant',
      'clientName', 'donorOrganization', 'areaSqm',
    ];

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

  private findExistingProject(
    projects: ProjectDTO[],
    externalRef?: string,
    reference?: string,
    title?: string,
  ): ProjectDTO | null {
    return (
      projects.find((project) => {
        const candidate = project as ProjectDTO & { reference?: string };
        return (
          (externalRef && candidate.externalRef === externalRef) ||
          (reference && candidate.projectReference === reference) ||
          (reference && candidate.reference === reference) ||
          (title && candidate.title?.trim().toLowerCase() === title.trim().toLowerCase())
        );
      }) ?? null
    );
  }

  private determineOperation(
    existing: ProjectDTO | null,
    mode: string,
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

  private async validateDataset(
    dataset: ProjectImportDataset,
    options: ImportOptions,
  ): Promise<{
    errors: Array<{ row: number; title: string; message: string }>;
    warnings: string[];
  }> {
    const errors: Array<{ row: number; title: string; message: string }> = [];
    const warnings: string[] = [];

    for (let i = 0; i < dataset.projects.length; i++) {
      const row = dataset.projects[i];
      const rowNum = i + 1;

      if (!row.title?.trim()) {
        errors.push({ row: rowNum, title: '(empty)', message: 'Le titre du projet est requis' });
      }

      if (
        !row.location?.trim() &&
        !row.interventionZone?.address &&
        !row.interventionZones?.length
      ) {
        errors.push({
          row: rowNum,
          title: row.title || '(empty)',
          message: 'La localisation est requise',
        });
      }

      if (row.organizationId) {
        const orgExists = dataset.organizations?.some((o) => o.id === row.organizationId);
        if (!orgExists) {
          warnings.push(
            `L'organisation "${row.organizationId}" référencée dans le projet "${row.title}" n'existe pas`,
          );
        }
      }

      if (row.phases) {
        for (let p = 0; p < row.phases.length; p++) {
          if (!row.phases[p].name?.trim()) {
            errors.push({
              row: rowNum,
              title: row.title || '(empty)',
              message: `Phase ${p + 1}: nom requis`,
            });
          }
        }
      }
    }

    if (dataset.employees) {
      const emails = new Set<string>();
      for (const emp of dataset.employees) {
        if (!emp.email?.trim()) {
          errors.push({
            row: 0,
            title: 'Employee',
            message: `L'email est requis pour l'employé ${emp.id || 'sans ID'}`,
          });
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
    const selected = opts.ids?.length ? all.filter((p) => opts.ids!.includes(p.id)) : all;

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

  private async toExportRowWithRelations(
    p: ProjectDTO,
    includeZone: boolean,
  ): Promise<Record<string, unknown>> {
    const base = this.toExportRow(p, includeZone);
    const [phases, stakeholders] = await Promise.all([
      this.phaseService.getPhasesByProject(p.id),
      this.stakeholderService.getProjectStakeholders(p.id),
    ]);
    const phaseRows = await Promise.all(
      phases.map(async (phase) => ({
        ...phase,
        milestones: await this.milestoneService.getPhaseMilestones(p.id, phase.id),
        tasks: await this.taskAssignmentService.getByPhase(phase.id),
        dqeLines: await boqRepository.list({
          source: 'dqe',
          contextId: p.id,
          projectId: p.id,
          phaseId: phase.id,
        }),
      })),
    );
    const dqeLines = phaseRows.flatMap((phase) => phase.dqeLines as BoqLineDTO[]);
    const projectMilestones = await this.milestoneService.getMilestonesByProject(p.id);
    return {
      ...base,
      phases: phaseRows,
      dqeLines,
      stakeholders,
      milestones: projectMilestones,
    };
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
    const zones =
      p.interventionZones && p.interventionZones.length > 0
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

  private computeDurationFromDates(start?: string, end?: string): number | undefined {
    if (!start || !end) return undefined;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(ms) || ms <= 0) return undefined;
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  private sumTaskDurations(tasks?: ProjectImportTask[]): number | undefined {
    if (!tasks?.length) return undefined;
    const total = tasks.reduce((sum, t) => {
      const days = (t as { estimatedDurationDays?: number }).estimatedDurationDays;
      if (typeof days === 'number' && days > 0) return sum + days;
      if (typeof t.estimatedHours === 'number' && t.estimatedHours > 0) {
        return sum + t.estimatedHours / 8;
      }
      return sum;
    }, 0);
    return total > 0 ? Math.round(total) : undefined;
  }

  private sumStepDurations(
    steps?: Array<{ tasks?: ProjectImportTask[] }>,
  ): number | undefined {
    if (!steps?.length) return undefined;
    const total = steps.reduce(
      (sum, s) => sum + (this.sumTaskDurations(s.tasks) ?? 0),
      0,
    );
    return total > 0 ? Math.round(total) : undefined;
  }
}

export default ProjectImportExportService;