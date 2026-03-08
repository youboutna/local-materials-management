/**
 * Task Transformer - Hexagonal Architecture
 * Handles transformations between layers following the guide:
 * UI → Hooks → Services → Domain ← Infrastructure → Database
 * 
 * Implements all 10 conversion methods:
 * - Database ↔ Domain: fromSupabase, toSupabase
 * - Domain ↔ DTO: toDTO, fromDTO
 * - UI ↔ DTO: formToCreateRequest, formToUpdateRequest, toUI
 * - Batch: manyFromSupabase, manyToDTO, manyToUI
 */

import { Task } from '@/domain/entities/Task';
import { TaskStatus as DomainTaskStatus, TaskPriority as DomainTaskPriority } from '@/domain/types/TaskTypes';
import { 
  TaskDTO, 
  CreateTaskDTO, 
  UpdateTaskDTO,
  TaskSummaryDTO,
  TaskStatus as DTOTaskStatus,
  TaskPriority as DTOTaskPriority,
  TaskType as DTOTaskType,
  TaskPriority
} from '@/dtos/entities/TaskDTO';

// UI State for Task presentation
export interface TaskUIState extends TaskDTO {
  formData: {
    title: string;
    description?: string;
    status?: DTOTaskStatus;
    priority?: DTOTaskPriority;
    dueDate?: string;
    assignedTo?: string[];
    notes?: string;
  };
  calculatedFields: {
    daysRemaining: number;
    isOverdue: boolean;
    progressPercentage: number;
    completionStatus: string;
  };
  displayLabels: {
    statusLabel: string;
    priorityLabel: string;
    typeLabel: string;
  };
}

