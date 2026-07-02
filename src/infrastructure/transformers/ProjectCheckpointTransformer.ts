// @ts-nocheck
import { ProjectCheckpoint } from '@/domain/entities/ProjectCheckpoint';
import { ProjectCheckpointDTO } from '@/dtos/transforms/ProjectCheckpointDTO';

export class ProjectCheckpointTransformer {
  static toDTO(checkpoint: ProjectCheckpoint): ProjectCheckpointDTO {
    return {
      id: checkpoint.id,
      project_id: checkpoint.projectId || '',
      status: checkpoint.status as 'pending' | 'completed',
      date: checkpoint.date || new Date().toISOString()
    };
  }

  static fromDTO(dto: ProjectCheckpointDTO): ProjectCheckpoint {
    return {
      ...dto,
      projectId: dto.project_id || ''
    };
  }
}
