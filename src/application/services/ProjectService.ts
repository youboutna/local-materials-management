/**
 * Project Service - Hexagonal Architecture
 * Business logic layer with use cases
 * Clean separation between domain logic and infrastructure
 */

import { Project, ProjectStatus } from '@/domain/entities/Project';
import { IProjectRepository, ProjectWithRelatedData } from '@/domain/repositories';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO, ProjectSummaryDTO, ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';

/**
 * Custom error class for project operations
 */
export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'PROJECT_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ProjectServiceError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ProjectServiceError {
  constructor(message: string, public fieldErrors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Project Service - Use Cases Implementation
 */
export class ProjectService {
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  // Helper method to transform Project to ProjectDTO
  private toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      title: project.title,
      description: project.description || '',
      location: project.location || '',
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      startDate: project.startDate?.toISOString?.() || '',
      endDate: project.endDate?.toISOString?.() || undefined,
      teamSize: project.teamSize || 0,
      thumbnail: project.thumbnail || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Create a new project with validation
   */
  async createProject(createDTO: CreateProjectDTO): Promise<ProjectDTO> {
    try {
      const validation = this.validateProjectData(createDTO);
      
      if (!validation.isValid) {
        throw new ValidationError('Project validation failed', validation.fieldErrors);
      }

      const projectData: Partial<Project> = {
        title: createDTO.title,
        description: createDTO.description,
        location: createDTO.location,
        status: createDTO.status as ProjectStatus,
        progress: createDTO.progress || 0,
        budget: createDTO.budget,
        startDate: createDTO.startDate ? new Date(createDTO.startDate) : null,
        endDate: createDTO.endDate ? new Date(createDTO.endDate) : null,
        teamSize: createDTO.teamSize,
        thumbnail: createDTO.thumbnail
      };

      const project = await this.projectRepository.create(projectData);
      return this.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_PROJECT_ERROR',
        error
      );
    }
  }

  /**
   * Update an existing project with validation
   */
  async updateProject(id: string, updateDTO: UpdateProjectDTO): Promise<ProjectDTO> {
    try {
      const validation = this.validateProjectData(updateDTO);
      
      if (!validation.isValid) {
        throw new ValidationError('Project validation failed', validation.fieldErrors);
      }

      const projectData: Partial<Project> = {};
      if (updateDTO.title !== undefined) (projectData as any).title = updateDTO.title;
      if (updateDTO.description !== undefined) (projectData as any).description = updateDTO.description;
      if (updateDTO.location !== undefined) (projectData as any).location = updateDTO.location;
      if (updateDTO.status !== undefined) (projectData as any).status = updateDTO.status;
      if (updateDTO.progress !== undefined) (projectData as any).progress = updateDTO.progress;
      if (updateDTO.budget !== undefined) (projectData as any).budget = updateDTO.budget;
      if (updateDTO.startDate !== undefined) (projectData as any).startDate = new Date(updateDTO.startDate);
      if (updateDTO.endDate !== undefined) (projectData as any).endDate = new Date(updateDTO.endDate);
      if (updateDTO.teamSize !== undefined) (projectData as any).teamSize = updateDTO.teamSize;
      if (updateDTO.thumbnail !== undefined) (projectData as any).thumbnail = updateDTO.thumbnail;

      const project = await this.projectRepository.update(id, projectData);
      return this.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_PROJECT_ERROR',
        error
      );
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ProjectDTO | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) return null;
      return this.toDTO(project);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_ERROR',
        error
      );
    }
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<ProjectDTO[]> {
    try {
      const projects = await this.projectRepository.findAll();
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get all projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ALL_PROJECTS_ERROR',
        error
      );
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await this.projectRepository.delete(id);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_PROJECT_ERROR',
        error
      );
    }
  }

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<ProjectDTO[]> {
    try {
      const projects = await this.projectRepository.findActiveProjects();
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get active projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ACTIVE_PROJECTS_ERROR',
        error
      );
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: string): Promise<ProjectDTO[]> {
    try {
      const allProjects = await this.projectRepository.findAll();
      const projects = allProjects.filter(p => p.status === status);
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get projects by status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECTS_BY_STATUS_ERROR',
        error
      );
    }
  }

  /**
   * Get project summary with counts
   */
  async getProjectSummary(id: string): Promise<ProjectSummaryDTO | null> {
    try {
      const summary = await this.projectRepository.findSummary(id);
      if (!summary) return null;

      return {
        id: summary.id,
        title: summary.title,
        status: summary.status as ProjectStatus,
        progress: summary.progress,
        phasesCount: summary.phasesCount,
        tasksCount: summary.tasksCount,
        inspectionsCount: summary.inspectionsCount,
        paymentsCount: summary.paymentsCount,
        risksCount: 0,
        lastActivity: undefined,
        createdAt: '',
        updatedAt: '',
        description: '',
        location: '',
        budget: 0,
        startDate: '',
        teamSize: 0,
        thumbnail: ''
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_SUMMARY_ERROR',
        error
      );
    }
  }

  /**
   * Get project with all related data
   */
  async getProjectWithDetails(id: string): Promise<ProjectDetailDTO | null> {
    try {
      const projectWithRelated = await this.projectRepository.findWithRelatedData(id);
      if (!projectWithRelated || !projectWithRelated.project) return null;

      const projectDTO = this.toDTO(projectWithRelated.project);
      
      return {
        ...projectDTO,
        tasks: projectWithRelated.tasks || [],
        inspections: projectWithRelated.inspections || [],
        risks: projectWithRelated.risks || [],
        plannedPhases: projectWithRelated.phases || [],
        resources: [],
        expenses: []
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_DETAILS_ERROR',
        error
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
      const projects = await this.projectRepository.findAll();
      let filteredProjects = projects;

      if (criteria.status) {
        filteredProjects = filteredProjects.filter(p => p.status === criteria.status);
      }

      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          (p.location && p.location.toLowerCase().includes(query))
        );
      }

      if (criteria.dateRange?.start && criteria.dateRange?.end) {
        filteredProjects = filteredProjects.filter(p => {
          if (!p.startDate) return false;
          const startDate = new Date(p.startDate);
          return startDate >= new Date(criteria.dateRange!.start) && 
                 startDate <= new Date(criteria.dateRange!.end);
        });
      }

      const total = filteredProjects.length;
      const offset = criteria.offset || 0;
      const limit = criteria.limit || 20;
      const paginatedProjects = filteredProjects.slice(offset, offset + limit);

      return {
        projects: paginatedProjects.map(project => this.toDTO(project)),
        total
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_PROJECTS_ERROR',
        error
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
      const allProjects = await this.projectRepository.findAll();
      
      return {
        total: allProjects.length,
        active: allProjects.filter(p => p.status === 'en cours').length,
        completed: allProjects.filter(p => p.status === 'terminé').length,
        onHold: allProjects.filter(p => p.status === 'suspendu').length,
        cancelled: allProjects.filter(p => p.status === 'annulé').length
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_STATISTICS_ERROR',
        error
      );
    }
  }

  /**
   * Get project with stakeholders for payment validation
   */
  async getProjectWithStakeholders(id: string): Promise<ProjectDTO | null> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) return null;
      
      // For now, return basic project data
      // In a real implementation, this would include stakeholders data
      return this.toDTO(project);
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project with stakeholders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_STAKEHOLDERS_ERROR',
        error
      );
    }
  }

  /**
   * Get employee user ID for payment notifications
   */
  async getEmployeeUserId(employeeId: string): Promise<{ user_id: string | null } | null> {
    try {
      // This would typically use an EmployeeService or repository
      // For now, return a placeholder implementation
      // In a real implementation, this would query the employees table
      return { user_id: null };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get employee user ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_EMPLOYEE_USER_ID_ERROR',
        error
      );
    }
  }

  private validateProjectData(data: Partial<CreateProjectDTO | UpdateProjectDTO>): {
    isValid: boolean;
    errors: string[];
    fieldErrors: Record<string, string[]>;
  } {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if ('title' in data && (!data.title || data.title.trim() === '')) {
      errors.push('Project title is required');
      fieldErrors.title = ['Project title is required'];
    }

    if ('budget' in data && data.budget !== undefined && data.budget <= 0) {
      errors.push('Budget must be greater than 0');
      fieldErrors.budget = ['Budget must be greater than 0'];
    }

    if ('progress' in data && data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
      fieldErrors.progress = ['Progress must be between 0 and 100'];
    }

    return { isValid: errors.length === 0, errors, fieldErrors };
  }
}
