/**
 * TaskAssignment Transformer — SOURCE UNIQUE (Hexagonal)
 * 
 * Rôles du Transformer selon PROMPT.md :
 * - toDTO(entity): Domain → DTO (camelCase pour UI)
 * - toEntity(dto): DTO → Domain
 * - fromRepository(row): DB (snake_case) → Domain
 * - toRepository(entity): Domain → DB (snake_case)
 * - toDTOList(entities): Domain[] → DTO[]
 * - toEntityList(dtos): DTO[] → Domain[]
 * 
 * Flow complet :
 * UI (camelCase) → DTO (camelCase) → Transformer → Domain (camelCase) → 
 * Repository (snake_case) → Adapter → DB (snake_case)
 * 
 * Respecte la règle : Chaque couche a sa propre convention de casing
 * 
 * Corrections v3.3 :
 * - toEntity() : fallback title ?? name ?? throw
 * - fromRepository() : fallback row.title ?? row.name ?? 'Tâche'
 * - toRepository() : assigned_to sérialisé en tableau natif
 * - normalizeForPersistence() : validation title robuste
 */

import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import {
  CreateTaskAssignmentDTO,
  TaskAssignmentDTO,
  UpdateTaskAssignmentDTO,
  normalizeAssignedTo,
  normalizeTaskPriority,
  normalizeTaskStatus,
} from '@/dtos/entities/TaskAssignmentDTO';

type Row = Record<string, unknown>;

export class TaskAssignmentTransformer {
  // ============= HELPERS =============

  /**
   * Résout le titre d'une tâche depuis plusieurs sources possibles.
   * Priorité : title > name > fallback
   * Throw si aucun titre valide n'est trouvé et requireNonEmpty=true
   */
  private static resolveTitle(
    source: Record<string, unknown> | null | undefined,
    fallback = 'Tâche sans titre',
    requireNonEmpty = false,
  ): string {
    const title =
      (source?.title as string | undefined) ??
      (source?.name as string | undefined) ??
      (source?.label as string | undefined);

    const trimmed = typeof title === 'string' ? title.trim() : '';

    if (!trimmed) {
      if (requireNonEmpty) {
        throw new Error('Task title is required (neither "title" nor "name" provided)');
      }
      return fallback;
    }

    return trimmed;
  }

  // ============= DOMAIN → DTO (camelCase) =============

  /**
   * Convertit une entité domaine en DTO pour l'UI
   */
  static toDTO(entity: TaskAssignment): TaskAssignmentDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      stepId: entity.stepId,
      assignedTo: entity.assignedTo,
      assignedBy: entity.assignedBy,
      assigneeType: entity.assigneeType,
      assigneeName: entity.assigneeName,
      assigneeEmail: entity.assigneeEmail,
      status: entity.status,
      priority: entity.priority,
      progress: entity.progress,
      type: entity.type,
      startDate: entity.startDate?.toISOString(),
      endDate: entity.endDate?.toISOString(),
      dueDate: entity.dueDate?.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
      estimatedDuration: entity.estimatedDuration,
      actualDuration: entity.actualDuration,
      quantity: entity.quantity,
      unit: entity.unit,
      dailyRate: entity.dailyRate,
      estimatedCost: entity.estimatedCost,
      metadata: entity.metadata,
      dependencies: entity.dependencies,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Convertit une liste d'entités en liste de DTOs
   */
  static toDTOList(entities: TaskAssignment[]): TaskAssignmentDTO[] {
    return entities.map(this.toDTO);
  }

  // ============= DTO → DOMAIN (camelCase) =============

