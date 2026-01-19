/**
 * Project Service - Hexagonal Architecture
 * Business logic layer with use cases and transformer integration
 * Clean separation between domain logic and infrastructure
 */

import { Project } from '@/domain/entities';
import { IProjectRepository, ProjectSummary, ProjectWithRelatedData } from '@/domain/repositories';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO, ProjectSummaryDTO, ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { EntityToDTOMapper } from '@/dtos/transforms';

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
 * Encapsulates business logic and coordinates between repository and UI
 */
export class ProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private transformer: EntityToDTOMapper<Project, ProjectDTO>
  ) {}

  // ============= CRUD Use Cases =============

  /**
   * Create a new project with validation
   */
  async createProject(createDTO: CreateProjectDTO): Promise<ProjectDTO> {
    try {
      // Validation avec le transformer
      const validation = this.transformer.validate(createDTO);
      
      if (!validation.isValid) {
        throw new ValidationError(
          'Project validation failed',
          validation.fieldErrors || {}
        );
      }

      // Création via repository
      const project = await this.projectRepository.create(createDTO as Partial<Project>);
      
      // Transformation pour l'UI
      return this.transformer.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
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
      // Validation avec le transformer
      const validation = this.transformer.validate(updateDTO);
      
      if (!validation.isValid) {
        throw new ValidationError(
          'Project validation failed',
          validation.fieldErrors || {}
        );
      }

      // Mise à jour via repository
      const project = await this.projectRepository.update(id, updateDTO as Partial<Project>);
      
      // Transformation pour l'UI
      return this.transformer.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
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
      
      if (!project) {
        return null;
      }

      return this.transformer.toDTO(project);
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
      
      return projects.map(project => this.transformer.toDTO(project));
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

  // ============= Business Logic Use Cases =============

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<ProjectDTO[]> {
    try {
      const projects = await this.projectRepository.findByStatus('en cours');
      
      return projects.map(project => this.transformer.toDTO(project));
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
      const projects = await this.projectRepository.findByStatus(status);
      
      return projects.map(project => this.transformer.toDTO(project));
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
      const summary = await this.projectRepository.getProjectSummary(id);
      
      if (!summary) {
        return null;
      }

      const projectDTO = this.transformer.toDTO(summary.project);
      
      return {
        ...projectDTO,
        tasksCount: summary.tasksCount,
        inspectionsCount: summary.inspectionsCount,
        paymentsCount: summary.paymentsCount,
        risksCount: summary.risksCount,
        lastActivity: summary.lastActivity
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
      
      if (!projectWithRelated) {
        return null;
      }

      const projectDTO = this.transformer.toDTO(projectWithRelated.project);
      
      return {
        ...projectDTO,
        tasks: projectWithRelated.tasks || [],
        inspections: projectWithRelated.inspections || [],
        payments: projectWithRelated.payments || [],
        risks: projectWithRelated.risks || [],
        phases: [] // À implémenter avec les phases
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
      // Pour l'instant, utilisation de findAll
      // À améliorer avec des requêtes filtrées dans le repository
      const projects = await this.projectRepository.findAll();
      
      let filteredProjects = projects;

      // Filtrage par statut
      if (criteria.status) {
        filteredProjects = filteredProjects.filter(p => p.status === criteria.status);
      }

      // Filtrage par recherche textuelle
      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query)
        );
      }

      // Filtrage par plage de dates
      if (criteria.dateRange) {
        filteredProjects = filteredProjects.filter(p => {
          const startDate = new Date(p.startDate);
          const filterStart = new Date(criteria.dateRange.start);
          const filterEnd = new Date(criteria.dateRange.end);
          return startDate >= filterStart && startDate <= filterEnd;
        });
      }

      // Pagination
      const total = filteredProjects.length;
      const offset = criteria.offset || 0;
      const limit = criteria.limit || 20;
      const paginatedProjects = filteredProjects.slice(offset, offset + limit);

      return {
        projects: paginatedProjects.map(project => this.transformer.toDTO(project)),
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
      
      const stats = {
        total: allProjects.length,
        active: allProjects.filter(p => p.status === 'en cours').length,
        completed: allProjects.filter(p => p.status === 'terminé').length,
        onHold: allProjects.filter(p => p.status === 'suspendu').length,
        cancelled: allProjects.filter(p => p.status === 'annulé').length
      };

      return stats;
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_STATISTICS_ERROR',
        error
      );
    }
  }

  // ============= Utility Methods =============

  /**
   * Validate project data before operations
   */
  private validateProjectData(data: Partial<CreateProjectDTO | UpdateProjectDTO>): {
    isValid: boolean;
    errors: string[];
    fieldErrors: Record<string, string[]>;
  } {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (!data.title || data.title.trim() === '') {
      errors.push('Project title is required');
      fieldErrors.title = ['Project title is required'];
    }

    if (!data.description || data.description.trim() === '') {
      errors.push('Project description is required');
      fieldErrors.description = ['Project description is required'];
    }

    if (!data.location || data.location.trim() === '') {
      errors.push('Project location is required');
      fieldErrors.location = ['Project location is required'];
    }

    if (data.budget !== undefined && data.budget <= 0) {
      errors.push('Budget must be greater than 0');
      fieldErrors.budget = ['Budget must be greater than 0'];
    }

    if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
      fieldErrors.progress = ['Progress must be between 0 and 100'];
    }

    if (data.teamSize !== undefined && data.teamSize <= 0) {
      errors.push('Team size must be greater than 0');
      fieldErrors.teamSize = ['Team size must be greater than 0'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }
}
