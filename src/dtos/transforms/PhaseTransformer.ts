
/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformations between Phase domain entities and PhaseDTO
 * Following hexagonal architecture principles
 */

import { getAllReferentials } from '@/config/referentials';
import { Phase, PhasePriority, PhaseStatus, PhaseStep, PhaseTask, PhaseType } from '@/domain/entities/Phase';
import {
  PhasePriority as DTOPriority,
  PhaseStatus as DTOStatus,
  PhaseType as DTOType,
  PhaseDTO,
  PhaseStepDTO,
  PhaseTaskDTO
} from '@/dtos/entities/PhaseDTO';

// =============================================================================
// PHASE TYPE CONSTANTS
// =============================================================================

export const PHASE_TYPES = {
  STANDARD: 'standard',
  CUSTOM: 'custom',
  
  // Valeurs métier du projet
  ETUDES: 'etudes',
  TRAVAUX: 'travaux',
  RECEPTION: 'reception',
  FABRICATION: 'fabrication',
  INSTALLATION: 'installation',
  ANALYSE: 'analyse',
  DEFINITION: 'definition',
  VALIDATION: 'validation',
  EXECUTION: 'execution',
  PRE_FEASIBILITY: 'pre_feasibility',
  DESIGN_DAO: 'design_dao',
  CONCEPTION: 'conception',
  PREPARATION: 'preparation',
  DESIGN: 'design',
  CONSTRUCTION: 'construction',
  CLOTURE: 'cloture',
  LIVRAISON: 'livraison',
  PLANIFICATION: 'planification',
  PLANNING: 'planning',
  
  // Valeurs originales de la migration project_phases
  PRE_CONSTRUCTION: 'pre_construction',
  SITE_PREPARATION: 'site_preparation',
  FOUNDATION: 'foundation',
  FRAMING: 'framing',
  STRUCTURAL_WORK: 'structural_work',
  FINISHING: 'finishing',
  POST_CONSTRUCTION: 'post_construction',
  HANDOVER: 'handover',
} as const;

export type PhaseTypeValue = typeof PHASE_TYPES[keyof typeof PHASE_TYPES];

