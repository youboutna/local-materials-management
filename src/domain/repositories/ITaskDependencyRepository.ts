/**
 * Task Dependency Repository Port (btp.task_dependencies)
 */

export interface TaskDependencyRow {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType?: string | null;
  lagDays?: number | null;
  createdAt?: string | null;
}

export interface ITaskDependencyRepository {
  findByTaskIds(taskIds: string[]): Promise<TaskDependencyRow[]>;
  create(dependency: Partial<TaskDependencyRow>): Promise<TaskDependencyRow>;
  delete(id: string): Promise<void>;
}
