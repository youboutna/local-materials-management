/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformations between Phase domain entities and PhaseDTO
 * Following hexagonal architecture principles
 */

import { Phase, PhaseStep, PhaseTask, PhaseResources, PhaseStatus, PhaseType, PhasePriority } from '@/domain/entities/Phase';
import { 
  PhaseDTO, 
  PhaseStepDTO,
  PhaseTaskDTO,
  PhaseStatus as DTOStatus,
  PhaseType as DTOType,
  PhasePriority as DTOPriority
} from '@/dtos/entities/PhaseDTO';

export class PhaseTransformer {
  // =================== DB Row (snake_case) → Domain Entity ===================

  /**
   * Map a raw Supabase row (snake_case columns of `project_phases`) to a Phase entity.
   * Safely parses JSON-as-string columns (milestones, dependencies, materials, ...).
   */
  static fromDB(row: any): Phase {
    if (!row) return null as any;

    const safeJson = (val: unknown, fallback: any = null) => {
      if (val == null) return fallback;
      if (typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch { return fallback; }
    };

    const customPhaseData = row.custom_phase_data && typeof row.custom_phase_data === 'object'
      ? row.custom_phase_data as Record<string, unknown>
      : {};

    return Phase.create({
      id: row.id,
      projectId: row.project_id,
      phaseName: row.phase_name || row.name || '',
      customPhaseData: {
        ...customPhaseData,
        ...(row.phase_code ? { phaseCode: row.phase_code } : {}),
      },
      description: row.description ?? null,
      status: row.status || 'pending',
      progress: row.progress ?? 0,
      orderIndex: row.order_index ?? 0,
      phaseType: row.phase_type || row.construction_phase || '',
      startDate: row.start_date ?? null,
      endDate: row.end_date ?? null,
      estimatedDuration: row.estimated_duration ?? null,
      actualDuration: row.actual_duration ?? null,
      estimatedCost: row.estimated_cost ?? null,
      actualCost: row.actual_cost ?? null,
      constructionPhase: row.construction_phase ?? null,
      constructionStage: row.construction_stage ?? null,
      dependencies: safeJson(row.dependencies, []),
      milestones: safeJson(row.milestones, []),
      humanResources: safeJson(row.human_resources, null),
      materials: safeJson(row.materials, []),
      suppliers: safeJson(row.suppliers, []),
      location: row.location ?? null,
      notes: row.notes ?? null,
      weight: row.weight ?? 0.1,
      createdBy: row.created_by ?? null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    });
  }

  /** Backwards-compat alias used by adapters that historically called fromDTO on a DB row. */
  static fromDTO(row: any): Phase {
    return this.fromDB(row);
  }

  // =================== Domain to DTO ===================

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: PhaseDTO[]): Phase[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(phases: Phase[]): PhaseDTO[] {
    return phases.map(phase => this.toDTO(phase));
  }

  static toDTO(phase: Phase): PhaseDTO {
    // Map phaseType (snake_case DB value) to DTO type enum value; fallback to 'execution'
    const rawType = (phase.phaseType || phase.constructionPhase || '').toString();
    const mappedType = (PhaseTransformer.validatePhaseType(rawType) as unknown) as DTOType;
    return {
      id: phase.id,
      projectId: phase.projectId,
      name: phase.phaseName,
      phaseCode: (phase.customPhaseData as { phaseCode?: string } | null)?.phaseCode,
      description: phase.description || '',
      status: phase.status as DTOStatus,
      progress: phase.progress || 0,
      orderIndex: phase.orderIndex || 0,
      startDate: phase.startDate || '',
      endDate: phase.endDate || '',
      estimatedDuration: phase.estimatedDuration || 0,
      actualDuration: phase.actualDuration || 0,
      estimatedCost: phase.estimatedCost || 0,
      actualCost: phase.actualCost || 0,
      type: mappedType || ('execution' as DTOType),
      priority: 'medium' as DTOPriority, // Priority not persisted yet in project_phases
      dependencies: phase.dependencies || [],
      milestones: [], // Hydratés par MilestoneService (workflow projet)
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,

      // Additional database fields surfaced in DTO
      constructionPhase: phase.constructionPhase || undefined,
      constructionStage: phase.constructionStage || undefined,
      createdBy: phase.createdBy || undefined,
      customPhaseData: phase.customPhaseData ?? undefined,
      humanResources: phase.humanResources ? (phase.humanResources as unknown as Record<string, unknown>) : undefined,
      weight: phase.weight || undefined,
    };
  }

  // =================== Domain Entity → DB Row (snake_case) ===================
  /**
   * Centralized mapping Phase → project_phases row (snake_case).
   * Use from adapters' insert/update calls to guarantee round-trip parity.
   */
  static toDB(phase: Partial<Phase> & Record<string, any>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const set = (key: string, val: unknown) => { if (val !== undefined) out[key] = val; };

    set('project_id', phase.projectId);
    set('phase_name', phase.phaseName ?? phase.name);
    set('description', phase.description);
    set('status', phase.status);
    set('progress', phase.progress);
    set('order_index', phase.orderIndex);
    set('phase_type', phase.phaseType);
    set('phase_code', phase.phaseCode ?? (phase.customPhaseData as { phaseCode?: string } | undefined)?.phaseCode);
    set('start_date', (phase.startDate as any) instanceof Date ? (phase.startDate as unknown as Date).toISOString() : phase.startDate);
    set('end_date', (phase.endDate as any) instanceof Date ? (phase.endDate as unknown as Date).toISOString() : phase.endDate);
    set('estimated_duration', phase.estimatedDuration);
    set('actual_duration', phase.actualDuration);
    set('estimated_cost', phase.estimatedCost);
    set('actual_cost', phase.actualCost);
    set('construction_phase', phase.constructionPhase);
    set('construction_stage', phase.constructionStage);
    set('weight', phase.weight ?? 0.1);
    set('notes', phase.notes);
    set('location', phase.location);
    set('custom_phase_data', phase.customPhaseData);
    if (phase.dependencies !== undefined) set('dependencies', JSON.stringify(phase.dependencies));
    if (phase.milestones !== undefined) set('milestones', JSON.stringify(phase.milestones));
    if (phase.humanResources !== undefined) set('human_resources', JSON.stringify(phase.humanResources));
    if (phase.materials !== undefined) set('materials', JSON.stringify(phase.materials));
    if (phase.suppliers !== undefined) set('suppliers', JSON.stringify(phase.suppliers));
    return out;
  }

  static stepToDTO(step: PhaseStep): PhaseStepDTO {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      status: step.status as DTOStatus,
      progress: step.progress,
      order_index: step.order_index,
      estimated_duration_days: step.estimated_duration_days,
      actual_duration_days: step.actual_duration_days,
      start_date: step.start_date ? new Date(step.start_date).toISOString().split('T')[0] : undefined,
      end_date: step.end_date ? new Date(step.end_date).toISOString().split('T')[0] : undefined,
      // estimated_cost, actual_cost, assigned_to, dependencies not in PhaseStepDTO
      tasks: step.tasks.map(task => this.taskToDTO(task))
    };
  }