export const VALID_PHASE_TYPES: PhaseTypeValue[] = Object.values(PHASE_TYPES);

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
    
    // `phase_type` est NOT NULL en base : on garantit toujours une valeur normalisée.
    out['phase_type'] = PhaseTransformer.normalizeDbPhaseType(
      phase.phaseType ??
        phase.phase_type ??
        phase.phaseCode ??
        (phase.customPhaseData as { phaseCode?: string } | undefined)?.phaseCode ??
        phase.type ??
        phase.name,
    );
    
    // `phase_code` conserve le code métier source (ETUDES, TRAVAUX…)
    set(
      'phase_code',
      phase.phaseCode ??
        (phase.customPhaseData as { phaseCode?: string } | undefined)?.phaseCode ??
        (typeof phase.phaseType === 'string' ? phase.phaseType : undefined) ??
        (typeof phase.type === 'string' ? phase.type : undefined) ??
        (typeof phase.name === 'string' ? phase.name : undefined),
    );

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
    // Colonnes jsonb : on envoie les objets tels quels (pas de double encodage)
    if (phase.dependencies !== undefined) set('dependencies', phase.dependencies);
    if (phase.milestones !== undefined) set('milestones', phase.milestones);
    if (phase.humanResources !== undefined) set('human_resources', phase.humanResources);
    if (phase.materials !== undefined) set('materials', phase.materials);
    if (phase.suppliers !== undefined) set('suppliers', phase.suppliers);

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

  static fromCreateDTO(dto: Partial<PhaseDTO> & Record<string, any>): Phase {
    const phaseCode = (dto as { phaseCode?: string }).phaseCode;
    const raw = dto as Record<string, any>;

    // Champs libres persistés dans custom_phase_data (steps, stages, champs métier…)
    const customPhaseData: Record<string, unknown> = {
      ...((dto.customPhaseData as Record<string, unknown> | undefined) ?? {}),
      ...((raw.customPhase as Record<string, unknown> | undefined) ?? {}),
      ...(phaseCode ? { phaseCode } : {}),
      ...(raw.steps ? { steps: raw.steps } : {}),
      ...(raw.stages ? { stages: raw.stages } : {}),
      ...(raw.priority ? { priority: raw.priority } : {}),
      ...(raw.responsibleId ? { responsibleId: raw.responsibleId } : {}),
    };

    const resolvedName =
      raw.phaseName ?? dto.name ?? raw.title ?? raw.label ?? '';
    const resolvedCost =
      dto.estimatedCost ?? raw.budget ?? raw.budgetMru ?? raw.estimated_cost ?? null;

    return Phase.create({
      id: dto.id,
      projectId: dto.projectId || '',
      phaseName: resolvedName,
      description: dto.description || raw.notes || '',
      status: (dto.status as PhaseStatus) || 'pending',
      progress: dto.progress || 0,
      orderIndex: dto.orderIndex ?? raw.order ?? 0,
      // Type de phase normalisé pour respecter les contraintes CHECK côté DB
      phaseType: PhaseTransformer.normalizeDbPhaseType(
        (dto as { phaseType?: string }).phaseType ?? phaseCode ?? dto.type,
      ),
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      estimatedDuration: dto.estimatedDuration ?? raw.durationDays ?? null,
      actualDuration: dto.actualDuration || null,
      estimatedCost: resolvedCost,
      actualCost: dto.actualCost ?? raw.actualCost ?? null,
      dependencies: Array.isArray(raw.dependencies) ? raw.dependencies : [],
      milestones: (dto.milestones ?? []).map((m) => (typeof m === 'string' ? m : m.id)),
      humanResources: raw.humanResources ?? null,
      materials: Array.isArray(raw.materials) ? raw.materials : [],
      suppliers: Array.isArray(raw.suppliers) ? raw.suppliers : [],
      location: raw.location ?? null,
      customPhaseData: Object.keys(customPhaseData).length > 0 ? customPhaseData : null,
      notes: raw.notes ?? null,
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
    if (!value) return PHASE_TYPES.STANDARD;

    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // 1. Vérifier les valeurs spéciales
    if (normalized === PHASE_TYPES.CUSTOM) return PHASE_TYPES.CUSTOM;
    if (normalized === PHASE_TYPES.STANDARD) return PHASE_TYPES.STANDARD;

    // 2. Mapper les codes métier vers les valeurs autorisées
    const mapping: Record<string, string> = {
      // Valeurs métier du projet
      'analyse': PHASE_TYPES.ANALYSE,
      'definition': PHASE_TYPES.DEFINITION,
      'validation': PHASE_TYPES.VALIDATION,
      'etude': PHASE_TYPES.ETUDES,
      'etudes': PHASE_TYPES.ETUDES,
      'travaux': PHASE_TYPES.TRAVAUX,
      'reception': PHASE_TYPES.RECEPTION,
      'fabrication': PHASE_TYPES.FABRICATION,
      'installation': PHASE_TYPES.INSTALLATION,
      'execution': PHASE_TYPES.EXECUTION,
      'handover': PHASE_TYPES.HANDOVER,
      'pre_feasibility': PHASE_TYPES.PRE_FEASIBILITY,
      'design_dao': PHASE_TYPES.DESIGN_DAO,
      'conception': PHASE_TYPES.CONCEPTION,
      'preparation': PHASE_TYPES.PREPARATION,
      'design': PHASE_TYPES.DESIGN,
      'construction': PHASE_TYPES.CONSTRUCTION,
      'cloture': PHASE_TYPES.CLOTURE,
      'livraison': PHASE_TYPES.LIVRAISON,
      'planification': PHASE_TYPES.PLANIFICATION,
      'planning': PHASE_TYPES.PLANNING,
      // Valeurs originales de la migration
      'pre_construction': PHASE_TYPES.PRE_CONSTRUCTION,
      'site_preparation': PHASE_TYPES.SITE_PREPARATION,
      'foundation': PHASE_TYPES.FOUNDATION,
      'framing': PHASE_TYPES.FRAMING,
      'structural_work': PHASE_TYPES.STRUCTURAL_WORK,
      'finishing': PHASE_TYPES.FINISHING,
      'post_construction': PHASE_TYPES.POST_CONSTRUCTION,
    };

    if (mapping[normalized]) return mapping[normalized];

    // 3. Vérifier si la valeur est déjà dans la liste des valeurs autorisées
    if (VALID_PHASE_TYPES.includes(normalized as PhaseTypeValue)) return normalized;

    // 4. Récupérer les codes depuis le ReferentialService
    try {
      const referentials = getAllReferentials();
      
      for (const ref of referentials) {
        for (const phase of ref.phases) {
          const code = typeof phase === 'string' ? phase : phase.code;
          if (code && code.toLowerCase() === normalized) {
            // Vérifier si le code est dans les valeurs autorisées
            const lowerCode = code.toLowerCase();
            if (VALID_PHASE_TYPES.includes(lowerCode as PhaseTypeValue)) {
              return lowerCode;
            }
            // Sinon, le code métier devient custom
            return PHASE_TYPES.CUSTOM;
          }
        }
      }
    } catch (error) {
      // Silencieux : fallback standard
      console.warn('[PhaseTransformer] ReferentialService unavailable, using fallback');
    }

    // 5. Fallback
    return PHASE_TYPES.STANDARD;
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

  static updatePhase(phase: Phase, updates: Partial<PhaseDTO> & Record<string, any>): Phase {
    const raw = updates as Record<string, any>;
    const pick = <T,>(value: T | undefined, fallback: T): T => (value !== undefined ? value : fallback);
    return Phase.create({
      ...phase.toJSON(),
      phaseName: updates.name || raw.phaseName || raw.title || phase.phaseName,
      description: updates.description !== undefined ? updates.description : phase.description,
      status: updates.status ? this.validatePhaseStatus(updates.status) : phase.status,
      progress: updates.progress !== undefined ? updates.progress : phase.progress,
      orderIndex: updates.orderIndex !== undefined ? updates.orderIndex : phase.orderIndex,
      startDate: updates.startDate !== undefined ? updates.startDate : phase.startDate,
      endDate: updates.endDate !== undefined ? updates.endDate : phase.endDate,
      estimatedDuration: updates.estimatedDuration !== undefined ? updates.estimatedDuration : phase.estimatedDuration,
      actualDuration: updates.actualDuration !== undefined ? updates.actualDuration : phase.actualDuration,
      estimatedCost: pick(
        updates.estimatedCost ?? (raw.budget as number | undefined),
        phase.estimatedCost as any,
      ),
      actualCost: updates.actualCost !== undefined ? updates.actualCost : phase.actualCost,
      // Colonnes jsonb : ressources / matériaux / fournisseurs sont éditées dans l'UI
      // détail de phase et doivent être persistées avec le reste de la phase.
      materials: pick(raw.materials, phase.materials as any),
      humanResources: pick(raw.humanResources ?? raw.human_resources, phase.humanResources as any),
      suppliers: pick(raw.suppliers, phase.suppliers as any),
      location: pick(raw.location, phase.location as any),
      notes: pick(updates.notes ?? raw.notes, phase.notes as any),
      customPhaseData: pick(updates.customPhaseData, phase.customPhaseData as any),
      // Note: steps removed - handled as separate entities
      updatedAt: new Date().toISOString()
    });
  }
}

