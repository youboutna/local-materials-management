/**
 * Unified TaskAssignment Transformer
 * Entity <-> DTO <-> Repository (snake_case, table `task_assignments`)
 */

import { UnifiedTaskAssignment } from '@/domain/entities/UnifiedTaskAssignment';
import {
  CreateUnifiedTaskAssignmentDTO,
  UnifiedTaskAssignmentDTO,
  normalizeAssignedTo,
  normalizeUnifiedPriority,
  normalizeUnifiedStatus,
} from '@/dtos/entities/UnifiedTaskAssignmentDTO';

type Row = Record<string, unknown>;

export class UnifiedTaskAssignmentTransformer {
  // ============= Entity → DTO =============
  static toDTO(entity: UnifiedTaskAssignment): UnifiedTaskAssignmentDTO {
    return entity.toDTO();
  }

  // ============= DTO → Entity =============
  static toEntity(dto: CreateUnifiedTaskAssignmentDTO | UnifiedTaskAssignmentDTO): UnifiedTaskAssignment {
    const source = dto as UnifiedTaskAssignmentDTO & CreateUnifiedTaskAssignmentDTO;
    return UnifiedTaskAssignment.create({
      id: source.id || crypto.randomUUID(),
      title: source.title,
      description: source.description,
      projectId: source.projectId,
      phaseId: source.phaseId,
      assignedTo: normalizeAssignedTo(source.assignedTo),
      assignedBy: source.assignedBy,
      assigneeType: source.assigneeType,
      assigneeName: source.assigneeName,
      assigneeEmail: source.assigneeEmail,
      status: normalizeUnifiedStatus(source.status as string | undefined, source.progress),
      priority: normalizeUnifiedPriority(source.priority as string | undefined),
      progress: source.progress ?? 0,
      startDate: source.startDate ? new Date(source.startDate) : undefined,
      endDate: source.endDate ? new Date(source.endDate) : undefined,
      dueDate: source.dueDate ? new Date(source.dueDate) : undefined,
      completedAt: (source as UnifiedTaskAssignmentDTO).completedAt
        ? new Date((source as UnifiedTaskAssignmentDTO).completedAt as string)
        : undefined,
      notes: source.notes,
    });
  }

  // ============= Entity → Repository (snake_case) =============
  static toRepository(entity: UnifiedTaskAssignment, includeId = true): Row {
    const assignedTo = entity.assignedTo ?? [];
    const row: Row = {
      title: entity.title,
      description: entity.description ?? null,
      project_id: entity.projectId ?? null,
      phase_id: entity.phaseId ?? null,
      // Tableau PostgreSQL : {uuid1,uuid2}
      assigned_to: assignedTo.length > 0 ? `{${assignedTo.join(',')}}` : null,
      // Colonne héritée encore NOT NULL sur certains environnements
      assignee_id: assignedTo[0] ?? entity.assignedBy ?? null,
      assigned_by: entity.assignedBy ?? null,
      assignee_type: entity.assigneeType ?? null,
      assignee_name: entity.assigneeName ?? null,
      assignee_email: entity.assigneeEmail ?? null,
      status: entity.status,
      priority: entity.priority,
      progress: entity.progress ?? 0,
      start_date: entity.startDate?.toISOString() ?? null,
      end_date: entity.endDate?.toISOString() ?? null,
      due_date: entity.dueDate?.toISOString() ?? null,
      completed_at: entity.completedAt?.toISOString() ?? null,
      notes: entity.notes ?? null,
      updated_at: new Date().toISOString(),
    };
    if (includeId) {
      row.id = entity.id;
      row.created_at = entity.createdAt.toISOString();
    }
    return row;
  }

  // ============= Repository → Entity =============
  static fromRepository(row: Row): UnifiedTaskAssignment {
    const rawAssigned = (row.assigned_to ?? row.assignee_id) as string | string[] | null | undefined;
    return UnifiedTaskAssignment.create({
      id: row.id as string,
      title: (row.title as string) ?? 'Tâche',
      description: (row.description as string) ?? undefined,
      projectId: (row.project_id as string) ?? undefined,
      phaseId: (row.phase_id as string) ?? undefined,
      assignedTo: normalizeAssignedTo(rawAssigned),
      assignedBy: (row.assigned_by as string) ?? undefined,
      assigneeType: (row.assignee_type as never) ?? undefined,
      assigneeName: (row.assignee_name as string) ?? undefined,
      assigneeEmail: (row.assignee_email as string) ?? undefined,
      status: (row.status as string) ?? 'pending',
      priority: (row.priority as string) ?? 'medium',
      progress: (row.progress as number) ?? 0,
      startDate: row.start_date ? new Date(row.start_date as string) : undefined,
      endDate: row.end_date ? new Date(row.end_date as string) : undefined,
      dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      notes: (row.notes as string) ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
    });
  }
}
