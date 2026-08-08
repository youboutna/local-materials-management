/**
 * TaskAssignment Service — SOURCE UNIQUE (Hexagonal)
 * Fusion définitive Task + TaskAssignment sur la table `task_assignments`.
 */

import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import {
  CreateTaskAssignmentDTO,
  CreateTaskAssignmentRequestDTO,
  DeleteTaskAssignmentRequestDTO,
  GetTaskAssignmentByIdRequestDTO,
  GetTaskAssignmentsRequestDTO,
  TaskAssignmentDTO,
  TaskAssignmentFiltersDTO,
  TaskAssignmentStatsDTO,
  TaskStatus,
  UpdateTaskAssignmentDTO,
  UpdateTaskAssignmentRequestDTO,
  normalizeAssignedTo,
  normalizeTaskPriority,
  normalizeTaskStatus,
} from '@/dtos/entities/TaskAssignmentDTO';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class TaskAssignmentService {
  private readonly repository: ITaskAssignmentRepository;

  constructor(repository?: ITaskAssignmentRepository) {
    this.repository = repository ?? RepositoryFactory.getTaskAssignmentRepository();
  }

  // ============= CRUD (API simple) =============
  async create(dto: CreateTaskAssignmentDTO): Promise<TaskAssignmentDTO> {
    if (!dto.title) throw new Error('Task title is required');
    const entity = TaskAssignmentTransformer.toEntity(dto);
    const saved = await this.repository.save(entity);
    return saved.toDTO();
  }

  async getById(id: string): Promise<TaskAssignmentDTO | null> {
    const entity = await this.repository.findById(id);
    return entity ? entity.toDTO() : null;
  }

  async getAll(): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findAll();
    return entities.map((e) => e.toDTO());
  }

  async update(id: string, dto: UpdateTaskAssignmentDTO): Promise<TaskAssignmentDTO> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error('TaskAssignment not found');

    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.projectId !== undefined) entity.projectId = dto.projectId;
    if (dto.phaseId !== undefined) entity.phaseId = dto.phaseId;
    if (dto.stepId !== undefined) entity.stepId = dto.stepId;
    if (dto.priority !== undefined) entity.priority = normalizeTaskPriority(dto.priority as string);
    if (dto.progress !== undefined) entity.progress = dto.progress;
    if (dto.type !== undefined) entity.type = dto.type;
    if (dto.startDate !== undefined) entity.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    if (dto.endDate !== undefined) entity.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (dto.dueDate !== undefined) entity.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.assignedTo !== undefined) entity.assignedTo = normalizeAssignedTo(dto.assignedTo);
    if (dto.assignedBy !== undefined) entity.assignedBy = dto.assignedBy;
    if (dto.assigneeType !== undefined) entity.assigneeType = dto.assigneeType;
    if (dto.assigneeName !== undefined) entity.assigneeName = dto.assigneeName;
    if (dto.assigneeEmail !== undefined) entity.assigneeEmail = dto.assigneeEmail;
    if (dto.estimatedDuration !== undefined) entity.estimatedDuration = dto.estimatedDuration;
    if (dto.actualDuration !== undefined) entity.actualDuration = dto.actualDuration;
    if (dto.dependencies !== undefined) entity.dependencies = dto.dependencies;
    if (dto.notes !== undefined) entity.notes = dto.notes;
    if (dto.status !== undefined) entity.updateStatus(normalizeTaskStatus(dto.status as string));

    entity.updatedAt = new Date();
    const saved = await this.repository.update(id, entity);
    return saved.toDTO();
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ============= Façade "request DTO" (compat UI) =============
  async createTaskAssignment(request: CreateTaskAssignmentRequestDTO): Promise<TaskAssignmentDTO> {
    const { taskData } = request;
    return this.create({
      ...taskData,
      id: taskData.id ?? taskData.taskId,
      assignedBy: request.assignedBy ?? taskData.assignedBy,
      notes: taskData.notes ?? taskData.assignmentNotes,
    });
  }

  async updateTaskAssignment(request: UpdateTaskAssignmentRequestDTO): Promise<TaskAssignmentDTO> {
    const { updates } = request;
    return this.update(request.id, {
      ...updates,
      notes: updates.notes ?? updates.assignmentNotes,
    });
  }

  async deleteTaskAssignment(request: DeleteTaskAssignmentRequestDTO): Promise<void> {
    await this.delete(request.id);
  }

  async getTaskAssignmentById(request: GetTaskAssignmentByIdRequestDTO): Promise<TaskAssignmentDTO | null> {
    return this.getById(request.id);
  }

  async getAllTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    return this.getAll();
  }

  async getTaskAssignments(request: GetTaskAssignmentsRequestDTO = {}): Promise<TaskAssignmentDTO[]> {
    return this.search(request.filters ?? {});
  }

  // ============= Queries =============
  async search(filters: TaskAssignmentFiltersDTO): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findWithFilters(filters);
    return entities.map((e) => e.toDTO());
  }

  async getByProject(projectId: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByProjectId(projectId);
    return entities.map((e) => e.toDTO());
  }

  async getByPhase(phaseId: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByPhaseId(phaseId);
    return entities.map((e) => e.toDTO());
  }

  async getByStep(stepId: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByStepId(stepId);
    return entities.map((e) => e.toDTO());
  }

  async getByAssignee(assigneeId: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByAssignee(assigneeId);
    return entities.map((e) => e.toDTO());
  }

  async getByAssigner(assignerId: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByAssignedBy(assignerId);
    return entities.map((e) => e.toDTO());
  }

  async getByStatus(status: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByStatus(normalizeTaskStatus(status));
    return entities.map((e) => e.toDTO());
  }

  async getByPriority(priority: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findByPriority(normalizeTaskPriority(priority));
    return entities.map((e) => e.toDTO());
  }

  async getOverdue(): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findOverdue();
    return entities.map((e) => e.toDTO());
  }

  async getDueSoon(days = 7): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findDueSoon(days);
    return entities.map((e) => e.toDTO());
  }

  async getDueBetween(start: string, end: string): Promise<TaskAssignmentDTO[]> {
    const entities = await this.repository.findDueBetween(start, end);
    return entities.map((e) => e.toDTO());
  }

  // ============= Status =============
  async updateStatus(id: string, status: TaskStatus | string): Promise<TaskAssignmentDTO> {
    return this.update(id, { status });
  }

  async markAsCompleted(id: string): Promise<TaskAssignmentDTO> {
    return this.updateStatus(id, TaskStatus.COMPLETED);
  }

  // ============= Stats =============
  async getStats(projectId?: string): Promise<TaskAssignmentStatsDTO> {
    const entities: TaskAssignment[] = projectId
      ? await this.repository.findByProjectId(projectId)
      : await this.repository.findAll();

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;

    entities.forEach((task) => {
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
      if (task.isOverdue()) overdue += 1;
      const days = task.getDaysUntilDue();
      if (days !== null && days >= 0 && days <= 7) dueSoon += 1;
      if (task.isCompleted()) completed += 1;
    });

    return {
      total: entities.length,
      byStatus,
      byPriority,
      overdue,
      dueSoon,
      completionRate: entities.length > 0 ? Math.round((completed / entities.length) * 100) : 0,
    };
  }
}

export default TaskAssignmentService;

let taskAssignmentServiceInstance: TaskAssignmentService | null = null;
export function getTaskAssignmentService(): TaskAssignmentService {
  if (!taskAssignmentServiceInstance) {
    taskAssignmentServiceInstance = new TaskAssignmentService();
  }
  return taskAssignmentServiceInstance;
}
