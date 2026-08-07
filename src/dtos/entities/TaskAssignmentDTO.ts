/**
 * TaskAssignment Data Transfer Objects — SOURCE UNIQUE
 * Fusion définitive Task + TaskAssignment sur la table `task_assignments`.
 * `assignedTo` est TOUJOURS un tableau d'UUID côté DTO/entité.
 * camelCase uniquement, aucune logique métier (hors normalisation de vocabulaire).
 */

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  /** Statut d'affichage uniquement — normalisé en `in_progress` avant persistance. */
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export type AssigneeType = 'supplier' | 'employee' | 'user';

/** Type de tâche (classification métier facultative). */
export enum TaskType {
  GENERAL = 'general',
  INSPECTION = 'inspection',
  DOCUMENT = 'document',
  PAYMENT = 'payment',
  MATERIAL = 'material',
  STUDY = 'study',
  EXECUTION = 'execution',
}

export interface TaskAssignmentDTO {
  id: string;
  title: string;
  /** Alias de compatibilité de `title` (lecture seule côté UI/rapports). */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo: string[];
  /** Alias de compatibilité : premier assigné. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  progress: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}


export interface CreateTaskAssignmentDTO {
  id?: string;
  title: string;
  /** Alias de compatibilité de `title`. */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo?: string | string[];
  /** Alias de compatibilité : assigné unique. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskAssignmentDTO {
  title?: string;
  /** Alias de compatibilité de `title`. */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string | string[];
  /** Alias de compatibilité : assigné unique. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** Filtres de recherche. */
export interface TaskAssignmentFiltersDTO {
  searchTerm?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  projectId?: string;
  phaseId?: string;
}

/** Statistiques agrégées. */
export interface TaskAssignmentStatsDTO {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

/** Normalise toute forme d'assignation vers un tableau d'UUID. */
export function normalizeAssignedTo(assignedTo?: string | string[] | null): string[] {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) return assignedTo.filter((a) => !!a);
  if (typeof assignedTo === 'string' && assignedTo.startsWith('{')) {
    return assignedTo.slice(1, -1).split(',').filter((s) => s.length > 0);
  }
  return [assignedTo];
}

/** Normalise un statut (FR/EN, accentué) vers le statut DB autorisé. */
export function normalizeTaskStatus(status?: string | null, progress?: number): TaskStatus {
  const key = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const map: Record<string, TaskStatus> = {
    termine: TaskStatus.COMPLETED,
    terminee: TaskStatus.COMPLETED,
    completed: TaskStatus.COMPLETED,
    done: TaskStatus.COMPLETED,
    en_cours: TaskStatus.IN_PROGRESS,
    in_progress: TaskStatus.IN_PROGRESS,
    started: TaskStatus.IN_PROGRESS,
    en_attente: TaskStatus.PENDING,
    planifie: TaskStatus.PENDING,
    planifiee: TaskStatus.PENDING,
    pending: TaskStatus.PENDING,
    not_started: TaskStatus.PENDING,
    todo: TaskStatus.PENDING,
    assigned: TaskStatus.PENDING,
    accepted: TaskStatus.IN_PROGRESS,
    delayed: TaskStatus.IN_PROGRESS,
    en_retard: TaskStatus.IN_PROGRESS,
    bloque: TaskStatus.IN_PROGRESS,
    bloquee: TaskStatus.IN_PROGRESS,
    blocked: TaskStatus.IN_PROGRESS,
    annule: TaskStatus.CANCELLED,
    annulee: TaskStatus.CANCELLED,
    cancelled: TaskStatus.CANCELLED,
    canceled: TaskStatus.CANCELLED,
    rejected: TaskStatus.CANCELLED,
  };
  if (map[key]) return map[key];
  if (progress != null) {
    if (progress >= 100) return TaskStatus.COMPLETED;
    if (progress > 0) return TaskStatus.IN_PROGRESS;
  }
  return TaskStatus.PENDING;
}

/** Normalise une priorité (FR/EN) vers la priorité DB autorisée. */
export function normalizeTaskPriority(priority?: string | null): TaskPriority {
  const key = (priority ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const map: Record<string, TaskPriority> = {
    basse: TaskPriority.LOW,
    faible: TaskPriority.LOW,
    low: TaskPriority.LOW,
    moyen: TaskPriority.MEDIUM,
    moyenne: TaskPriority.MEDIUM,
    normale: TaskPriority.MEDIUM,
    medium: TaskPriority.MEDIUM,
    normal: TaskPriority.MEDIUM,
    haute: TaskPriority.HIGH,
    elevee: TaskPriority.HIGH,
    high: TaskPriority.HIGH,
    urgente: TaskPriority.URGENT,
    urgent: TaskPriority.URGENT,
    critique: TaskPriority.URGENT,
    critical: TaskPriority.URGENT,
  };
  return map[key] ?? TaskPriority.MEDIUM;
}

// ============= Request DTOs (façade service) =============

/** Champs tolérés en entrée UI (compat héritée). */
export interface TaskAssignmentInputDTO extends CreateTaskAssignmentDTO {
  taskId?: string;
  assignmentNotes?: string;
}

export interface CreateTaskAssignmentRequestDTO {
  taskData: TaskAssignmentInputDTO;
  assignedBy?: string;
}

export interface UpdateTaskAssignmentRequestDTO {
  id: string;
  updates: UpdateTaskAssignmentDTO & { assignmentNotes?: string };
}

export interface DeleteTaskAssignmentRequestDTO {
  id: string;
}

export interface GetTaskAssignmentByIdRequestDTO {
  id: string;
}

export interface GetTaskAssignmentsRequestDTO {
  filters?: TaskAssignmentFiltersDTO;
}

export interface TaskAssignmentValidationResultDTO {
  isValid: boolean;
  errors: string[];
}
