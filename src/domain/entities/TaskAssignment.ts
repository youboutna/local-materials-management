import {
  AssigneeType,
  TaskPriority,
  TaskStatus,
  TaskType,
  ActionType,
} from '@/dtos/entities/TaskAssignmentDTO';

export interface TaskAssignmentProps {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo: string[];
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  type?: TaskType | string;
  actionType?: ActionType | string;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export class TaskAssignment {
  public readonly id: string;
  public title: string;
  public description?: string;
  public projectId?: string;
  public phaseId?: string;
  public stepId?: string;
  public assignedTo: string[];
  public assignedBy?: string;
  public assigneeType?: AssigneeType;
  public assigneeName?: string;
  public assigneeEmail?: string;
  public status: TaskStatus;
  public priority: TaskPriority;
  public progress: number;
  public type?: TaskType | string;
  public actionType?: ActionType | string;
  public startDate?: Date;
  public endDate?: Date;
  public dueDate?: Date;
  public completedAt?: Date;
  public estimatedDuration?: number;
  public actualDuration?: number;
  public quantity?: number;
  public unit?: string;
  public dailyRate?: number;
  public estimatedCost?: number;
  public actualCost?: number;
  public dependencies?: string[];
  public notes?: string;
  public metadata?: Record<string, unknown>;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: TaskAssignmentProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.projectId = props.projectId;
    this.phaseId = props.phaseId;
    this.stepId = props.stepId;
    this.assignedTo = props.assignedTo;
    this.assignedBy = props.assignedBy;
    this.assigneeType = props.assigneeType;
    this.assigneeName = props.assigneeName;
    this.assigneeEmail = props.assigneeEmail;
    this.status = props.status;
    this.priority = props.priority;
    this.progress = props.progress;
    this.type = props.type;
    this.actionType = props.actionType ?? ActionType.TASK_ASSIGNMENT;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.dueDate = props.dueDate;
    this.completedAt = props.completedAt;
    this.estimatedDuration = props.estimatedDuration;
    this.actualDuration = props.actualDuration;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.dailyRate = props.dailyRate;
    this.estimatedCost = props.estimatedCost;
    this.actualCost = props.actualCost;
    this.dependencies = props.dependencies;
    this.notes = props.notes;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: Partial<TaskAssignmentProps> & { title: string }): TaskAssignment {
    const now = new Date();
    return new TaskAssignment({
      id: props.id ?? crypto.randomUUID(),
      title: props.title,
      description: props.description,
      projectId: props.projectId,
      phaseId: props.phaseId,
      stepId: props.stepId,
      assignedTo: props.assignedTo ?? [],
      assignedBy: props.assignedBy,
      assigneeType: props.assigneeType,
      assigneeName: props.assigneeName,
      assigneeEmail: props.assigneeEmail,
      // ✅ v2.1 : ASSIGNED par défaut (au lieu de PENDING)
      status: props.status ?? TaskStatus.ASSIGNED,
      priority: props.priority ?? TaskPriority.MEDIUM,
      progress: props.progress ?? 0,
      type: props.type,
      actionType: props.actionType ?? ActionType.TASK_ASSIGNMENT,
      startDate: props.startDate,
      endDate: props.endDate,
      dueDate: props.dueDate,
      completedAt: props.completedAt,
      estimatedDuration: props.estimatedDuration,
      actualDuration: props.actualDuration,
      quantity: props.quantity,
      unit: props.unit,
      dailyRate: props.dailyRate,
      estimatedCost: props.estimatedCost,
      actualCost: props.actualCost,
      dependencies: props.dependencies,
      notes: props.notes,
      metadata: props.metadata,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  toDTO() {
    return {
      id: this.id,
      title: this.title,
      name: this.title,
      description: this.description,
      projectId: this.projectId,
      phaseId: this.phaseId,
      stepId: this.stepId,
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
      assigneeType: this.assigneeType,
      assigneeName: this.assigneeName,
      assigneeEmail: this.assigneeEmail,
      status: this.status,
      priority: this.priority,
      progress: this.progress,
      type: this.type,
      actionType: this.actionType,
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      dueDate: this.dueDate?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      estimatedDuration: this.estimatedDuration,
      actualDuration: this.actualDuration,
      quantity: this.quantity,
      unit: this.unit,
      dailyRate: this.dailyRate,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      dependencies: this.dependencies,
      notes: this.notes,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.CANCELLED) {
      return false;
    }
    return this.dueDate.getTime() < Date.now();
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const diff = this.dueDate.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  updateStatus(status: TaskStatus): void {
    this.status = status;
    if (status === TaskStatus.COMPLETED) {
      this.progress = 100;
      this.completedAt = new Date();
    }
    this.updatedAt = new Date();
  }
}

export default TaskAssignment;