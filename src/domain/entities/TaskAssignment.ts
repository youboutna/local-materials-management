/**
 * Domain Entity: TaskAssignment — SOURCE UNIQUE
 * Fusion Task + TaskAssignment sur la table `task_assignments`.
 * `assignedTo` est toujours un tableau d'UUID.
 */

import {
  AssigneeType,
  TaskAssignmentDTO,
  TaskPriority,
  TaskStatus,
  TaskType,
  normalizeTaskPriority,
  normalizeTaskStatus,
} from '@/dtos/entities/TaskAssignmentDTO';

export interface TaskAssignmentProps {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo?: string[];
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TaskAssignment {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | undefined,
    public projectId: string | undefined,
    public phaseId: string | undefined,
    public stepId: string | undefined,
    public assignedTo: string[],
    public assignedBy: string | undefined,
    public assigneeType: AssigneeType | undefined,
    public assigneeName: string | undefined,
    public assigneeEmail: string | undefined,
    public status: TaskStatus,
    public priority: TaskPriority,
    public progress: number,
    public type: TaskType | string | undefined,
    public startDate: Date | undefined,
    public endDate: Date | undefined,
    public dueDate: Date | undefined,
    public completedAt: Date | undefined,
    public estimatedDuration: number | undefined,
    public actualDuration: number | undefined,
    public dependencies: string[],
    public notes: string | undefined,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
    if (!id) throw new Error('TaskAssignment id is required');
    if (!title || title.trim().length === 0) throw new Error('TaskAssignment title is required');
  }

  // ============= Factory =============
  static create(props: TaskAssignmentProps): TaskAssignment {
    const now = new Date();
    return new TaskAssignment(
      props.id,
      props.title,
      props.description,
      props.projectId,
      props.phaseId,
      props.stepId,
      props.assignedTo ?? [],
      props.assignedBy,
      props.assigneeType,
      props.assigneeName,
      props.assigneeEmail,
      normalizeTaskStatus(props.status as string | undefined, props.progress),
      normalizeTaskPriority(props.priority as string | undefined),
      props.progress ?? 0,
      props.type,
      props.startDate,
      props.endDate,
      props.dueDate,
      props.completedAt,
      props.estimatedDuration,
      props.actualDuration,
      props.dependencies ?? [],
      props.notes,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  // ============= Business logic =============
  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaskStatus.COMPLETED && this.status !== TaskStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  getProgress(): number {
    return this.progress;
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    return Math.ceil((this.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  updateStatus(status: TaskStatus | string): void {
    this.status = normalizeTaskStatus(status as string);
    if (this.status === TaskStatus.COMPLETED) {
      this.completedAt = new Date();
      this.progress = 100;
    }
    this.updatedAt = new Date();
  }

  assignTo(assignees: string[], assigneeType?: AssigneeType): void {
    this.assignedTo = assignees ?? [];
    if (assigneeType) this.assigneeType = assigneeType;
    this.updatedAt = new Date();
  }

  // ============= DTO =============
  toDTO(): TaskAssignmentDTO {
    return {
      id: this.id,
      title: this.title,
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
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      dueDate: this.dueDate?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      estimatedDuration: this.estimatedDuration,
      actualDuration: this.actualDuration,
      dependencies: this.dependencies,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export default TaskAssignment;
