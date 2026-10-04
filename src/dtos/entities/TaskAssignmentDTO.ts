import { ENUM_LABELS, type EnumLabel } from '@/config/referentials/i18n/enum-labels.referential';

/**
 * TaskAssignment Data Transfer Objects — SOURCE UNIQUE
 *
 * v2.1 : Alignement sur la contrainte DB task_assignments_status_check :
 *        CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
 *        - PENDING est alias de ASSIGNED
 *        - BLOCKED est alias de IN_PROGRESS
 */

export enum TaskStatus {
  /** ✅ Valeur DB officielle pour une tâche non commencée */
  ASSIGNED = 'assigned',
  /** @deprecated Alias de ASSIGNED — conservé pour compatibilité */
  PENDING = 'assigned',
  IN_PROGRESS = 'in_progress',
  /** @deprecated Alias de IN_PROGRESS — 'blocked' n'existe pas en DB */
  BLOCKED = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'urgent',
}

export type AssigneeType = 'supplier' | 'employee' | 'user' | 'external';

export enum TaskType {
  GENERAL = 'general',
  INSPECTION = 'inspection',
  DOCUMENT = 'document',
  PAYMENT = 'payment',
  MATERIAL = 'material',
  STUDY = 'study',
  EXECUTION = 'execution',
}

export enum ActionType {
  TASK_ASSIGNMENT = 'task_assignment',
  SCHEDULE_INSPECTION = 'schedule_inspection',
  SCHEDULE_CALL = 'schedule_call',
  INFORM_HIERARCHY = 'inform_hierarchy',
  SEND_NOTIFICATION = 'send_notification',
  ASSIGN_TASK = 'assign_task',
  APPROVE_PAYMENT = 'approve_payment',
  ESCALATE_ISSUE = 'escalate_issue',
  REQUEST_DOCUMENT = 'request_document',
  SCHEDULE_MEETING = 'schedule_meeting',
  HIERARCHY_NOTIFICATION = 'hierarchy_notification',
  SMS = 'sms',
  CALL = 'call',
  EMAIL = 'email',
  MAIL = 'mail',
  EXPORT_RECEIPT = 'export_receipt',
  BLOCKCHAIN_VERIFICATION = 'blockchain_verification',
  TASK = 'task',
  GENERAL = 'general',
}

export interface TaskAssignmentDTO {
  id: string;
  title: string;
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo: string[];
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  progress: number;
  type?: TaskType | string;
  actionType?: ActionType | string;
  action_type?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  quantity?: number;
  unit?: string;
  dailyRate?: number;
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
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo?: string | string[];
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  actionType?: ActionType | string;
  action_type?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedDuration?: number;
  estimatedHours?: number;
  actualHours?: number;
  quantity?: number;
  unit?: string;
  dailyRate?: number;
  estimatedCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskAssignmentDTO {
  title?: string;
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  actionType?: ActionType | string;
  action_type?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string | string[];
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  quantity?: number;
  unit?: string;
  dailyRate?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskAssignmentFiltersDTO {
  searchTerm?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  projectId?: string;
  phaseId?: string;
  actionType?: string;
}

export interface TaskAssignmentStatsDTO {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byActionType?: Record<string, number>;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

export function normalizeAssignedTo(assignedTo?: string | string[] | null): string[] {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) return assignedTo.filter((a) => !!a);
  if (typeof assignedTo === 'string' && assignedTo.startsWith('{')) {
    return assignedTo.slice(1, -1).split(',').filter((s) => s.length > 0);
  }
  return [assignedTo];
}

/**
 * ✅ v2.1 : Toutes les valeurs 'pending' / 'todo' / 'not_started' etc.
 * sont mappées vers TaskStatus.ASSIGNED (= 'assigned' en DB).
 * Toutes les valeurs 'blocked' / 'delayed' / 'en_retard' sont mappées
 * vers TaskStatus.IN_PROGRESS (= 'in_progress' en DB).
 */
export function normalizeTaskStatus(status?: string | null, progress?: number): TaskStatus {
  const key = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const map: Record<string, TaskStatus> = {
    // ─── Completed ───
    termine: TaskStatus.COMPLETED,
    terminee: TaskStatus.COMPLETED,
    completed: TaskStatus.COMPLETED,
    done: TaskStatus.COMPLETED,

    // ─── In Progress ───
    encours: TaskStatus.IN_PROGRESS,
    inprogress: TaskStatus.IN_PROGRESS,
    started: TaskStatus.IN_PROGRESS,
    accepted: TaskStatus.IN_PROGRESS,
    delayed: TaskStatus.IN_PROGRESS,
    enretard: TaskStatus.IN_PROGRESS,
    bloque: TaskStatus.IN_PROGRESS,
    bloquee: TaskStatus.IN_PROGRESS,
    blocked: TaskStatus.IN_PROGRESS,

    // ─── Assigned (ex-Pending) ───
    enattente: TaskStatus.ASSIGNED,
    planifie: TaskStatus.ASSIGNED,
    planifiee: TaskStatus.ASSIGNED,
    pending: TaskStatus.ASSIGNED,
    notstarted: TaskStatus.ASSIGNED,
    todo: TaskStatus.ASSIGNED,
    assigned: TaskStatus.ASSIGNED,

    // ─── Cancelled ───
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
  return TaskStatus.ASSIGNED;
}

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

export function normalizeActionType(
  actionType?: string | null,
  action_type?: string | null,
): string {
  const raw = (actionType ?? action_type ?? '').toString().trim();
  return raw || ActionType.TASK_ASSIGNMENT;
}

// ============= Request DTOs =============

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

export const TASK_STATUS_LABELS: Readonly<Record<TaskStatus, EnumLabel>> =
    ENUM_LABELS.TaskStatus as Readonly<Record<TaskStatus, EnumLabel>>;

export const TASK_PRIORITY_LABELS: Readonly<Record<TaskPriority, EnumLabel>> =
    ENUM_LABELS.TaskPriority as Readonly<Record<TaskPriority, EnumLabel>>;

export const TASK_TYPE_LABELS: Readonly<Record<TaskType, EnumLabel>> =
    ENUM_LABELS.TaskType as Readonly<Record<TaskType, EnumLabel>>;