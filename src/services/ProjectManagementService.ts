import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Import all project-related services
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectAnalyticsService } from '@/services/ProjectAnalyticsService';
import { ProjectCalculationService } from '@/services/ProjectCalculationService';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { ProjectManagerService } from '@/application/services/ProjectManagerService';

// Import DTOs
import { 
  ProjectDTO, 
  CreateProjectDTO, 
  UpdateProjectDTO, 
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TRANSITIONS 
} from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';

// Comprehensive project management interfaces
export interface ProjectOverviewDTO {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  location: string;
  startDate: string;
  endDate?: string;
  currentPhase?: string;
  teamSize: number;
  riskLevel: 'low' | 'medium' | 'high';
  healthScore: number;
  lastUpdated: string;
}

export interface ProjectMetricsDTO {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalBudget: number;
  spentBudget: number;
  averageProgress: number;
  onTimeDelivery: number;
  budgetUtilization: number;
  qualityScore: number;
  riskDistribution: Record<string, number>;
  statusDistribution: Record<ProjectStatus, number>;
}

export interface ProjectDetailDTO extends ProjectDTO {
  phases: PhaseDTO[];
  materials: MaterialDTO[];
  stakeholders: StakeholderDTO[];
  analytics: {
    progress: number;
    budget: {
      total: number;
      spent: number;
      remaining: number;
      utilization: number;
    };
    timeline: {
      totalDays: number;
      elapsedDays: number;
      remainingDays: number;
      onTime: boolean;
    };
    quality: {
      score: number;
      issues: number;
      inspections: number;
    };
    risks: {
      total: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  calculations: {
    realCosts: any;
    phaseCosts: any;
    resourceUtilization: any;
    timelinePerformance: any;
    healthScore: any;
  };
}

export interface ProjectFilterDTO {
  status?: ProjectStatus[];
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  progressRange?: {
    min: number;
    max: number;
  };
  location?: string;
  managerId?: string;
  clientId?: string;
}

export interface ProjectActionDTO {
  type: 'create' | 'update' | 'delete' | 'archive' | 'restore';
  projectId: string;
  data?: Partial<ProjectDTO>;
  reason?: string;
  userId: string;
}

export interface ProjectWorkflowDTO {
  projectId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  status: 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  estimatedCompletion: string;
  actualCompletion?: string;
  blockers: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
  }>;
}

/**
 * Comprehensive Project Management Service
 * Orchestrates all project-related services following hexagonal architecture
 */
export class ProjectManagementService {
  private projectService: ProjectService;
  private analyticsService: ProjectAnalyticsService;
  private calculationService: typeof ProjectCalculationService;
  private workflowService: ProjectWorkflowService;
  private stakeholderService: ProjectStakeholderService;
  private managerService: ProjectManagerService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.analyticsService = new ProjectAnalyticsService();
    this.calculationService = ProjectCalculationService;
    this.workflowService = new ProjectWorkflowService();
    this.stakeholderService = new ProjectStakeholderService();
    this.managerService = new ProjectManagerService();
  }

