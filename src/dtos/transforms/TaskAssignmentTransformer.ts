/**
 * TaskAssignment Transformer — SOURCE UNIQUE (Hexagonal)
 *
 * v3.6 :
 * - ✅ actionType / action_type propagé dans toutes les méthodes
 * - ✅ status aligné sur contrainte DB : ('assigned', 'in_progress', 'completed', 'cancelled')
 * - ✅ Tous les fallbacks utilisent les ENUMS (pas de strings littérales)
 * - resolveTitle() exposé publiquement
 */

import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import {
  CreateTaskAssignmentDTO,
  TaskAssignmentDTO,
  UpdateTaskAssignmentDTO,
  TaskStatus,
  TaskPriority,
  ActionType,
  normalizeActionType,
  normalizeAssignedTo,
  normalizeTaskPriority,
  normalizeTaskStatus,
} from '@/dtos/entities/TaskAssignmentDTO';

type Row = Record<string, unknown>;

export class TaskAssignmentTransformer {
  // ============= HELPERS =============

  static resolveTitle(
    source: Record<string, unknown> | null | undefined,
    fallback = 'Tâche sans titre',
    requireNonEmpty = false,
  ): string {
    if (!source) {
      if (requireNonEmpty) throw new Error('Task title is required (source is null)');
      return fallback;
    }

    const rawTitle =
      (source['title'] as string | undefined) ??
      (source['name'] as string | undefined) ??
      (source['label'] as string | undefined);

    const trimmed = typeof rawTitle === 'string' ? rawTitle.trim() : '';

    if (!trimmed) {
      if (requireNonEmpty) {
        throw new Error('Task title is required (neither "title", "name" nor "label" provided)');
      }
      return fallback;
    }
    return trimmed;
  }

  static hasValidTitle(source: Record<string, unknown> | null | undefined): boolean {
    if (!source) return false;
    const rawTitle =
      (source['title'] as string | undefined) ??
      (source['name'] as string | undefined) ??
      (source['label'] as string | undefined);
    return typeof rawTitle === 'string' && rawTitle.trim().length > 0;
  }

  // ============= DOMAIN → DTO =============

