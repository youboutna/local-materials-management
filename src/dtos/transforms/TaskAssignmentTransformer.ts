/**
 * Task Assignment Transformer
 * Handles conversion between snake_case (DB) and camelCase (DTO)
 */

import { CreateTaskAssignmentRequestDTO, TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { TaskAssignment as WorkspaceTaskAssignment } from '@/domain/entities/Workspace';

/**
 * Repository data format (snake_case)
 */
interface RepositoryTaskAssignment {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  assignee_type?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class TaskAssignmentTransformer {
  static toDTO(entity: WorkspaceTaskAssignment): TaskAssignmentDTO {
    return {
      id: entity.id as string,
      title: entity.title as string,
      description: entity.description as string | undefined,
      projectId: entity.projectId as string | undefined,
      assignedTo: entity.assignedTo as string | undefined,
      assignedBy: entity.assignedBy as string | undefined,
      assigneeType: entity.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      status: entity.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: entity.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: entity.dueDate?.toISOString() as string | undefined,
      completedAt: entity.completedAt?.toISOString() as string | undefined,
      createdAt: entity.createdAt.toISOString() as string,
      updatedAt: entity.updatedAt.toISOString() as string
    };
  }

  static toEntity(dto: TaskAssignmentDTO): WorkspaceTaskAssignment {
    return new WorkspaceTaskAssignment(
      dto.id,
      dto.title,
      dto.description,
      dto.projectId,
      dto.assignedTo,
      dto.assignedBy,
      dto.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      dto.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived',
      dto.priority as 'low' | 'medium' | 'high' | 'urgent',
      dto.dueDate ? new Date(dto.dueDate) : undefined,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static fromRepository(data: RepositoryTaskAssignment): TaskAssignmentDTO {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      projectId: data.project_id,
      assignedTo: data.assigned_to,
      assignedBy: data.assigned_by,
      assigneeType: data.assignee_type,
      status: data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: data.due_date,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static toRepository(dto: TaskAssignmentDTO): RepositoryTaskAssignment {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      project_id: dto.projectId,
      assigned_to: dto.assignedTo,
      assigned_by: dto.assignedBy,
      assignee_type: dto.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      status: dto.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: dto.priority as 'low' | 'medium' | 'high' | 'urgent',
      due_date: dto.dueDate,
      completed_at: dto.completedAt,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  static fromCreateDTO(dto: CreateTaskAssignmentRequestDTO): Partial<WorkspaceTaskAssignment> {
    return {
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      assignedTo: dto.assignedTo,
      assignedBy: dto.assignedBy,
      assigneeType: dto.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      priority: dto.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
    };
  }
}
