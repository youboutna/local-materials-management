/**
 * Phase Transformer - Hexagonal Architecture
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

import { Phase, PhaseStatus, PhaseType } from '@/domain/entities/Phase';
import { 
  PhaseDTO, 
  PhaseFormDataDTO,
  PhaseUIState,
  CreatePhaseDTO,
  UpdatePhaseDTO,
  PhaseSummaryDTO,
  PhaseStatus as DTOStatus,
  PhaseType as DTOType,
  PhasePriority,
  PhaseStepDTO,
  PhaseMilestoneDTO
} from '@/dtos/entities/PhaseDTO';

// Request DTOs for API
export interface CreatePhaseRequestDTO {
  projectId: string;
  name: string;
  description?: string;
  type?: DTOType;
  priority?: PhasePriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedCost?: number;
  dependencies?: string[];
  milestones?: string[];
  assignedTo?: string[];
  resources?: {
    employees?: string[];
    equipment?: string[];
    materials?: string[];
  };
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  location?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags?: string[];
  notes?: string;
  documents?: string[];
  inspections?: string[];
}

export interface UpdatePhaseRequestDTO {
  name?: string;
  description?: string;
  status?: DTOStatus;
  endDate?: string;
  progress?: number;
  actualCost?: number;
  assignedTo?: string[];
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  dependencies?: string[];
  materials?: string[];
  documents?: string[];
  inspections?: string[];
  updatedBy?: string;
  changeReason?: string;
}

export class PhaseTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================  
  /**
   * Supabase Row → Domain Model
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): Phase {
    return Phase.create({
      id: row.id as string,
      projectId: row.project_id as string,
      phaseName: row.phase_name as string,
      description: row.description as string,
      status: this.fromDatabaseStatus(row.status as string),
      progress: Number(row.progress) || 0,
      orderIndex: Number(row.order_index) || 0,
      startDate: row.start_date as string ? new Date(row.start_date as string) : null,
      endDate: row.end_date as string ? new Date(row.end_date as string) : null,
      estimatedCost: Number(row.estimated_cost) || null,
      actualCost: Number(row.actual_cost) || null,
      estimatedDuration: Number(row.estimated_duration_days) || null,
      constructionPhase: row.construction_phase as string || null,
      constructionStage: row.construction_stage as string || null,
      phaseType: row.phase_type as PhaseType || 'execution',
      location: row.location as string || null,
      customPhaseData: row.custom_phase_data as Record<string, unknown> || null,
      dependencies: Array.isArray(row.dependencies) ? row.dependencies as string[] : [],
      milestones: Array.isArray(row.milestones) ? row.milestones as string[] : [],
      materials: Array.isArray(row.materials) ? row.materials as Array<{id: string; name: string; quantity: number}> : [],
      suppliers: Array.isArray(row.suppliers) ? row.suppliers as Array<{id: string; name: string}> : [],
      humanResources: row.human_resources as {employees?: string[]; equipment?: string[]} | null,
      steps: Array.isArray(row.steps) ? row.steps as Array<{id: string; name: string; description: string; completed: boolean}> : [],
      notes: row.notes as string || null,
      weight: Number(row.weight) || null,
      createdBy: row.created_by as string || null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    });
  }

  /**
   * Domain Model → Supabase Insert/Update Object
   * Following hexagonal architecture: Domain → Application → Infrastructure
   */
  static toSupabase(phase: Phase): Record<string, unknown> {
    return {
      id: phase.id,
      project_id: phase.projectId,
      phase_name: phase.phaseName,
      description: phase.description,
      status: this.toDatabaseStatus(phase.status),
      progress: phase.progress,
      order_index: phase.orderIndex,
      start_date: phase.startDate?.toISOString(),
      end_date: phase.endDate?.toISOString(),
      estimated_cost: phase.estimatedCost,
      actual_cost: phase.actualCost,
      estimated_duration_days: phase.estimatedDuration,
      construction_phase: phase.constructionPhase,
      construction_stage: phase.constructionStage,
      phase_type: phase.phaseType,
      location: phase.location,
      custom_phase_data: phase.customPhaseData,
      dependencies: phase.dependencies,
      milestones: phase.milestones,
      materials: phase.materials,
      suppliers: phase.suppliers,
      human_resources: phase.humanResources,
      steps: phase.steps,
      notes: phase.notes,
      weight: phase.weight,
      created_by: phase.createdBy,
      created_at: phase.createdAt,
      updated_at: phase.updatedAt
    };
  }

  /**
   * Create Request → Supabase Insert Object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreatePhaseRequestDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      project_id: request.projectId,
      phase_name: request.name,
      description: request.description,
      status: 'planning',
      progress: 0,
      order_index: 0,
      start_date: request.startDate,
      end_date: request.endDate,
      estimated_cost: request.estimatedCost,
      actual_cost: null,
      estimated_duration_days: null,
      construction_phase: null,
      construction_stage: null,
      phase_type: request.type || 'execution',
      location: request.location?.address,
      custom_phase_data: null,
      dependencies: request.dependencies || [],
      milestones: request.milestones || [],
      materials: request.resources?.materials || [],
      suppliers: [],
      human_resources: {
        employees: request.assignedTo || [],
        equipment: request.resources?.equipment || []
      },
      steps: [],
      notes: request.notes,
      weight: null,
      created_by: null,
      created_at: now,
      updated_at: now
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(phase: Phase): PhaseDTO {
    return {
      id: phase.id,
      name: phase.phaseName,
      description: phase.description,
      type: phase.phaseType as DTOType,
      status: this.toDTOStatus(phase.status),
      priority: 'medium' as PhasePriority,
      progress: phase.progress,
      completionPercentage: phase.progress,
      startDate: phase.startDate?.toISOString(),
      endDate: phase.endDate?.toISOString(),
      estimatedDuration: phase.estimatedDuration,
      actualDuration: phase.endDate && phase.startDate ? 
        Math.ceil((phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      budget: phase.estimatedCost,
      estimatedCost: phase.estimatedCost,
      actualCost: phase.actualCost,
      dependencies: phase.dependencies,
      milestones: phase.milestones,
      assignedTo: phase.humanResources?.employees || [],
      resources: {
        employees: phase.humanResources?.employees || [],
        materials: phase.materials?.map(m => m.id) || []
      },
      requiresInspection: false,
      requiresEngineerApproval: false,
      steps: phase.steps?.map((step, index) => ({
        id: `${phase.id}_step_${index}`,
        name: step.name || `Step ${index + 1}`,
        description: step.description || ''
      })) || [],
      deliverables: [],
      acceptanceCriteria: [],
      location: phase.location ? {
        address: phase.location,
        city: '',
        country: '',
        coordinates: undefined
      } : undefined,
      projectId: phase.projectId,
      tags: [],
      notes: phase.notes,
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt
    };
  }

  /**
   * API Response DTO → Domain Model
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: PhaseDTO): Phase {
    return Phase.create({
      id: dto.id,
      projectId: dto.projectId,
      phaseName: dto.name,
      description: dto.description,
      status: this.fromDTOStatus(dto.status),
      progress: dto.progress,
      orderIndex: 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      estimatedCost: dto.estimatedCost,
      actualCost: dto.actualCost,
      estimatedDuration: dto.estimatedDuration,
      constructionPhase: null,
      constructionStage: null,
      phaseType: dto.type as PhaseType,
      location: dto.location?.address,
      customPhaseData: null,
      dependencies: dto.dependencies || [],
      milestones: dto.milestones || [],
      materials: dto.resources?.materials?.map(id => ({ id, name: id, quantity: 0 })) || [],
      suppliers: [],
      humanResources: {
        employees: dto.assignedTo || [],
        equipment: dto.resources?.equipment || []
      },
      steps: dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        completed: false
      })) || [],
      notes: dto.notes,
      weight: null,
      createdBy: null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  /**
   * Create Request DTO → Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromCreateRequest(request: CreatePhaseRequestDTO, id: string): Phase {
    return Phase.create({
      id: id,
      projectId: request.projectId,
      phaseName: request.name,
      description: request.description,
      status: 'pending',
      progress: 0,
      orderIndex: 0,
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
      estimatedCost: request.estimatedCost,
      actualCost: null,
      estimatedDuration: null,
      constructionPhase: null,
      constructionStage: null,
      phaseType: request.type as PhaseType || 'execution',
      location: request.location?.address,
      customPhaseData: null,
      dependencies: request.dependencies || [],
      milestones: request.milestones || [],
      materials: request.resources?.materials?.map(id => ({ id, name: id, quantity: 0 })) || [],
      suppliers: [],
      humanResources: {
        employees: request.assignedTo || [],
        equipment: request.resources?.equipment || []
      },
      steps: [],
      notes: request.notes,
      weight: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Update Request DTO → Partial Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromUpdateRequest(dto: UpdatePhaseRequestDTO): Partial<Phase> {
    // Note: Since Phase properties are readonly, we return update data
    // The service layer will handle creating a new Phase instance with updates
    return {
      updatedAt: new Date().toISOString()
    };
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreatePhaseRequestDTO {
    return {
      projectId: formData.projectId as string,
      name: formData.name as string,
      description: formData.description as string,
      type: formData.type as DTOType,
      priority: formData.priority as PhasePriority,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      budget: Number(formData.budget) || 0,
      estimatedCost: Number(formData.estimatedCost) || 0,
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      milestones: Array.isArray(formData.milestones) ? formData.milestones as string[] : [],
      assignedTo: Array.isArray(formData.assignedTo) ? formData.assignedTo as string[] : [],
      resources: {
        employees: Array.isArray(formData.employees) ? formData.employees as string[] : [],
        materials: Array.isArray(formData.materials) ? formData.materials as string[] : []
      },
      requiresInspection: Boolean(formData.requiresInspection),
      requiresEngineerApproval: Boolean(formData.requiresEngineerApproval),
      location: formData.location as {address?: string; city?: string; country?: string; coordinates?: {lat: number; lng: number}} | undefined,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : [],
      notes: formData.notes as string,
      documents: Array.isArray(formData.documents) ? formData.documents as string[] : [],
      inspections: Array.isArray(formData.inspections) ? formData.inspections as string[] : []
    };
  }

  /**
   * Domain Model → UI View Model
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toUI(phase: Phase): PhaseUIState {
    const today = new Date();
    const startDate = phase.startDate ? new Date(phase.startDate) : today;
    const endDate = phase.endDate ? new Date(phase.endDate) : today;
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      // Base phase data
      id: phase.id,
      name: phase.phaseName,
      description: phase.description,
      type: phase.phaseType as DTOType,
      status: this.toDTOStatus(phase.status),
      priority: 'medium' as PhasePriority,
      progress: phase.progress || 0,
      completionPercentage: phase.progress || 0,
      startDate: phase.startDate?.toISOString(),
      endDate: phase.endDate?.toISOString(),
      estimatedDuration: phase.estimatedDuration,
      actualDuration: phase.endDate && phase.startDate ? 
        Math.ceil((phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      budget: phase.estimatedCost,
      estimatedCost: phase.estimatedCost,
      actualCost: phase.actualCost,
      dependencies: phase.dependencies?.map(dep => dep.id) || [],
      milestones: phase.milestones?.map(mil => mil.id) || [],
      assignedTo: phase.humanResources?.employees || [],
      resources: {
        employees: phase.humanResources?.employees || [],
        materials: phase.materials?.map(m => m.id) || []
      },
      requiresInspection: false,
      requiresEngineerApproval: false,
      steps: phase.steps?.map((step, index) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        orderIndex: step.orderIndex,
        tasks: step.tasks?.map(task => task.id) || [],
        estimatedDurationDays: step.estimatedDurationDays,
        requiresInspection: step.requiresInspection,
        requiresEngineerApproval: step.requiresEngineerApproval,
        startDate: step.startDate?.toISOString(),
        endDate: step.endDate?.toISOString(),
        inspections: step.inspections?.map(inspection => inspection.id) || [],
        documents: step.documents?.map(doc => doc.id) || []
      })) || [],
      deliverables: [],
      acceptanceCriteria: [],
      location: phase.location ? {
        address: phase.location,
        city: '',
        country: '',
        coordinates: undefined
      } : undefined,
      projectId: phase.projectId,
      tags: [],
      notes: phase.notes,
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,
      
      // Form data
      formData: {
        name: phase.phaseName,
        description: phase.description,
        type: phase.phaseType as DTOType,
        status: this.toDTOStatus(phase.status),
        priority: 'medium' as PhasePriority,
        progress: phase.progress,
        startDate: phase.startDate?.toISOString(),
        endDate: phase.endDate?.toISOString(),
        budget: phase.estimatedCost,
        estimatedCost: phase.estimatedCost,
        actualCost: phase.actualCost,
        // Add other form fields as needed
      },
      
      // Calculated fields
      calculatedFields: {
        totalCost: phase.estimatedCost || 0,
        completionPercentage: phase.progress || 0,
        daysRemaining: daysRemaining,
        budgetVariance: phase.actualCost && phase.estimatedCost ? 
          phase.actualCost - phase.estimatedCost : 0,
        isOnTrack: (phase.progress || 0) >= (daysElapsed / totalDays) * 100,
        taskCount: phase.steps?.length || 0,
        completedTasks: phase.steps?.filter(s => s.status === 'completed').length || 0,
        budgetUtilization: phase.actualCost && phase.estimatedCost ? 
          (phase.actualCost / phase.estimatedCost) * 100 : 0
      },
      
      // UI-specific properties
      formattedStartDate: startDate.toLocaleDateString(),
      formattedEndDate: endDate.toLocaleDateString(),
      formattedBudget: phase.estimatedCost ? 
        new Intl.NumberFormat('fr-MR', {
          style: 'currency',
          currency: 'MRU'
        }).format(phase.estimatedCost) : '',
      daysElapsed: daysElapsed,
      totalDays: totalDays,
      isOverdue: daysRemaining < 0 && phase.status !== 'completed',
      isOnTrack: (phase.progress || 0) >= (daysElapsed / totalDays) * 100,
      statusColor: this.getStatusColor(phase.status),
      priorityColor: this.getPriorityColor('medium'),
      progressVariant: this.getProgressVariant(phase.progress || 0),
      canEdit: ['pending', 'in_progress'].includes(phase.status),
      canDelete: phase.status === 'pending',
      canComplete: ['in_progress'].includes(phase.status),
      
      // Visual indicators
      badgeVariant: this.getBadgeVariant(phase.status, daysRemaining),
      icon: this.getStatusIcon(phase.status),
      healthIndicator: this.getHealthIndicator(phase),
      
      // Loading and error states
      loading: false,
      error: null,
      isDirty: false,
      isValid: true,
      touchedFields: new Set<string>(),
      
      // UI state management
      expandedSections: new Set<string>(),
      selectedTab: 'overview',
      filters: {
        status: 'all',
        priority: 'all',
        dateRange: null
      },
      
      // Pagination and sorting
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      },
      sorting: {
        field: 'createdAt',
        direction: 'desc'
      }
    };
  }

  /**
   * UI Form Data → Update Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdatePhaseRequestDTO {
    return {
      name: formData.name as string,
      description: formData.description as string,
      status: formData.status as DTOStatus,
      endDate: formData.endDate as string,
      progress: Number(formData.progress) || 0,
      actualCost: Number(formData.actualCost) || 0,
      assignedTo: Array.isArray(formData.assignedTo) ? formData.assignedTo as string[] : [],
      requiresInspection: Boolean(formData.requiresInspection),
      requiresEngineerApproval: Boolean(formData.requiresEngineerApproval),
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      materials: Array.isArray(formData.materials) ? formData.materials as string[] : [],
      documents: Array.isArray(formData.documents) ? formData.documents as string[] : [],
      inspections: Array.isArray(formData.inspections) ? formData.inspections as string[] : [],
      updatedBy: formData.updatedBy as string,
      changeReason: formData.changeReason as string
    };
  }

  // =================== BATCH TRANSFORMATIONS ===================
  
  /**
   * Multiple Supabase Rows → Domain Models
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Phase[] {
    return rows.map(row => this.fromSupabase(row));
  }

  /**
   * Multiple Domain Models → DTOs
   */
  static manyToDTO(phases: Phase[]): PhaseDTO[] {
    return phases.map(phase => this.toDTO(phase));
  }

  /**
   * Multiple Domain Models → UI View Models
   */
  static manyToUI(phases: Phase[]): PhaseUIState[] {
    return phases.map(phase => this.toUI(phase));
  }

  /**
   * Multiple DTOs → Domain Models
   */
  static manyFromDTO(dtos: PhaseDTO[]): Phase[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  // =================== ENUM CONVERSIONS ===================
  
  private static fromDatabaseStatus(status: string): PhaseStatus {
    const mapping: Record<string, PhaseStatus> = {
      'planning': 'pending',
      'active': 'in_progress',
      'completed': 'completed',
      'paused': 'blocked',
      'cancelled': 'delayed'
    };
    return mapping[status] || 'pending';
  }

  private static toDatabaseStatus(status: PhaseStatus): string {
    const mapping: Record<PhaseStatus, string> = {
      'pending': 'planning',
      'in_progress': 'active',
      'completed': 'completed',
      'blocked': 'paused',
      'delayed': 'cancelled'
    };
    return mapping[status] || 'planning';
  }

  private static fromDTOStatus(dto: DTOStatus): PhaseStatus {
    const mapping: Record<DTOStatus, PhaseStatus> = {
      [DTOStatus.PLANNING]: 'pending',
      [DTOStatus.ACTIVE]: 'in_progress',
      [DTOStatus.COMPLETED]: 'completed',
      [DTOStatus.PAUSED]: 'blocked',
      [DTOStatus.CANCELLED]: 'delayed'
    };
    return mapping[dto] || 'pending';
  }

  private static toDTOStatus(status: PhaseStatus): DTOStatus {
    const mapping: Record<PhaseStatus, DTOStatus> = {
      'pending': DTOStatus.PLANNING,
      'in_progress': DTOStatus.ACTIVE,
      'completed': DTOStatus.COMPLETED,
      'blocked': DTOStatus.PAUSED,
      'delayed': DTOStatus.CANCELLED
    };
    return mapping[status] || DTOStatus.PLANNING;
  }

  // =================== UI HELPER METHODS ===================
  
  private static getStatusColor(status: PhaseStatus): string {
    const colors = {
      'pending': 'gray',
      'in_progress': 'blue',
      'completed': 'green',
      'blocked': 'orange',
      'delayed': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getPriorityColor(priority: PhasePriority): string {
    const colors = {
      'low': 'gray',
      'medium': 'blue',
      'high': 'orange',
      'urgent': 'red'
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

  private static getBadgeVariant(status: PhaseStatus, daysRemaining: number): string {
    if (status === 'completed') return 'success';
    if (status === 'blocked' || status === 'delayed') return 'danger';
    if (daysRemaining < 0 && status !== 'completed') return 'warning';
    if (status === 'in_progress') return 'primary';
    return 'secondary';
  }

  private static getStatusIcon(status: PhaseStatus): string {
    const icons = {
      'pending': 'clock',
      'in_progress': 'play-circle',
      'completed': 'check-circle',
      'blocked': 'pause-circle',
      'delayed': 'alert-circle'
    };
    return icons[status] || 'circle';
  }

  private static getHealthIndicator(phase: Phase): 'healthy' | 'warning' | 'critical' {
    if (phase.status === 'blocked' || phase.status === 'delayed') return 'critical';
    if (phase.progress < 25 && phase.startDate && new Date(phase.startDate) < new Date()) return 'warning';
    return 'healthy';
  }

  // =================== SUMMARY TRANSFORMATIONS ===================
  
  /**
   * Create summary object for lists
   */
  static toSummary(phase: Phase): PhaseSummaryDTO {
    const ui = this.toUI(phase);
    
    return {
      id: ui.id,
      name: ui.name,
      status: ui.status,
      progress: ui.progress,
      projectId: ui.projectId,
      startDate: ui.startDate,
      endDate: ui.endDate,
      orderIndex: 0,
      taskCount: ui.calculatedFields?.taskCount || 0,
      completedTasks: ui.calculatedFields?.completedTasks || 0,
      budgetUtilization: ui.calculatedFields?.budgetUtilization || 0,
      isOnTrack: ui.calculatedFields?.isOnTrack || false,
      priority: ui.priority,
      lastActivity: ui.updatedAt,
      createdAt: ui.createdAt,
      updatedAt: ui.updatedAt
    };
  }

  /**
   * Create timeline item
   */
  static toTimelineItem(phase: Phase) {
    const ui = this.toUI(phase);
    
    return {
      id: ui.id,
      name: ui.name,
      description: ui.description,
      date: ui.formattedStartDate,
      status: ui.status,
      icon: ui.icon,
      color: ui.statusColor,
      progress: ui.progress,
      budget: ui.formattedBudget,
      projectId: ui.projectId
    };
  }

  // =================== BUSINESS LOGIC HELPERS ===================
  
  /**
   * Calculate phase progress percentage
   */
  static calculatePhaseProgress(phase: Phase): number {
    return Math.min(100, Math.max(0, phase.progress || 0));
  }

  /**
   * Format phase duration as human readable string
   */
  static formatPhaseDuration(startDate: Date | null, endDate: Date | null): string {
    if (!startDate) return 'Non défini';
    
    const start = startDate;
    const end = endDate || new Date();
    
    if (isNaN(start.getTime())) return 'Date invalide';
    if (isNaN(end.getTime())) return 'Date invalide';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Même jour';
    if (diffDays === 1) return '1 jour';
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} mois`;
    return `${Math.round(diffDays / 365)} ans`;
  }

  /**
   * Calculate phase efficiency based on budget and progress
   */
  static calculatePhaseEfficiency(phase: Phase): number {
    if (!phase.estimatedCost || phase.estimatedCost <= 0) return 0;
    
    const progress = phase.progress || 0;
    const efficiency = progress / 100;
    
    // Add some business logic based on phase status
    if (phase.status === 'completed') {
      return Math.min(100, efficiency * 100);
    }
    
    return Math.round(efficiency * 100);
  }

  /**
   * Calculate phase risk level based on various factors
   */
  static calculatePhaseRisk(phase: Phase): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Budget risk
    if (phase.estimatedCost && phase.estimatedCost > 100000) riskScore += 20;
    
    // Timeline risk
    if (phase.startDate && phase.endDate) {
      const duration = phase.endDate.getTime() - phase.startDate.getTime();
      const days = duration / (1000 * 60 * 60 * 24);
      if (days > 90) riskScore += 20;
    }
    
    // Progress risk
    if (phase.progress < 25) riskScore += 20;
    
    // Status risk
    if (phase.status === 'blocked' || phase.status === 'delayed') riskScore += 30;
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }
}
