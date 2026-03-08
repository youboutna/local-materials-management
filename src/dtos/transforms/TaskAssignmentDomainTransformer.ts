import { TaskAssignment } from '@/domain/entities/Workspace';
import { 
  TaskAssignmentDTO, 
  CreateTaskAssignmentRequestDto, 
  UpdateTaskAssignmentRequestDto 
} from './shared';
import { EntityToDTOMapper } from './shared';

export class TaskAssignmentDomainTransformer {
  
  toDTO(entity: TaskAssignment): TaskAssignmentDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      project_id: entity.projectId,
      assigned_to: entity.assignedTo,
      assigned_by: entity.assignedBy,
      assignee_type: entity.assigneeType,
      assignee_name: entity.assigneeName,
      assignee_email: entity.assigneeEmail,
      due_date: entity.dueDate?.toISOString(),
      priority: entity.priority,
      status: entity.status,
      notes: entity.notes,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  fromDTO(dto: TaskAssignmentDTO): any {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      projectId: dto.project_id,
      assignedTo: dto.assigned_to,
      assignedBy: dto.assigned_by,
      assigneeType: dto.assignee_type,
      assigneeName: dto.assignee_name,
      assigneeEmail: dto.assignee_email,
      dueDate: dto.due_date ? new Date(dto.due_date) : undefined,
      priority: dto.priority,
      status: dto.status,
      notes: dto.notes,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  fromCreateDtoToEntity(dto: CreateTaskAssignmentRequestDto): any {
    return {
      title: dto.title,
      description: dto.description,
      projectId: dto.project_id,
      assignedTo: dto.assigned_to,
      assigneeType: dto.assignee_type,
      assigneeName: dto.assignee_name,
      assigneeEmail: dto.assignee_email,
      dueDate: dto.due_date ? new Date(dto.due_date) : undefined,
      priority: dto.priority || 'medium',
      status: dto.status || 'pending',
      notes: dto.notes
    };
  }

  fromUpdateDtoToEntity(dto: UpdateTaskAssignmentRequestDto): any {
    return {
      title: dto.title,
      description: dto.description,
      projectId: dto.project_id,
      assignedTo: dto.assigned_to,
      assigneeType: dto.assignee_type,
      assigneeName: dto.assignee_name,
      assigneeEmail: dto.assignee_email,
      dueDate: dto.due_date ? new Date(dto.due_date) : undefined,
      priority: dto.priority,
      status: dto.status,
      notes: dto.notes
    };
  }

  fromDtosToAdapter(dtos: TaskAssignmentDTO[]): TaskAssignmentDTO[] {
    return dtos;
  }

  toResponseDto(entity: TaskAssignment): TaskAssignmentDTO {
    return this.toDTO(entity);
  }

  toRequestDto(dto: any): TaskAssignmentDTO {
    return dto;
  }

  toUpdateDto(dto: any): Partial<UpdateTaskAssignmentRequestDto> {
    return dto;
  }

  validate(data: CreateTaskAssignmentRequestDto | UpdateTaskAssignmentRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Task title is required');
    }

    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }

    if (data.status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(data.status)) {
      errors.push('Status must be one of: pending, in_progress, completed, cancelled');
    }

    if (data.assignee_type && !['supplier', 'employee', 'user'].includes(data.assignee_type)) {
      errors.push('Assignee type must be one of: supplier, employee, user');
    }

    if (data.due_date && isNaN(new Date(data.due_date).getTime())) {
      errors.push('Due date must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toDatabaseFormat(entity: TaskAssignment): any {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      project_id: entity.projectId,
      assigned_to: entity.assignedTo,
      assigned_by: entity.assignedBy,
      assignee_type: entity.assigneeType,
      assignee_name: entity.assigneeName,
      assignee_email: entity.assigneeEmail,
      due_date: entity.dueDate?.toISOString(),
      priority: entity.priority,
      status: entity.status,
      notes: entity.notes,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  fromDatabaseFormat(dbData: any): any {
    return {
      id: dbData.id,
      title: dbData.title,
      description: dbData.description,
      projectId: dbData.project_id,
      assignedTo: dbData.assigned_to,
      assignedBy: dbData.assigned_by,
      assigneeType: dbData.assignee_type,
      assigneeName: dbData.assignee_name,
      assigneeEmail: dbData.assignee_email,
      dueDate: dbData.due_date ? new Date(dbData.due_date) : undefined,
      priority: dbData.priority,
      status: dbData.status,
      notes: dbData.notes,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    };
  }
}
