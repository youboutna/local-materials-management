/**
 * Project Checkpoint Transformer
 * Handles conversion between checkpoint entities and DTOs
 */

export interface ProjectCheckpoint {
  id: string;
  projectId: string;
  status: string;
  date: string;
}

export interface ProjectCheckpointDTO {
  id: string;
  project_id: string;
  status: 'pending' | 'completed';
  date: string;
}

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
      id: dto.id,
      projectId: dto.project_id || '',
      status: dto.status,
      date: dto.date
    };
  }
}
