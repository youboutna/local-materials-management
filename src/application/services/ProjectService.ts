/**
 * Project Service - Hexagonal Architecture
 * Business logic layer with use cases
 * Clean separation between domain logic and infrastructure
 */

import { Project } from '@/domain/entities/Project';
import { ProjectStakeholderEntity, StakeholderType, StakeholderEntityType } from '@/domain/entities/ProjectStakeholder';
import { IProjectRepository } from '@/domain/repositories';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO, ProjectSummaryDTO, ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';

// Type pour le statut de projet
type ProjectStatus = 'en cours' | 'terminé' | 'suspendu' | 'annulé';

// Types pour les méthodes étendues
export interface ProjectFormDataDTO {
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
}

export interface ProjectAnalyticsDTO {
  total_budget: number;
  actual_cost: number;
  budget_variance: number;
  progress_percentage: number;
  milestone_completion: number;
  risk_score: number;
  quality_score: number;
  timeline_variance: number;
  resource_utilization: number;
}

export interface StakeholderDTO {
  id: string;
  project_id: string;
  stakeholder_type: 'employee' | 'external';
  entity_id: string;
  role: string;
  is_primary: boolean;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Custom error class for project operations
 */
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
    private projectRepository: IProjectRepository,
    private stakeholderRepository?: IProjectStakeholderRepository
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
      coordinates: project.coordinates ? {
        latitude: project.coordinates.latitude,
        longitude: project.coordinates.longitude
      } : undefined,
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
        error as Record<string, unknown>
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
      if (updateDTO.title !== undefined) projectData.title = updateDTO.title;
      if (updateDTO.description !== undefined) projectData.description = updateDTO.description;
      if (updateDTO.location !== undefined) projectData.location = updateDTO.location;
      if (updateDTO.status !== undefined) projectData.status = updateDTO.status;
      if (updateDTO.progress !== undefined) projectData.progress = updateDTO.progress;
      if (updateDTO.budget !== undefined) projectData.budget = updateDTO.budget;
      if (updateDTO.startDate !== undefined) projectData.startDate = new Date(updateDTO.startDate);
      if (updateDTO.endDate !== undefined) projectData.endDate = new Date(updateDTO.endDate);
      if (updateDTO.teamSize !== undefined) projectData.teamSize = updateDTO.teamSize;
      if (updateDTO.thumbnail !== undefined) {
        // thumbnail is read-only in the domain entity, so we skip it for now
        // TODO: Implement thumbnail update when domain entity supports it
      }

      const project = await this.projectRepository.update(id, projectData);
      return this.toDTO(project);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_PROJECT_ERROR',
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
        error as Record<string, unknown>
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
      
      // Get project DTO
      const projectDTO = this.toDTO(project);
      
      // Get stakeholders for this project
      // TODO: Replace with actual repository call when StakeholderRepository is available
      // For now, simulate stakeholder data or return empty array
      const stakeholders: StakeholderDTO[] = await this.getProjectStakeholdersData(id);
      
