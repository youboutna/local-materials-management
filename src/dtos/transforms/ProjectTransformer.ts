/**
 * Project Transformer - Hexagonal Architecture
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

import { Project } from '@/domain/entities/Project';
import { 
  ProjectDTO, 
  ProjectDetailDTO,
  ProjectDTO,
  ProjectUIState,
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateProjectRequestDTO,
  ProjectStatus,
  ProjectPriority,
  ProjectType,
  ConstructionStage
} from '@/dtos/entities/ProjectDTO';

export class ProjectTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================  
  /**
   * Supabase Row → Domain Model
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): Project {
    return new Project(
      row.id as string,
      row.title as string,
      row.description as string,
      row.status as ProjectStatus,
      Number(row.progress) || 0,
      Number(row.budget) || 0,
      row.start_date as string ? new Date(row.start_date as string) : null,
      row.end_date as string ? new Date(row.end_date as string) : null,
      row.location as string,
      Number(row.team_size) || 0,
      row.thumbnail as string || undefined,
      row.created_by as string || '',
      row.created_at as string ? new Date(row.created_at as string) : new Date(),
      row.updated_at as string ? new Date(row.updated_at as string) : new Date(),
      // Coordinates
      row.latitude && row.longitude ? {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        isValid: true
      } : undefined,
      // Financial
      row.financing_source as string || '',
      row.main_contractor as string || '',
      row.currency as string || 'MRU',
      // Organization
      row.client_organization as string || '',
      row.donor_organization as string || '',
      row.sector as string || '',
      row.project_type as string || '',
      row.priority as string || 'Moyenne',
      // Location details
      row.geographic_zone as string || '',
      row.terrain_type as string || '',
      row.environmental_constraints as string || '',
      row.area_sqm ? Number(row.area_sqm) : undefined,
      // Project details
      row.project_reference_number as string || '',
      row.project_order as string || '',
      row.client_id as string || '',
      row.current_phase as string || '',
      row.current_stage as string || '',
      // Payment settings
      Boolean(row.allows_initial_payment),
      Number(row.initial_payment_percentage) || 0,
      row.payment_frequency as string || '',
      row.payment_mode as string || '',
      Number(row.retention_percentage) || 0,
      Number(row.initial_advance_percentage) || 0,
      // Timeline
      row.completion_date as string ? new Date(row.completion_date as string) : undefined,
      Number(row.estimated_days) || 0,
      row.launch_date as string ? new Date(row.launch_date as string) : undefined,
      row.attribution_date as string ? new Date(row.attribution_date as string) : undefined,
      // Requirements
      Boolean(row.requires_consultant_validation),
      Boolean(row.requires_ministry_approval),
      Boolean(row.requires_permits),
      row.permit_number as string || '',
      Boolean(row.has_utilities),
      // Team members
      row.engineering_consultant as string || undefined,
      row.technical_manager as string || undefined,
      row.project_responsable as string || undefined,
      row.supervisor as string || undefined,
      // Collections
      Array.isArray(row.payments) ? row.payments : [],
      Array.isArray(row.inspections) ? row.inspections : [],
      Array.isArray(row.tasks) ? row.tasks : [],
      Array.isArray(row.documents) ? row.documents : [],
      Array.isArray(row.materials) ? row.materials : [],
      Array.isArray(row.phases) ? row.phases : [],
      Array.isArray(row.milestones) ? row.milestones : [],
      Array.isArray(row.risks) ? row.risks : [],
      Array.isArray(row.tenders) ? row.tenders : [],
      Array.isArray(row.suppliers) ? row.suppliers : [],
      Array.isArray(row.employees) ? row.employees : [],
      row.project_reference as string || ''
    );
  }

  /**
   * Domain Model → Supabase Insert/Update Object
   * Following hexagonal architecture: Domain → Application → Infrastructure
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
      team_size: project.teamSize,
      thumbnail: project.thumbnail,
      created_by: project.createdBy,
      created_at: project.createdAt?.toISOString(),
      updated_at: project.updatedAt?.toISOString(),
      // Coordinates
      latitude: project.coordinates?.latitude,
      longitude: project.coordinates?.longitude,
      // Financial
      financing_source: project.financingSource,
      main_contractor: project.mainContractor,
      currency: project.currency,
      // Organization
      client_organization: project.clientOrganization,
      donor_organization: project.donorOrganization,
      sector: project.sector,
      project_type: project.projectType,
      priority: project.priority,
      // Location details
      geographic_zone: project.geographicZone,
      terrain_type: project.terrainType,
      environmental_constraints: project.environmentalConstraints,
      area_sqm: project.areaSqm,
      // Project details
      project_reference_number: project.projectReferenceNumber,
      project_order: project.projectOrder,
      client_id: project.clientId,
      current_phase: project.currentPhase,
      current_stage: project.currentStage,
      // Payment settings
      allows_initial_payment: project.allowsInitialPayment,
      initial_payment_percentage: project.initialPaymentPercentage,
      payment_frequency: project.paymentFrequency,
      payment_mode: project.paymentMode,
      retention_percentage: project.retentionPercentage,
      initial_advance_percentage: project.initialAdvancePercentage,
      // Timeline
      completion_date: project.completionDate?.toISOString(),
      estimated_days: project.estimatedDays,
      launch_date: project.launchDate?.toISOString(),
      attribution_date: project.attributionDate?.toISOString(),
      // Requirements
      requires_consultant_validation: project.requiresConsultantValidation,
      requires_ministry_approval: project.requiresMinistryApproval,
      requires_permits: project.requiresPermits,
      permit_number: project.permitNumber,
      has_utilities: project.hasUtilities,
      // Team members
      engineering_consultant: project.engineeringConsultant,
      technical_manager: project.technicalManager,
      project_responsable: project.projectResponsable,
      supervisor: project.supervisor,
      // Collections
      payments: project.payments,
      inspections: project.inspections,
      tasks: project.tasks,
      documents: project.documents,
      materials: project.materials,
      phases: project.phases,
      milestones: project.milestones,
      risks: project.risks,
      tenders: project.tenders,
      suppliers: project.suppliers,
      employees: project.employees,
      project_reference: project.projectReference
    };
  }

  /**
   * Create Request → Supabase Insert Object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreateProjectRequestDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      title: request.title,
      description: request.description,
      status: 'planifie' as ProjectStatus,
      progress: 0,
      budget: request.budget || 0,
      start_date: request.startDate || now,
      end_date: request.endDate,
      location: request.location || '',
      team_size: request.teamSize || 0,
      thumbnail: request.thumbnail,
      created_by: request.createdBy,
      created_at: now,
      updated_at: now,
      // Coordinates
      latitude: request.latitude,
      longitude: request.longitude,
      // Financial
      financing_source: request.financingSource,
      main_contractor: request.mainContractor,
      currency: request.currency || 'MRU',
      // Organization
      client_organization: request.clientOrganization,
      donor_organization: request.donorOrganization,
      sector: request.sector,
      project_type: request.projectType,
      priority: request.priority || 'Moyenne',
      // Location details
      geographic_zone: request.geographicZone,
      terrain_type: request.terrainType,
      environmental_constraints: request.environmentalConstraints,
      area_sqm: request.areaSqm,
      // Project details
      project_reference_number: request.projectReferenceNumber,
      project_order: request.projectOrder,
      client_id: request.clientId,
      current_phase: request.currentPhase,
      current_stage: request.currentStage,
      // Payment settings
      allows_initial_payment: request.allowsInitialPayment,
      initial_payment_percentage: request.initialPaymentPercentage,
      payment_frequency: request.paymentFrequency,
      payment_mode: request.paymentMode,
      retention_percentage: request.retentionPercentage,
      initial_advance_percentage: request.initialAdvancePercentage,
      // Timeline
      completion_date: request.completionDate,
      estimated_days: request.estimatedDays,
      launch_date: request.launchDate,
      attribution_date: request.attributionDate,
      // Requirements
      requires_consultant_validation: request.requiresConsultantValidation,
      requires_ministry_approval: request.requiresMinistryApproval,
      requires_permits: request.requiresPermits,
      permit_number: request.permitNumber,
      has_utilities: request.hasUtilities,
      // Team members
      engineering_consultant: request.engineeringConsultant?.name,
      technical_manager: request.technicalManager?.name,
      project_responsable: request.projectResponsable?.name,
      supervisor: request.supervisor?.name,
      // Collections
      payments: [],
      inspections: [],
      tasks: [],
      documents: [],
      materials: request.materials || [],
      phases: request.phases || [],
      milestones: request.milestones || [],
      risks: request.risks || [],
      tenders: request.tenders || [],
      suppliers: request.suppliers || [],
      employees: request.employees || [],
      project_reference: request.projectReference
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      progress: project.progress,
      location: project.location,
      address: project.location,
      latitude: project.coordinates?.latitude,
      longitude: project.coordinates?.longitude,
      geographicZone: project.geographicZone,
      terrainType: project.terrainType,
      startDate: project.startDate?.toISOString() || '',
      endDate: project.endDate?.toISOString(),
      estimatedDurationDays: project.estimatedDays,
      budget: project.budget,
      currency: project.currency,
      totalSpent: 0, // Would be calculated from payments
      remainingBudget: project.budget,
      budgetUtilization: 0,
      teamSize: project.teamSize,
      projectManagerId: project.createdBy,
      technicalManagerId: project.technicalManager?.id,
      supervisorId: project.supervisor?.id,
      clientId: project.clientId,
      mainContractor: project.mainContractor ? {
        id: project.mainContractor,
        name: project.mainContractor,
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        specialization: '',
        rating: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : undefined,
      thumbnail: project.thumbnail,
      currentPhase: project.currentPhase as any,
      constructionStage: project.currentStage as ConstructionStage,
      priority: project.priority as ProjectPriority,
      projectType: project.projectType as ProjectType,
      methodology: 'waterfall' as const,
      createdAt: project.createdAt?.toISOString(),
      updatedAt: project.updatedAt?.toISOString()
    };
  }

  /**
   * API Response DTO → Domain Model
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: ProjectDTO): Project {
    return this.fromSupabase(dto);
  }

  /**
   * Create Request DTO → Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromCreateRequest(request: CreateProjectRequestDTO, id: string): Project {
    return new Project(
      id,
      request.title,
      request.description || '',
      'planifie' as ProjectStatus,
      0,
      request.budget || 0,
      request.startDate ? new Date(request.startDate) : null,
      request.endDate ? new Date(request.endDate) : null,
      request.location || '',
      request.teamSize || 0,
      request.thumbnail,
      request.createdBy || '',
      new Date(),
      new Date(),
      // Coordinates
      request.latitude && request.longitude ? {
        latitude: request.latitude,
        longitude: request.longitude,
        isValid: true
      } : undefined,
      // Financial
      request.financingSource || '',
      request.mainContractor || '',
      request.currency || 'MRU',
      // Organization
      request.clientOrganization || '',
      request.donorOrganization || '',
      request.sector || '',
      request.projectType || '',
      request.priority || 'Moyenne',
      // Location details
      request.geographicZone || '',
      request.terrainType || '',
      request.environmentalConstraints || '',
      request.areaSqm,
      // Project details
      request.projectReferenceNumber || '',
      request.projectOrder || '',
      request.clientId || '',
      request.currentPhase || '',
      request.currentStage || '',
      // Payment settings
      request.allowsInitialPayment || false,
      request.initialPaymentPercentage || 0,
      request.paymentFrequency || '',
      request.paymentMode || '',
      request.retentionPercentage || 0,
      request.initialAdvancePercentage || 0,
      // Timeline
      request.completionDate ? new Date(request.completionDate) : undefined,
      request.estimatedDays || 0,
      request.launchDate ? new Date(request.launchDate) : undefined,
      request.attributionDate ? new Date(request.attributionDate) : undefined,
      // Requirements
      request.requiresConsultantValidation || false,
      request.requiresMinistryApproval || false,
      request.requiresPermits || false,
      request.permitNumber || '',
      request.hasUtilities || false,
      // Team members
      request.engineeringConsultant,
      request.technicalManager,
      request.projectResponsable,
      request.supervisor,
      // Collections
      [],
      [],
      [],
      [],
      request.materials || [],
      request.phases || [],
      request.milestones || [],
      request.risks || [],
      request.tenders || [],
      request.suppliers || [],
      request.employees || [],
      request.projectReference || ''
    );
  }

  /**
   * Update Request DTO → Partial Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromUpdateRequest(dto: UpdateProjectDTO): Partial<Project> {
    // Note: Since Project properties are readonly, we return update data
    // The service layer will handle creating a new Project instance with updates
    return {
      updatedAt: new Date().toISOString()
    };
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateProjectRequestDTO {
    return {
      title: formData.title as string,
      description: formData.description as string,
      budget: Number(formData.budget) || 0,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      location: formData.location as string,
      teamSize: Number(formData.teamSize) || 0,
      thumbnail: formData.thumbnail as string,
      createdBy: formData.createdBy as string,
      latitude: Number(formData.latitude) || undefined,
      longitude: Number(formData.longitude) || undefined,
      financingSource: formData.financingSource as string,
      mainContractor: formData.mainContractor as string,
      currency: formData.currency as string,
      clientOrganization: formData.clientOrganization as string,
      donorOrganization: formData.donorOrganization as string,
      sector: formData.sector as string,
      projectType: formData.projectType as string,
      priority: formData.priority as string,
      geographicZone: formData.geographicZone as string,
      terrainType: formData.terrainType as string,
      environmentalConstraints: formData.environmentalConstraints as string,
      areaSqm: Number(formData.areaSqm) || undefined,
      projectReferenceNumber: formData.projectReferenceNumber as string,
      projectOrder: formData.projectOrder as string,
      clientId: formData.clientId as string,
      currentPhase: formData.currentPhase as string,
      currentStage: formData.currentStage as string,
      allowsInitialPayment: Boolean(formData.allowsInitialPayment),
      initialPaymentPercentage: Number(formData.initialPaymentPercentage) || 0,
      paymentFrequency: formData.paymentFrequency as string,
      paymentMode: formData.paymentMode as string,
      retentionPercentage: Number(formData.retentionPercentage) || 0,
      initialAdvancePercentage: Number(formData.initialAdvancePercentage) || 0,
      completionDate: formData.completionDate as string,
      estimatedDays: Number(formData.estimatedDays) || 0,
      launchDate: formData.launchDate as string,
      attributionDate: formData.attributionDate as string,
      requiresConsultantValidation: Boolean(formData.requiresConsultantValidation),
      requiresMinistryApproval: Boolean(formData.requiresMinistryApproval),
      requiresPermits: Boolean(formData.requiresPermits),
      permitNumber: formData.permitNumber as string,
      hasUtilities: Boolean(formData.hasUtilities),
      engineeringConsultant: formData.engineeringConsultant as any,
      technicalManager: formData.technicalManager as any,
      projectResponsable: formData.projectResponsable as any,
      supervisor: formData.supervisor as any,
      materials: Array.isArray(formData.materials) ? formData.materials as any[] : [],
      phases: Array.isArray(formData.phases) ? formData.phases as any[] : [],
      milestones: Array.isArray(formData.milestones) ? formData.milestones as any[] : [],
      risks: Array.isArray(formData.risks) ? formData.risks as any[] : [],
      tenders: Array.isArray(formData.tenders) ? formData.tenders as any[] : [],
      suppliers: Array.isArray(formData.suppliers) ? formData.suppliers as any[] : [],
      employees: Array.isArray(formData.employees) ? formData.employees as any[] : [],
      projectReference: formData.projectReference as string
    };
  }

  /**
   * Domain Model → UI View Model
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toUI(project: Project): ProjectUIState {
    const dto = this.toDTO(project);
    const today = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : today;
    const endDate = project.endDate ? new Date(project.endDate) : today;
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      // Base DTO data
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      progress: dto.progress,
      location: dto.location,
      startDate: dto.startDate,
      endDate: dto.endDate,
      budget: dto.budget,
      teamSize: dto.teamSize,
      thumbnail: dto.thumbnail,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      
      // Form data
      formData: {
        title: project.title,
        description: project.description,
        budget: project.budget,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        location: project.location,
        teamSize: project.teamSize,
        thumbnail: project.thumbnail,
        status: project.status,
        priority: project.priority as ProjectPriority,
        projectType: project.projectType as ProjectType,
        // Add other form fields as needed
      },
      
      // Calculated fields
      calculatedFields: {
        totalCost: project.budget,
        completionPercentage: project.progress,
        daysRemaining: daysRemaining,
        riskScore: this.calculateRiskScore(project),
        teamUtilization: project.teamSize > 0 ? (project.teamSize / 10) * 100 : 0 // Assuming 10 as optimal team size
      },
      
      // UI-specific properties
      formattedStartDate: startDate.toLocaleDateString(),
      formattedEndDate: endDate.toLocaleDateString(),
      formattedBudget: new Intl.NumberFormat('fr-MR', {
        style: 'currency',
        currency: project.currency
      }).format(project.budget),
      daysElapsed: daysElapsed,
      totalDays: totalDays,
      isOverdue: daysRemaining < 0 && project.status !== 'completed',
      isOnTrack: project.progress >= (daysElapsed / totalDays) * 100,
      statusColor: this.getStatusColor(project.status),
      priorityColor: this.getPriorityColor(project.priority as ProjectPriority),
      progressVariant: this.getProgressVariant(project.progress),
      canEdit: ['planifie', 'enCours', 'enAttente'].includes(project.status),
      canDelete: project.status === 'planifie',
      canComplete: ['enCours', 'enInspection'].includes(project.status),
      
      // Visual indicators
      badgeVariant: this.getBadgeVariant(project.status, daysRemaining),
      icon: this.getStatusIcon(project.status),
      healthIndicator: this.getHealthIndicator(project),
      
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
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateProjectDTO {
    return {
      id: formData.id as string,
      title: formData.title as string,
      description: formData.description as string,
      status: formData.status as ProjectStatus,
      progress: Number(formData.progress) || 0,
      budget: Number(formData.budget) || 0,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      location: formData.location as string,
      teamSize: Number(formData.teamSize) || 0,
      thumbnail: formData.thumbnail as string,
      priority: formData.priority as ProjectPriority,
      projectType: formData.projectType as ProjectType,
      geographicZone: formData.geographicZone as string,
      terrainType: formData.terrainType as string,
      environmentalConstraints: formData.environmentalConstraints as string,
      // Add other updateable fields as needed
    };
  }

  // =================== BATCH TRANSFORMATIONS ===================
  
  /**
   * Multiple Supabase Rows → Domain Models
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Project[] {
    return rows.map(row => this.fromSupabase(row));
  }

  /**
   * Multiple Domain Models → DTOs
   */
  static manyToDTO(projects: Project[]): ProjectDTO[] {
    return projects.map(project => this.toDTO(project));
  }

  /**
   * Multiple Domain Models → UI View Models
   */
  static manyToUI(projects: Project[]): ProjectUIState[] {
    return projects.map(project => this.toUI(project));
  }

  /**
   * Multiple DTOs → Domain Models
   */
  static manyFromDTO(dtos: ProjectDTO[]): Project[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  // =================== ENUM CONVERSIONS ===================
  
  private static getStatusColor(status: ProjectStatus): string {
    const colors = {
      'planifie': 'gray',
      'enCours': 'blue',
      'enAttente': 'orange',
      'enInspection': 'purple',
      'suspendu': 'red',
      'annule': 'red',
      'attribue': 'green',
      'termine': 'green',
      'enConception': 'blue',
      'enConstruction': 'orange',
      'enCloture': 'purple',
      'enRetard': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getPriorityColor(priority: ProjectPriority): string {
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

  private static getBadgeVariant(status: ProjectStatus, daysRemaining: number): string {
    if (status === 'termine') return 'success';
    if (status === 'suspendu' || status === 'annule') return 'danger';
    if (daysRemaining < 0 && status !== 'termine') return 'warning';
    if (status === 'enCours') return 'primary';
    if (status === 'enInspection') return 'purple';
    return 'secondary';
  }

  private static getStatusIcon(status: ProjectStatus): string {
    const icons = {
      'planifie': 'calendar',
      'enCours': 'play-circle',
      'enAttente': 'pause-circle',
      'enInspection': 'search',
      'suspendu': 'pause',
      'annule': 'x-circle',
      'attribue': 'check-circle',
      'termine': 'check-circle-2',
      'enConception': 'pen-tool',
      'enConstruction': 'hammer',
      'enCloture': 'archive',
      'enRetard': 'alert-circle'
    };
    return icons[status] || 'circle';
  }

  private static getHealthIndicator(project: Project): 'healthy' | 'warning' | 'critical' {
    if (project.status === 'suspendu' || project.status === 'annule') return 'critical';
    if (project.status === 'enRetard') return 'warning';
    if (project.progress < 25 && project.startDate && new Date(project.startDate) < new Date()) return 'warning';
    return 'healthy';
  }

  private static calculateRiskScore(project: Project): number {
    let riskScore = 0;
    
    // Budget risk
    if (project.budget > 1000000) riskScore += 20;
    
    // Timeline risk
    if (project.startDate && project.endDate) {
      const duration = project.endDate.getTime() - project.startDate.getTime();
      const days = duration / (1000 * 60 * 60 * 24);
      if (days > 365) riskScore += 20;
    }
    
    // Progress risk
    if (project.progress < 25) riskScore += 20;
    
    // Status risk
    if (project.status === 'suspendu' || project.status === 'enRetard') riskScore += 30;
    
    return Math.min(100, riskScore);
  }

  // =================== SUMMARY TRANSFORMATIONS ===================
  
  /**
   * Create summary object for lists
   */
  static toSummary(project: Project) {
    const ui = this.toUI(project);
    
    return {
      id: ui.id,
      title: ui.title,
      status: ui.status,
      priority: project.priority,
      location: ui.location,
      startDate: ui.formattedStartDate,
      endDate: ui.formattedEndDate,
      progress: ui.progress,
      budget: ui.formattedBudget,
      teamSize: ui.teamSize,
      daysRemaining: ui.daysRemaining,
      badgeVariant: ui.badgeVariant,
      statusColor: ui.statusColor,
      healthIndicator: ui.healthIndicator,
      isOverdue: ui.isOverdue
    };
  }

  /**
   * Create timeline item
   */
  static toTimelineItem(project: Project) {
    const ui = this.toUI(project);
    
    return {
      id: ui.id,
      title: ui.title,
      description: ui.description,
      date: ui.formattedStartDate,
      status: ui.status,
      icon: ui.icon,
      color: ui.statusColor,
      progress: ui.progress,
      budget: ui.formattedBudget,
      location: ui.location
    };
  }

  // =================== BUSINESS LOGIC HELPERS ===================
  
  /**
   * Calculate project progress percentage
   */
  static calculateProjectProgress(project: Project): number {
    return Math.min(100, Math.max(0, project.progress));
  }

  /**
   * Format project duration as human readable string
   */
  static formatProjectDuration(startDate: Date | null, endDate: Date | null): string {
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
   * Calculate project efficiency based on budget and progress
   */
  static calculateProjectEfficiency(project: Project): number {
    if (!project.budget || project.budget <= 0) return 0;
    
    const progress = project.progress || 0;
    const efficiency = progress / 100;
    
    // Add some business logic based on project status
    if (project.status === 'termine') {
      return Math.min(100, efficiency * 100);
    }
    
    return Math.round(efficiency * 100);
  }

  /**
   * Calculate project risk level based on various factors
   */
  static calculateProjectRisk(project: Project): 'low' | 'medium' | 'high' {
    const riskScore = this.calculateRiskScore(project);
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }
}