  /**
   * Convertit un DTO (camelCase) en entité domaine.
   * ✅ Fallback : title ?? name ?? throw
   */
  static toEntity(
    dto: CreateTaskAssignmentDTO | TaskAssignmentDTO | UpdateTaskAssignmentDTO,
  ): TaskAssignment {
    const source = dto as TaskAssignmentDTO & CreateTaskAssignmentDTO & UpdateTaskAssignmentDTO;

    // ✅ Résolution du titre avec fallback "name"
    const title = this.resolveTitle(
      source as unknown as Record<string, unknown>,
      'Tâche sans titre',
      true,
    );

    const createData: Partial<TaskAssignment> = {
      id: source.id || crypto.randomUUID(),
      title,
      description: source.description,
      projectId: source.projectId,
      phaseId: source.phaseId,
      stepId: source.stepId,
      assignedTo: normalizeAssignedTo(source.assignedTo),
      assignedBy: source.assignedBy,
      assigneeType: source.assigneeType as 'employee' | 'supplier' | 'user' | undefined,
      assigneeName: source.assigneeName,
      assigneeEmail: source.assigneeEmail,
      status: normalizeTaskStatus(source.status as string | undefined, source.progress),
      priority: normalizeTaskPriority(source.priority as string | undefined),
      progress: source.progress ?? 0,
      type: source.type,
      startDate: source.startDate ? new Date(source.startDate) : undefined,
      endDate: source.endDate ? new Date(source.endDate) : undefined,
      dueDate: source.dueDate ? new Date(source.dueDate) : undefined,
      completedAt: (source as TaskAssignmentDTO).completedAt
        ? new Date((source as TaskAssignmentDTO).completedAt as string)
        : undefined,
      estimatedDuration: source.estimatedDuration,
      actualDuration: (source as TaskAssignmentDTO).actualDuration,
      quantity: source.quantity,
      unit: source.unit,
      dailyRate: source.dailyRate,
      estimatedCost: source.estimatedCost,
      metadata: source.metadata,
      dependencies: source.dependencies,
      notes: source.notes,
    };

    return TaskAssignment.create(createData as Parameters<typeof TaskAssignment.create>[0]);
  }

  /**
   * Convertit une liste de DTOs en entités
   */
  static toEntityList(dtos: CreateTaskAssignmentDTO[]): TaskAssignment[] {
    return dtos.map(this.toEntity);
  }

  // ============= DOMAIN → DB (snake_case) =============

