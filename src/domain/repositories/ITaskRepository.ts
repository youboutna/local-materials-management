// Repository interface for Task entity
import { Task } from '../entities/Task';
import { TaskStatus, TaskPriority } from '../types/TaskTypes';

export interface ITaskRepository {
  // CRUD operations
  findById(id: string): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  update(id: string, data: Partial<Task>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Task[]>;
  findByPhaseId(phaseId: string): Promise<Task[]>;
  findByStepId(stepId: string): Promise<Task[]>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findByPriority(priority: TaskPriority): Promise<Task[]>;
  findByAssignee(userId: string): Promise<Task[]>;
  
  // Date-based queries
  findDueBetween(startDate: string, endDate: string): Promise<Task[]>;
  findOverdue(): Promise<Task[]>;
  findDueToday(): Promise<Task[]>;
  
  // Statistics
  countByStatus(projectId: string): Promise<Record<TaskStatus, number>>;
  getCompletionRate(projectId: string): Promise<number>;
}
