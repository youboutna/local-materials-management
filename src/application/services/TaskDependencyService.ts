/**
 * TaskDependencyService — btp.task_dependencies
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type {
  ITaskDependencyRepository,
  TaskDependencyRow,
} from '@/domain/repositories/ITaskDependencyRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class TaskDependencyService {
  constructor(private repository: ITaskDependencyRepository) {}

  async getByTaskIds(taskIds: string[]): Promise<TaskDependencyRow[]> {
    return this.repository.findByTaskIds(taskIds ?? []);
  }

  async create(taskId: string, dependsOnTaskId: string, options?: { dependencyType?: string; lagDays?: number }) {
    if (!taskId || !dependsOnTaskId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Both task IDs are required');
    }
    if (taskId === dependsOnTaskId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'A task cannot depend on itself');
    }
    return this.repository.create({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      dependency_type: options?.dependencyType ?? 'finish-to-start',
      lag_days: options?.lagDays ?? 0,
    });
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Dependency ID is required');
    await this.repository.delete(id);
  }
}

let instance: TaskDependencyService | null = null;

export function getTaskDependencyService(): TaskDependencyService {
  if (!instance) {
    instance = new TaskDependencyService(RepositoryFactory.getTaskDependencyRepository());
  }
  return instance;
}
