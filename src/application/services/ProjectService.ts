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
  PROJECT_STATUS_TRANSITIONS
} from '@/dtos/entities/ProjectDTO';

// Import ProjectTransformer for transformations
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';

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
    private stakeholderRepository?: IProjectStakeholderRepository
  ) {}

  // =================== CORE CRUD OPERATIONS ===================

  /**
   * Create a new project
   * Flow: CreateDTO → Domain Entity → Repository → DTO
   */
  async create(request: CreateProjectDTO): Promise<ProjectDTO> {
    try {
      this.validateCreateRequest(request);
      
      const projectData: Partial<Project> = {
        title: request.title,
        description: request.description,
        location: request.location,
        status: request.status || ProjectStatus.EN_ATTENTE,
        budget: request.budget,
        progress: 0,
        startDate: request.startDate ? new Date(request.startDate) : null,
        endDate: request.endDate ? new Date(request.endDate) : null,
        teamSize: request.teamSize || 0,
        thumbnail: request.thumbnail,
        // Additional fields from CreateProjectDTO
        address: request.address,
        latitude: request.latitude,
        longitude: request.longitude,
        geographicZone: request.geographicZone,
        terrainType: request.terrainType,
        category: request.category,
        subCategory: request.subCategory,
        priorityLevel: request.priorityLevel,
        riskLevel: request.riskLevel,
        projectManagerId: request.projectManagerId,
        clientId: request.clientId,
        workspaceId: request.workspaceId,
        createdBy: request.createdBy,
        projectReference: request.projectReference,
        methodology: request.methodology,
        estimatedDurationDays: request.estimatedDurationDays,
        financingSource: request.financingSource,
        marketType: request.marketType,
        selectionMode: request.selectionMode,
        launchDate: request.launchDate ? new Date(request.launchDate) : undefined,
        attributionDate: request.attributionDate ? new Date(request.attributionDate) : undefined,
        mainContractor: request.mainContractor,
        allowsInitialPayment: request.allowsInitialPayment,
        initialPaymentPercentage: request.initialPaymentPercentage,
        currency: request.currency || 'EUR'
      };

      // Handle coordinates if provided
      if (request.latitude && request.longitude) {
        const coordinates = new ProjectCoordinates(
          Number(request.latitude),
          Number(request.longitude)
        );
        (projectData as Partial<Project> & { coordinates: ProjectCoordinates }).coordinates = coordinates;
      }

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
      throw new ProjectServiceError(
        `Failed to find projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const projectData: Partial<Project> = {};
      
      // Basic fields with proper type handling
      if (request.title !== undefined && request.title !== null) projectData.title = String(request.title);
      if (request.description !== undefined && request.description !== null) projectData.description = String(request.description);
      if (request.location !== undefined && request.location !== null) projectData.location = String(request.location);
      if (request.status !== undefined && request.status !== null) projectData.status = request.status as ProjectStatus;
      if (request.progress !== undefined && request.progress !== null) projectData.progress = Number(request.progress);
      if (request.budget !== undefined && request.budget !== null) projectData.budget = Number(request.budget);
      if (request.startDate !== undefined && request.startDate !== null) projectData.startDate = new Date(String(request.startDate));
      if (request.endDate !== undefined && request.endDate !== null) projectData.endDate = new Date(String(request.endDate));
      if (request.teamSize !== undefined && request.teamSize !== null) projectData.teamSize = Number(request.teamSize);
      
      // Additional fields from form (using correct DTO field names)
      if (request.thumbnail !== undefined && request.thumbnail !== null) projectData.thumbnail = String(request.thumbnail);
      if (request.financingSource !== undefined && request.financingSource !== null) projectData.financingSource = String(request.financingSource);
      if (request.marketType !== undefined && request.marketType !== null) projectData.marketType = String(request.marketType);
      if (request.selectionMode !== undefined && request.selectionMode !== null) projectData.selectionMode = String(request.selectionMode);
      if (request.projectReference !== undefined && request.projectReference !== null) projectData.projectReference = String(request.projectReference);
      if (request.mainContractor !== undefined && request.mainContractor !== null) projectData.mainContractor = String(request.mainContractor);
      if (request.currentPhase !== undefined && request.currentPhase !== null) projectData.currentPhase = String(request.currentPhase);
      if (request.currentStage !== undefined && request.currentStage !== null) projectData.currentStage = String(request.currentStage);
      
      // Handle coordinates (create new ProjectCoordinates object for the entity)
      if (request.coordinates !== undefined && request.coordinates !== null) {
        if (typeof request.coordinates === 'object' && request.coordinates.latitude && request.coordinates.longitude) {
          // Create a new ProjectCoordinates instance
          projectData.coordinates = new ProjectCoordinates(
            Number(request.coordinates.latitude),
            Number(request.coordinates.longitude)
          );
        }
      } else if (request.latitude !== undefined && request.longitude !== undefined) {
        // Handle individual latitude/longitude fields
        projectData.coordinates = new ProjectCoordinates(
          Number(request.latitude),
          Number(request.longitude)
        );
      }

      // Add timestamp for update
      (projectData as Partial<Project> & { updatedAt: Date }).updatedAt = new Date();

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

  /**
   * Get projects by status (enhanced with new ProjectStatus enum)
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<ProjectDTO[]> {
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
   * Update project status with business logic validation
   */
  async updateProjectStatus(id: string, newStatus: ProjectStatus, reason?: string): Promise<ProjectDTO | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new ProjectServiceError(
          'Project not found',
          'PROJECT_NOT_FOUND'
        );
      }

      // Validate status transition
      const currentStatus = project.status as ProjectStatus;
      if (!this.isValidStatusTransition(currentStatus, newStatus)) {
        throw new ProjectServiceError(
          `Invalid status transition from ${PROJECT_STATUS_LABELS[currentStatus]} to ${PROJECT_STATUS_LABELS[newStatus]}`,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // Update project with new status
      const updateData: UpdateProjectDTO = {
        id,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      const updatedProject = await this.update(id, updateData);
      
      // Log status change if reason provided
      if (reason) {
        console.log(`Project ${id} status changed from ${PROJECT_STATUS_LABELS[currentStatus]} to ${PROJECT_STATUS_LABELS[newStatus]}. Reason: ${reason}`);
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
  async getProjectsByCategory(category: keyof typeof PROJECT_STATUS_CATEGORIES): Promise<ProjectDTO[]> {
    try {
      const statusInCategory = PROJECT_STATUS_CATEGORIES[category];
      const allProjects = await this.projectRepository.findAll();
      const filtered = allProjects.filter(p => 
        statusInCategory.includes(p.status as ProjectStatus)
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
  async getAvailableStatusTransitions(id: string): Promise<ProjectStatus[]> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new ProjectServiceError(
          'Project not found',
          'PROJECT_NOT_FOUND'
        );
      }

      const currentStatus = project.status as ProjectStatus;
      return PROJECT_STATUS_TRANSITIONS[currentStatus] || [];
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

  async getStatusStatistics(): Promise<Record<ProjectStatus, number>> {
    try {
      const allProjects = await this.projectRepository.findAll();
      const statistics: Record<string, number> = {};
      
      // Initialize all statuses with 0
      Object.keys(ProjectStatus).forEach(statusKey => {
        const status = ProjectStatus[statusKey as keyof typeof ProjectStatus];
        statistics[status] = 0;
      });
      
      // Count projects by status
      allProjects.forEach(project => {
        const status = project.status as ProjectStatus;
        if (statistics[status] !== undefined) {
          statistics[status]++;
        }
      });
      
      return statistics as Record<ProjectStatus, number>;
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get status statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_STATISTICS_ERROR'
      );
    }
  }

  /**
   * Validate status transition according to business rules
   */
  private isValidStatusTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus] || [];
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
   */
  async getProjectWithDetails(id: string): Promise<ProjectDetailDTO | null> {
    try {
      const data = await this.projectRepository.findWithRelatedData(id);
      if (!data.project) return null;

      const detailDTO = ProjectTransformer.toDetailDTO(data.project);
      
      return {
        ...detailDTO,
        phases: data.phases || [],
        tasks: data.tasks || [],
        risks: data.risks || [],
        payments: data.payments || [],
        inspections: data.inspections as InspectionDTO[] || [],
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
        active: projects.filter(p => p.status === ProjectStatus.EN_COURS).length,
        completed: projects.filter(p => p.status === ProjectStatus.TERMINE).length,
        onHold: projects.filter(p => p.status === ProjectStatus.SUSPENDU).length,
        cancelled: projects.filter(p => p.status === ProjectStatus.ANNULE).length,
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
   * Create project from form data
   */
  async createFromForm(formData: Record<string, unknown>): Promise<ProjectDTO> {
    const request = ProjectTransformer.formToCreateRequest(formData);
    return this.create(request);
  }

  /**
   * Update project from form data
   */
  async updateFromForm(id: string, formData: Record<string, unknown>): Promise<ProjectDTO | null> {
    const request = ProjectTransformer.formToUpdateRequest(formData);
    return this.update(id, request);
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
