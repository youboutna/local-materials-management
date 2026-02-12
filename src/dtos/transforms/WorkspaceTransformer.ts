import { Workspace, OperationalStatus } from '@/domain/entities/Workspace';
import { GeographicUnit } from '@/types/mauritania';
import { WorkspaceDTO, CreateWorkspaceRequestDTO, UpdateWorkspaceRequestDTO } from '@/dtos/entities/WorkspaceDTO';

export class WorkspaceTransformer {
  static toDTO(workspace: Workspace): WorkspaceDTO {
    return {
      id: workspace.id,
      workspaceId: workspace.workspaceId,
      workspaceCode: workspace.workspaceCode,
      name: workspace.name,
      location: {
        code: workspace.location.code,
        name: workspace.location.name,
        nameAr: workspace.location.nameAr,
        type: this.getGeographicType(workspace.location),
        parentCode: this.getParentCode(workspace.location),
        population: workspace.location.population,
        coordinates: workspace.location.lat && workspace.location.lng ? {
          latitude: workspace.location.lat,
          longitude: workspace.location.lng
        } : undefined
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
    const geographicUnit: GeographicUnit = {
      code: dto.location.code,
      name: dto.location.name,
      nameAr: dto.location.nameAr,
      lat: dto.location.coordinates?.latitude || 0,
      lng: dto.location.coordinates?.longitude || 0,
      population: dto.location.population
    };

    return {
      workspaceId: dto.workspaceId,
      workspaceCode: dto.workspaceCode,
      name: dto.name,
      location: geographicUnit,
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
      const geographicUnit: GeographicUnit = {
        code: dto.location.code,
        name: dto.location.name,
        nameAr: dto.location.nameAr,
        lat: dto.location.coordinates?.latitude || 0,
        lng: dto.location.coordinates?.longitude || 0,
        population: dto.location.population
      };
      result.location = geographicUnit;
    }

    return result;
  }

  static toEntity(dto: WorkspaceDTO): Workspace {
    const geographicUnit: GeographicUnit = {
      code: dto.location.code,
      name: dto.location.name,
      nameAr: dto.location.nameAr,
      lat: dto.location.coordinates?.latitude || 0,
      lng: dto.location.coordinates?.longitude || 0,
      population: dto.location.population
    };

    return {
      id: dto.id,
      workspaceId: dto.workspaceId,
      workspaceCode: dto.workspaceCode,
      name: dto.name,
      location: geographicUnit,
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

  // Helper methods to determine geographic type and parent code
  private static getGeographicType(location: GeographicUnit): 'region' | 'city' | 'port' | 'university' {
    // This is a simplified logic - you may need to enhance this based on your specific requirements
    if (location.economicImportance === 'capital') return 'region';
    if (location.economicImportance === 'economic') return 'city';
    // You could add more sophisticated logic here based on your data
    return 'city';
  }

  private static getParentCode(location: GeographicUnit): string | undefined {
    // This would need to be implemented based on your geographic hierarchy
    // For now, returning undefined as it's optional
    return undefined;
  }
}