  /**
   * Get comprehensive project overview
   */
  async getProjectOverview(projectId: string): Promise<ProjectOverviewDTO> {
    try {
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const analytics = await this.analyticsService.getProjectAnalytics(projectId);
      const healthScore = await this.calculationService.calculateProjectHealthScore(
        project.progress || 0,
        analytics.budgetUtilization || 0,
        analytics.timelinePerformance || 0,
        analytics.qualityScore || 0
      );

      return {
        id: project.id,
        title: project.title,
        status: project.status as ProjectStatus,
        progress: project.progress || 0,
        budget: project.budget || 0,
        location: project.location,
        startDate: project.start_date,
        endDate: project.end_date,
        currentPhase: project.current_phase,
        teamSize: project.team_size || 0,
        riskLevel: this.calculateRiskLevel(analytics),
        healthScore: healthScore.overallScore || 0,
        lastUpdated: project.updated_at
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get project overview',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(filter?: ProjectFilterDTO): Promise<ProjectOverviewDTO[]> {
    try {
      const projects = await this.projectService.getAllProjects();
      
      let filteredProjects = projects;

      // Apply filters
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          filteredProjects = filteredProjects.filter(p => 
            filter.status!.includes(p.status as ProjectStatus)
          );
        }

        if (filter.category && filter.category.length > 0) {
          filteredProjects = filteredProjects.filter(p => {
            const projectStatus = p.status as ProjectStatus;
            return filter.category!.some(category => 
              PROJECT_STATUS_CATEGORIES[category as keyof typeof PROJECT_STATUS_CATEGORIES]?.includes(projectStatus)
            );
          });
        }

        if (filter.dateRange) {
          filteredProjects = filteredProjects.filter(p => {
            const startDate = new Date(p.start_date);
            const endDate = p.end_date ? new Date(p.end_date) : new Date();
            const filterStart = new Date(filter.dateRange!.start);
            const filterEnd = new Date(filter.dateRange!.end);
            return startDate >= filterStart && endDate <= filterEnd;
          });
        }

        if (filter.budgetRange) {
          filteredProjects = filteredProjects.filter(p => 
            p.budget >= filter.budgetRange!.min && p.budget <= filter.budgetRange!.max
          );
        }

        if (filter.progressRange) {
          filteredProjects = filteredProjects.filter(p => 
            (p.progress || 0) >= filter.progressRange!.min && (p.progress || 0) <= filter.progressRange!.max
          );
        }

        if (filter.location) {
          filteredProjects = filteredProjects.filter(p => 
            p.location.toLowerCase().includes(filter.location!.toLowerCase())
          );
        }

        if (filter.managerId) {
          filteredProjects = filteredProjects.filter(p => 
            p.technical_manager_id === filter.managerId || p.project_responsable_id === filter.managerId
          );
        }

        if (filter.clientId) {
          filteredProjects = filteredProjects.filter(p => 
            p.client_id === filter.clientId
          );
        }
      }

      // Transform to overview format
      const overviews: ProjectOverviewDTO[] = [];
      for (const project of filteredProjects) {
        const overview = await this.getProjectOverview(project.id);
        overviews.push(overview);
      }

      return overviews;
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get projects',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get comprehensive project details
   */
  async getProjectDetails(projectId: string): Promise<ProjectDetailDTO> {
    try {
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Get related data in parallel
      const [phases, materials, stakeholders, analytics, realCosts, phaseCosts, resourceUtilization, timelinePerformance, healthScore] = await Promise.all([
        this.getProjectPhases(projectId),
        this.getProjectMaterials(projectId),
        this.getProjectStakeholders(projectId),
        this.analyticsService.getProjectAnalytics(projectId),
        this.calculationService.calculateRealProjectCosts(projectId),
        this.calculationService.calculatePhaseCosts(projectId, project.current_phase || ''),
        this.calculationService.calculatePhaseResourceUtilization(projectId, project.current_phase || ''),
        this.calculationService.calculateTimelinePerformance(project, []),
        this.calculationService.calculateProjectHealthScore(
          project.progress || 0,
          0, // Will be calculated from analytics
          0, // Will be calculated from analytics
          0  // Will be calculated from analytics
        )
      ]);

      return {
        ...project,
        phases,
        materials,
        stakeholders,
        analytics: {
          progress: project.progress || 0,
          budget: {
            total: project.budget || 0,
            spent: realCosts.totalPayments || 0,
            remaining: (project.budget || 0) - (realCosts.totalPayments || 0),
            utilization: realCosts.budgetUtilization || 0
          },
          timeline: {
            totalDays: 0, // Calculate from dates
            elapsedDays: 0, // Calculate from dates
            remainingDays: 0, // Calculate from dates
            onTime: true // Calculate from timeline performance
          },
          quality: {
            score: 85, // Default value
            issues: 0, // Get from inspections
            inspections: 0 // Get from inspections
          },
          risks: {
            total: 0, // Get from risk assessment
            high: 0,
            medium: 0,
            low: 0
          }
        },
        calculations: {
          realCosts,
          phaseCosts,
          resourceUtilization,
          timelinePerformance,
          healthScore
        }
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get project details',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get project metrics across all projects
   */
  async getProjectMetrics(): Promise<ProjectMetricsDTO> {
    try {
      const projects = await this.projectService.getAllProjects();
      
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => 
        PROJECT_STATUS_CATEGORIES.ACTIVE.includes(p.status as ProjectStatus)
      ).length;
      const completedProjects = projects.filter(p => 
        PROJECT_STATUS_CATEGORIES.COMPLETED.includes(p.status as ProjectStatus)
      ).length;
      const delayedProjects = projects.filter(p => 
        p.status === ProjectStatus.EN_RETARD
      ).length;

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const averageProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects;

      // Calculate spent budget and other metrics
      let spentBudget = 0;
      let onTimeDelivery = 0;
      let budgetUtilization = 0;
      let qualityScore = 0;

      for (const project of projects) {
        const analytics = await this.analyticsService.getProjectAnalytics(project.id);
        spentBudget += analytics.totalSpent || 0;
        onTimeDelivery += analytics.onTimePerformance || 0;
        budgetUtilization += analytics.budgetUtilization || 0;
        qualityScore += analytics.qualityScore || 0;
      }

      spentBudget = spentBudget / totalProjects;
      onTimeDelivery = onTimeDelivery / totalProjects;
      budgetUtilization = budgetUtilization / totalProjects;
      qualityScore = qualityScore / totalProjects;

      // Status distribution
      const statusDistribution = projects.reduce((acc, project) => {
        const status = project.status as ProjectStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<ProjectStatus, number>);

      // Risk distribution
      const riskDistribution = {
        low: 0,
        medium: 0,
        high: 0
      };

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        delayedProjects,
        totalBudget,
        spentBudget,
        averageProgress: Math.round(averageProgress),
        onTimeDelivery: Math.round(onTimeDelivery),
        budgetUtilization: Math.round(budgetUtilization),
        qualityScore: Math.round(qualityScore),
        riskDistribution,
        statusDistribution
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get project metrics',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDTO): Promise<ProjectDTO> {
    try {
      // Validate project data
      this.validateProjectData(data);

      // Create project using service
      const project = await this.projectService.createProject(data);

      // Initialize project workflow
      await this.workflowService.initializeProjectWorkflow(project.id);

      // Add default stakeholders if needed
      if (data.technical_manager_id) {
        await this.stakeholderService.addStakeholder(project.id, {
          name: 'Technical Manager',
          role: 'technical_manager',
          contact: '',
          organization: '',
          isPrimary: true
        });
      }

      return project;
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to create project',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, data: UpdateProjectDTO): Promise<ProjectDTO> {
    try {
      // Validate update data
      if (data.status) {
        this.validateStatusTransition(projectId, data.status);
      }

      // Update project
      const updatedProject = await this.projectService.updateProject(projectId, data);

      // Trigger workflow updates if status changed
      if (data.status) {
        await this.workflowService.updateProjectStatus(projectId, data.status);
      }

      return updatedProject;
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update project',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Execute project action
   */
  async executeProjectAction(action: ProjectActionDTO): Promise<void> {
    try {
      switch (action.type) {
        case 'create':
          // Already handled by createProject
          break;
        case 'update':
          await this.updateProject(action.projectId, action.data as UpdateProjectDTO);
          break;
        case 'delete':
          await this.projectService.deleteProject(action.projectId);
          break;
        case 'archive':
          await this.projectService.archiveProject(action.projectId);
          break;
        case 'restore':
          await this.projectService.restoreProject(action.projectId);
          break;
      }

      // Log action for audit trail
      await this.logProjectAction(action);
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to execute project action: ${action.type}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get project workflow status
   */
  async getProjectWorkflow(projectId: string): Promise<ProjectWorkflowDTO> {
    try {
      const workflow = await this.workflowService.getProjectWorkflow(projectId);
      return {
        projectId: workflow.projectId,
        currentStep: workflow.currentStep,
        totalSteps: workflow.totalSteps,
        completedSteps: workflow.completedSteps,
        status: workflow.status,
        estimatedCompletion: workflow.estimatedCompletion,
        actualCompletion: workflow.actualCompletion,
        blockers: workflow.blockers || []
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get project workflow',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods
  private async getProjectPhases(projectId: string): Promise<PhaseDTO[]> {
    // Implementation would call PhaseService
    return [];
  }

  private async getProjectMaterials(projectId: string): Promise<MaterialDTO[]> {
    // Implementation would call MaterialService
    return [];
  }

  private async getProjectStakeholders(projectId: string): Promise<StakeholderDTO[]> {
    return await this.stakeholderService.getProjectStakeholders(projectId);
  }

  private calculateRiskLevel(analytics: any): 'low' | 'medium' | 'high' {
    // Simple risk calculation based on analytics
    const riskScore = analytics.riskScore || 0;
    if (riskScore < 30) return 'low';
    if (riskScore < 70) return 'medium';
    return 'high';
  }

  private validateProjectData(data: CreateProjectDTO): void {
    if (!data.title) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project title is required');
    }
    if (!data.budget || data.budget <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Valid budget is required');
    }
    if (!data.start_date) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date is required');
    }
  }

  private async validateStatusTransition(projectId: string, newStatus: ProjectStatus): Promise<void> {
    const project = await this.projectService.getProjectById(projectId);
    if (!project) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
    }

    const currentStatus = project.status as ProjectStatus;
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status transition from ${PROJECT_STATUS_LABELS[currentStatus]} to ${PROJECT_STATUS_LABELS[newStatus]}`
      );
    }
  }

  private async logProjectAction(action: ProjectActionDTO): Promise<void> {
    // Implementation would log to audit trail
    console.log('Project action logged:', action);
  }
}

// Export singleton instance
export const projectManagementService = new ProjectManagementService();