  static toDTO(entity: TaskAssignment): TaskAssignmentDTO {
    return {
      id: entity.id,
      title: entity.title,
      name: entity.title,
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
      actionType: entity.actionType,
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
      actualCost: entity.actualCost,
      metadata: entity.metadata,
      dependencies: entity.dependencies,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toDTOList(entities: TaskAssignment[]): TaskAssignmentDTO[] {
    return entities.map((e) => this.toDTO(e));
  }

  // ============= DTO → DOMAIN =============

  static toEntity(
    dto: CreateTaskAssignmentDTO | TaskAssignmentDTO | UpdateTaskAssignmentDTO,
  ): TaskAssignment {
    const source = dto as TaskAssignmentDTO &
      CreateTaskAssignmentDTO &
      UpdateTaskAssignmentDTO;

    const title = this.resolveTitle(
      source as unknown as Record<string, unknown>,
      'Tâche sans titre',
      true,
    );

    const actionType = normalizeActionType(
      (source as { actionType?: string }).actionType,
      (source as { action_type?: string }).action_type,
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
      actionType,
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

    return TaskAssignment.create(
      createData as Parameters<typeof TaskAssignment.create>[0],
    );
  }

  static toEntityList(dtos: CreateTaskAssignmentDTO[]): TaskAssignment[] {
    return dtos.map((dto) => this.toEntity(dto));
  }

  // ============= DOMAIN → DB (snake_case) =============

  static toRepository(entity: TaskAssignment, includeId = true): Row {
    const assignedTo = entity.assignedTo ?? [];

    const row: Row = {
      title: entity.title,
      description: entity.description ?? null,

      project_id: entity.projectId ?? null,
      phase_id: entity.phaseId ?? null,
      step_id: entity.stepId ?? null,

      assigned_to: assignedTo.length > 0 ? assignedTo : null,
      assigned_by: entity.assignedBy ?? null,

      assignee_type: entity.assigneeType ?? null,
      assignee_name: entity.assigneeName ?? null,
      assignee_email: entity.assigneeEmail ?? null,

      // ✅ v3.6 : PENDING → ASSIGNED (contrainte DB n'accepte que 'assigned')
      status: entity.status === TaskStatus.PENDING ? TaskStatus.ASSIGNED : entity.status,
      priority: entity.priority,
      progress: entity.progress ?? 0,

      // ✅ v3.6 : action_type TOUJOURS envoyé
      action_type: entity.actionType ?? ActionType.TASK_ASSIGNMENT,

      start_date: entity.startDate?.toISOString() ?? null,
      end_date: entity.endDate?.toISOString() ?? null,
      due_date: entity.dueDate?.toISOString() ?? null,
      completed_at: entity.completedAt?.toISOString() ?? null,

      estimated_duration: entity.estimatedDuration ?? null,
      actual_duration: entity.actualDuration ?? null,

      quantity: entity.quantity ?? null,
      unit: entity.unit ?? null,
      daily_rate: entity.dailyRate ?? null,
      cost_estimate: entity.estimatedCost ?? null,
      metadata: entity.metadata ?? {},

      notes: entity.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    if (includeId) {
      row.id = entity.id;
      row.created_at = entity.createdAt.toISOString();
    }

    return row;
  }

  static toRepositoryList(entities: TaskAssignment[], includeId = true): Row[] {
    return entities.map((entity) => this.toRepository(entity, includeId));
  }

  // ============= DB (snake_case) → DOMAIN =============

  static fromRepository(row: Row): TaskAssignment {
    const rawAssigned = (row.assigned_to ?? row.assignee_id) as
      | string
      | string[]
      | null
      | undefined;

    const title = this.resolveTitle(row, 'Tâche', false);

    const actionType = normalizeActionType(
      row.action_type as string | undefined,
      row.action_type as string | undefined,
    );

    const createData: Partial<TaskAssignment> = {
      id: row.id as string,
      title,
      description: (row.description as string) ?? undefined,

      projectId: (row.project_id as string) ?? undefined,
      phaseId: (row.phase_id as string) ?? undefined,
      stepId: (row.step_id as string) ?? undefined,

      assignedTo: normalizeAssignedTo(rawAssigned),
      assignedBy: (row.assigned_by as string) ?? undefined,

      assigneeType: (row.assignee_type as 'employee' | 'supplier' | 'user') ?? undefined,
      assigneeName: (row.assignee_name as string) ?? undefined,
      assigneeEmail: (row.assignee_email as string) ?? undefined,

      status: normalizeTaskStatus(
        row.status as string | undefined,
        row.progress as number | undefined,
      ),
      priority: normalizeTaskPriority(row.priority as string | undefined),
      progress: (row.progress as number) ?? 0,

      actionType,

      startDate: row.start_date ? new Date(row.start_date as string) : undefined,
      endDate: row.end_date ? new Date(row.end_date as string) : undefined,
      dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,

      estimatedDuration: (row.estimated_duration as number) ?? undefined,
      actualDuration: (row.actual_duration as number) ?? undefined,
      quantity:
        row.quantity !== null && row.quantity !== undefined
          ? Number(row.quantity)
          : undefined,
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

      notes: (row.notes as string) ?? undefined,

      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
    };

    return TaskAssignment.create(
      createData as Parameters<typeof TaskAssignment.create>[0],
    );
  }

  static fromRepositoryList(rows: Row[]): TaskAssignment[] {
    return rows.map((row) => this.fromRepository(row));
  }

  // ============= UTILITAIRES =============

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
    actionType?: string;
    action_type?: string;
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
    const title = this.resolveTitle(
      formData as unknown as Record<string, unknown>,
      '',
      true,
    );

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
      status: formData.status
        ? normalizeTaskStatus(formData.status)
        : TaskStatus.ASSIGNED,
      priority: formData.priority ? normalizeTaskPriority(formData.priority) : undefined,
      progress: formData.progress,
      type: formData.type,
      actionType: normalizeActionType(formData.actionType, formData.action_type),
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

  static formToUpdateDTO(
    formData: Partial<{
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
      actionType?: string;
      action_type?: string;
      startDate?: string;
      endDate?: string;
      dueDate?: string;
      estimatedDuration?: number;
      dependencies?: string[];
      notes?: string;
    }>,
  ): UpdateTaskAssignmentDTO {
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
      actionType:
        formData.actionType || formData.action_type
          ? normalizeActionType(formData.actionType, formData.action_type)
          : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      dueDate: formData.dueDate,
      estimatedDuration: formData.estimatedDuration,
      dependencies: formData.dependencies,
      notes: formData.notes,
    };
  }

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
      // ✅ v3.6 : ActionType enum (pas de string littérale)
      actionType: entity.actionType ?? ActionType.TASK_ASSIGNMENT,
    } as Parameters<typeof TaskAssignment.create>[0]);
  }

  /**
   * ✅ v3.6 : tous les fallbacks utilisent les ENUMS.
   * Corrige l'erreur "Type 'TaskPriority | \"medium\"' is not assignable..."
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
      // ✅ v3.6 : TaskStatus.ASSIGNED au lieu de 'pending'
      status: partial.status
        ? normalizeTaskStatus(partial.status)
        : TaskStatus.ASSIGNED,
      // ✅ v3.6 : TaskPriority.MEDIUM au lieu de 'medium'
      priority: partial.priority
        ? normalizeTaskPriority(partial.priority)
        : TaskPriority.MEDIUM,
      progress: partial.progress ?? 0,
      type: partial.type,
      // ✅ v3.6 : ActionType.TASK_ASSIGNMENT au lieu de 'task_assignment'
      actionType: partial.actionType ?? ActionType.TASK_ASSIGNMENT,
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