import { UnifiedTaskAssignment } from '@/domain/entities/UnifiedTaskAssignment';

/**
 * Repository unifié des tâches assignées (table `task_assignments`).
 */
export interface IUnifiedTaskAssignmentRepository {
  save(task: UnifiedTaskAssignment): Promise<UnifiedTaskAssignment>;
  findById(id: string): Promise<UnifiedTaskAssignment | null>;
  findAll(): Promise<UnifiedTaskAssignment[]>;
  findByProjectId(projectId: string): Promise<UnifiedTaskAssignment[]>;
  findByPhaseId(phaseId: string): Promise<UnifiedTaskAssignment[]>;
  findByAssignee(assigneeId: string): Promise<UnifiedTaskAssignment[]>;
  findByStatus(status: string): Promise<UnifiedTaskAssignment[]>;
  findOverdue(): Promise<UnifiedTaskAssignment[]>;
  findDueBetween(start: string, end: string): Promise<UnifiedTaskAssignment[]>;
  update(id: string, task: UnifiedTaskAssignment): Promise<UnifiedTaskAssignment>;
  delete(id: string): Promise<void>;
}
