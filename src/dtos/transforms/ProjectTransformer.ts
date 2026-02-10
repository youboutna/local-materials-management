/**
 * Project Transformer - Hexagonal Architecture
 * Complete conversion methods following the guide pattern:
 * 
 * Database ↔ Domain (fromSupabase, toSupabase)
 * Domain ↔ DTO (toDTO, fromDTO)  
 * UI ↔ DTO (formToCreateRequest, formToUpdateRequest, toUI)
 * Batch operations (manyFromSupabase, manyToDTO, manyToUI)
 */

import { Project, ProjectStatus, ProjectCoordinates } from '@/domain/entities/Project';
import { 
  ProjectDTO, 
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectDetailDTO,
  ProjectSummaryDTO,
  CreateProjectRequestDTO
} from '@/dtos/entities/ProjectDTO';

export class ProjectTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================
  
  /**
   * Supabase Row → Domain Entity
   * Converts snake_case database fields to camelCase domain properties
   */
  static fromSupabase(row: Record<string, unknown>): Project {
    const coordinates = row.coordinates_latitude && row.coordinates_longitude
      ? new ProjectCoordinates(
          Number(row.coordinates_latitude),
          Number(row.coordinates_longitude)
        )
      : undefined;

    return Project.create({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string) || '',
      status: (row.status as ProjectStatus) || 'planifié',
      progress: Number(row.progress) || 0,
      budget: Number(row.budget) || 0,
      startDate: row.start_date ? new Date(row.start_date as string) : null,
      endDate: row.end_date ? new Date(row.end_date as string) : null,
      location: row.location as string,
      coordinates,
      teamSize: Number(row.team_size) || 0,
      thumbnail: row.thumbnail as string,
      financingSource: row.financing_source as string,
      mainContractor: row.main_contractor as string,
      currency: (row.currency as string) || 'XOF',
      createdBy: row.created_by as string,
      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
    });
  }

  /**
   * Domain Entity → Supabase Insert/Update Object
   * Converts camelCase domain properties to snake_case database fields
   */
  static toSupabase(project: Project): Record<string, unknown> {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      start_date: project.startDate?.toISOString(),
      end_date: project.endDate?.toISOString(),
      location: project.location,
      coordinates_latitude: project.coordinates?.latitude,
      coordinates_longitude: project.coordinates?.longitude,
      team_size: project.teamSize,
      thumbnail: project.thumbnail,
      financing_source: project.financingSource,
      main_contractor: typeof project.mainContractor === 'string' 
        ? project.mainContractor 
        : project.mainContractor?.name,
      currency: project.currency,
      created_by: project.createdBy,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Batch: Supabase Rows → Domain Entities
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Project[] {
    return rows.map(row => this.fromSupabase(row));
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Entity → DTO
   * Converts domain entity to DTO for API responses
   */
  static toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      progress: project.progress,
      location: project.location || '',
      latitude: project.coordinates?.latitude,
      longitude: project.coordinates?.longitude,
      startDate: project.startDate?.toISOString() || '',
      endDate: project.endDate?.toISOString(),
      budget: project.budget,
      currency: project.currency || 'EUR',
      teamSize: project.teamSize || 0,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt?.toISOString(),
      updatedAt: project.updatedAt?.toISOString(),
      address: undefined, 
      geographicZone: undefined,
      terrainType: undefined,
      category: undefined,
      subCategory: undefined,
      priorityLevel: undefined,
      riskLevel: undefined,
      projectManagerId: undefined,
      technicalManagerId: undefined,
      supervisorId: undefined,
      clientId: undefined,
      mainContractor: undefined,
      currentPhase: undefined,
      currentStage: undefined,
      methodology: undefined,
      projectReference: undefined,
      selectionMode: undefined,
      financingSource: project.financingSource,
      marketType: project.marketType,
      requiresPermits: undefined,
      permitNumber: undefined,
      environmentalImpact: undefined,
      environmentalConstraints: undefined,
      insuranceRequired: undefined,
      bankGuaranteeRequired: undefined,
      bankGuaranteeAmount: undefined,
      hasUtilities: undefined,
      areaSqm: undefined,
      siteDetails: undefined,
      workspaceId: undefined,
      createdBy: undefined,
      taskCount: undefined,
      completedTasks: undefined,
      overdueTasks: undefined,
      riskCount: undefined,
      highRiskCount: undefined,
      inspectionCount: undefined,
      passedInspections: undefined,
      failedInspections: undefined,
      paymentCount: undefined,
      paidAmount: undefined,
      pendingPayments: undefined,
      phaseCount: undefined,
      completedPhases: undefined,
      activePhases: undefined,
      isOnTrack: undefined,
      scheduleVariance: undefined,
      activeTeamMembers: undefined,
      ganttChart: undefined,
      pertAnalysis: undefined,
      earnedValueManagement: undefined,
      projectAnalytics: undefined,
      performanceMetrics: undefined
    };
  }

  /**
   * DTO → Domain Entity
   * For processing incoming API requests
   */
  static fromDTO(dto: ProjectDTO): Project {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : undefined;

    return Project.create({
      id: dto.id,
      title: dto.title,
      description: dto.description || '',
      status: dto.status,
      progress: dto.progress || 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location,
      coordinates,
      teamSize: dto.teamSize || 0,
      thumbnail: dto.thumbnail,
      currency: dto.currency || 'EUR',
      // Additional fields that exist in domain entity
      financingSource: dto.financingSource,
      marketType: dto.marketType,
    });
  }

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(projects: Project[]): ProjectDTO[] {
    return projects.map(project => this.toDTO(project));
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Transforms form submission data to API create request
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateProjectDTO {
    return {
      title: formData.title as string,
      description: (formData.description as string) || '',
      location: (formData.location as string) || '',
      status: (formData.status as any) || 'planifie',
      budget: Number(formData.budget) || 0,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      teamSize: Number(formData.teamSize) || 0,
      thumbnail: formData.thumbnail as string,
      currency: (formData.currency as string) || 'XOF',
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      createdBy: formData.createdBy as string,
    };
  }

  /**
   * CreateProjectDTO → Partial<Project> (Entity)
   * For repository create operations
   */
  static fromCreateDTOToEntity(dto: CreateProjectDTO): Partial<Project> {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : undefined;

    return {
      title: dto.title,
      description: dto.description || '',
      status: (dto.status as unknown as ProjectStatus) || 'planifié',
      progress: 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location,
      coordinates,
      teamSize: dto.teamSize || 0,
      thumbnail: dto.thumbnail,
      currency: dto.currency || 'XOF',
      createdBy: dto.createdBy,
    } as Partial<Project>;
  }

  /**
   * UpdateProjectDTO → Partial<Project> (Entity)
   * For repository update operations
   */
  static fromUpdateDTOToEntity(dto: UpdateProjectDTO): Partial<Project> {
    const updates: Partial<Project> = {};
    
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status as unknown as ProjectStatus;
    if (dto.budget !== undefined) updates.budget = dto.budget;
    if (dto.progress !== undefined) updates.progress = dto.progress;
    if (dto.startDate !== undefined) updates.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updates.endDate = new Date(dto.endDate);
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.teamSize !== undefined) updates.teamSize = dto.teamSize;
    if (dto.thumbnail !== undefined) updates.thumbnail = dto.thumbnail;
    
    return updates;
  }

  /**
   * UI Form Data → Update Request DTO
   * Transforms form submission data to API update request
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateProjectDTO {
    return {
      id: formData.id as string,
      title: formData.title as string,
      description: formData.description as string,
      location: formData.location as string,
      status: formData.status as any,
      budget: formData.budget !== undefined ? Number(formData.budget) : undefined,
      progress: formData.progress !== undefined ? Number(formData.progress) : undefined,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      teamSize: formData.teamSize !== undefined ? Number(formData.teamSize) : undefined,
      thumbnail: formData.thumbnail as string,
    };
  }

  /**
   * Domain Entity → UI State
   * Transforms entity to UI-friendly format with calculated fields
   */
  static toUI(project: Project): Record<string, unknown> {
    const dto = this.toDTO(project);
    const daysRemaining = project.endDate 
      ? Math.max(0, Math.ceil((project.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      ...dto,
      isOverdue: project.isOverdue(),
      isCompleted: project.isCompleted(),
      daysRemaining,
      budgetFormatted: new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: project.currency || 'XOF' 
      }).format(project.budget),
      progressFormatted: `${project.progress}%`,
    };
  }

  /**
   * Batch: Domain Entities → UI States
   */
  static manyToUI(projects: Project[]): Record<string, unknown>[] {
    return projects.map(project => this.toUI(project));
  }

  // =================== CREATE REQUEST TRANSFORMATIONS ===================

  /**
   * Create Request DTO → Domain Entity
   * Used when creating a new project from API request
   */
  static fromCreateRequest(request: CreateProjectDTO, id: string): Project {
    const coordinates = request.latitude && request.longitude
      ? new ProjectCoordinates(request.latitude, request.longitude)
      : undefined;

    return Project.create({
      id,
      title: request.title,
      description: request.description || '',
      status: 'planifié' as ProjectStatus,
      progress: 0,
      budget: request.budget || 0,
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
      location: request.location,
      coordinates,
      teamSize: request.teamSize || 0,
      thumbnail: request.thumbnail,
      currency: request.currency || 'XOF',
      createdBy: request.createdBy,
    });
  }

  /**
   * Create Request DTO → Supabase Insert Object
   * Direct transformation for database insertion
   */
  static createToSupabase(request: CreateProjectDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      title: request.title,
      description: request.description || '',
      status: 'planifié',
      progress: 0,
      budget: request.budget || 0,
      start_date: request.startDate || now,
      end_date: request.endDate,
      location: request.location || '',
      coordinates_latitude: request.latitude,
      coordinates_longitude: request.longitude,
      team_size: request.teamSize || 0,
      thumbnail: request.thumbnail,
      currency: request.currency || 'XOF',
      created_by: request.createdBy,
      created_at: now,
      updated_at: now,
    };
  }

  // =================== DETAIL & SUMMARY TRANSFORMATIONS ===================

  /**
   * Domain Entity → Detail DTO
   * Includes all related data for detail views
   */
  static toDetailDTO(project: Project): ProjectDetailDTO {
    const baseDTO = this.toDTO(project);
    
    return {
      ...baseDTO,
      phases: [],
      tasks: [],
      risks: [],
      milestones: [],
      payments: [],
      materials: [],
      stakeholders: [],
      insurancePolicies: [],
      insuranceCertificates: [],
      alerts: [],
      plannedPhases: [],
      constructionMilestones: [],
      tenders: [],
      expenses: [],
    };
  }

  /**
   * Domain Entity → Summary DTO
   * Lightweight representation with counts
   */
  static toSummaryDTO(project: Project, counts?: {
    phasesCount?: number;
    tasksCount?: number;
    risksCount?: number;
    inspectionsCount?: number;
    paymentsCount?: number;
  }): ProjectSummaryDTO {
    const baseDTO = this.toDTO(project);
    
    return {
      ...baseDTO,
      phasesCount: counts?.phasesCount || 0,
      tasksCount: counts?.tasksCount || 0,
      risksCount: counts?.risksCount || 0,
      inspectionsCount: counts?.inspectionsCount || 0,
      paymentsCount: counts?.paymentsCount || 0,
    };
  }
}