  /**
   * Convertit une entité domaine en format DB (snake_case).
   * ✅ assigned_to sérialisé en tableau natif (PostgREST uuid[])
   */
  static toRepository(entity: TaskAssignment, includeId = true): Row {
    const assignedTo = entity.assignedTo ?? [];

    const row: Row = {
      // Champs texte
      title: entity.title,
      description: entity.description ?? null,

      // Clés étrangères
      project_id: entity.projectId ?? null,
      phase_id: entity.phaseId ?? null,
      step_id: entity.stepId ?? null,

      // ✅ Assignation : tableau natif (PostgREST uuid[])
      assigned_to: assignedTo.length > 0 ? assignedTo : null,
      assigned_by: entity.assignedBy ?? null,

      // Informations assigné
      assignee_type: entity.assigneeType ?? null,
      assignee_name: entity.assigneeName ?? null,
      assignee_email: entity.assigneeEmail ?? null,

      // Statut et priorité
      status: entity.status,
      priority: entity.priority,
      progress: entity.progress ?? 0,

      // Dates
      start_date: entity.startDate?.toISOString() ?? null,
      end_date: entity.endDate?.toISOString() ?? null,
      due_date: entity.dueDate?.toISOString() ?? null,
      completed_at: entity.completedAt?.toISOString() ?? null,

      // Durées
      estimated_duration: entity.estimatedDuration ?? null,
      actual_duration: entity.actualDuration ?? null,

      // Données DQE reportées sur la tâche
      quantity: entity.quantity ?? null,
      unit: entity.unit ?? null,
      daily_rate: entity.dailyRate ?? null,
      cost_estimate: entity.estimatedCost ?? null,
      metadata: entity.metadata ?? {},

      // Métadonnées
      notes: entity.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    if (includeId) {
      row.id = entity.id;
      row.created_at = entity.createdAt.toISOString();
    }

    return row;
  }

  /**
   * Convertit une liste d'entités en format DB
   */
  static toRepositoryList(entities: TaskAssignment[], includeId = true): Row[] {
    return entities.map((entity) => this.toRepository(entity, includeId));
  }

  // ============= DB (snake_case) → DOMAIN =============

  /**
   * Convertit une ligne DB (snake_case) en entité domaine.
   * ✅ Fallback : row.title ?? row.name ?? 'Tâche'
   */
  static fromRepository(row: Row): TaskAssignment {
    // Normalisation des assignés
    const rawAssigned = (row.assigned_to ?? row.assignee_id) as
      | string
      | string[]
      | null
      | undefined;

    // ✅ Résolution du titre avec fallback "name"
    const title = this.resolveTitle(row, 'Tâche', false);

    const createData: Partial<TaskAssignment> = {
      id: row.id as string,
      title,
      description: (row.description as string) ?? undefined,

      // Clés étrangères
      projectId: (row.project_id as string) ?? undefined,
      phaseId: (row.phase_id as string) ?? undefined,
      stepId: (row.step_id as string) ?? undefined,

      // Assignation
      assignedTo: normalizeAssignedTo(rawAssigned),
      assignedBy: (row.assigned_by as string) ?? undefined,

      // Informations assigné
      assigneeType: (row.assignee_type as 'employee' | 'supplier' | 'user') ?? undefined,
      assigneeName: (row.assignee_name as string) ?? undefined,
      assigneeEmail: (row.assignee_email as string) ?? undefined,

      // Statut et priorité
      status: normalizeTaskStatus(
        row.status as string | undefined,
        row.progress as number | undefined,
      ),
      priority: normalizeTaskPriority(row.priority as string | undefined),
      progress: (row.progress as number) ?? 0,

      // Dates
      startDate: row.start_date ? new Date(row.start_date as string) : undefined,
      endDate: row.end_date ? new Date(row.end_date as string) : undefined,
      dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,

      // Durées
      estimatedDuration: (row.estimated_duration as number) ?? undefined,
      actualDuration: (row.actual_duration as number) ?? undefined,
      quantity:
        row.quantity !== null && row.quantity !== undefined ? Number(row.quantity) : undefined,
      unit: (row.unit as string) ?? undefined,
      dailyRate:
        row.daily_rate !== null && row.daily_rate !== undefined
          ? Number(row.daily_rate)
          : undefined,
      estimatedCost:
        row.cost_estimate !== null && row.cost_estimate !== undefined
          ? Number(row.cost_estimate)
          : undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},

      // Métadonnées
      notes: (row.notes as string) ?? undefined,

      // Timestamps
      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
    };

    return TaskAssignment.create(createData as Parameters<typeof TaskAssignment.create>[0]);
  }

  /**
   * Convertit une liste de lignes DB en entités
   */
  static fromRepositoryList(rows: Row[]): TaskAssignment[] {
    return rows.map(this.fromRepository);
  }

  // ============= UTILITAIRES =============

  /**
   * Crée un DTO de création à partir d'un formulaire UI
   */
  static formToCreateDTO(formData: {
    title?: string;
    name?: string;
    description?: string;
    projectId?: string;
    phaseId?: string;
    stepId?: string;
    assignedTo?: string | string[];
    assignedBy?: string;
    assigneeType?: 'employee' | 'supplier' | 'user';
    assigneeName?: string;
    assigneeEmail?: string;
    status?: string;
    priority?: string;
    progress?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    estimatedDuration?: number;
    quantity?: number;
    unit?: string;
    dailyRate?: number;
    estimatedCost?: number;
    dependencies?: string[];
    notes?: string;
  }): CreateTaskAssignmentDTO {
    // ✅ Fallback title ?? name
    const title = (formData.title ?? formData.name ?? '').trim();

    return {
      title,
      description: formData.description,
      projectId: formData.projectId,
      phaseId: formData.phaseId,
      stepId: formData.stepId,
      assignedTo: formData.assignedTo,
      assignedBy: formData.assignedBy,
      assigneeType: formData.assigneeType,
      assigneeName: formData.assigneeName,
      assigneeEmail: formData.assigneeEmail,
      status: formData.status ? normalizeTaskStatus(formData.status) : undefined,
      priority: formData.priority ? normalizeTaskPriority(formData.priority) : undefined,
      progress: formData.progress,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      dueDate: formData.dueDate,
      estimatedDuration: formData.estimatedDuration,
      quantity: formData.quantity,
      unit: formData.unit,
      dailyRate: formData.dailyRate,
      estimatedCost: formData.estimatedCost,
      dependencies: formData.dependencies,
      notes: formData.notes,
    };
  }