      return {
        ...projectDTO,
        stakeholders: stakeholders
      };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get project with stakeholders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_STAKEHOLDERS_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  /**
   * Get employee user ID for payment notifications
   * This method would typically use an EmployeeService or repository
   * For now, it queries the users table to find the user ID associated with the employee
   */
  async getEmployeeUserId(employeeId: string): Promise<{ user_id: string | null } | null> {
    try {
      // TODO: Implement proper employee-user relationship when EmployeeRepository is available
      // For now, return the employee ID as user_id (assuming 1:1 relationship)
      // In a real implementation, this would:
      // 1. Query the employees table to get the user_id associated with the employee_id
      // 2. Handle cases where employee might not have an associated user
      
      return { user_id: employeeId };
    } catch (error) {
      throw new ProjectServiceError(
        `Failed to get employee user ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_EMPLOYEE_USER_ID_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  private async getProjectStakeholdersData(projectId: string): Promise<StakeholderDTO[]> {
    try {
      if (!this.stakeholderRepository) {
        // Fallback si le repository n'est pas disponible
        console.warn('Stakeholder repository not available, returning empty array');
        return [];
      }

      const stakeholders = await this.stakeholderRepository.findByProjectId(projectId);
      
      return stakeholders.map(stakeholder => ({
        id: stakeholder.id,
        project_id: stakeholder.projectId,
        stakeholder_type: stakeholder.stakeholderEntityType === 'employee' ? 'employee' : 'external',
        entity_id: stakeholder.employeeId || stakeholder.supplierId || '',
        role: stakeholder.roleDescription || 'Unknown Role',
        is_primary: stakeholder.isActive,
        name: stakeholder.externalName || stakeholder.getDisplayName(),
        email: stakeholder.externalEmail || undefined,
        phone: stakeholder.externalPhone || undefined
      }));
    } catch (error) {
      console.error(`Failed to get stakeholders for project ${projectId}:`, error);
      return [];
    }
  }

  // ========================================
  // MÉTHODES ÉTENDUES - Remplacement des services par écran
  // ========================================

  /**
   * WORKFLOW FORMULAIRE (remplace ProjectFormService)
   * Créer un projet depuis les données du formulaire
   */
  async createFromForm(formData: ProjectFormDataDTO): Promise<ProjectDTO> {
    try {
      // Validation spécifique formulaire
      this.validateFormData(formData);

      // Transformer vers CreateProjectDTO
      const createDTO: CreateProjectDTO = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        status: formData.status as ProjectStatus,
        progress: formData.progress,
        budget: formData.budget,
        startDate: formData.start_date,
        endDate: formData.end_date,
        teamSize: formData.team_size,
        thumbnail: ''
      };

      return await this.createProject(createDTO);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ProjectServiceError(
        `Failed to create project from form: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_FROM_FORM_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  /**
   * WORKFLOW ANALYTICS (remplace ProjectAnalyticsService)
   * Obtenir les analytics d'un projet
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDTO> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new ProjectServiceError('Project not found', 'NOT_FOUND');
      }

      // Calculer les métriques (logique simplifiée)
      const analytics: ProjectAnalyticsDTO = {
        total_budget: project.budget,
        actual_cost: project.budget * (project.progress / 100), // Simplifié
        budget_variance: project.budget - (project.budget * (project.progress / 100)),
        progress_percentage: project.progress,
        milestone_completion: 0, // TODO: Implémenter avec MilestoneService
        risk_score: this.calculateRiskScore(project),
        quality_score: this.calculateQualityScore(project),
        timeline_variance: this.calculateTimelineVariance(project),
        resource_utilization: this.calculateResourceUtilization(project)
      };

      return analytics;
    } catch (error) {
      if (error instanceof ProjectServiceError) throw error;
      throw new ProjectServiceError(
        `Failed to get project analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ANALYTICS_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  /**
   * WORKFLOW STAKEHOLDERS (remplace ProjectStakeholderService)
   * Ajouter des stakeholders à un projet
   */
  async addStakeholders(projectId: string, stakeholders: Omit<StakeholderDTO, 'id' | 'project_id'>[]): Promise<StakeholderDTO[]> {
    try {
      // Vérifier que le projet existe
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new ProjectServiceError('Project not found', 'NOT_FOUND');
      }

      if (!this.stakeholderRepository) {
        throw new ProjectServiceError('Stakeholder repository not available', 'REPOSITORY_NOT_AVAILABLE');
      }

      const createdStakeholders: StakeholderDTO[] = [];
      
      for (const stakeholder of stakeholders) {
        // Créer les données pour le repository (interface ProjectStakeholder)
        const stakeholderData = {
          projectId: projectId,
          stakeholderType: this.mapStakeholderType(stakeholder.stakeholder_type),
          stakeholderEntityType: this.mapStakeholderEntityType(stakeholder.stakeholder_type),
          employeeId: stakeholder.stakeholder_type === 'employee' ? stakeholder.entity_id : null,
          supplierId: stakeholder.stakeholder_type === 'external' ? stakeholder.entity_id : null,
          externalName: stakeholder.stakeholder_type === 'external' ? stakeholder.name : null,
          externalEmail: stakeholder.email || null,
          externalPhone: stakeholder.phone || null,
          roleDescription: stakeholder.role,
          responsibilities: null,
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: null,
          hourlyRate: null,
          contractType: null,
          notes: null
        } as Omit<ProjectStakeholderEntity, 'id' | 'createdAt' | 'updatedAt'>;

        // Créer via repository
        const created = await this.stakeholderRepository.create(stakeholderData);
        
        // Transformer Entity en DTO pour retour
        const createdDTO: StakeholderDTO = {
          id: created.id,
          project_id: created.projectId,
          stakeholder_type: stakeholder.stakeholder_type,
          entity_id: stakeholder.entity_id,
          role: stakeholder.role,
          is_primary: stakeholder.is_primary,
          name: stakeholder.name,
          email: stakeholder.email,
          phone: stakeholder.phone
        };
        
        createdStakeholders.push(createdDTO);
      }

      console.log(`Added ${createdStakeholders.length} stakeholders to project ${projectId}`);
      return createdStakeholders;
    } catch (error) {
      if (error instanceof ProjectServiceError) throw error;
      throw new ProjectServiceError(
        `Failed to add stakeholders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADD_STAKEHOLDERS_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  /**
   * WORKFLOW PROGRESSION (remplace ProgressCalculationHexService)
   * Calculer la progression d'un projet
   */
  async calculateProjectProgress(projectId: string): Promise<number> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new ProjectServiceError('Project not found', 'NOT_FOUND');
      }

      // Logique de calcul simplifiée
      // TODO: Intégrer avec MilestoneService et TaskService pour calcul précis
      return project.progress;
    } catch (error) {
      if (error instanceof ProjectServiceError) throw error;
      throw new ProjectServiceError(
        `Failed to calculate project progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALCULATE_PROGRESS_ERROR',
        error as Record<string, unknown>
      );
    }
  }

  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================

  private validateFormData(formData: ProjectFormDataDTO): void {
    const errors: Record<string, string[]> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = ['Title is required'];
    }
    
    if (!formData.budget || formData.budget <= 0) {
      errors.budget = ['Budget must be greater than 0'];
    }
    
    if (!formData.start_date) {
      errors.start_date = ['Start date is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Form validation failed', errors);
    }
  }

  private calculateRiskScore(project: ProjectDTO): number {
    // Logique complète de calcul de risque basée sur plusieurs facteurs
    let riskScore = 0;
    
    // Facteur 1: Progression (40%)
    if (project.progress < 10) riskScore += 40;
    else if (project.progress < 25) riskScore += 30;
    else if (project.progress < 50) riskScore += 20;
    else if (project.progress < 75) riskScore += 10;
    else riskScore += 5;
    
    // Facteur 2: Timeline (25%)
    const timelineVariance = this.calculateTimelineVariance(project);
    if (timelineVariance < -20) riskScore += 25; // Très en retard
    else if (timelineVariance < -10) riskScore += 15; // En retard
    else if (timelineVariance < 0) riskScore += 10; // Légèrement en retard
    else if (timelineVariance > 10) riskScore += 5; // En avance (réduit risque)
    
    // Facteur 3: Budget (20%)
    if (project.budget > 0) {
      const budgetEfficiency = project.progress / 100;
      if (budgetEfficiency < 0.5) riskScore += 20; // Moins de 50% du budget utilisé
      else if (budgetEfficiency < 0.8) riskScore += 10; // Moins de 80% du budget utilisé
      else riskScore += 5; // Bonne utilisation du budget
    }
    
    // Facteur 4: Taille d'équipe (10%)
    if (project.teamSize < 3) riskScore += 10; // Équipe trop petite
    else if (project.teamSize < 5) riskScore += 5; // Équipe petite
    else riskScore += 0; // Équipe adéquate
    
    // Facteur 5: Complexité (5%)
    if (project.title.length > 100) riskScore += 5; // Projet complexe
    else if (project.title.length > 50) riskScore += 2; // Projet moyennement complexe
    
    return Math.min(100, riskScore);
  }

  private calculateQualityScore(project: ProjectDTO): number {
    // Logique complète de calcul de qualité basée sur plusieurs facteurs
    let qualityScore = 50; // Score de base
    
    // Facteur 1: Progression du projet (30%)
    const progressScore = Math.min(30, project.progress * 0.3);
    qualityScore += progressScore;
    
    // Facteur 2: Respect du budget (20%)
    if (project.budget > 0) {
      const budgetEfficiency = Math.min(20, (project.progress / 100) * 20);
      qualityScore += budgetEfficiency;
    }
    
    // Facteur 3: Timeline (25%)
    const timelineScore = this.calculateTimelineScore(project);
    qualityScore += timelineScore;
    
    // Facteur 4: Complexité et taille (15%)
    const complexityScore = Math.min(15, project.teamSize * 2);
    qualityScore += complexityScore;
    
    // Facteur 5: Stabilité (10%)
    const stabilityScore = project.status === 'en cours' ? 10 : 5;
    qualityScore += stabilityScore;
    
    return Math.min(100, Math.round(qualityScore));
  }

  private calculateTimelineScore(project: ProjectDTO): number {
    if (!project.endDate) return 15; // Score neutre si pas de date de fin
    
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    const expectedProgress = (elapsedDuration / totalDuration) * 100;
    
    const progressDiff = project.progress - expectedProgress;
    
    // Score basé sur la différence entre progression réelle et attendue
    if (progressDiff >= 0) {
      return Math.min(25, 15 + (progressDiff * 0.1)); // En avance = bonus
    } else {
      return Math.max(0, 15 + (progressDiff * 0.2)); // En retard = pénalité
    }
  }

  private calculateTimelineVariance(project: ProjectDTO): number {
    if (!project.endDate) return 0;
    
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    const plannedDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    const expectedProgress = (elapsedDuration / plannedDuration) * 100;
    
    return project.progress - expectedProgress;
  }

  private calculateResourceUtilization(project: ProjectDTO): number {
    // Logique complète d'utilisation des ressources
    let utilizationScore = 0;
    
    // Facteur 1: Taille d'équipe (40%)
    const teamScore = Math.min(40, project.teamSize * 4);
    utilizationScore += teamScore;
    
    // Facteur 2: Progression (30%)
    const progressScore = Math.min(30, project.progress * 0.3);
    utilizationScore += progressScore;
    
    // Facteur 3: Budget (20%)
    if (project.budget > 0) {
      const budgetUtilization = Math.min(20, (project.progress / 100) * 20);
      utilizationScore += budgetUtilization;
    }
    
    // Facteur 4: Complexité du projet (10%)
    const complexityScore = project.title.length > 50 ? 10 : 5;
    utilizationScore += complexityScore;
    
    return Math.min(100, Math.round(utilizationScore));
  }

  // Helper methods pour les transformations
  private mapStakeholderType(type: string): StakeholderType {
    const mapping: Record<string, StakeholderType> = {
      'employee': 'manager',
      'external': 'contractor',
      'supplier': 'supplier',
      'consultant': 'consultant',
      'inspector': 'inspector',
      'client': 'client',
      'engineer': 'engineer',
      'architect': 'architect'
    };
    return mapping[type] || 'other';
  }

  private mapStakeholderEntityType(type: string): StakeholderEntityType {
    if (type === 'employee') return 'employee';
    if (type === 'supplier') return 'supplier';
    return 'external';
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

    // Validate dates if both are provided
    if ('startDate' in data && 'endDate' in data && data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
        fieldErrors.endDate = ['End date must be after start date'];
      }
    }

    return { isValid: errors.length === 0, errors, fieldErrors };
  }
}