  static taskToDTO(task: PhaseTask): PhaseTaskDTO {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status as DTOStatus,
      progress: task.progress,
      order_index: task.order_index,
      estimated_duration_days: task.estimated_duration_days,
      actual_duration_days: task.actual_duration_days,
      start_date: task.start_date,
      end_date: task.end_date,
      assigned_to: task.assigned_to,
      dependencies: task.dependencies || [],
      weight: task.weight
    };
  }

  // =================== DTO to Domain ===================

  static toEntity(dto: PhaseDTO): Phase {
    return Phase.create({
      id: dto.id,
      projectId: dto.projectId,
      phaseName: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      orderIndex: dto.orderIndex,
      startDate: dto.startDate,
      endDate: dto.endDate,
      estimatedDuration: dto.estimatedDuration,
      actualDuration: dto.actualDuration,
      estimatedCost: dto.estimatedCost,
      actualCost: dto.actualCost,
      dependencies: [], // Will be loaded separately
      milestones: (dto.milestones ?? []).map((m) => (typeof m === 'string' ? m : m.id)),
      humanResources: null, // Will be loaded separately
      materials: [], // Will be loaded separately
      suppliers: [], // Will be loaded separately
      location: null, // Not in DTO
      customPhaseData: null, // Not in DTO
      // Note: steps removed - handled as separate entities
      notes: null, // Not in DTO
      weight: null, // Not in DTO
      createdBy: null, // Not in DTO
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  static dtoToStep(dto: PhaseStepDTO): PhaseStep {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      order_index: dto.order_index,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      tasks: dto.tasks?.map(task => this.dtoToTask(task)) || []
    };
  }

  static dtoToTask(dto: PhaseTaskDTO): PhaseTask {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      order_index: dto.order_index,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      assigned_to: dto.assigned_to,
      dependencies: dto.dependencies,
      weight: dto.weight,
    } as any;
  }

  // =================== Create Operations ===================

  static fromCreateDTO(dto: Partial<PhaseDTO>): Phase {
    const phaseCode = (dto as { phaseCode?: string }).phaseCode;
    const customPhaseData = {
      ...((dto.customPhaseData as Record<string, unknown> | undefined) ?? {}),
      ...(phaseCode ? { phaseCode } : {}),
    };
    return Phase.create({
      id: dto.id,
      projectId: dto.projectId || '',
      phaseName: dto.name || '',
      description: dto.description || '',
      status: (dto.status as PhaseStatus) || 'pending',
      progress: dto.progress || 0,
      orderIndex: dto.orderIndex || 0,
      // Type de phase normalisé pour respecter les contraintes CHECK côté DB
      phaseType: PhaseTransformer.normalizeDbPhaseType(
        (dto as { phaseType?: string }).phaseType ?? phaseCode ?? dto.type,
      ),
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      estimatedDuration: dto.estimatedDuration || null,
      actualDuration: dto.actualDuration || null,
      estimatedCost: dto.estimatedCost || null,
      actualCost: dto.actualCost || null,
      dependencies: [],
      milestones: (dto.milestones ?? []).map((m) => (typeof m === 'string' ? m : m.id)),
      humanResources: null,
      materials: [],
      suppliers: [],
      location: null,
      customPhaseData: Object.keys(customPhaseData).length > 0 ? customPhaseData : null,
      // Note: steps removed - handled as separate entities
      notes: null,
      weight: dto.weight ?? 0.1,
      createdBy: null,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    });
  }

  /**
   * Normalise un code/type source (ETUDES, "Travaux", TRAVAUX_RESEAU, ...) vers
   * une valeur snake_case minuscule acceptée par `project_phases.phase_type`.
   * Les codes métier restent conservés dans `phase_code` / `custom_phase_data`.
   */
  static normalizeDbPhaseType(raw?: string | null): string {
    const value = (raw ?? '').toString().trim();
    if (!value) return 'standard';
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const aliases: Record<string, string> = {
      etude: 'etudes',
      etudes: 'etudes',
      conception: 'etudes',
      design: 'etudes',
      travaux: 'travaux',
      execution: 'travaux',
      construction: 'travaux',
      reception: 'reception',
      cloture: 'reception',
      livraison: 'reception',
      handover: 'reception',
      preparation: 'preparation',
      analyse: 'preparation',
    };
    return aliases[normalized] ?? normalized ?? 'standard';
  }


  // =================== Validation ===================

  static validatePhaseStatus(status: string): PhaseStatus {
    const validStatuses: PhaseStatus[] = ['pending', 'in_progress', 'completed', 'blocked', 'delayed'];
    return validStatuses.includes(status as PhaseStatus) ? status as PhaseStatus : 'pending';
  }

  static validatePhaseType(type: string): PhaseType {
    const validTypes: PhaseType[] = ['preparation', 'execution', 'completion', 'validation'];
    return validTypes.includes(type as PhaseType) ? type as PhaseType : 'execution';
  }

  static validatePhasePriority(priority: string): PhasePriority {
    const validPriorities: PhasePriority[] = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority as PhasePriority) ? priority as PhasePriority : 'medium';
  }

  // =================== Update Operations ===================

  static updatePhase(phase: Phase, updates: Partial<PhaseDTO>): Phase {
    return Phase.create({
      ...phase.toJSON(),
      phaseName: updates.name || phase.phaseName,
      description: updates.description !== undefined ? updates.description : phase.description,
      status: updates.status ? this.validatePhaseStatus(updates.status) : phase.status,
      progress: updates.progress !== undefined ? updates.progress : phase.progress,
      orderIndex: updates.orderIndex !== undefined ? updates.orderIndex : phase.orderIndex,
      startDate: updates.startDate !== undefined ? updates.startDate : phase.startDate,
      endDate: updates.endDate !== undefined ? updates.endDate : phase.endDate,
      estimatedDuration: updates.estimatedDuration !== undefined ? updates.estimatedDuration : phase.estimatedDuration,
      actualDuration: updates.actualDuration !== undefined ? updates.actualDuration : phase.actualDuration,
      estimatedCost: updates.estimatedCost !== undefined ? updates.estimatedCost : phase.estimatedCost,
      actualCost: updates.actualCost !== undefined ? updates.actualCost : phase.actualCost,
      // Note: steps removed - handled as separate entities
      updatedAt: new Date().toISOString()
    });
  }
}