  /**
   * Crée un DTO de mise à jour à partir d'un formulaire UI
   */
  static formToUpdateDTO(formData: Partial<{
    title: string;
    name: string;
    description?: string;
    projectId?: string;
    phaseId?: string;
    stepId?: string;
    assignedTo?: string | string[];
    assignedBy?: string;
    assigneeType?: 'employee' | 'supplier' | 'user';
    assigneeName?: string;
    assigneeEmail?: string;
    status?: string;
    priority?: string;
    progress?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    estimatedDuration?: number;
    dependencies?: string[];
    notes?: string;
  }>): UpdateTaskAssignmentDTO {
    return {
      title: formData.title ?? formData.name,
      description: formData.description,
      projectId: formData.projectId,
      phaseId: formData.phaseId,
      stepId: formData.stepId,
      assignedTo: formData.assignedTo,
      assignedBy: formData.assignedBy,
      assigneeType: formData.assigneeType,
      assigneeName: formData.assigneeName,
      assigneeEmail: formData.assigneeEmail,
      status: formData.status ? normalizeTaskStatus(formData.status) : undefined,
      priority: formData.priority ? normalizeTaskPriority(formData.priority) : undefined,
      progress: formData.progress,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      dueDate: formData.dueDate,
      estimatedDuration: formData.estimatedDuration,
      dependencies: formData.dependencies,
      notes: formData.notes,
    };
  }

  /**
   * Valide et normalise une tâche avant persistance.
   * ✅ Validation robuste : title ?? name ?? throw
   */
  static normalizeForPersistence(entity: TaskAssignment): TaskAssignment {
    const title = this.resolveTitle(
      entity as unknown as Record<string, unknown>,
      '',
      true,
    );

    return TaskAssignment.create({
      ...entity,
      title,
      status: normalizeTaskStatus(entity.status),
      priority: normalizeTaskPriority(entity.priority),
      assignedTo: normalizeAssignedTo(entity.assignedTo),
    } as Parameters<typeof TaskAssignment.create>[0]);
  }

  /**
   * Convertit un objet partiel en entité TaskAssignment.
   */
  static toEntityPartial(partial: Partial<TaskAssignment>): TaskAssignment {
    const title = this.resolveTitle(
      partial as unknown as Record<string, unknown>,
      'Tâche sans titre',
      false,
    );

    return TaskAssignment.create({
      id: partial.id || crypto.randomUUID(),
      title,
      description: partial.description,
      projectId: partial.projectId,
      phaseId: partial.phaseId,
      stepId: partial.stepId,
      assignedTo: partial.assignedTo ? normalizeAssignedTo(partial.assignedTo) : [],
      assignedBy: partial.assignedBy,
      assigneeType: partial.assigneeType,
      assigneeName: partial.assigneeName,
      assigneeEmail: partial.assigneeEmail,
      status: partial.status ? normalizeTaskStatus(partial.status) : 'pending',
      priority: partial.priority ? normalizeTaskPriority(partial.priority) : 'medium',
      progress: partial.progress ?? 0,
      type: partial.type,
      startDate: partial.startDate,
      endDate: partial.endDate,
      dueDate: partial.dueDate,
      completedAt: partial.completedAt,
      estimatedDuration: partial.estimatedDuration,
      actualDuration: partial.actualDuration,
      dependencies: partial.dependencies,
      notes: partial.notes,
      createdAt: partial.createdAt || new Date(),
      updatedAt: partial.updatedAt || new Date(),
    });
  }
}

export default TaskAssignmentTransformer;