/**
 * Project Service - Hexagonal Architecture
 * 
 * Business use cases layer following the pattern:
 * constructor(private repository: IEntityRepository) {}
 * 
 * async create(request: CreateEntityDTO): Promise<EntityDTO>
 * async findById(id: string): Promise<EntityDTO | null>
 * async findAll(): Promise<EntityDTO[]>
 * async update(id: string, request: UpdateEntityDTO): Promise<EntityDTO | null>
 * async delete(id: string): Promise<boolean>
 */

import { Project, ProjectCoordinates } from '@/domain/entities/Project';
import { IProjectRepository, ProjectSummary } from '@/domain/repositories/IProjectRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { InspectionDTO, StakeholderDTO } from '@/dtos';
import { 
  ProjectDTO, 
  CreateProjectDTO, 
  UpdateProjectDTO, 
  ProjectSummaryDTO, 
  ProjectDetailDTO,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CATEGORIES,
  PROJECT_STATUS_TRANSITIONS,
  ProjectLocationData as ProjectLocationDataType
} from '@/dtos/entities/ProjectDTO';

// Import ProjectTransformer for transformations
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { RiskTransformer } from '@/dtos/transforms/RiskTransformer';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';

// Import location service and types
import { LocationService } from './LocationService';
import type { ProjectLocationData } from '@/dtos/entities/ProjectDTO';

// Import geocoding for project location validation
// NOTE: services must be pure TS — we use the singleton factory, never the React hook.
import { getGeocodingService } from './GeocodingServiceFactory';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { AutoFillLocationData } from '@/hooks/hexagonal/useLocationAutoFill';
import { MAURITANIA_REGIONS, MAURITANIA_CITIES } from '@/utils/mauritania';

// Location metadata interface
interface LocationMetadata extends Record<string, unknown> {
  validatedAt: string;
  validationSource: string;
  confidence: number;
  updatedAt?: string;
  updateSource?: string;
  region?: string;
  city?: string;
}

// =================== ERROR CLASSES ===================

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'PROJECT_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProjectServiceError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// =================== SERVICE IMPLEMENTATION ===================

