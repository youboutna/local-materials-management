/**
 * Interface for Task Repository
 * Defines the contract for task data access operations
 */

import { TaskDTO, CreateTaskDTO, UpdateTaskDTO } from '@/types/task-dto';

export interface ITaskRepository {
  // ============= CRUD Operations =============
  findById(id: string): Promise<TaskDTO | null>;
  findAll(filters?: Record<string, any>): Promise<TaskDTO[]>;
  create(data: CreateTaskDTO): Promise<TaskDTO>;
  update(id: string, data: UpdateTaskDTO): Promise<TaskDTO>;
  delete(id: string): Promise<void>;

  // ============= Task-Specific Operations =============
  findByProjectId(projectId: string): Promise<TaskDTO[]>;
  findByStatus(status: string): Promise<TaskDTO[]>;
  findByAssignee(assigneeId: string): Promise<TaskDTO[]>;
  findOverdue(): Promise<TaskDTO[]>;
  findUpcoming(days: number): Promise<TaskDTO[]>;
}
