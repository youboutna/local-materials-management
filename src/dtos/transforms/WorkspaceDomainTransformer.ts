import { Workspace, ProjectAlert, Action, OperationalStatus } from '@/domain/entities/Workspace';
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

export class WorkspaceDomainTransformer {
  
  toDTO(entity: Workspace): WorkspaceDTO {
    return {
      id: entity.id,
      name: entity.name,
      location: entity.location,
      status: entity.status || OperationalStatus.active,
      contact_manager: entity.contact?.manager,
      contact_phone: entity.contact?.phone,
      facilities: entity.facilities as any,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  fromDTO(dto: WorkspaceDTO): any {
    return {
      id: dto.id,
      name: dto.name,
      location: dto.location,
      status: dto.status as OperationalStatus,
      contact: {
        manager: dto.contact_manager,
        phone: dto.contact_phone,
      },
      facilities: dto.facilities,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  fromCreateDtoToEntity(dto: CreateWorkspaceRequestDto): any {
    return {
      name: dto.name,
      location: dto.location,
      status: (dto.status || 'active') as OperationalStatus,
      contact: {
        manager: dto.contact_manager,
        phone: dto.contact_phone,
      },
      facilities: dto.facilities
    };
  }

  fromUpdateDtoToEntity(dto: UpdateWorkspaceRequestDto): any {
    return {
      name: dto.name,
      location: dto.location,
      status: dto.status as OperationalStatus | undefined,
      contact: dto.contact_manager ? {
        manager: dto.contact_manager,
        phone: dto.contact_phone,
      } : undefined,
      facilities: dto.facilities
    };
  }

  fromEntityToDTO(entity: Workspace): WorkspaceDTO {
    return this.toDTO(entity);
  }

  fromDtosToAdapter(dtos: WorkspaceDTO[]): WorkspaceDTO[] {
    return dtos;
  }

  toResponseDto(entity: Workspace): WorkspaceDTO {
    return this.toDTO(entity);
  }

  toRequestDto(dto: any): WorkspaceDTO {
    return dto;
  }

  toUpdateDto(dto: any): Partial<UpdateWorkspaceRequestDto> {
    return dto;
  }

  validate(dto: WorkspaceDTO): { isValid: boolean; errors: string[]; fieldErrors?: Record<string, string[]> } {
    const errors: string[] = [];
    if (!dto.name) errors.push('Name is required');
    return { isValid: errors.length === 0, errors };
  }
}

export class ProjectAlertDomainTransformer {
  
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
      action_proofs: entity.actionProofs as any,
      metadata: entity.metadata,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  fromDTO(dto: ProjectAlertDTO): any {
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

  fromCreateDtoToEntity(dto: CreateProjectAlertRequestDto): any {
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

  fromUpdateDtoToEntity(dto: UpdateProjectAlertRequestDto): any {
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

  fromEntityToDTO(entity: ProjectAlert): ProjectAlertDTO {
    return this.toDTO(entity);
  }

  fromDtosToAdapter(dtos: ProjectAlertDTO[]): ProjectAlertDTO[] {
    return dtos;
  }

  toResponseDto(entity: ProjectAlert): ProjectAlertDTO {
    return this.toDTO(entity);
  }

  toRequestDto(dto: any): ProjectAlertDTO {
    return dto;
  }

  toUpdateDto(dto: any): Partial<UpdateProjectAlertRequestDto> {
    return dto;
  }

  validate(dto: ProjectAlertDTO): { isValid: boolean; errors: string[]; fieldErrors?: Record<string, string[]> } {
    const errors: string[] = [];
    if (!dto.title) errors.push('Title is required');
    return { isValid: errors.length === 0, errors };
  }
}

export class ActionDomainTransformer {
  
  toDTO(entity: Action): ActionDTO {
    return {
      id: entity.id,
      action_type: entity.actionType,
      message: entity.message,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  fromDTO(dto: ActionDTO): Action {
    return {
      id: dto.id,
      actionType: dto.action_type,
      message: dto.message,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  fromCreateDtoToEntity(dto: CreateActionRequestDto): Omit<Action, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      actionType: dto.action_type,
      message: dto.message
    };
  }

  fromUpdateDtoToEntity(dto: UpdateActionRequestDto): Partial<Action> {
    return {
      actionType: dto.action_type,
      message: dto.message
    };
  }

  fromEntityToDTO(entity: Action): ActionDTO {
    return this.toDTO(entity);
  }

  fromDtosToAdapter(dtos: ActionDTO[]): ActionDTO[] {
    return dtos;
  }

  toResponseDto(entity: Action): ActionDTO {
    return this.toDTO(entity);
  }

  toRequestDto(dto: any): ActionDTO {
    return dto;
  }

  toUpdateDto(dto: any): Partial<UpdateActionRequestDto> {
    return dto;
  }

  validate(dto: ActionDTO): { isValid: boolean; errors: string[]; fieldErrors?: Record<string, string[]> } {
    const errors: string[] = [];
    if (!dto.message) errors.push('Message is required');
    return { isValid: errors.length === 0, errors };
  }
}
