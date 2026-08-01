import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Import all project-related services
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectManagerService } from '@/application/services/ProjectManagerService';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';

// Import DTOs
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import {
    CreateProjectDTO,
    PROJECT_STATUS_CATEGORIES,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_TRANSITIONS,
    ProjectDTO,
    ProjectStatus,
    UpdateProjectDTO
} from '@/dtos/entities/ProjectDTO';
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
  dateRange?: { start: string; end: string; };
  budgetRange?: { min: number; max: number; };
  progressRange?: { min: number; max: number; };
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
    this.workflowService = ProjectWorkflowService.default();
    this.stakeholderService = new ProjectStakeholderService();
    this.managerService = null as any; // Lazy init - requires project context
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
      const healthScore = this.calculationService.calculateProjectHealthScore(
        project.progress || 0,
        (analytics as any).budgetVariance || 0,
        (analytics as any).schedulePerformance || 0,
        (analytics as any).qualityScore || 0
      );

      return {
        id: project.id,
        title: project.title,
        status: project.status as ProjectStatus,
        progress: project.progress || 0,
        budget: project.budget || 0,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        currentPhase: project.currentPhase,
        teamSize: project.teamSize || 0,
        riskLevel: this.calculateRiskLevel(analytics),
        healthScore: healthScore.overallScore || 0,
        lastUpdated: project.updatedAt
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
              (PROJECT_STATUS_CATEGORIES as any)[category]?.includes(projectStatus)
            );
          });
        }

        if (filter.dateRange) {
          filteredProjects = filteredProjects.filter(p => {
            const startDate = new Date(p.startDate);
            const endDate = p.endDate ? new Date(p.endDate) : new Date();
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
            p.technicalManagerId === filter.managerId || p.projectResponsableId === filter.managerId
          );
        }

        if (filter.clientId) {
          filteredProjects = filteredProjects.filter(p => 
            p.clientId === filter.clientId
          );
        }
      }

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

      const [phases, materials, stakeholders, analytics, realCosts, phaseCosts, resourceUtilization, timelinePerformance, healthScore] = await Promise.all([
        this.getProjectPhases(projectId),
        this.getProjectMaterials(projectId),
        this.getProjectStakeholders(projectId),
        this.analyticsService.getProjectAnalytics(projectId),
        this.calculationService.calculateRealProjectCosts(projectId),
        this.calculationService.calculatePhaseCosts(projectId, project.currentPhase || ''),
        this.calculationService.calculatePhaseResourceUtilization(projectId, project.currentPhase || ''),
        this.calculationService.calculateTimelinePerformance(project, []),
        this.calculationService.calculateProjectHealthScore(
          project.progress || 0,
          0, // budgetVariance
          0, // schedulePerformance
          0  // qualityScore
        )
      ]);

      const projectAnalytics = analytics;

      return {
        ...project,
        phases: phases as PhaseDTO[],
        materials: materials as MaterialDTO[],
        stakeholders: stakeholders as StakeholderDTO[],
        analytics: {
          progress: project.progress || 0,
          budget: {
            total: project.budget || 0,
            spent: realCosts.totalPayments || 0,
            remaining: (project.budget || 0) - (realCosts.totalPayments || 0),
            utilization: realCosts.budgetUtilization || 0
          },
          timeline: {
            totalDays: 0,
            elapsedDays: 0,
            remainingDays: 0,
            onTime: true
          },
          quality: {
            score: 85,
            issues: 0,
            inspections: 0
          },
          risks: {
            total: 0,
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
        (PROJECT_STATUS_CATEGORIES.ACTIVE as readonly ProjectStatus[]).includes(p.status as ProjectStatus)
      ).length;
      const completedProjects = projects.filter(p => 
        (PROJECT_STATUS_CATEGORIES.COMPLETED as readonly ProjectStatus[]).includes(p.status as ProjectStatus)
      ).length;
      const delayedProjects = projects.filter(p => 
        p.status === ProjectStatus.EN_RETARD
      ).length;

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const averageProgress = totalProjects > 0 ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects : 0;

      const spentBudget = 0;
      const onTimeDelivery = 0;
      const budgetUtilization = 0;
      const qualityScore = 0;

      const statusDistribution = projects.reduce((acc, project) => {
        const status = project.status as ProjectStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<ProjectStatus, number>);

      const riskDistribution = { low: 0, medium: 0, high: 0 };

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        delayedProjects,
        totalBudget,
        spentBudget,
        averageProgress: Math.round(averageProgress),
        onTimeDelivery,
        budgetUtilization,
        qualityScore,
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
      this.validateProjectData(data);
      const project = await this.projectService.createProject(data);
      await (this.workflowService as any).initializeWorkflow(project.id);
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
      if (data.status) {
        this.validateStatusTransition(projectId, data.status);
      }
      const updatedProject = await this.projectService.updateProject(projectId, data);
      if (data.status) {
        await (this.workflowService as any).transitionStatus?.(projectId, data.status);
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
        case 'create': break;
        case 'update':
          await this.updateProject(action.projectId, action.data as UpdateProjectDTO);
          break;
        case 'delete':
          await this.projectService.deleteProject(action.projectId);
          break;
        case 'archive':
          await this.projectService.updateProject(action.projectId, { id: action.projectId, status: ProjectStatus.ANNULE as any });
          break;
        case 'restore':
          await this.projectService.updateProject(action.projectId, { id: action.projectId, status: ProjectStatus.EN_ATTENTE as any });
          break;
      }
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
      const workflow = await (this.workflowService as any).getWorkflowStatus?.(projectId) || { projectId, currentStep: 0, totalSteps: 0, completedSteps: 0, status: 'active', estimatedCompletion: '', actualCompletion: '', blockers: [] };
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
    return [];
  }

  private async getProjectMaterials(projectId: string): Promise<MaterialDTO[]> {
    return [];
  }

  private async getProjectStakeholders(projectId: string): Promise<StakeholderDTO[]> {
    return await this.stakeholderService.getProjectStakeholders(projectId) as any;
  }

  private calculateRiskLevel(analytics: any): 'low' | 'medium' | 'high' {
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
    console.log('Project action logged:', action);
  }
}

// Export singleton instance
export const projectManagementService = new ProjectManagementService();