export class TaskTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================
  
  /**
   * Supabase Row → Domain Model (snake_case → camelCase)
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): Task {
    const domainStatus = TaskTransformer.fromDatabaseStatus(row.status as string);
    const domainPriority = TaskTransformer.fromDatabasePriority(row.priority as string);
    
    return Task.create({
      id: row.id as string,
      projectId: row.project_id as string,
      phaseId: (row.phase_id as string) || undefined,
      stepId: (row.step_id as string) || undefined,
      title: row.title as string,
      description: row.description as string,
      status: TaskTransformer.domainStatusToEnum(domainStatus),
      priority: TaskTransformer.domainPriorityToEnum(domainPriority),
      progress: Number(row.progress) || 0,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      dueDate: row.due_date as string,
      estimatedDuration: Number(row.estimated_duration) || undefined,
      notes: row.notes as string,
      assignedTo: Array.isArray(row.assigned_to) ? row.assigned_to as string[] : [],
      assignedById: row.assigned_by as string
    });
  }

  /**
   * Domain Model → Supabase Insert/Update Object (camelCase → snake_case)
   * Following hexagonal architecture: Domain → Application → Infrastructure
   */
  static toSupabase(task: Task): Record<string, unknown> {
    return {
      id: task.id,
      project_id: task.projectId,
      phase_id: task.phaseId,
      step_id: task.stepId,
      title: task.title,
      description: task.description,
      status: TaskTransformer.toDatabaseStatus(task.status),
      priority: TaskTransformer.toDatabasePriority(task.priority),
      progress: task.progress,
      start_date: task.startDate,
      end_date: task.endDate,
      due_date: task.dueDate,
      completion_date: task.completionDate,
      estimated_duration: task.estimatedDuration,
      actual_duration: task.actualDuration,
      notes: task.notes,
      assigned_to: task.assignedTo,
      assigned_by: task.assignedById,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(task: Task): TaskDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      type: DTOTaskType.DEVELOPMENT, // Default type
      status: TaskTransformer.toDTOStatus(task.status),
      priority: TaskTransformer.toDTOPriority(task.priority),
      progress: task.progress,
      completionPercentage: task.progress,
      assignedTo: task.assignedTo,
      assigneeType: 'individual',
      startDate: task.startDate || undefined,
      endDate: task.endDate || undefined,
      dueDate: task.dueDate || undefined,
      completedAt: task.completionDate || undefined,
      estimatedDuration: task.estimatedDuration ?? undefined,
      actualDuration: task.actualDuration ?? undefined,
      dependsOn: task.dependencies.map(dep => dep.id),
      blocks: [],
      projectId: task.projectId,
      phaseId: task.phaseId || undefined,
      notes: task.notes ?? undefined,
      tags: [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  /**
   * API Response DTO → Domain Model
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: TaskDTO): Task {
    return Task.create({
      id: dto.id,
      projectId: dto.projectId || '',
      phaseId: dto.phaseId,
      stepId: undefined,
      title: dto.title,
      description: dto.description,
      status: TaskTransformer.fromDTOStatus(dto.status) as any,
      priority: TaskTransformer.fromDTOPriority(dto.priority) as any,
      progress: dto.progress,
      startDate: dto.startDate,
      endDate: dto.endDate,
      dueDate: dto.dueDate,
      estimatedDuration: dto.estimatedDuration,
      notes: dto.notes,
      assignedTo: dto.assignedTo,
      assignedById: undefined
    });
  }

  /**
   * Create Request DTO → Domain Model
   */
  static fromCreateRequest(request: CreateTaskDTO, id: string): Task {
    return Task.create({
      id,
      projectId: request.projectId || '',
      phaseId: request.phaseId,
      stepId: undefined,
      title: request.title,
      description: request.description,
      status: DTOTaskStatus.NOT_STARTED,
      priority: TaskTransformer.fromDTOPriority(request.priority || DTOTaskPriority.MEDIUM),
      progress: 0,
      startDate: request.startDate,
      endDate: request.endDate,
      dueDate: request.dueDate,
      estimatedDuration: request.estimatedDuration,
      notes: request.notes,
      assignedTo: request.assignedTo,
      assignedById: undefined
    });
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateTaskDTO {
    return {
      title: formData.title as string,
      description: formData.description as string,
      type: (formData.type as DTOTaskType) || DTOTaskType.DEVELOPMENT,
      priority: formData.priority as DTOTaskPriority,
      projectId: formData.projectId as string,
      phaseId: formData.phaseId as string,
      milestoneId: formData.milestoneId as string,
      assignedTo: Array.isArray(formData.assignedTo) ? formData.assignedTo as string[] : [],
      assigneeType: formData.assigneeType as 'individual' | 'team' | 'role',
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      dueDate: formData.dueDate as string,
      estimatedDuration: Number(formData.estimatedDuration) || undefined,
      estimatedCost: Number(formData.estimatedCost) || undefined,
      budget: Number(formData.budget) || undefined,
      dependsOn: Array.isArray(formData.dependsOn) ? formData.dependsOn as string[] : [],
      requiredSkills: Array.isArray(formData.requiredSkills) ? formData.requiredSkills as string[] : [],
      providedResources: Array.isArray(formData.providedResources) ? formData.providedResources as string[] : [],
      attachments: Array.isArray(formData.attachments) ? formData.attachments as string[] : [],
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : [],
      notes: formData.notes as string
    };
  }

  /**
   * UI Form Data → Update Request DTO
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateTaskDTO {
    return {
      title: formData.title as string,
      description: formData.description as string,
      type: formData.type as DTOTaskType,
      status: formData.status as DTOTaskStatus,
      priority: formData.priority as DTOTaskPriority,
      assignedTo: Array.isArray(formData.assignedTo) ? formData.assignedTo as string[] : undefined,
      progress: formData.progress !== undefined ? Number(formData.progress) : undefined,
      endDate: formData.endDate as string,
      dueDate: formData.dueDate as string,
      notes: formData.notes as string,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : undefined
    };
  }

  /**
   * Domain Model → UI View Model
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toUI(task: Task): TaskUIState {
    const today = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const daysRemaining = dueDate 
      ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isOverdue = dueDate ? today > dueDate && task.status !== 'completed' : false;

    const baseDTO = TaskTransformer.toDTO(task);

    return {
      ...baseDTO,
      formData: {
        title: task.title,
        description: task.description || undefined,
        status: TaskTransformer.toDTOStatus(task.status),
        priority: TaskTransformer.toDTOPriority(task.priority),
        dueDate: task.dueDate || undefined,
        assignedTo: task.assignedTo,
        notes: task.notes || undefined
      },
      calculatedFields: {
        daysRemaining,
        isOverdue,
        progressPercentage: task.progress,
        completionStatus: task.status === 'completed' ? 'Terminé' : 
                          task.status === 'in_progress' ? 'En cours' : 'Non commencé'
      },
      displayLabels: {
        statusLabel: TaskTransformer.getStatusLabel(task.status),
        priorityLabel: TaskTransformer.getPriorityLabel(task.priority),
        typeLabel: 'Développement'
      }
    };
  }

  // =================== BATCH OPERATIONS ===================
  
  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(tasks: Task[]): TaskDTO[] {
    return tasks.map(task => TaskTransformer.toDTO(task));
  }
  
  static manyFromSupabase(rows: Record<string, unknown>[]): Task[] {
    return rows.map(row => TaskTransformer.fromSupabase(row));
  }

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: TaskDTO[]): Task[] {
    return dtos.map(dto => TaskTransformer.fromDTO(dto));
  }

  static manyToUI(tasks: Task[]): TaskUIState[] {
    return tasks.map(task => TaskTransformer.toUI(task));
  }

  static manyToSupabase(tasks: Task[]): Record<string, unknown>[] {
    return tasks.map(task => TaskTransformer.toSupabase(task));
  }

  // =================== STATUS & PRIORITY MAPPINGS ===================
  
  private static fromDatabaseStatus(status: string): DomainTaskStatus {
    const statusMap: Record<string, DomainTaskStatus> = {
      'not_started': 'not_started',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'delayed': 'delayed',
      'blocked': 'blocked',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'not_started';
  }

  private static toDatabaseStatus(status: DomainTaskStatus): string {
    return status;
  }

  private static fromDatabasePriority(priority: string): DomainTaskPriority {
    const priorityMap: Record<string, DomainTaskPriority> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return priorityMap[priority] || 'medium';
  }

  private static toDatabasePriority(priority: DomainTaskPriority): string {
    return priority;
  }

  private static toDTOStatus(status: DomainTaskStatus): DTOTaskStatus {
    const statusMap: Record<DomainTaskStatus, DTOTaskStatus> = {
      'not_started': DTOTaskStatus.NOT_STARTED,
      'in_progress': DTOTaskStatus.IN_PROGRESS,
      'completed': DTOTaskStatus.COMPLETED,
      'delayed': DTOTaskStatus.DELAYED,
      'blocked': DTOTaskStatus.BLOCKED,
      'cancelled': DTOTaskStatus.CANCELLED
    };
    return statusMap[status] || DTOTaskStatus.NOT_STARTED;
  }

  private static fromDTOStatus(status: DTOTaskStatus): DomainTaskStatus {
    const statusMap: Record<DTOTaskStatus, DomainTaskStatus> = {
      [DTOTaskStatus.NOT_STARTED]: 'not_started',
      [DTOTaskStatus.IN_PROGRESS]: 'in_progress',
      [DTOTaskStatus.COMPLETED]: 'completed',
      [DTOTaskStatus.DELAYED]: 'delayed',
      [DTOTaskStatus.BLOCKED]: 'blocked',
      [DTOTaskStatus.CANCELLED]: 'cancelled'
    };
    return statusMap[status] || 'not_started';
  }

  private static toDTOPriority(priority: DomainTaskPriority): DTOTaskPriority {
    const priorityMap: Record<DomainTaskPriority, DTOTaskPriority> = {
      'low': DTOTaskPriority.LOW,
      'medium': DTOTaskPriority.MEDIUM,
      'high': DTOTaskPriority.HIGH,
      'urgent': DTOTaskPriority.URGENT
    };
    return priorityMap[priority] || DTOTaskPriority.MEDIUM;
  }

  private static fromDTOPriority(priority: DTOTaskPriority): DomainTaskPriority {
    const priorityMap: Record<DTOTaskPriority, DomainTaskPriority> = {
      [DTOTaskPriority.LOW]: 'low',
      [DTOTaskPriority.MEDIUM]: 'medium',
      [DTOTaskPriority.HIGH]: 'high',
      [DTOTaskPriority.URGENT]: 'urgent'
    };
    return priorityMap[priority] || 'medium';
  }

  private static getStatusLabel(status: DomainTaskStatus): string {
    const labels: Record<DomainTaskStatus, string> = {
      'not_started': 'Non commencé',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'delayed': 'En retard',
      'blocked': 'Bloqué',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  }

  private static domainStatusToEnum(domainStatus: DomainTaskStatus): TaskStatus {
    switch (domainStatus) {
      case 'not_started': return TaskStatus.NOT_STARTED;
      case 'in_progress': return TaskStatus.IN_PROGRESS;
      case 'completed': return TaskStatus.COMPLETED;
      case 'delayed': return TaskStatus.DELAYED;
      case 'blocked': return TaskStatus.BLOCKED;
      case 'cancelled': return TaskStatus.CANCELLED;
      default: return TaskStatus.NOT_STARTED;
    }
  }

  private static domainPriorityToEnum(domainPriority: DomainTaskPriority): TaskPriority {
    switch (domainPriority) {
      case 'low': return TaskPriority.LOW;
      case 'medium': return TaskPriority.MEDIUM;
      case 'high': return TaskPriority.HIGH;
      case 'urgent': return TaskPriority.URGENT;
      default: return TaskPriority.MEDIUM;
    }
  }

  // =================== SUMMARY DTO ===================
  
  static toSummaryDTO(task: Task): TaskSummaryDTO {
    const today = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate ? today > dueDate && task.status !== 'completed' : false;

    return {
      id: task.id,
      title: task.title,
      type: DTOTaskType.DEVELOPMENT,
      status: TaskTransformer.toDTOStatus(task.status),
      priority: TaskTransformer.toDTOPriority(task.priority),
      progress: task.progress,
      projectId: task.projectId,
      phaseId: task.phaseId || undefined,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate || undefined,
      isOverdue,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }
}
