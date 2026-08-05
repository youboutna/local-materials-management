/**
 * Unified TaskAssignment Service - Hexagonal Architecture
 * Service unique pour les tâches assignées (fusion Task + TaskAssignment).
 */

import { UnifiedTaskAssignment } from '@/domain/entities/UnifiedTaskAssignment';
import { IUnifiedTaskAssignmentRepository } from '@/domain/repositories/IUnifiedTaskAssignmentRepository';
import {
  CreateUnifiedTaskAssignmentDTO,
  UnifiedTaskAssignmentDTO,
  UnifiedTaskStatus,
  UpdateUnifiedTaskAssignmentDTO,
  normalizeAssignedTo,
  normalizeUnifiedPriority,
} from '@/dtos/entities/UnifiedTaskAssignmentDTO';
import { UnifiedTaskAssignmentTransformer } from '@/dtos/transforms/UnifiedTaskAssignmentTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class UnifiedTaskAssignmentService {
  private readonly repository: IUnifiedTaskAssignmentRepository;

  constructor(repository?: IUnifiedTaskAssignmentRepository) {
    this.repository = repository ?? RepositoryFactory.getUnifiedTaskAssignmentRepository();
  }

  // ============= CRUD =============
  async create(dto: CreateUnifiedTaskAssignmentDTO): Promise<UnifiedTaskAssignmentDTO> {
    if (!dto.title) throw new Error('Task title is required');
    const entity = UnifiedTaskAssignmentTransformer.toEntity(dto);
    const saved = await this.repository.save(entity);
    return saved.toDTO();
  }

  async getById(id: string): Promise<UnifiedTaskAssignmentDTO | null> {
    const entity = await this.repository.findById(id);
    return entity ? entity.toDTO() : null;
  }

  async getAll(): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findAll();
    return entities.map((e) => e.toDTO());
  }

  async update(id: string, dto: UpdateUnifiedTaskAssignmentDTO): Promise<UnifiedTaskAssignmentDTO> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error('TaskAssignment not found');

    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.projectId !== undefined) entity.projectId = dto.projectId;
    if (dto.phaseId !== undefined) entity.phaseId = dto.phaseId;
    if (dto.priority !== undefined) entity.priority = normalizeUnifiedPriority(dto.priority as string);
    if (dto.progress !== undefined) entity.progress = dto.progress;
    if (dto.startDate !== undefined) entity.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    if (dto.endDate !== undefined) entity.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (dto.dueDate !== undefined) entity.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.assignedTo !== undefined) entity.assignedTo = normalizeAssignedTo(dto.assignedTo);
    if (dto.assignedBy !== undefined) entity.assignedBy = dto.assignedBy;
    if (dto.assigneeType !== undefined) entity.assigneeType = dto.assigneeType;
    if (dto.assigneeName !== undefined) entity.assigneeName = dto.assigneeName;
    if (dto.assigneeEmail !== undefined) entity.assigneeEmail = dto.assigneeEmail;
    if (dto.notes !== undefined) entity.notes = dto.notes;
    if (dto.status !== undefined) entity.updateStatus(dto.status as UnifiedTaskStatus);

    entity.updatedAt = new Date();
    const saved = await this.repository.update(id, entity);
    return saved.toDTO();
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ============= Queries =============
  async getByProject(projectId: string): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findByProjectId(projectId);
    return entities.map((e) => e.toDTO());
  }

  async getByPhase(phaseId: string): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findByPhaseId(phaseId);
    return entities.map((e) => e.toDTO());
  }

  async getByAssignee(assigneeId: string): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findByAssignee(assigneeId);
    return entities.map((e) => e.toDTO());
  }

  async getByStatus(status: string): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findByStatus(status);
    return entities.map((e) => e.toDTO());
  }

  async getOverdue(): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findOverdue();
    return entities.map((e) => e.toDTO());
  }

  async getDueBetween(start: string, end: string): Promise<UnifiedTaskAssignmentDTO[]> {
    const entities = await this.repository.findDueBetween(start, end);
    return entities.map((e) => e.toDTO());
  }

  // ============= Status =============
  async updateStatus(id: string, status: UnifiedTaskStatus | string): Promise<UnifiedTaskAssignmentDTO> {
    return this.update(id, { status });
  }

  async markAsCompleted(id: string): Promise<UnifiedTaskAssignmentDTO> {
    return this.updateStatus(id, UnifiedTaskStatus.COMPLETED);
  }

  // ============= Stats =============
  async getStats(projectId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completionRate: number;
  }> {
    const entities: UnifiedTaskAssignment[] = projectId
      ? await this.repository.findByProjectId(projectId)
      : await this.repository.findAll();
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let overdue = 0;
    for (const task of entities) {
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
      if (task.isOverdue()) overdue += 1;
    }
    const completed = byStatus[UnifiedTaskStatus.COMPLETED] ?? 0;
    return {
      total: entities.length,
      byStatus,
      byPriority,
      overdue,
      completionRate: entities.length > 0 ? Math.round((completed / entities.length) * 100) : 0,
    };
  }
}

export const unifiedTaskAssignmentService = new UnifiedTaskAssignmentService();
