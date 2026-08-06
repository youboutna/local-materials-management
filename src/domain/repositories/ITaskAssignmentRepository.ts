import { TaskAssignment } from '@/domain/entities/TaskAssignment';

/**
 * Repository unique des tâches assignées (table `task_assignments`).
 * Fusion Task + TaskAssignment.
 */
export interface ITaskAssignmentRepository {
  save(task: TaskAssignment): Promise<TaskAssignment>;
  findById(id: string): Promise<TaskAssignment | null>;
  findAll(): Promise<TaskAssignment[]>;
  findByProjectId(projectId: string): Promise<TaskAssignment[]>;
  findByPhaseId(phaseId: string): Promise<TaskAssignment[]>;
  findByStepId(stepId: string): Promise<TaskAssignment[]>;
  findByAssignee(assigneeId: string): Promise<TaskAssignment[]>;
  /** Alias historique de findByAssignee. */
  findByAssignedTo(assigneeId: string): Promise<TaskAssignment[]>;
  findByAssignedBy(assignerId: string): Promise<TaskAssignment[]>;
  findByStatus(status: string): Promise<TaskAssignment[]>;
  findByPriority(priority: string): Promise<TaskAssignment[]>;
  findOverdue(): Promise<TaskAssignment[]>;
  findDueSoon(days: number): Promise<TaskAssignment[]>;
  findDueBetween(start: string, end: string): Promise<TaskAssignment[]>;
  findWithFilters(filters: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    projectId?: string;
    phaseId?: string;
  }): Promise<TaskAssignment[]>;
  update(id: string, task: TaskAssignment | Partial<TaskAssignment>): Promise<TaskAssignment>;
  delete(id: string): Promise<void>;
}
