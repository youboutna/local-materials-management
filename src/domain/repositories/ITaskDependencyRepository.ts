/**
 * Task Dependency Repository Port (btp.task_dependencies)
 */

export interface TaskDependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type?: string | null;
  lag_days?: number | null;
  created_at?: string | null;
}

export interface ITaskDependencyRepository {
  findByTaskIds(taskIds: string[]): Promise<TaskDependencyRow[]>;
  create(dependency: Partial<TaskDependencyRow>): Promise<TaskDependencyRow>;
  delete(id: string): Promise<void>;
}
