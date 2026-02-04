import { Workspace } from '@/domain/entities/Workspace';
import { WorkspaceDTO, CreateWorkspaceRequestDTO, UpdateWorkspaceRequestDTO } from '@/dtos/entities/WorkspaceDTO';

export class WorkspaceTransformer {
  static toDTO(workspace: Workspace): WorkspaceDTO {
    return {
      id: workspace.id,
      name: workspace.name,
      location: workspace.location,
      description: workspace.description,
      capacity: workspace.capacity,
      contactPhone: workspace.contactPhone,
      contactEmail: workspace.contactEmail,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  static fromCreateDTO(dto: CreateWorkspaceRequestDTO): Omit<Workspace, 'id'> {
    return {
      name: dto.name,
      location: dto.location,
      description: dto.description,
      capacity: dto.capacity,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static fromUpdateDTO(dto: UpdateWorkspaceRequestDTO): Partial<Workspace> {
    return {
      name: dto.name,
      location: dto.location,
      description: dto.description,
      capacity: dto.capacity,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      updatedAt: new Date().toISOString()
    };
  }
}
