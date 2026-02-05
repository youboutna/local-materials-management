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
  MilestoneStatus as DTOStatus,
  MilestoneType,
  MilestonePriority as DTOPriority
} from '@/dtos/entities/MilestoneDTO';

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
        weight: (row.weight as number) || 1,
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
      project_id: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      target_date: milestone.targetDate,
      completed_date: milestone.completionDate,
      status: this.toDatabaseStatus(milestone.status),
      priority: milestone.priority,
      progress_percentage: milestone.progressPercentage,
      dependencies: milestone.dependencies.map(dep => dep.description),
      deliverables: milestone.deliverables.map(del => del.name),
      assigned_to: milestone.assignedTo,
      created_by: milestone.createdBy,
      created_at: milestone.createdAt,
      updated_at: milestone.updatedAt,
      // Configuration fields
      template_id: milestone.configuration.templateId,
      type: milestone.configuration.type,
      is_critical: milestone.configuration.isCritical,
      weight: milestone.configuration.weight,
      tags: milestone.configuration.tags,
      approval_requirements: milestone.configuration.approvalRequirements
    };
  }

  /**
   * Create Request → Supabase Insert Object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreateMilestoneRequestDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      project_id: request.projectId,
      title: request.title,
      description: request.description,
      target_date: request.targetDate,
      status: 'pending',
      priority: request.priority || 'normal',
      weight: request.weight || 1,
      type: request.type || 'checkpoint',
      is_critical: request.isCritical || false,
      dependencies: request.dependencies || [],
      deliverables: request.deliverables || [],
      assigned_to: request.assignedTo,
      tags: request.tags || [],
      template_id: request.templateId,
      approval_requirements: request.approvalRequirements || [],
      created_at: now,
      updated_at: now
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(milestone: Milestone): MilestoneDTO {
    return {
      id: milestone.id,
      project_id: milestone.projectId,
      phase_id: undefined, // Will be set by service layer
      title: milestone.title,
      description: milestone.description || undefined,
      target_date: milestone.targetDate || '',
      early_start_date: undefined,
      late_finish_date: undefined,
      completed_date: milestone.completionDate || undefined,
      status: this.toDTOStatus(milestone.status),
      type: milestone.configuration.type,
      priority: milestone.configuration.priority,
      weight: milestone.configuration.weight,
      notes: undefined,
      is_from_template: !!milestone.configuration.templateId,
      template_id: milestone.configuration.templateId,
      dependencies: milestone.dependencies.map(dep => dep.description),
      float_days: undefined,
      is_on_critical_path: milestone.configuration.isCritical,
      deliverables: milestone.deliverables.map(del => del.name),
      approval_status: undefined,
      approved_by: undefined,
      approval_date: undefined,
      created_at: milestone.createdAt || '',
      updated_at: milestone.updatedAt || ''
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
        dueDate: dto.target_date,
        assignedTo: undefined
      })));
    }

    return new Milestone(
      dto.id,
      dto.project_id,
      dto.title,
      dto.description || null,
      dto.target_date,
      dto.completed_date || null,
      this.fromDTOStatus(dto.status),
      dto.priority,
      null, // progressPercentage not in DTO
      dependencies,
      deliverables,
      undefined, // assignedTo not in DTO
      undefined, // createdBy not in DTO
      dto.created_at,
      dto.updated_at,
      {
        templateId: dto.template_id,
        constructionPhase: undefined,
        weight: dto.weight,
        isCritical: dto.is_on_critical_path || false,
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
    const targetDate = new Date(dto.target_date);
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...dto,
      // UI-specific properties
      formattedTargetDate: targetDate.toLocaleDateString(),
      formattedCompletionDate: dto.completed_date ? new Date(dto.completed_date).toLocaleDateString() : null,
      daysRemaining: daysRemaining,
      isOverdue: daysRemaining < 0 && dto.status !== 'completed',
      isToday: daysRemaining === 0,
      statusColor: this.getStatusColor(dto.status),
      priorityColor: this.getPriorityColor(dto.priority),
      progressVariant: this.getProgressVariant(milestone.progressPercentage || 0),
      canEdit: dto.status !== 'completed',
      canDelete: dto.status === 'pending',
      canComplete: ['pending', 'in_progress'].includes(dto.status),
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
      target_date: ui.formattedTargetDate,
      daysRemaining: ui.daysRemaining,
      progress_percentage: milestone.progressPercentage,
      is_critical: milestone.configuration.isCritical,
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
