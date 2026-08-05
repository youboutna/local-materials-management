/**
 * Task Assignment Transformer
 * Handles conversion between snake_case (DB) and camelCase (DTO)
 */

import { TaskAssignment as WorkspaceTaskAssignment } from '@/domain/entities/Workspace';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';

/**
 * Repository data format (snake_case)
 */
interface RepositoryTaskAssignment {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  phase_id?: string;
  assigned_to?: string | null;  // ← Format PostgreSQL: {uuid1,uuid2} ou null
  assigned_by?: string;
  assignee_type?: string;
  assignee_name?: string;
  assignee_email?: string;
  status: string;
  priority: string;
  progress?: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
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
      assignedTo: (entity.assignedTo as string | string[]) || [],
      assignedTo: entity.assignedTo as string || '',
      assignedBy: entity.assignedBy as string || '',
      assigneeType: (entity.assigneeType || 'individual') as any,
      assigneeName: (entity as any).assigneeName as string | undefined,
      assigneeEmail: (entity as any).assigneeEmail as string | undefined,
      status: (entity.status || 'assigned') as any,
      priority: (entity.priority || 'medium') as any,
      progress: (entity as any).progress || 0,
      startDate: (entity as any).startDate?.toISOString() as string | undefined,
      endDate: (entity as any).endDate?.toISOString() as string | undefined,
      dueDate: entity.dueDate?.toISOString() as string | undefined,
      completedAt: entity.completedAt?.toISOString() as string | undefined,
      assignedAt: entity.createdAt.toISOString(),
      notes: (entity as any).notes as string | undefined,
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
      dto.assigneeName,
      dto.assigneeEmail,
      (dto.status as unknown as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending',
      (dto.priority as unknown as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      dto.dueDate ? new Date(dto.dueDate) : undefined,
      dto.completedAt ? new Date(dto.completedAt) : undefined,
      dto.notes,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  /**
   * Convertit une ligne de base de données (snake_case) en DTO
   */
  static fromRepository(data: RepositoryTaskAssignment): TaskAssignmentDTO {
    // Parser assigned_to (format PostgreSQL {uuid1,uuid2} → string[])
    let assignedTo: string | string[] | undefined;
    if (data.assigned_to) {
      if (typeof data.assigned_to === 'string' && data.assigned_to.startsWith('{')) {
        // Format PostgreSQL: {uuid1,uuid2}
        const cleaned = data.assigned_to.slice(1, -1);
        assignedTo = cleaned.length > 0 ? cleaned.split(',') : [];
      } else if (Array.isArray(data.assigned_to)) {
        assignedTo = data.assigned_to;
      } else {
        assignedTo = data.assigned_to;
      }
    }

    return {
      id: data.id,
      taskId: data.id,
      title: data.title,
      description: data.description,
      projectId: data.project_id || '',
      phaseId: data.phase_id,
      assignedTo: assignedTo ?? [],
      assignedBy: data.assigned_by,
      assigneeType: (data.assignee_type || 'individual') as any,
      assigneeName: data.assignee_name,
      assigneeEmail: data.assignee_email,
      status: (data.status || 'assigned') as any,
      priority: (data.priority || 'medium') as any,
      progress: data.progress || 0,
      startDate: data.start_date,
      endDate: data.end_date,
      dueDate: data.due_date,
      completedAt: data.completed_at,
      assignedAt: data.created_at,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Convertit un DTO en format Repository (snake_case)
   */
  static toRepository(dto: TaskAssignmentDTO): RepositoryTaskAssignment {
    // ✅ Formater assigned_to pour PostgreSQL
    let assignedToDb: string | null = null;
    if (dto.assignedTo) {
      if (Array.isArray(dto.assignedTo) && dto.assignedTo.length > 0) {
        // Format PostgreSQL: {uuid1,uuid2}
        assignedToDb = `{${dto.assignedTo.join(',')}}`;
      } else if (typeof dto.assignedTo === 'string' && dto.assignedTo.length > 0) {
        // Si c'est une seule chaîne, la mettre dans un tableau
        assignedToDb = `{${dto.assignedTo}}`;
      }
    }

    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      project_id: dto.projectId,
      phase_id: dto.phaseId,
      assigned_to: assignedToDb,
      assigned_by: dto.assignedBy,
      assignee_type: dto.assigneeType as unknown as string,
      assignee_name: dto.assigneeName,
      assignee_email: dto.assigneeEmail,
      status: dto.status as string,
      priority: dto.priority as string,
      progress: dto.progress || 0,
      start_date: dto.startDate,
      end_date: dto.endDate,
      due_date: dto.dueDate,
      completed_at: dto.completedAt,
      notes: dto.notes,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }
}