export class ProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private stakeholderRepository?: IProjectStakeholderRepository,
    private locationService?: LocationService
  ) {}

  // =================== CORE CRUD OPERATIONS ===================

  /**
   * Create a new project
   * Flow: CreateDTO → Domain Entity → Repository → DTO
   */
  async create(request: CreateProjectDTO): Promise<ProjectDTO> {
    try {
      this.validateCreateRequest(request);
      
      // Keep the complete UI -> DTO -> domain/adapter mapping in one place.
      // The adapter then converts this camelCase object to database snake_case.
      const projectData = ProjectTransformer.fromCreateDTOToEntity(request);

      const project = await this.projectRepository.create(projectData);
      return ProjectTransformer.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_ERROR'
      );
    }
  }

  /**
   * Find project by ID
   * Flow: Repository → Domain Entity → DTO
   */
  async findById(id: string): Promise<ProjectDTO | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) return null;
      return ProjectTransformer.toDTO(project);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to find project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ERROR'
      );
    }
  }

  /**
   * Find all projects
   * Flow: Repository → Domain Entities → DTOs
   */
  async findAll(): Promise<ProjectDTO[]> {
    try {
      const projects = await this.projectRepository.findAll();
      return ProjectTransformer.manyToDTO(projects);
    } catch (error) {
      console.error('ProjectService.findAll error details:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          error && typeof error === 'object' ? JSON.stringify(error) : 
                          'Unknown error';
      throw new ProjectServiceError(
        `Failed to find projects: ${errorMessage}`,
        'FIND_ALL_ERROR'
      );
    }
  }

  /**
   * Update an existing project
   * Flow: UpdateDTO → Repository → Domain Entity → DTO
   */
  async update(id: string, request: UpdateProjectDTO): Promise<ProjectDTO | null> {
    try {
      const projectData = ProjectTransformer.fromUpdateDTOToEntity(request);

      const project = await this.projectRepository.update(id, projectData);
      return ProjectTransformer.toDTO(project);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR'
      );
    }
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.projectRepository.delete(id);
      return true;
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_ERROR'
      );
    }
  }

  // =================== LEGACY ALIASES (for backward compatibility) ===================

  async createProject(dto: CreateProjectDTO): Promise<ProjectDTO> {
    return this.create(dto);
  }

  async getProjectById(id: string): Promise<ProjectDTO | null> {
    return this.findById(id);
  }

  async getAllProjects(): Promise<ProjectDTO[]> {
    return this.findAll();
  }

  async updateProject(id: string, dto: UpdateProjectDTO): Promise<ProjectDTO> {
    const result = await this.update(id, dto);
    if (!result) throw new ProjectServiceError('Project not found', 'NOT_FOUND');
    return result;
  }

  async deleteProject(id: string): Promise<void> {
    await this.delete(id);
  }

  async assignOrganizationToAll(organizationId: string): Promise<number> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    return this.projectRepository.assignOrganizationToAll(organizationId);
  }

  // =================== SPECIALIZED QUERIES ===================

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<ProjectDTO[]> {
    try {
      const projects = await this.projectRepository.findActiveProjects();
      return ProjectTransformer.manyToDTO(projects);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get active projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ACTIVE_ERROR'
      );
    }
  }

  async getProjectsByStatus(status: string): Promise<ProjectDTO[]> {
    try {
      const allProjects = await this.projectRepository.findAll();
      const filtered = allProjects.filter(p => p.status === status);
      return ProjectTransformer.manyToDTO(filtered);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get projects by status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_BY_STATUS_ERROR'
      );
    }
  }

  /**
   * Returns the list of projects relevant for insurance monitoring.
   * Currently aliases "active" projects (status = en cours / EN_COURS).
   * Provided as a dedicated method so UI layers don't hardcode status filters.
   */
  async getProjectsForInsurance(): Promise<ProjectDTO[]> {
    try {
      const active = await this.projectRepository.findAll();
      const eligible = active.filter(p => {
        const s = String(p.status || '').toLowerCase();
        return s === 'en cours' || s === 'en_cours' || s === 'en_cours_v2' || s === 'in_progress';
      });
      return ProjectTransformer.manyToDTO(eligible);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get insurance projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_FOR_INSURANCE_ERROR'
      );
    }
  }

  async getProjectHierarchy(projectId: string) {
    try {
      const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
      return await hierarchyRepository.getProjectHierarchy(projectId);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_HIERARCHY_ERROR'
      );
    }
  }

  async updateProjectStatus(id: string, newStatus: string, reason?: string): Promise<ProjectDTO | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new ProjectServiceError(
          'Project not found',
          'PROJECT_NOT_FOUND'
        );
      }

      // Validate status transition
      const currentStatus = project.status;
      if (!this.isValidStatusTransition(currentStatus, newStatus)) {
        throw new ProjectServiceError(
          `Invalid status transition from ${currentStatus} to ${newStatus}`,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // Update project with new status
      const updateData: UpdateProjectDTO = {
        id,
        status: newStatus as ProjectStatus
      };

      const updatedProject = await this.update(id, updateData);
      
      // Log status change if reason provided
      if (reason) {
        console.log(`Project ${id} status changed from ${currentStatus} to ${newStatus}. Reason: ${reason}`);
      }

      return updatedProject;
    } catch (error) {
      if (error instanceof ProjectServiceError) {
        throw error;
      }
      throw new ProjectServiceError(
        `Failed to update project status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_STATUS_ERROR'
      );
    }
  }

  /**
   * Get projects by status category
   */
  async getProjectsByCategory(category: string): Promise<ProjectDTO[]> {
    try {
      // Define status categories
      const statusCategories: Record<string, string[]> = {
        'INITIAL': ['en_attente', 'en_conception', 'pre_qualification'],
        'ACTIVE': ['en_attente', 'en_conception', 'planifie_v2', 'attribue_v2', 'en_cours_v2', 'en_construction_v2'],
        'REVIEW': ['en_inspection_v2', 'en_review'],
        'COMPLETED': ['termine_v2', 'en_cloture_v2', 'completed'],
        'PROBLEM': ['suspendu_v2', 'en_retard_v2', 'annule_v2', 'cancelled']
      };
      
      const statusInCategory = statusCategories[category] || [];
      const allProjects = await this.projectRepository.findAll();
      const filtered = allProjects.filter(p => 
        statusInCategory.includes(p.status)
      );
      return ProjectTransformer.manyToDTO(filtered);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get projects by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_BY_CATEGORY_ERROR'
      );
    }
  }

  /**
   * Get available status transitions for a project
   */
  async getAvailableStatusTransitions(id: string): Promise<string[]> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new ProjectServiceError(
          'Project not found',
          'PROJECT_NOT_FOUND'
        );
      }

      const currentStatus = project.status;
      // Return available transitions based on current status
      const transitions: Record<string, string[]> = {
        'en_attente': ['en_conception', 'planifie_v2', 'en_cours_v2', 'annule_v2'],
        'en_conception': ['planifie_v2', 'en_cours_v2', 'annule_v2'],
        'planifie_v2': ['attribue_v2', 'en_cours_v2', 'annule_v2'],
        'attribue_v2': ['en_cours_v2', 'en_construction_v2', 'annule_v2'],
        'en_cours_v2': ['en_construction_v2', 'en_inspection_v2', 'suspendu_v2', 'en_retard_v2', 'annule_v2'],
        'en_construction_v2': ['en_inspection_v2', 'en_review', 'suspendu_v2', 'en_retard_v2', 'annule_v2'],
        'en_inspection_v2': ['en_review', 'termine_v2', 'en_cloture_v2', 'suspendu_v2', 'en_retard_v2'],
        'en_review': ['termine_v2', 'en_cloture_v2', 'suspendu_v2', 'en_retard_v2'],
        'termine_v2': ['en_cloture_v2', 'completed'],
        'en_cloture_v2': ['completed'],
        'completed': [],
        'suspendu_v2': ['en_cours_v2', 'en_retard_v2', 'annule_v2'],
        'en_retard_v2': ['en_cours_v2', 'suspendu_v2', 'annule_v2'],
        'annule_v2': [],
        'cancelled': []
      };
      return transitions[currentStatus] || [];
    } catch (error) {
      if (error instanceof ProjectServiceError) {
        throw error;
      }
      throw new ProjectServiceError(
        `Failed to get available status transitions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TRANSITIONS_ERROR'
      );
    }
  }

  async getStatusStatistics(): Promise<Record<string, number>> {
    try {
      const allProjects = await this.projectRepository.findAll();
      const statistics: Record<string, number> = {};
      
      // Initialize all statuses with 0
      const allStatuses = ['en_attente', 'en_conception', 'planifie_v2', 'attribue_v2', 'en_cours_v2', 'en_construction_v2', 'en_inspection_v2', 'en_review', 'termine_v2', 'en_cloture_v2', 'completed', 'suspendu_v2', 'en_retard_v2', 'annule_v2', 'cancelled'];
      allStatuses.forEach(status => {
        statistics[status] = 0;
      });
      
      // Count projects by status
      allProjects.forEach(project => {
        const status = project.status;
        if (statistics[status] !== undefined) {
          statistics[status]++;
        }
      });
      
      return statistics;
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get status statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_STATISTICS_ERROR'
      );
    }
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    // Define valid transitions
    const validTransitions: Record<string, string[]> = {
      'en_attente': ['en_conception', 'planifie_v2', 'en_cours_v2', 'annule_v2'],
      'en_conception': ['planifie_v2', 'en_cours_v2', 'annule_v2'],
      'planifie_v2': ['attribue_v2', 'en_cours_v2', 'annule_v2'],
      'attribue_v2': ['en_cours_v2', 'en_construction_v2', 'annule_v2'],
      'en_cours_v2': ['en_construction_v2', 'en_inspection_v2', 'suspendu_v2', 'en_retard_v2', 'annule_v2'],
      'en_construction_v2': ['en_inspection_v2', 'en_review', 'suspendu_v2', 'en_retard_v2', 'annule_v2'],
      'en_inspection_v2': ['en_review', 'termine_v2', 'en_cloture_v2', 'suspendu_v2', 'en_retard_v2'],
      'en_review': ['termine_v2', 'en_cloture_v2', 'suspendu_v2', 'en_retard_v2'],
      'termine_v2': ['en_cloture_v2', 'completed'],
      'en_cloture_v2': ['completed'],
      'completed': [],
      'suspendu_v2': ['en_cours_v2', 'en_retard_v2', 'annule_v2'],
      'en_retard_v2': ['en_cours_v2', 'suspendu_v2', 'annule_v2'],
      'annule_v2': [],
      'cancelled': []
    };
    
    const allowedTransitions = validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get project summary with counts
   */
  async getProjectSummary(id: string): Promise<ProjectSummaryDTO | null> {
    try {
      const summary = await this.projectRepository.findSummary(id);
      if (!summary) return null;

      const project = await this.projectRepository.findById(id);
      if (!project) return null;

      return ProjectTransformer.toSummaryDTO(project, {
        phasesCount: summary.phasesCount,
        tasksCount: summary.tasksCount,
        inspectionsCount: summary.inspectionsCount,
        paymentsCount: summary.paymentsCount,
      });
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_SUMMARY_ERROR'
      );
    }
  }

  /**
   * Get project with all related data
   * Utilise TaskAssignmentTransformer pour les tâches
   */
  async getProjectWithDetails(id: string): Promise<ProjectDetailDTO | null> {
    try {
      const data = await this.projectRepository.findWithRelatedData(id);
      if (!data.project) return null;

      const detailDTO = ProjectTransformer.toDetailDTO(data.project);
      
      // Transformation des phases
      const phases = PhaseTransformer.manyToDTO(data.phases || []);
      
      // Transformation des tâches avec TaskAssignmentTransformer
      const tasks = TaskAssignmentTransformer.toDTOList(data.tasks || []);
      
      // Transformation des risques
      const risks = RiskTransformer.manyToDTO(data.risks || []);
      
      // Transformation des paiements
      const payments = PaymentTransformer.manyToDTO(data.payments || []);
      
      return {
        ...detailDTO,
        phases,
        plannedPhases: phases,
        tasks,
        risks,
        payments,
        expenses: payments.filter((payment) => payment.status === 'paid'),
        inspections: data.inspections as InspectionDTO[] || [],
        documents: data.documents || [],
        bankGuarantees: data.bankGuarantees || [],
        insuranceCertificates: data.insuranceCertificates || [],
        // Sous-objets hydratés depuis le repository
        milestones: (data.milestones || []) as ProjectDetailDTO['milestones'],
        stakeholders: (data.stakeholders || []) as unknown as StakeholderDTO[],
        resources: (data.resources || []) as ProjectDetailDTO['resources'],
        contacts: (data.contacts || []) as unknown as ProjectDetailDTO['contacts'],
        materials: (data.materials || []) as unknown as ProjectDetailDTO['materials'],
      };

    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_DETAILS_ERROR'
      );
    }
  }

  /**
   * Search projects by criteria
   */
  async searchProjects(criteria: {
    status?: string;
    searchQuery?: string;
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectDTO[]; total: number }> {
    try {
      let projects = await this.projectRepository.findAll();

      // Filter by status
      if (criteria.status) {
        projects = projects.filter(p => p.status === criteria.status);
      }

      // Filter by search query
      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase();
        projects = projects.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
        );
      }

      // Filter by date range
      if (criteria.dateRange?.start && criteria.dateRange?.end) {
        const start = new Date(criteria.dateRange.start);
        const end = new Date(criteria.dateRange.end);
        projects = projects.filter(p => {
          if (!p.startDate) return false;
          return p.startDate >= start && p.startDate <= end;
        });
      }

      const total = projects.length;
      const offset = criteria.offset || 0;
      const limit = criteria.limit || 20;
      const paginated = projects.slice(offset, offset + limit);

      return {
        projects: ProjectTransformer.manyToDTO(paginated),
        total,
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_ERROR'
      );
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(): Promise<{
    total: number;
    active: number;
    completed: number;
    onHold: number;
    cancelled: number;
  }> {
    try {
      const projects = await this.projectRepository.findAll();
      
      return {
        total: projects.length,
        active: projects.filter(p => p.status === 'en_cours_v2').length,
        completed: projects.filter(p => p.status === 'termine_v2').length,
        onHold: projects.filter(p => p.status === 'suspendu_v2').length,
        cancelled: projects.filter(p => p.status === 'annule_v2').length,
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STATISTICS_ERROR'
      );
    }
  }

  /**
   * Get project with stakeholders for payment validation
   */
  async getProjectWithStakeholders(id: string): Promise<(ProjectDTO & { stakeholders?: StakeholderDTO[] }) | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) return null;
      
      const projectDTO = ProjectTransformer.toDTO(project);
      const stakeholders = await this.getProjectStakeholdersData(id);
      
      return {
        ...projectDTO,
        stakeholders,
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project with stakeholders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_STAKEHOLDERS_ERROR'
      );
    }
  }

  /**
   * Get employee user ID for payment notifications
   */
  async getEmployeeUserId(employeeId: string): Promise<{ user_id: string | null } | null> {
    try {
      return { user_id: employeeId };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get employee user ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_EMPLOYEE_ERROR'
      );
    }
  }

  // =================== FORM WORKFLOW METHODS ===================

  /**
   * Create project with enhanced location data
   */
  async createWithLocation(request: CreateProjectDTO, locationData?: ProjectLocationData): Promise<ProjectDTO> {
    try {
      this.validateCreateRequest(request);
      
      // Validate and enrich location data if provided
      let enrichedLocation: ProjectLocationData & { validatedAt: string; validationSource: string; confidence: number } | undefined;
      if (locationData) {
        // Pure-TS enrichment via singleton geocoding factory (no React hook needed).
        enrichedLocation = await this.validateAndEnrichProjectLocation(locationData);
      }

      // Create project data for repository - let repository handle mapping
      const projectDataForRepo: Record<string, unknown> = {};

      // Add basic project data from request
      Object.assign(projectDataForRepo, {
        title: request.title,
        description: request.description,
        status: 'en_attente',
        budget: request.budget,
        startDate: request.startDate,
        endDate: request.endDate,
        teamSize: request.teamSize || 0,
        currency: request.currency || 'EUR',
        financingSource: request.financingSource,
        mainContractor: request.mainContractor,
        clientId: request.clientId,
        projectManagerId: request.projectManagerId,
        projectReference: request.projectReference,
        methodology: request.methodology,
        allowsInitialPayment: request.allowsInitialPayment,
        initialPaymentPercentage: request.initialPaymentPercentage,
      });

      // Add validated location data
      if (enrichedLocation?.latitude && enrichedLocation?.longitude) {
        projectDataForRepo.coordinates_latitude = enrichedLocation.latitude;
        projectDataForRepo.coordinates_longitude = enrichedLocation.longitude;
      }

      if (enrichedLocation) {
        projectDataForRepo.location = enrichedLocation.address;
        projectDataForRepo.geographicZone = enrichedLocation.regionCode;
        projectDataForRepo.localisation = {
          ...enrichedLocation.locationData,
          validatedAt: enrichedLocation.validatedAt,
          validationSource: enrichedLocation.validationSource,
          confidence: enrichedLocation.confidence,
        } as LocationMetadata;
      }

      // Use repository to create project - it will handle the mapping
      const project = await this.projectRepository.create(projectDataForRepo as Partial<Project>);
      return ProjectTransformer.toDTO(project);
      
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to create project with location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_WITH_LOCATION_ERROR'
      );
    }
  }

  async updateLocation(projectId: string, locationData: ProjectLocationData): Promise<ProjectDTO> {
    try {
      // Validate and enrich location data (pure TS — singleton factory).
      const enrichedLocation = await this.validateAndEnrichProjectLocation(locationData);

      // Update project with location data
      const updateData: UpdateProjectDTO = {
        id: projectId,
        location: enrichedLocation.address,
        latitude: enrichedLocation.latitude,
        longitude: enrichedLocation.longitude,
        geographicZone: enrichedLocation.regionCode,
        localisation: {
          ...enrichedLocation.locationData,
          updatedAt: new Date().toISOString(),
          updateSource: 'location_update',
          confidence: enrichedLocation.confidence,
        } as LocationMetadata,
      };

      const result = await this.update(projectId, updateData);
      if (!result) {
        throw new ProjectServiceError('Project not found', 'PROJECT_NOT_FOUND');
      }

      return result;
      
    } catch (error) {
      if (error instanceof ProjectServiceError) throw error;
      throw new ProjectServiceError(
        `Failed to update project location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_LOCATION_ERROR'
      );
    }
  }

  /**
   * Update project from form data
   */
  async updateFromForm(id: string, formData: Record<string, unknown>): Promise<ProjectDTO | null> {
    const request = ProjectTransformer.formToCreateRequest(formData) as UpdateProjectDTO;
    return this.update(id, request);
  }

  // =================== PROJECT LOCATION METHODS ===================

  /**
   * Validate and enrich project location data with geocoding.
   *
   * Pure-TS implementation: uses the singleton {@link getGeocodingService}
   * factory and ignores any React hook accidentally passed by legacy callers.
   */
  async validateAndEnrichProjectLocation(
    locationData: ProjectLocationData,
    _legacyLocationHook?: unknown,
  ): Promise<ProjectLocationData & { validatedAt: string; validationSource: string; confidence: number }> {
    try {
      // Validate coordinates first
      this.validateProjectCoordinates(locationData.latitude, locationData.longitude);

      // Attempt geocoding if address provided but no coordinates
      if (locationData.address && (!locationData.latitude || !locationData.longitude)) {
        const geocoded = await this.geocodeProjectAddress(locationData.address);
        if (geocoded?.coordinates && geocoded.confidence > 0.7) {
          locationData.latitude = geocoded.coordinates.lat;
          locationData.longitude = geocoded.coordinates.lng;
          locationData.locationData = geocoded;
        }
      }

      // Attempt reverse geocoding if coordinates provided but no address
      if ((locationData.latitude && locationData.longitude) && !locationData.address) {
        const reverseGeocoded = await this.reverseGeocodeProjectCoordinates(
          locationData.latitude,
          locationData.longitude,
        );
        if (reverseGeocoded?.address) {
          locationData.address = reverseGeocoded.address;
          locationData.locationData = reverseGeocoded;
        }
      }

      // Validate and enrich region/city data
      this.validateAndEnrichProjectRegionData(locationData);

      // Validate Mauritania bounds
      this.validateProjectMauritaniaBounds(locationData);

      return {
        ...locationData,
        validatedAt: new Date().toISOString(),
        validationSource: 'ProjectService',
        confidence: locationData.locationData?.confidence || 0.5,
      };

    } catch (error) {
      if (error instanceof ProjectServiceError) throw error;
      throw new ProjectServiceError(`Project location validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'LOCATION_VALIDATION_ERROR');
    }
  }

  /**
   * Validate project coordinates
   */
  private validateProjectCoordinates(lat?: number, lng?: number): void {
    if (lat !== undefined) {
      if (isNaN(lat)) {
        throw new ProjectServiceError('Project latitude must be a valid number.', 'VALIDATION_ERROR');
      }
      if (lat < -90 || lat > 90) {
        throw new ProjectServiceError('Project latitude must be between -90° and +90°.', 'VALIDATION_ERROR');
      }
    }

    if (lng !== undefined) {
      if (isNaN(lng)) {
        throw new ProjectServiceError('Project longitude must be a valid number.', 'VALIDATION_ERROR');
      }
      if (lng < -180 || lng > 180) {
        throw new ProjectServiceError('Project longitude must be between -180° and +180°.', 'VALIDATION_ERROR');
      }
    }
  }

  /**
   * Geocode project address — pure TS, uses singleton factory.
   */
  private async geocodeProjectAddress(address: string): Promise<AutoFillLocationData | null> {
    try {
      const results = await getGeocodingService().geocode(address);
      if (!results || results.length === 0) return null;
      const r = results[0];
      return {
        address: r.address,
        coordinates: r.coordinates,
        confidence: r.confidence,
        type: r.type,
        metadata: r.metadata,
      };
    } catch (error) {
      console.warn('Project geocoding failed:', error);
      return null;
    }
  }

  /**
   * Reverse geocode project coordinates — pure TS, uses singleton factory.
   */
  private async reverseGeocodeProjectCoordinates(
    lat: number,
    lng: number,
  ): Promise<AutoFillLocationData | null> {
    try {
      const results = await getGeocodingService().reverseGeocode(lat, lng);
      if (!results || results.length === 0) return null;
      const r = results[0];
      return {
        address: r.address,
        coordinates: r.coordinates,
        confidence: r.confidence,
        type: r.type,
        metadata: r.metadata,
      };
    } catch (error) {
      console.warn('Project reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Validate and enrich project region/city data
   */
  private validateAndEnrichProjectRegionData(locationData: ProjectLocationData): void {
    // If we have locationData from geocoding, try to match with Mauritania regions
    if (locationData.locationData?.region) {
      const region = MAURITANIA_REGIONS.find(r =>
        r.name.toLowerCase() === locationData.locationData!.region!.name.toLowerCase() ||
        r.code === locationData.locationData!.region!.code
      );

      if (region) {
        locationData.regionCode = region.code;
        // Enhanced locationData with region info
        locationData.locationData!.region = region;
      }
    }

    // If we have regionCode, validate it exists
    if (locationData.regionCode) {
      const regionExists = MAURITANIA_REGIONS.some(r => r.code === locationData.regionCode);
      if (!regionExists) {
        console.warn(`Project region code '${locationData.regionCode}' not found in Mauritania regions`);
      }
    }
  }

  /**
   * Validate project coordinates are within Mauritania bounds
   */
  private validateProjectMauritaniaBounds(locationData: ProjectLocationData): void {
    if (!locationData.latitude || !locationData.longitude) {
      return;
    }

    // Mauritania geographical bounds (approximate)
    const MAURITANIA_BOUNDS = {
      north: 27.3,
      south: 14.8,
      east: -4.8,  // Note: negative values for western hemisphere
      west: -17.1
    };

    const { latitude, longitude } = locationData;

    if (latitude < MAURITANIA_BOUNDS.south || latitude > MAURITANIA_BOUNDS.north ||
        longitude < MAURITANIA_BOUNDS.west || longitude > MAURITANIA_BOUNDS.east) {
      console.warn('Project coordinates appear to be outside Mauritania geographical bounds', {
        coordinates: { lat: latitude, lng: longitude },
        bounds: MAURITANIA_BOUNDS
      });
    }
  }

  /**
   * Check if project location is within reasonable distance from Mauritania
   */
  isProjectLocationWithinMauritania(locationData: ProjectLocationData): boolean {
    if (!locationData.latitude || !locationData.longitude) {
      return false;
    }

    // Nouakchott coordinates (approximate center of Mauritania)
    const nouakchottLat = 18.0735;
    const nouakchottLng = -15.9582;

    // Use generic distance calculation from LocationService
    if (this.locationService) {
      const distance = this.locationService.calculateDistance(
        locationData.latitude,
        locationData.longitude,
        nouakchottLat,
        nouakchottLng
      );
      // Mauritania's maximum extent is about 1500km, so 2000km is a reasonable buffer
      return distance <= 2000;
    }

    return false;
  }

  // =================== PRIVATE HELPERS ===================

  private validateCreateRequest(request: CreateProjectDTO): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new ValidationError('Project title is required');
    }
    if (!request.location || request.location.trim().length === 0) {
      throw new ValidationError('Project location is required');
    }
    if (request.budget !== undefined && request.budget < 0) {
      throw new ValidationError('Budget cannot be negative');
    }
  }

  private validateProjectData(data: Partial<CreateProjectDTO | UpdateProjectDTO>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('title' in data && data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        errors.push('Title must be a non-empty string');
      }
    }

    if ('budget' in data && data.budget !== undefined) {
      if (typeof data.budget !== 'number' || data.budget < 0) {
        errors.push('Budget must be a non-negative number');
      }
    }

    if ('progress' in data && data.progress !== undefined) {
      if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
        errors.push('Progress must be between 0 and 100');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private async getProjectStakeholdersData(projectId: string): Promise<StakeholderDTO[]> {
    try {
      if (!this.stakeholderRepository) {
        return [];
      }

      const stakeholders = await this.stakeholderRepository.findByProjectId(projectId);

      return stakeholders.map(s => ({
        id: s.id,
        projectId: s.projectId,
        stakeholderType: s.stakeholderEntityType === 'employee' ? 'employee' : 'external',
        entityId: s.employeeId || s.supplierId || '',
        role: s.roleDescription || 'Unknown',
        isPrimary: s.isActive,
        isInternal: s.stakeholderEntityType === 'employee',
        name: s.externalName || s.getDisplayName(),
        email: s.externalEmail,
        phone: s.externalPhone,
        entityType: 'person',
        employeeId: s.employeeId,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })) as StakeholderDTO[];
    } catch (error) {
      console.error(`Failed to get stakeholders for project ${projectId}:`, error);
      return [];
    }
  }
}

// =================== FACTORY FUNCTION ===================

export function createProjectService(
  projectRepository: IProjectRepository,
  stakeholderRepository?: IProjectStakeholderRepository
): ProjectService {
  return new ProjectService(projectRepository, stakeholderRepository);
}

let projectServiceInstance: ProjectService | null = null;
export function getProjectService(): ProjectService {
  if (!projectServiceInstance) {
    projectServiceInstance = new ProjectService(RepositoryFactory.getProjectRepository());
  }
  return projectServiceInstance;
}
