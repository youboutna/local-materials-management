import { Workspace, OperationalStatus } from '@/domain/entities/Workspace';
import { WorkspaceDTO } from '@/dtos/entities/TaskAssignmentDTO';;

export class WorkspaceTransformer {
  static toDTO(workspace: Workspace): WorkspaceDTO {
    return {
      id: workspace.id,
      workspaceId: workspace.workspaceId,
      workspaceCode: workspace.workspaceCode,
      name: workspace.name,
      location: {
        code: workspace.location || '',
        name: workspace.location || '',
        nameAr: '',
        type: 'city',
        parentCode: undefined,
        population: undefined,
        coordinates: undefined
      },
      description: workspace.description,
      capacity: workspace.capacity,
      contact: workspace.contact,
      facilities: workspace.facilities,
      status: workspace.status,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString()
    };
  }

  static fromCreateDTO(dto: CreateWorkspaceRequestDTO): Omit<Workspace, 'id'> {
    return {
      workspaceId: dto.workspaceId,
      workspaceCode: dto.workspaceCode,
      name: dto.name,
      location: dto.location?.name || '',
      description: dto.description,
      capacity: dto.capacity,
      contact: dto.contact,
      facilities: dto.facilities,
      status: (dto.status as OperationalStatus) || OperationalStatus.active,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static fromUpdateDTO(dto: UpdateWorkspaceRequestDTO): Partial<Workspace> {
    const result: Partial<Workspace> = {
      workspaceId: dto.workspaceId,
      workspaceCode: dto.workspaceCode,
      name: dto.name,
      description: dto.description,
      capacity: dto.capacity,
      contact: dto.contact,
      facilities: dto.facilities,
      status: dto.status as OperationalStatus,
      updatedAt: new Date()
    };

    if (dto.location) {
      result.location = dto.location?.name || '';
    }

    return result;
  }

  static toEntity(dto: WorkspaceDTO): Workspace {
    return {
      id: dto.id,
      workspaceId: dto.workspaceId,
      workspaceCode: dto.workspaceCode,
      name: dto.name,
      location: dto.location?.name || '',
      description: dto.description,
      capacity: dto.capacity,
      contact: dto.contact,
      facilities: dto.facilities,
      status: dto.status as OperationalStatus,
      createdAt: new Date(dto.createdAt || new Date()),
      updatedAt: new Date(dto.updatedAt || new Date())
    };
  }

  static fromEntity(entity: Workspace): WorkspaceDTO {
    return this.toDTO(entity);
  }
}
