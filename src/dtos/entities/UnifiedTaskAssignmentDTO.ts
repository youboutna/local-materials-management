/**
 * Unified TaskAssignment DTO
 * Fusion Task + TaskAssignment — table unique `task_assignments`
 * assignedTo est TOUJOURS un tableau d'UUID côté DTO/entité.
 */

export enum UnifiedTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UnifiedTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export type UnifiedAssigneeType = 'supplier' | 'employee' | 'user';

export interface UnifiedTaskAssignmentDTO {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  assignedTo: string[];
  assignedBy?: string;
  assigneeType?: UnifiedAssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status: UnifiedTaskStatus | string;
  priority: UnifiedTaskPriority | string;
  progress: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnifiedTaskAssignmentDTO {
  id?: string;
  title: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  assignedTo?: string | string[];
  assignedBy?: string;
  assigneeType?: UnifiedAssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: UnifiedTaskStatus | string;
  priority?: UnifiedTaskPriority | string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface UpdateUnifiedTaskAssignmentDTO {
  title?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  status?: UnifiedTaskStatus | string;
  priority?: UnifiedTaskPriority | string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  assignedTo?: string | string[];
  assignedBy?: string;
  assigneeType?: UnifiedAssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  notes?: string;
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
export function normalizeUnifiedStatus(status?: string | null, progress?: number): UnifiedTaskStatus {
  const key = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const map: Record<string, UnifiedTaskStatus> = {
    termine: UnifiedTaskStatus.COMPLETED,
    terminee: UnifiedTaskStatus.COMPLETED,
    completed: UnifiedTaskStatus.COMPLETED,
    done: UnifiedTaskStatus.COMPLETED,
    en_cours: UnifiedTaskStatus.IN_PROGRESS,
    in_progress: UnifiedTaskStatus.IN_PROGRESS,
    started: UnifiedTaskStatus.IN_PROGRESS,
    en_attente: UnifiedTaskStatus.PENDING,
    planifie: UnifiedTaskStatus.PENDING,
    planifiee: UnifiedTaskStatus.PENDING,
    pending: UnifiedTaskStatus.PENDING,
    not_started: UnifiedTaskStatus.PENDING,
    assigned: UnifiedTaskStatus.PENDING,
    delayed: UnifiedTaskStatus.IN_PROGRESS,
    en_retard: UnifiedTaskStatus.IN_PROGRESS,
    bloquee: UnifiedTaskStatus.IN_PROGRESS,
    blocked: UnifiedTaskStatus.IN_PROGRESS,
    annule: UnifiedTaskStatus.CANCELLED,
    annulee: UnifiedTaskStatus.CANCELLED,
    cancelled: UnifiedTaskStatus.CANCELLED,
  };
  if (map[key]) return map[key];
  if (progress != null) {
    if (progress >= 100) return UnifiedTaskStatus.COMPLETED;
    if (progress > 0) return UnifiedTaskStatus.IN_PROGRESS;
  }
  return UnifiedTaskStatus.PENDING;
}

/** Normalise une priorité (FR/EN) vers la priorité DB autorisée. */
export function normalizeUnifiedPriority(priority?: string | null): UnifiedTaskPriority {
  const key = (priority ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const map: Record<string, UnifiedTaskPriority> = {
    basse: UnifiedTaskPriority.LOW,
    faible: UnifiedTaskPriority.LOW,
    low: UnifiedTaskPriority.LOW,
    moyen: UnifiedTaskPriority.MEDIUM,
    moyenne: UnifiedTaskPriority.MEDIUM,
    medium: UnifiedTaskPriority.MEDIUM,
    normal: UnifiedTaskPriority.MEDIUM,
    haute: UnifiedTaskPriority.HIGH,
    elevee: UnifiedTaskPriority.HIGH,
    high: UnifiedTaskPriority.HIGH,
    urgente: UnifiedTaskPriority.URGENT,
    urgent: UnifiedTaskPriority.URGENT,
    critique: UnifiedTaskPriority.URGENT,
    critical: UnifiedTaskPriority.URGENT,
  };
  return map[key] ?? UnifiedTaskPriority.MEDIUM;
}
