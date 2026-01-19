import { Workspace, ProjectAlert, Action } from '@/domain/entities/Workspace';
import { 
  WorkspaceDTO, 
  CreateWorkspaceRequestDto, 
  UpdateWorkspaceRequestDto,
  ProjectAlertDTO,
  CreateProjectAlertRequestDto,
  UpdateProjectAlertRequestDto,
  ActionDTO,
  CreateActionRequestDto,
  UpdateActionRequestDto
} from './shared';
import { EntityToDTOMapper } from './shared';

export class WorkspaceDomainTransformer implements EntityToDTOMapper<Workspace, WorkspaceDTO> {
  
  /**
   * Convert Workspace entity to DTO
   */
  toDTO(entity: Workspace): WorkspaceDTO {
    return {
      id: entity.id,
      name: entity.name,
      location: entity.location,
      status: entity.status,
      contact_manager: entity.contactManager,
      contact_phone: entity.contactPhone,
      facilities: entity.facilities,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to Workspace entity
   */
  fromDTO(dto: WorkspaceDTO): Workspace {
    return {
      id: dto.id,
      name: dto.name,
      location: dto.location,
      status: dto.status,
      contactManager: dto.contact_manager,
      contactPhone: dto.contact_phone,
      facilities: dto.facilities,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  /**
   * Convert CreateWorkspaceRequestDto to entity
   */
  fromCreateDtoToEntity(dto: CreateWorkspaceRequestDto): Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: dto.name,
      location: dto.location,
      status: dto.status || 'active',
      contactManager: dto.contact_manager,
      contactPhone: dto.contact_phone,
      facilities: dto.facilities
    };
  }

  /**
   * Convert UpdateWorkspaceRequestDto to partial entity
   */
  fromUpdateDtoToEntity(dto: UpdateWorkspaceRequestDto): Partial<Workspace> {
    return {
      name: dto.name,
      location: dto.location,
      status: dto.status,
      contactManager: dto.contact_manager,
      contactPhone: dto.contact_phone,
      facilities: dto.facilities
    };
  }

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: WorkspaceDTO[]): WorkspaceDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: Workspace): WorkspaceDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): WorkspaceDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<UpdateWorkspaceRequestDto> {
    return dto;
  }
}

export class ProjectAlertDomainTransformer implements EntityToDTOMapper<ProjectAlert, ProjectAlertDTO> {
  
  /**
   * Convert ProjectAlert entity to DTO
   */
  toDTO(entity: ProjectAlert): ProjectAlertDTO {
    return {
      id: entity.id,
      project_id: entity.projectId,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      severity: entity.severity,
      source: entity.source,
      escalation_level: entity.escalationLevel,
      acknowledged: entity.acknowledged,
      acknowledged_at: entity.acknowledgedAt?.toISOString(),
      acknowledged_by: entity.acknowledgedBy,
      resolved: entity.resolved,
      resolved_at: entity.resolvedAt?.toISOString(),
      resolved_by: entity.resolvedBy,
      assigned_actions: entity.assignedActions,
      action_proofs: entity.actionProofs,
      metadata: entity.metadata,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to ProjectAlert entity
   */
  fromDTO(dto: ProjectAlertDTO): ProjectAlert {
    return {
      id: dto.id,
      projectId: dto.project_id,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      severity: dto.severity,
      source: dto.source,
      escalationLevel: dto.escalation_level,
      acknowledged: dto.acknowledged,
      acknowledgedAt: dto.acknowledged_at ? new Date(dto.acknowledged_at) : undefined,
      acknowledgedBy: dto.acknowledged_by,
      resolved: dto.resolved,
      resolvedAt: dto.resolved_at ? new Date(dto.resolved_at) : undefined,
      resolvedBy: dto.resolved_by,
      assignedActions: dto.assigned_actions,
      actionProofs: dto.action_proofs,
      metadata: dto.metadata,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  /**
   * Convert CreateProjectAlertRequestDto to entity
   */
  fromCreateDtoToEntity(dto: CreateProjectAlertRequestDto): Omit<ProjectAlert, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      projectId: dto.project_id,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      severity: dto.severity,
      source: dto.source,
      escalationLevel: dto.escalation_level,
      assignedActions: dto.assigned_actions,
      metadata: dto.metadata
    };
  }

  /**
   * Convert UpdateProjectAlertRequestDto to partial entity
   */
  fromUpdateDtoToEntity(dto: UpdateProjectAlertRequestDto): Partial<ProjectAlert> {
    return {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      severity: dto.severity,
      source: dto.source,
      escalationLevel: dto.escalation_level,
      acknowledged: dto.acknowledged,
      resolved: dto.resolved,
      assignedActions: dto.assigned_actions,
      actionProofs: dto.action_proofs,
      metadata: dto.metadata
    };
  }

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: ProjectAlertDTO[]): ProjectAlertDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: ProjectAlert): ProjectAlertDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): ProjectAlertDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<UpdateProjectAlertRequestDto> {
    return dto;
  }
}

export class ActionDomainTransformer implements EntityToDTOMapper<Action, ActionDTO> {
  
  /**
   * Convert Action entity to DTO
   */
  toDTO(entity: Action): ActionDTO {
    return {
      id: entity.id,
      action_type: entity.actionType,
      message: entity.message,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to Action entity
   */
  fromDTO(dto: ActionDTO): Action {
    return {
      id: dto.id,
      actionType: dto.action_type,
      message: dto.message,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  /**
   * Convert CreateActionRequestDto to entity
   */
  fromCreateDtoToEntity(dto: CreateActionRequestDto): Omit<Action, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      actionType: dto.action_type,
      message: dto.message
    };
  }

  /**
   * Convert UpdateActionRequestDto to partial entity
   */
  fromUpdateDtoToEntity(dto: UpdateActionRequestDto): Partial<Action> {
    return {
      actionType: dto.action_type,
      message: dto.message
    };
  }

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: ActionDTO[]): ActionDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: Action): ActionDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): ActionDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<UpdateActionRequestDto> {
    return dto;
  }
}
