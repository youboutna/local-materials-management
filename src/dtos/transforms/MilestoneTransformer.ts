/**
 * Milestone Transformer - Hexagonal Architecture
 * Handles transformations between layers in hexagonal architecture
 * Pattern: UI Layer -> DTOs -> Application Layer -> Domain Model -> Infrastructure Layer -> DB
 *              ↑                                      ↓
 *              └─────────── DTOs ←──────────────┘
 * 
 * Following PROMPTS.md Rules:
 * - Rule #1: Arrow flow maintained (Presentation → Application → Domain ← Infrastructure)
 * - Rule #3: Transformer pattern applied (Entity ↔ DTO conversion)
 * - Rule #4: Domain purity maintained (no DTOs in entities)
 * - Rule #5: UI/DOMAIN separation (clean boundaries)
 */

import { 
  Milestone, 
  MilestoneStatus, 
  MilestoneDependency,
  MilestoneDeliverable,
  MilestoneConfiguration
} from '@/domain/entities/Milestone';
import { 
  MilestoneDTO, 
  MilestoneFormDTO,
  MilestoneTemplateDTO,
  MilestoneStatus as DTOStatus,
  MilestoneType,
  MilestonePriority as DTOPriority
} from '@/dtos/entities/MilestoneDTO';
import { UserRoleDTO } from '@/dtos/entities/UserDTO';

// Request DTOs for API
export interface CreateMilestoneRequestDTO {
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  type?: MilestoneType;
  priority?: DTOPriority;
  weight?: number;
  isCritical?: boolean;
  dependencies?: string[];
  deliverables?: string[];
  assignedTo?: string;
  tags?: string[];
  templateId?: string;
  approvalRequirements?: string[];
}

export interface UpdateMilestoneRequestDTO {
  title?: string;
  description?: string;
  targetDate?: string;
  status?: DTOStatus;
  type?: MilestoneType;
  priority?: DTOPriority;
  weight?: number;
  isCritical?: boolean;
  dependencies?: string[];
  deliverables?: string[];
  assignedTo?: string;
  progressPercentage?: number;
  notes?: string;
  tags?: string[];
}

