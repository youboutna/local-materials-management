/**
 * Domain Entity: TaskAssignment (unifiée)
 * Représente une tâche assignée — table unique `task_assignments`.
 * Fusion de Task et TaskAssignment : `assignedTo` est toujours un tableau d'UUID.
 */

import {
  UnifiedAssigneeType,
  UnifiedTaskAssignmentDTO,
  UnifiedTaskPriority,
  UnifiedTaskStatus,
  normalizeUnifiedPriority,
  normalizeUnifiedStatus,
} from '@/dtos/entities/UnifiedTaskAssignmentDTO';

export interface UnifiedTaskAssignmentProps {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  assignedTo?: string[];
  assignedBy?: string;
  assigneeType?: UnifiedAssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: UnifiedTaskStatus | string;
  priority?: UnifiedTaskPriority | string;
  progress?: number;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UnifiedTaskAssignment {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | undefined,
    public projectId: string | undefined,
    public phaseId: string | undefined,
    public assignedTo: string[],
    public assignedBy: string | undefined,
    public assigneeType: UnifiedAssigneeType | undefined,
    public assigneeName: string | undefined,
    public assigneeEmail: string | undefined,
    public status: UnifiedTaskStatus,
    public priority: UnifiedTaskPriority,
    public progress: number,
    public startDate: Date | undefined,
    public endDate: Date | undefined,
    public dueDate: Date | undefined,
    public completedAt: Date | undefined,
    public notes: string | undefined,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
    if (!id) throw new Error('TaskAssignment id is required');
    if (!title || title.trim().length === 0) throw new Error('TaskAssignment title is required');
  }

  // ============= Factory =============
  static create(props: UnifiedTaskAssignmentProps): UnifiedTaskAssignment {
    const now = new Date();
    return new UnifiedTaskAssignment(
      props.id,
      props.title,
      props.description,
      props.projectId,
      props.phaseId,
      props.assignedTo ?? [],
      props.assignedBy,
      props.assigneeType,
      props.assigneeName,
      props.assigneeEmail,
      normalizeUnifiedStatus(props.status as string | undefined, props.progress),
      normalizeUnifiedPriority(props.priority as string | undefined),
      props.progress ?? 0,
      props.startDate,
      props.endDate,
      props.dueDate,
      props.completedAt,
      props.notes,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  // ============= Business logic =============
  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== UnifiedTaskStatus.COMPLETED && this.status !== UnifiedTaskStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === UnifiedTaskStatus.COMPLETED;
  }

  getProgress(): number {
    return this.progress;
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    return Math.ceil((this.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  updateStatus(status: UnifiedTaskStatus | string): void {
    this.status = normalizeUnifiedStatus(status as string);
    if (this.status === UnifiedTaskStatus.COMPLETED) {
      this.completedAt = new Date();
      this.progress = 100;
    }
    this.updatedAt = new Date();
  }

  assignTo(assignees: string[], assigneeType?: UnifiedAssigneeType): void {
    this.assignedTo = assignees ?? [];
    if (assigneeType) this.assigneeType = assigneeType;
    this.updatedAt = new Date();
  }

  // ============= DTO =============
  toDTO(): UnifiedTaskAssignmentDTO {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      projectId: this.projectId,
      phaseId: this.phaseId,
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
      assigneeType: this.assigneeType,
      assigneeName: this.assigneeName,
      assigneeEmail: this.assigneeEmail,
      status: this.status,
      priority: this.priority,
      progress: this.progress,
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      dueDate: this.dueDate?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
