/**
 * Project Transformer - Hexagonal Architecture
 * Complete conversion methods following the guide pattern:
 * 
 * Database ↔ Domain (fromSupabase, toSupabase)
 * Domain ↔ DTO (toDTO, fromDTO)  
 * UI ↔ DTO (formToCreateRequest, formToUpdateRequest, toUI)
 * Batch operations (manyFromSupabase, manyToDTO, manyToUI)
 */

import { Project, ProjectCoordinates } from '@/domain/entities/Project';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
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

      // NEW: Additional database fields mapping
      attributionDate: row.attribution_date ? new Date(row.attribution_date as string) : undefined,
      bankGuaranteeAmount: row.bank_guarantee_amount ? Number(row.bank_guarantee_amount) : undefined,
      bankGuaranteePercentage: row.bank_guarantee_percentage ? Number(row.bank_guarantee_percentage) : undefined,
      bankGuaranteeRequired: row.bank_guarantee_required as boolean,
      checkScheduleLastRun: row.check_schedule_last_run,
      closureNotes: row.closure_notes as string,
      completionDate: row.completion_date ? new Date(row.completion_date as string) : undefined,
      donorOrganization: row.donor_organization as string,
      estimatedDays: row.estimated_days ? Number(row.estimated_days) : undefined,
      forme: row.forme as string,
      fundingSource: row.funding_source as string,
      initialAdvancePercentage: row.initial_advance_percentage ? Number(row.initial_advance_percentage) : undefined,
      initialPaymentPercentage: row.initial_payment_percentage ? Number(row.initial_payment_percentage) : undefined,
      localisation: row.localisation,
      materialsBudget: row.materials_budget ? Number(row.materials_budget) : undefined,
      paymentFrequency: row.payment_frequency as string,
      paymentMode: row.payment_mode as string,
      paymentWorkflowConfig: row.payment_workflow_config,
      procurementLeadTime: row.procurement_lead_time ? Number(row.procurement_lead_time) : undefined,
      projectOrder: row.project_order ? String(row.project_order) : undefined,
      projectReferenceNumber: row.project_reference_number as string,
      projectResponsableId: row.project_responsable_id as string,
      receptionStatus: row.reception_status as string,
      requiresConsultantValidation: row.requires_consultant_validation as boolean,
      requiresMinistryApproval: row.requires_ministry_approval as boolean,
      resourceAssignment: row.resource_assignment as string,
      retentionPercentage: row.retention_percentage ? Number(row.retention_percentage) : undefined,
      sector: row.sector as string,
      siteDetails: row.site_details as string,
      supervisorId: row.supervisor_id as string,
      terrainType: row.terrain_type as string,
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

      // NEW: Additional database fields mapping
      attribution_date: project.attributionDate?.toISOString(),
      bank_guarantee_amount: project.bankGuaranteeAmount,
      bank_guarantee_percentage: project.bankGuaranteePercentage,
      bank_guarantee_required: project.bankGuaranteeRequired,
      check_schedule_last_run: project.checkScheduleLastRun,
      closure_notes: project.closureNotes,
      completion_date: project.completionDate?.toISOString(),
      donor_organization: project.donorOrganization,
      estimated_days: project.estimatedDays,
      forme: project.forme,
      funding_source: project.fundingSource,
      initial_advance_percentage: project.initialAdvancePercentage,
      initial_payment_percentage: project.initialPaymentPercentage,
      localisation: project.localisation,
      materials_budget: project.materialsBudget,
      payment_frequency: project.paymentFrequency,
      payment_mode: project.paymentMode,
      payment_workflow_config: project.paymentWorkflowConfig,
      procurement_lead_time: project.procurementLeadTime,
      project_order: project.projectOrder,
      project_reference_number: project.projectReferenceNumber,
      project_responsable_id: project.projectResponsableId,
      reception_status: project.receptionStatus,
      requires_consultant_validation: project.requiresConsultantValidation,
      requires_ministry_approval: project.requiresMinistryApproval,
      resource_assignment: project.resourceAssignment,
      retention_percentage: project.retentionPercentage,
      sector: project.sector,
      site_details: project.siteDetails,
      supervisor_id: project.supervisorId,
      terrain_type: project.terrainType || '',
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
      createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
      address: project.location || undefined,
      geographicZone: project.geographicZone || undefined,
      terrainType: project.terrainType || undefined,
      category: project.sector || undefined,
      subCategory: project.projectType || undefined,
      priorityLevel: project.priority as "faible" | "moyenne" | "elevee" | "tresElevee" | undefined, // Proper enum mapping
      riskLevel: (project.getRiskScore() > 70 ? 'critique' : project.getRiskScore() > 40 ? 'eleve' : 'faible') as "faible" | "moyen" | "eleve" | "critique",
      projectManagerId: project.projectResponsable?.id || undefined,
      technicalManagerId: project.technicalManager?.id || undefined,
      supervisorId: project.supervisorId || project.supervisor?.id,
      clientId: project.clientId || undefined,
      mainContractor: typeof project.mainContractor === 'string'
        ? project.mainContractor
        : project.mainContractor?.name,
      currentPhase: project.currentPhase || undefined,
      currentStage: project.currentStage as ConstructionStage | undefined, // Cast to ConstructionStage enum
      methodology: project.methodology as "waterfall" | "agile" | "hybrid" | undefined, // Cast to Methodology enum
      projectReference: project.projectReferenceNumber,
      selectionMode: project.selectionMode || undefined,
      financingSource: project.financingSource || undefined,
      marketType: project.marketType || undefined,
      requiresPermits: project.requiresPermits || undefined,
      permitNumber: project.permitNumber || undefined,
      environmentalImpact: project.environmentalConstraints as "nul" | "faible" | "modere" | "eleve" | undefined,
      environmentalConstraints: project.environmentalConstraints || undefined,
      insuranceRequired: project.insuranceRequired || undefined,
      bankGuaranteeRequired: project.bankGuaranteeRequired || undefined,
      bankGuaranteeAmount: project.bankGuaranteeAmount || undefined,
      hasUtilities: project.hasUtilities || undefined,
      areaSqm: project.areaSqm || undefined,
      siteDetails: project.siteDetails || undefined,
      workspaceId: undefined, // Not in entity
      createdBy: project.createdBy || undefined,
      taskCount: project.tasks?.length || 0,
      completedTasks: project.tasks?.filter(t => t.status === 'completed' || t.status === 'done' || t.status === 'validated').length || 0,
      overdueTasks: project.tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length || 0,
      riskCount: project.risks?.length || 0,
      highRiskCount: project.risks?.filter(r => r.probability * r.impact > 0.7).length || 0,
      inspectionCount: project.inspections?.length || 0,
      passedInspections: project.inspections?.filter(i => i.status === 'completed' || i.status === 'approved').length || 0,
      failedInspections: project.inspections?.filter(i => i.status === 'rejected').length || 0,
      paymentCount: project.payments?.length || 0,
      paidAmount: project.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0,
      pendingPayments: project.getPendingPayments().length || 0,
      phaseCount: project.phases?.length || 0,
      completedPhases: project.phases?.filter(p => p.status === 'completed').length || 0,
      activePhases: project.phases?.filter(p => p.status === 'in_progress').length || 0,
      isOnTrack: project.isOnSchedule(),
      scheduleVariance: project.calculateScheduleVariance(),
      activeTeamMembers: project.teamSize || 0,
      ganttChart: undefined, // Complex data, leave undefined for now
      pertAnalysis: undefined, // Complex data, leave undefined for now
      earnedValueManagement: undefined, // Complex data, leave undefined for now
      projectAnalytics: undefined, // Complex data, leave undefined for now
      performanceMetrics: undefined, // Complex data, leave undefined for now

      // NEW: Additional database fields in DTO
      attributionDate: project.attributionDate?.toISOString(),
      bankGuaranteePercentage: project.bankGuaranteePercentage,
      checkScheduleLastRun: project.checkScheduleLastRun,
      closureNotes: project.closureNotes,
      completionDate: project.completionDate?.toISOString(),
      coordinatesLatitude: project.coordinates?.latitude,
      coordinatesLongitude: project.coordinates?.longitude,
      donorOrganization: project.donorOrganization,
      estimatedDays: project.estimatedDays,
      forme: project.forme,
      fundingSource: project.fundingSource,
      initialAdvancePercentage: project.initialAdvancePercentage,
      initialPaymentPercentage: project.initialPaymentPercentage,
      localisation: project.localisation,
      materialsBudget: project.materialsBudget,
      paymentFrequency: project.paymentFrequency,
      paymentMode: project.paymentMode,
      paymentWorkflowConfig: project.paymentWorkflowConfig,
      procurementLeadTime: project.procurementLeadTime,
      projectOrder: project.projectOrder,
      projectReferenceNumber: project.projectReferenceNumber,
      projectResponsableId: project.projectResponsableId,
      receptionStatus: project.receptionStatus,
      requiresConsultantValidation: project.requiresConsultantValidation,
      requiresMinistryApproval: project.requiresMinistryApproval,
      resourceAssignment: project.resourceAssignment,
      retentionPercentage: project.retentionPercentage,
      sector: project.sector,
    };
  }

  /**
   * DTO → Domain Entity
   * For processing incoming API requests
   */
  static fromDTO(dto: ProjectDTO): Project {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : dto.coordinatesLatitude && dto.coordinatesLongitude
      ? new ProjectCoordinates(dto.coordinatesLatitude, dto.coordinatesLongitude)
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
      mainContractor: dto.mainContractor,

      // NEW: Additional database fields from DTO
      attributionDate: dto.attributionDate ? new Date(dto.attributionDate) : undefined,
      bankGuaranteeAmount: dto.bankGuaranteeAmount,
      bankGuaranteePercentage: dto.bankGuaranteePercentage,
      bankGuaranteeRequired: dto.bankGuaranteeRequired,
      checkScheduleLastRun: dto.checkScheduleLastRun,
      closureNotes: dto.closureNotes,
      completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
      donorOrganization: dto.donorOrganization,
      estimatedDays: dto.estimatedDays,
      forme: dto.forme,
      fundingSource: dto.fundingSource,
      initialAdvancePercentage: dto.initialAdvancePercentage,
      initialPaymentPercentage: dto.initialPaymentPercentage,
      localisation: dto.localisation,
      materialsBudget: dto.materialsBudget,
      paymentFrequency: dto.paymentFrequency,
      paymentMode: dto.paymentMode,
      paymentWorkflowConfig: dto.paymentWorkflowConfig,
      procurementLeadTime: dto.procurementLeadTime,
      projectOrder: dto.projectOrder,
      projectReferenceNumber: dto.projectReferenceNumber || dto.projectReference,
      projectResponsableId: dto.projectResponsableId,
      receptionStatus: dto.receptionStatus,
      requiresConsultantValidation: dto.requiresConsultantValidation,
      requiresMinistryApproval: dto.requiresMinistryApproval,
      resourceAssignment: dto.resourceAssignment,
      retentionPercentage: dto.retentionPercentage,
      sector: dto.sector,
      siteDetails: dto.siteDetails,
      supervisorId: dto.supervisorId,
      terrainType: dto.terrainType,
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
      status: (formData.status as ProjectStatus) || 'planifie',
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
      status: formData.status as ProjectStatus,
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
