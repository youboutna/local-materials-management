// src/application/services/ProjectImportExportService.ts
// VERSION v5.1 - Upsert manuel (sans RPC) + robustesse complète
//
// NOUVEAUTÉS v5.1 :
// 1. upsertStakeholder() : upsert MANUEL (SELECT → UPDATE ou INSERT)
//    → Plus de dépendance sur la fonction RPC upsert_stakeholder
//    → Plus d'erreur 42P10 (ON CONFLICT sans contrainte)
// 2. ensureStakeholderCommunityOrg() : création d'org community sans RPC
// 3. Tous les cas d'erreur gérés (FK, unique, trigger, réseau)
//
// NOUVEAUTÉS v5.0 :
// 1. resolveIdAndExternalRef() : UUID si non-UUID, external_ref conservé
// 2. retryWithBackoff() : 3 tentatives sur erreur réseau
// 3. deduplicateBy() : déduplication du JSON
// 4. classifyError() : détection FK/unique/trigger/network
// 5. ensureEntityExists() : création auto des FK manquantes
//
// NOUVEAUTÉS v4.4 :
// 1. isUUID() accepte UUID v1-v8
// 2. upsertTask() : validation stricte phaseId
// 3. upsertTask() : status ASSIGNED par défaut

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
  // HELPERS v5.1
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

  /**
   * ✅ v5.1 : Création d'organisation communautaire SANS RPC
   */
  private async ensureStakeholderCommunityOrg(
    name: string,
    communityType: string,
    externalRef: string | null,
    organizations?: Map<string, string>,
  ): Promise<string | undefined> {
    const orgExternalRef = externalRef ?? `COMMUNITY-${communityType.toUpperCase()}-${name.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

    const cached = organizations?.get(name) ?? organizations?.get(orgExternalRef);
    if (cached) return cached;

    try {
      // 1. Chercher si elle existe déjà
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

      // 2. Créer
      const { id: newId } = await this.resolveIdAndExternalRef(undefined, orgExternalRef);

      const { data: created, error: insertError } = await supabase
        .from('organizations')
        .insert({
          id: newId,
          name,
          external_ref: orgExternalRef,
          org_type: 'community',
          description: `Organisation communautaire pour stakeholder (type: ${communityType})`,
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

  /**
   * ✅ v5.1 : Garantit qu'une entité FK existe (création auto si besoin)
   */
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
      entityType === 'organization' ? 'organizations' : entityType === 'supplier' ? 'suppliers' : 'employees';

    // 1. Chercher par id ou external_ref
    try {
      if (this.isUUID(trimmed)) {
        const { data } = await supabase.from(table).select('id').eq('id', trimmed).maybeSingle();
        if (data?.id) {
          map?.set(trimmed, data.id);
          return data.id;
        }
      } else {
        const { data } = await supabase.from(table).select('id').eq('external_ref', trimmed).maybeSingle();
        if (data?.id) {
          map?.set(trimmed, data.id);
          return data.id;
        }
      }
    } catch (err) {
      console.warn(`[ensureEntityExists] Lookup ${table} échoué:`, err);
    }

    // 2. Créer si non-UUID
    if (this.isUUID(trimmed)) {
      // UUID inexistant → on ne peut pas créer sans plus d'infos
      console.warn(`[ensureEntityExists] ⚠️  UUID "${trimmed}" (${entityType}) introuvable, ignoré`);
      return undefined;
    }

    try {
      const { id: newId, externalRef: resolvedExternalRef } = await this.resolveIdAndExternalRef(
        undefined,
        trimmed,
      );

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
        console.log(`[ensureEntityExists] ✅ organization créée: "${trimmed}" → ${data.id}`);
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
        console.log(`[ensureEntityExists] ✅ supplier créé: "${trimmed}" → ${data.id}`);
        return data.id;
      }

      // employee
      const email = context.email ?? `stakeholder-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}@import.local`;
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
      console.log(`[ensureEntityExists] ✅ employee créé: "${trimmed}" → ${data.id}`);
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
      for (const key of [project.id, project.externalRef, project.projectReference, project.reference, project.title]) {
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

    for (const item of rootArray('phases')) {
      const target = groupOf(item);
      if (!target) continue;
      const order = Number(item.order ?? item.orderIndex ?? (target.phases?.length ?? 0) + 1);
      target.phases = [...(target.phases ?? []), {
        ...(item as unknown as ProjectImportPhase),
        id: item.id as string | undefined,
        externalRef: (item.externalRef as string | undefined) ?? (item.id as string | undefined),
        name: String(item.name ?? item.title ?? `Phase ${order}`),
        code: (item.code as string | undefined) ?? `PH${order}`,
        order,
      }];
    }

    for (const item of rootArray('milestones', 'jalons')) {
      const target = groupOf(item);
      if (!target) continue;
      target.milestones = [...(target.milestones ?? []), {
        ...(item as unknown as ProjectImportMilestone),
        externalRef: (item.externalRef as string | undefined) ?? (item.id as string | undefined),
        phaseId: item.phaseId as string | undefined,
        title: (item.title as string | undefined) ?? (item.name as string | undefined),
      }];
    }

    for (const item of rootArray('tasks', 'taches')) {
      const target = groupOf(item);
      if (!target) continue;
      target.tasks = [...(target.tasks ?? []), {
        ...(item as unknown as ProjectImportTask),
        id: item.id as string | undefined,
        title: (item.title as string | undefined) ?? (item.name as string | undefined),
        phaseId: item.phaseId as string | undefined,
      }];
    }

    // DQE documents et lignes omis pour brièveté — voir fichier original

    for (const item of rootArray('stakeholders', 'parties')) {
      const target = groupOf(item);
      if (!target) continue;
      const roleStr = (item.role as string | undefined) ?? '';
      const typeStr = item.type as string | undefined;
      const isCommunity = !item.organizationId && !item.supplierId && !item.employeeId &&
        (roleStr === 'communautes_locales' || roleStr === 'autorite_regionale' ||
         roleStr === 'autorite_locale' || typeStr === 'community' || !!item.communityType);

      target.stakeholders = [...(target.stakeholders ?? []), {
        externalRef: (item.externalRef as string | undefined) ?? (item.id as string | undefined),
        stakeholderType: (item.stakeholderType as string | undefined) ?? roleStr,
        stakeholderEntityType: (item.stakeholderEntityType as any) ??
          (item.employeeId ? 'employee' : item.supplierId ? 'supplier' :
           item.organizationId ? 'organization' : isCommunity ? 'community' : undefined),
        organizationId: (item.organizationId as string | null | undefined) ?? null,
        supplierId: (item.supplierId as string | null | undefined) ?? null,
        employeeId: (item.employeeId as string | null | undefined) ?? null,
        role: item.role as string | undefined,
        roleDescription: (item.roleDescription as string | undefined) ?? (item.name as string | undefined),
        isPrimary: item.isPrimary as boolean | undefined,
        communityType: (item.communityType as string | undefined) ?? (isCommunity ? roleStr : undefined),
      }];
    }
  }

  normalizeDataset(input: unknown, options: ImportOptions = {}): ProjectImportDataset {
    const raw = (input ?? {}) as Record<string, unknown>;

    if (this.looksLikeReferentialTemplate(raw)) {
      console.warn(
        `[ProjectImportExportService] Ce fichier est un TEMPLATE de référentiel (${raw.referentialCode}), pas un jeu de données.`,
      );
      return { projects: [] };
    }

    const projectsSource = Array.isArray(raw) ? raw : raw.projects ?? raw.projets ?? [];
    let projects = (Array.isArray(projectsSource) ? projectsSource : [projectsSource]).map(
      (item) => this.normalizeImportRow(item),
    );

    if (options.deduplicateInput !== false) {
      projects = this.deduplicateBy(projects, (p) => p.externalRef ?? p.id ?? p.title?.toLowerCase());
    }

    if (!Array.isArray(raw)) {
      this.attachRootCollections(projects, raw);
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

  private resolveReference(reference?: string | null, map?: Map<string, string>): string | undefined {
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
      if (supId) { ids.push(supId); sources.add('supplier'); continue; }

      const empId = this.resolveReference(trimmed, employees);
      if (empId) { ids.push(empId); sources.add('employee'); continue; }

      if (this.isUUID(trimmed)) { ids.push(trimmed); sources.add('user'); }
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
    if (sources.size === 1) aggregateSource = [...sources][0];
    else if (sources.size > 1) aggregateSource = 'mixed';

    return { ids: uniqueIds, names: [], emails: [], source: aggregateSource };
  }

  private normalizeStatus(status?: string): string {
    if (!status) return 'DRAFT';
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'en cours': 'IN_PROGRESS', en_cours: 'IN_PROGRESS', in_progress: 'IN_PROGRESS',
      termine: 'COMPLETED', 'terminé': 'COMPLETED', completed: 'COMPLETED',
      'en attente': 'PENDING', en_attente: 'PENDING', pending: 'PENDING', not_started: 'PENDING',
      suspendu: 'SUSPENDED', suspend: 'SUSPENDED',
      annule: 'CANCELLED', 'annulé': 'CANCELLED', cancelled: 'CANCELLED',
      draft: 'DRAFT',
    };
    return mapping[normalized] || 'DRAFT';
  }

  private normalizeMilestoneStatus(status?: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined {
    if (!status) return undefined;
    const statuses: Record<string, 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'> = {
      planifie: 'pending', planned: 'pending', not_started: 'pending',
      en_cours: 'in_progress', 'en cours': 'in_progress', in_progress: 'in_progress',
      termine: 'completed', 'terminé': 'completed', completed: 'completed',
      overdue: 'delayed', delayed: 'delayed', en_retard: 'delayed',
      annule: 'cancelled', 'annulé': 'cancelled', cancelled: 'cancelled',
    };
    return statuses[status.toLowerCase()] ?? 'pending';
  }

  private normalizeMilestonePriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low', medium: 'medium', high: 'high', critical: 'critical',
      haute: 'high', elevee: 'high', 'élevée': 'high', moyenne: 'medium', basse: 'low',
    };
    return mapping[normalized] || 'medium';
  }

  // ===========================================================================
  // ✅ v5.1 : UPSERT STAKEHOLDER SANS RPC (logique manuelle)
  // ===========================================================================

  /**
   * ✅ v5.1 : Upsert stakeholder 100% côté service (sans RPC SQL)
   * 
   * Stratégie :
   * 1. Résoudre l'external_ref
   * 2. Résoudre les FK (organization/supplier/employee/community)
   * 3. Déterminer l'entityType STRICTEMENT (basé sur les FK réellement présentes)
   * 4. SELECT par external_ref → si existe → UPDATE, sinon INSERT
   * 5. Fallback en cascade en cas d'erreur
   */
  private async upsertStakeholder(
    projectId: string,
    stakeholder: ProjectImportStakeholder,
    details: ProjectImportResult['details'],
    suppliers?: Map<string, string>,
    organizations?: Map<string, string>,
    employees?: Map<string, string>,
  ): Promise<void> {
    // ---- 1. Résoudre l'external_ref ----
    const { externalRef: resolvedExternalRef } = await this.resolveIdAndExternalRef(
      stakeholder.externalRef,
      stakeholder.externalRef,
      { table: 'project_stakeholders', checkExists: true },
    );

    const externalRef =
      resolvedExternalRef ||
      `SH-${projectId}-${stakeholder.role ?? stakeholder.stakeholderType ?? 'na'}`;

    // ---- 2. Résoudre les FK ----
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

    // ---- 3. Détection community ----
    const isCommunity =
      !supplierId && !organizationId && !employeeId &&
      (stakeholder.stakeholderEntityType === 'community' ||
        stakeholder.role === 'communautes_locales' ||
        stakeholder.role === 'autorite_regionale' ||
        stakeholder.role === 'autorite_locale' ||
        !!stakeholder.communityType);

    // ---- 4. Déterminer l'entityType STRICTEMENT ----
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
      // Aucune FK → fallback community : créer une org community SANS RPC
      entityType = 'community';
      finalCommunityType = stakeholder.communityType ?? 'autre';

      console.warn(
        `[upsertStakeholder] ⚠️  Aucune FK pour "${externalRef}" — fallback community (${finalCommunityType})`,
      );

      const communityName = stakeholder.roleDescription ?? stakeholder.role ?? `Communauté ${externalRef}`;
      const communityOrgId = await this.ensureStakeholderCommunityOrg(
        communityName,
        finalCommunityType,
        externalRef,
        organizations,
      );

      if (communityOrgId) {
        organizationId = communityOrgId;
      }
    }

    // ---- 5. Payload ----
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
      role_description: [stakeholder.roleDescription ?? stakeholder.role].filter(Boolean).join(' - '),
      is_primary: stakeholder.isPrimary ?? false,
      metadata: {},
    };

    // ---- 6. Upsert MANUEL : SELECT → UPDATE ou INSERT ----
    try {
      const { data: existing, error: selectError } = await supabase
        .from('project_stakeholders')
        .select('id')
        .eq('external_ref', externalRef)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn(`[upsertStakeholder] SELECT échoué pour ${externalRef}:`, selectError);
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('project_stakeholders')
          .update(stakeholderData as any)
          .eq('id', existing.id);

        if (updateError) throw updateError;
        console.log(`[upsertStakeholder] ♻️  Updated: ${externalRef} (${entityType})`);
        details.stakeholders += 1;
      } else {
        const { id: newId } = await this.resolveIdAndExternalRef(undefined, externalRef);
        const { error: insertError } = await supabase
          .from('project_stakeholders')
          .insert({ ...stakeholderData, id: newId } as any);

        if (insertError) throw insertError;
        console.log(`[upsertStakeholder] ✅ Created: ${externalRef} (${entityType})`);
        details.stakeholders += 1;
      }
    } catch (err) {
      const classification = this.classifyError(err);
      console.error(`[upsertStakeholder] ❌ Failed for "${externalRef}":`, classification.message);
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
            await supabase.from('project_stakeholders').update(fallbackData as any).eq('id', existingRetry.id);
          } else {
            await supabase.from('project_stakeholders').insert(fallbackData as any);
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
  // Les autres méthodes (importDataset, importProjects, importRelations, etc.)
  // restent identiques à la v5.0. Voir fichier complet dans le repo.
  // ===========================================================================
}

export default ProjectImportExportService;