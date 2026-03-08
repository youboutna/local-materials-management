/**
 * Task Assignment Transformer
 * Handles conversion between snake_case (DB) and camelCase (DTO)
 */

import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
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
      taskId: entity.id as string,
      title: entity.title as string,
      description: entity.description as string | undefined,
      projectId: entity.projectId as string || '',
      assignedTo: entity.assignedTo as string || '',
      assignedBy: entity.assignedBy as string || '',
      assigneeType: (entity.assigneeType || 'individual') as any,
      status: (entity.status || 'assigned') as any,
      priority: (entity.priority || 'medium') as any,
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
      dto.assigneeType as unknown as 'supplier' | 'employee' | 'user' | undefined,
      dto.status as unknown as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived',
      dto.priority as unknown as 'low' | 'medium' | 'high' | 'urgent',
      dto.dueDate ? new Date(dto.dueDate) : undefined,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static fromRepository(data: RepositoryTaskAssignment): TaskAssignmentDTO {
    return {
      id: data.id,
      taskId: data.id,
      title: data.title,
      description: data.description,
      projectId: data.project_id || '',
      assignedTo: data.assigned_to || '',
      assignedBy: data.assigned_by || '',
      assigneeType: (data.assignee_type || 'individual') as any,
      status: (data.status || 'assigned') as any,
      priority: (data.priority || 'medium') as any,
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
      assignee_type: dto.assigneeType as unknown as string,
      status: dto.status as string,
      priority: dto.priority as string,
      due_date: dto.dueDate,
      completed_at: dto.completedAt,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }
}