export class MilestoneTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================  
  /**
   * Supabase Row → Domain Model
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): Milestone {
    // Parse dependencies from JSON
    const dependencies: MilestoneDependency[] = [];
    if (row.dependencies && Array.isArray(row.dependencies)) {
      dependencies.push(...row.dependencies.map((dep: any, index: number) => ({
        id: `${row.id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: `Dependency on milestone ${dep}`
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (row.deliverables && Array.isArray(row.deliverables)) {
      deliverables.push(...row.deliverables.map((del: string, index: number) => ({
        id: `${row.id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: row.target_date as string,
        assignedTo: row.assigned_to as string || undefined
      })));
    }

    return new Milestone(
      row.id as string,
      row.project_id as string,
      row.title as string,
      (row.description as string) || null,
      row.target_date as string || null,
      row.completed_date as string || null,
      this.fromDatabaseStatus(row.status as string),
      (row.priority as DTOPriority) || 'normal',
      (row.progress_percentage as number) || null,
      dependencies,
      deliverables,
      (row.assigned_to as string) || null,
      (row.created_by as string) || null,
      (row.created_at as string) || null,
      (row.updated_at as string) || null,
      {
        templateId: (row.template_id as string) || undefined,
        constructionPhase: undefined,
        weight: (row.weight as number) ||1,
        isCritical: (row.is_critical as boolean) || false,
        type: (row.type as MilestoneType) || 'checkpoint',
        priority: (row.priority as DTOPriority) || 'normal',
        tags: (row.tags as string[]) || [],
        predecessorIds: (row.dependencies as string[]) || [],
        expectedDeliverables: (row.deliverables as string[]) || [],
        approvalRequirements: (row.approval_requirements as string[]) || [],
        relativeOffsetDays: 0
      }
    );
  }

  /**
   * Domain Model → Supabase Insert/Update Object
   * Following hexagonal architecture: Domain → Application → Infrastructure
   */
  static toSupabase(milestone: Milestone): Record<string, unknown> {
    return {
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.targetDate,
      completedDate: milestone.completionDate,
      status: this.toDatabaseStatus(milestone.status),
      progressPercentage: milestone.progressPercentage,
      dependencies: milestone.dependencies.map(dep => dep.description),
      deliverables: milestone.deliverables.map(del => del.name),
      assignedTo: milestone.assignedTo,
      createdBy: milestone.createdBy,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
      // Configuration fields
      templateId: milestone.configuration.templateId,
      type: milestone.configuration.type,
      priority: milestone.configuration.priority,
      weight: milestone.configuration.weight,
      isCritical: milestone.configuration.isCritical,
      tags: milestone.configuration.tags,
      predecessorIds: milestone.configuration.predecessorIds,
      expectedDeliverables: milestone.configuration.expectedDeliverables,
      approvalRequirements: milestone.configuration.approvalRequirements,
      relativeOffsetDays: milestone.configuration.relativeOffsetDays
    };
  }

  /**
   * Create Request → Supabase Insert Object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreateMilestoneRequestDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      projectId: request.projectId,
      title: request.title,
      description: request.description,
      targetDate: request.targetDate,
      status: 'pending',
      priority: request.priority || 'normal',
      weight: request.weight || 1,
      type: request.type || 'checkpoint',
      isCritical: request.isCritical || false,
      dependencies: request.dependencies || [],
      deliverables: request.deliverables || [],
      assignedTo: request.assignedTo,
      tags: request.tags || [],
      templateId: request.templateId,
      approvalRequirements: request.approvalRequirements || [],
      createdAt: now,
      updatedAt: now
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(milestone: Milestone): MilestoneDTO {
    return {
      // Required UserRoleDTO properties
      assignedTo: milestone.assignedTo ? {
        id: milestone.assignedTo,
        userId: milestone.assignedTo,
        roleName: 'assignee',
        status: 'active',
        assignedAt: milestone.createdAt || new Date().toISOString(),
        createdAt: milestone.createdAt || '',
        updatedAt: milestone.updatedAt || ''
      } : {} as UserRoleDTO,
      createdBy: milestone.createdBy ? {
        id: milestone.createdBy,
        userId: milestone.createdBy,
        roleName: 'creator',
        status: 'active',
        assignedAt: milestone.createdAt || new Date().toISOString(),
        createdAt: milestone.createdAt || '',
        updatedAt: milestone.updatedAt || ''
      } : {} as UserRoleDTO,
      completedate: milestone.completionDate || '',

      id: milestone.id,
      projectId: milestone.projectId,
      phaseId: undefined, // Will be set by service layer
      title: milestone.title,
      description: milestone.description || undefined,
      targetDate: milestone.targetDate || '',
      earlyStartDate: undefined,
      lateFinishDate: undefined,
      status: this.toDTOStatus(milestone.status),
      type: milestone.configuration.type,
      priority: milestone.configuration.priority,
      weight: milestone.configuration.weight,
      notes: undefined,
      isFromTemplate: !!milestone.configuration.templateId,
      templateId: milestone.configuration.templateId,
      dependencies: milestone.dependencies.map(dep => dep.description),
      floatDays: undefined,
      isOnCriticalPath: milestone.configuration.isCritical,
      deliverables: milestone.deliverables.map(del => del.name),
      approvalStatus: undefined,
      approvedBy: undefined,
      approvalDate: undefined,
      createdAt: milestone.createdAt || '',
      updatedAt: milestone.updatedAt || ''
    };
  }

  /**
   * API Response DTO → Domain Model
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: MilestoneDTO): Milestone {
    // Parse dependencies
    const dependencies: MilestoneDependency[] = [];
    if (dto.dependencies) {
      dependencies.push(...dto.dependencies.map((dep, index) => ({
        id: `${dto.id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (dto.deliverables) {
      deliverables.push(...dto.deliverables.map((del, index) => ({
        id: `${dto.id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: dto.targetDate,
        assignedTo: undefined
      })));
    }

    return new Milestone(
      dto.id,
      dto.projectId,
      dto.title,
      dto.description || null,
      dto.targetDate,
      dto.completedDate || null,
      this.fromDTOStatus(dto.status),
      dto.priority,
      null, // progressPercentage not in DTO
      dependencies,
      deliverables,
      dto?.assignedTo?.userId || null, // Extract userId from UserRoleDTO
      dto?.createdBy?.userId || null, // Extract userId from UserRoleDTO
      dto.createdAt,
      dto.updatedAt,
      {
        templateId: dto.templateId,
        constructionPhase: undefined,
        weight: dto.weight,
        isCritical: dto.isOnCriticalPath || false,
        type: dto.type,
        priority: dto.priority,
        tags: [],
        predecessorIds: dto.dependencies || [],
        expectedDeliverables: dto.deliverables || [],
        approvalRequirements: [],
        relativeOffsetDays: 0
      }
    );
  }

  /**
   * Create Request DTO → Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromCreateRequest(request: CreateMilestoneRequestDTO, id: string): Milestone {
    // Parse dependencies
    const dependencies: MilestoneDependency[] = [];
    if (request.dependencies) {
      dependencies.push(...request.dependencies.map((dep, index) => ({
        id: `${id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (request.deliverables) {
      deliverables.push(...request.deliverables.map((del, index) => ({
        id: `${id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: request.targetDate,
        assignedTo: request.assignedTo
      })));
    }

    return new Milestone(
      id,
      request.projectId,
      request.title,
      request.description || null,
      request.targetDate,
      null,
      'pending',
      request.priority || 'normal',
      null,
      dependencies,
      deliverables,
      request.assignedTo || null,
      null,
      new Date().toISOString(),
      new Date().toISOString(),
      {
        templateId: request.templateId,
        constructionPhase: undefined,
        weight: request.weight || 1,
        isCritical: request.isCritical || false,
        type: request.type || 'checkpoint',
        priority: request.priority || 'normal',
        tags: request.tags || [],
        predecessorIds: request.dependencies || [],
        expectedDeliverables: request.deliverables || [],
        approvalRequirements: request.approvalRequirements || [],
        relativeOffsetDays: 0
      }
    );
  }

  /**
   * Update Request DTO → Partial Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromUpdateRequest(dto: UpdateMilestoneRequestDTO): Partial<Milestone> {
    // Note: Since Milestone properties are readonly, we return update data
    // The service layer will handle creating a new Milestone instance with updates
    return {
      updatedAt: new Date().toISOString()
    };
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateMilestoneRequestDTO {
    return {
      projectId: formData.projectId as string,
      phaseId: formData.phaseId as string,
      title: formData.title as string,
      description: formData.description as string,
      targetDate: formData.targetDate as string,
      type: (formData.type as MilestoneType) || 'checkpoint',
      priority: (formData.priority as DTOPriority) || 'normal',
      weight: Number(formData.weight) || 1,
      isCritical: Boolean(formData.isCritical),
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      deliverables: Array.isArray(formData.deliverables) ? formData.deliverables as string[] : [],
      assignedTo: formData.assignedTo as string,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : [],
      templateId: formData.templateId as string,
      approvalRequirements: Array.isArray(formData.approvalRequirements) ? formData.approvalRequirements as string[] : []
    };
  }

  /**
   * Domain Model → UI View Model
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toUI(milestone: Milestone) {
    const dto = this.toDTO(milestone);
    const today = new Date();
    const targetDate = new Date(dto.targetDate);
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...dto,
      // UI-specific properties
      formattedTargetDate: targetDate.toLocaleDateString(),
      formattedCompletionDate: dto.completedDate ? new Date(dto.completedDate).toLocaleDateString() : null,
      daysRemaining: daysRemaining,
      isOverdue: daysRemaining < 0 && dto.status !== 'completed',
      isToday: daysRemaining === 0,
      statusColor: this.getStatusColor(dto.status),
      priorityColor: this.getPriorityColor(dto.priority),
      progressVariant: this.getProgressVariant(milestone.progressPercentage || 0),
      canEdit: dto.status !== 'completed',
      canDelete: dto.status === 'pending',
      canComplete: ['pending', 'in_progress'].includes(dto.status as 'pending' | 'in_progress' | 'completed' | 'delayed'),
      // Visual indicators
      badgeVariant: this.getBadgeVariant(dto.status, daysRemaining),
      icon: this.getStatusIcon(dto.status)
    };
  }

  /**
   * UI Form Data → Update Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateMilestoneRequestDTO {
    return {
      title: formData.title as string,
      description: formData.description as string,
      targetDate: formData.targetDate as string,
      status: formData.status as DTOStatus,
      type: formData.type as MilestoneType,
      priority: formData.priority as DTOPriority,
      weight: Number(formData.weight),
      isCritical: Boolean(formData.isCritical),
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      deliverables: Array.isArray(formData.deliverables) ? formData.deliverables as string[] : [],
      assignedTo: formData.assignedTo as string,
      progressPercentage: Number(formData.progressPercentage) || 0,
      notes: formData.notes as string,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : []
    };
  }

  // =================== BATCH TRANSFORMATIONS ===================
  
  /**
   * Multiple Supabase Rows → Domain Models
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Milestone[] {
    return rows.map(row => this.fromSupabase(row));
  }

  /**
   * Multiple Domain Models → DTOs
   */
  static manyToDTO(milestones: Milestone[]): MilestoneDTO[] {
    return milestones.map(milestone => this.toDTO(milestone));
  }

  /**
   * Multiple Domain Models → UI View Models
   */
  static manyToUI(milestones: Milestone[]): ReturnType<typeof this.toUI>[] {
    return milestones.map(milestone => this.toUI(milestone));
  }

  /**
   * Multiple DTOs → Domain Models
   */
  static manyFromDTO(dtos: MilestoneDTO[]): Milestone[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  // =================== ENUM CONVERSIONS ===================
  
  private static fromDatabaseStatus(status: string): MilestoneStatus {
    const mapping: Record<string, MilestoneStatus> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'delayed': 'delayed',
      'blocked': 'blocked',
      'overdue': 'overdue'
    };
    return mapping[status] || 'pending';
  }

  private static toDatabaseStatus(status: MilestoneStatus): string {
    return status; // Already in snake_case
  }

  private static fromDTOStatus(dto: DTOStatus): MilestoneStatus {
    return dto as MilestoneStatus;
  }

  private static toDTOStatus(status: MilestoneStatus): DTOStatus {
    return status as DTOStatus;
  }

  // =================== UI HELPER METHODS ===================
  
  private static getStatusColor(status: DTOStatus): string {
    const colors = {
      'pending': 'blue',
      'in_progress': 'orange',
      'completed': 'green',
      'delayed': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getPriorityColor(priority: DTOPriority): string {
    const colors = {
      'low': 'gray',
      'normal': 'blue',
      'high': 'orange',
      'critical': 'red'
    };
    return colors[priority] || 'gray';
  }

  private static getProgressVariant(progress: number): string {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'primary';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'danger';
  }

  private static getBadgeVariant(status: DTOStatus, daysRemaining: number): string {
    if (status === 'completed') return 'success';
    if (status === 'delayed') return 'danger';
    if (daysRemaining < 0 && status !== 'completed') return 'warning';
    if (status === 'in_progress') return 'primary';
    return 'secondary';
  }

  private static getStatusIcon(status: DTOStatus): string {
    const icons = {
      'pending': 'clock',
      'in_progress': 'play-circle',
      'completed': 'check-circle',
      'delayed': 'alert-circle'
    };
    return icons[status] || 'clock';
  }

  // =================== SUMMARY TRANSFORMATIONS ===================
  
  /**
   * Create summary object for lists
   */
  static toSummary(milestone: Milestone) {
    const ui = this.toUI(milestone);
    
    return {
      id: ui.id,
      title: ui.title,
      status: ui.status,
      priority: ui.priority,
      targetDate: ui.formattedTargetDate,
      daysRemaining: ui.daysRemaining,
      progressPercentage: milestone.progressPercentage,
      isCritical: milestone.configuration.isCritical,
      badgeVariant: ui.badgeVariant,
      statusColor: ui.statusColor
    };
  }

  /**
   * Create timeline item
   */
  static toTimelineItem(milestone: Milestone) {
    const ui = this.toUI(milestone);
    
    return {
      id: ui.id,
      title: ui.title,
      description: ui.description,
      date: ui.formattedTargetDate,
      status: ui.status,
      icon: ui.icon,
      color: ui.statusColor,
      isToday: ui.isToday,
      isOverdue: ui.isOverdue,
      progress: milestone.progressPercentage
    };
  }
}
