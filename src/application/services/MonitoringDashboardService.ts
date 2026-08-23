/**
 * Monitoring Dashboard Service - Hexagonal Architecture
 * 
 * Business use cases for monitoring and dashboard functionality
 */

import { 
  MonitoringDashboardDTO, 
  MonitoringWidgetDTO, 
  MonitoringFiltersDTO,
  ComprehensiveMonitoringDTO,
  MonitoringOverviewDTO,
  ProjectMonitoringDTO,
  MonitoringAlertDTO,
  PerformanceMetricsDTO
} from '@/dtos/entities/MonitoringDTOs';

import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { TaskAssignmentDTO, TaskStatus } from '@/dtos/entities/TaskAssignmentDTO';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { MonitoringTransformer } from '@/dtos/transforms/MonitoringTransformer';

// =================== ERROR CLASSES ===================

export class MonitoringServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'MONITORING_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MonitoringServiceError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// =================== MONITORING DASHBOARD SERVICE ===================

export class MonitoringDashboardService {
  private taskAssignmentService: TaskAssignmentService;

  constructor(
    private monitoringRepository: IMonitoringRepository,
    private projectRepository: IProjectRepository,
    private paymentRepository: IPaymentRepository
  ) {
    // Initialisation de TaskAssignmentService
    this.taskAssignmentService = new TaskAssignmentService(
      RepositoryFactory.getTaskAssignmentRepository()
    );
  }

  // =================== DASHBOARD OPERATIONS ===================

  async getMonitoringDashboard(userId: string): Promise<MonitoringDashboardDTO> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const dashboardData = await this.monitoringRepository.findDashboardByUserId(userId);
      if (!dashboardData) {
        throw new MonitoringServiceError('Dashboard not found', 'DASHBOARD_NOT_FOUND');
      }

      return MonitoringTransformer.toDashboardDTO(dashboardData);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to get monitoring dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_DASHBOARD_FAILED'
      );
    }
  }

  async createMonitoringDashboard(userId: string, config: Partial<MonitoringDashboardDTO>): Promise<MonitoringDashboardDTO> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const dashboardEntity = MonitoringTransformer.createDashboardEntity({
        userId,
        widgets: config.widgets || [],
        filters: config.filters || this.getDefaultFilters(),
        refreshInterval: config.refreshInterval || 300,
        ...config
      });

      const savedDashboard = await this.monitoringRepository.saveDashboard(dashboardEntity);
      return MonitoringTransformer.toDashboardDTO(savedDashboard);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to create monitoring dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_DASHBOARD_FAILED'
      );
    }
  }

  async updateMonitoringDashboard(id: string, updates: Partial<MonitoringDashboardDTO>): Promise<MonitoringDashboardDTO> {
    try {
      if (!id) {
        throw new ValidationError('Dashboard ID is required');
      }

      const existingDashboard = await this.monitoringRepository.findDashboardById(id);
      if (!existingDashboard) {
        throw new MonitoringServiceError('Dashboard not found', 'DASHBOARD_NOT_FOUND');
      }

      const updatedEntity = MonitoringTransformer.updateDashboardEntity(existingDashboard, updates);
      const savedDashboard = await this.monitoringRepository.saveDashboard(updatedEntity);
      return MonitoringTransformer.toDashboardDTO(savedDashboard);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to update monitoring dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_DASHBOARD_FAILED'
      );
    }
  }

  async addWidgetToDashboard(dashboardId: string, widget: Omit<MonitoringWidgetDTO, 'id' | 'lastRefresh'>): Promise<MonitoringDashboardDTO> {
    try {
      if (!dashboardId) {
        throw new ValidationError('Dashboard ID is required');
      }

      const dashboard = await this.getMonitoringDashboard(dashboardId);
      const newWidget: MonitoringWidgetDTO = {
        ...widget,
        id: crypto.randomUUID(),
        lastRefresh: new Date().toISOString()
      };

      dashboard.widgets.push(newWidget);
      return await this.updateMonitoringDashboard(dashboardId, { widgets: dashboard.widgets });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to add widget to dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADD_WIDGET_FAILED'
      );
    }
  }

  async removeWidgetFromDashboard(dashboardId: string, widgetId: string): Promise<MonitoringDashboardDTO> {
    try {
      if (!dashboardId || !widgetId) {
        throw new ValidationError('Dashboard ID and Widget ID are required');
      }

      const dashboard = await this.getMonitoringDashboard(dashboardId);
      dashboard.widgets = dashboard.widgets.filter((w: MonitoringWidgetDTO) => w.id !== widgetId);
      return await this.updateMonitoringDashboard(dashboardId, { widgets: dashboard.widgets });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to remove widget from dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REMOVE_WIDGET_FAILED'
      );
    }
  }

  // =================== COMPREHENSIVE MONITORING ===================

  async getComprehensiveMonitoring(userId: string, filters?: MonitoringFiltersDTO): Promise<ComprehensiveMonitoringDTO> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get user's projects via findAll
      const allProjects = await this.projectRepository.findAll();
      const projects = allProjects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        status: p.status as any,
        progress: p.progress || 0,
        budget: p.budget || 0,
        startDate: p.startDate?.toISOString() || '',
        endDate: p.endDate?.toISOString() || '',
        location: p.location || '',
        teamSize: p.teamSize || 0,
        createdAt: p.createdAt?.toISOString() || '',
        updatedAt: p.updatedAt?.toISOString() || '',
      })) as ProjectDTO[];

      // Récupérer les statistiques des tâches via TaskAssignmentService
      let openTasks = 0;
      let overdueTasks = 0;
      
      try {
        // Récupérer toutes les tâches (ou filtrer par projet si nécessaire)
        const allTasks = await this.taskAssignmentService.getAll();
        
        // Compter les tâches ouvertes (non terminées)
        openTasks = allTasks.filter(t => 
          t.status !== TaskStatus.COMPLETED && 
          t.status !== TaskStatus.CANCELLED
        ).length;
        
        // Compter les tâches en retard
        const now = new Date();
        overdueTasks = allTasks.filter(t => {
          if (!t.dueDate) return false;
          if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
          return new Date(t.dueDate) < now;
        }).length;
      } catch (error) {
        console.warn('Failed to fetch task statistics:', error);
        // Continuer avec des valeurs par défaut
      }

      const spentByProject = await this.getSpentByProject();

      const overview = this.calculateMonitoringOverview(projects, filters, openTasks, overdueTasks, spentByProject);

      const projectMonitoring = projects.slice(0, 10).map(project => 
        this.createProjectMonitoring(project, spentByProject)
      );

      const alerts: MonitoringAlertDTO[] = [];

      const performance = this.calculatePerformanceMetrics(projects, spentByProject, openTasks, overdueTasks);


      return {
        id: crypto.randomUUID(),
        userId,
        overview,
        projects: projectMonitoring,
        alerts,
        performance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MonitoringServiceError) {
        throw error;
      }
      throw new MonitoringServiceError(
        `Failed to get comprehensive monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_COMPREHENSIVE_MONITORING_FAILED'
      );
    }
  }

  /**
   * Récupère les statistiques des tâches pour un projet spécifique
   */
  async getProjectTaskStats(projectId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    overdue: number;
    completionRate: number;
  }> {
    try {
      const tasks = await this.taskAssignmentService.getByProject(projectId);
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
      const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
      const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
      
      const now = new Date();
      const overdue = tasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        return new Date(t.dueDate) < now;
      }).length;
      
      return {
        total,
        completed,
        inProgress,
        pending,
        blocked,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } catch (error) {
      console.error(`Failed to get task stats for project ${projectId}:`, error);
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        blocked: 0,
        overdue: 0,
        completionRate: 0,
      };
    }
  }

  /**
   * Récupère les tâches en retard pour un projet
   */
  async getOverdueTasksForProject(projectId: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentService.getByProject(projectId);
      const now = new Date();
      return tasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        return new Date(t.dueDate) < now;
      });
    } catch (error) {
      console.error(`Failed to get overdue tasks for project ${projectId}:`, error);
      return [];
    }
  }

  // =================== PRIVATE HELPER METHODS ===================

  private getDefaultFilters(): MonitoringFiltersDTO {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      dateRange: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString()
      },
      projects: [],
      status: [],
      departments: [],
      severity: []
    };
  }

  private filterProjects(projects: ProjectDTO[], filters?: MonitoringFiltersDTO): ProjectDTO[] {
    if (!filters) return projects;

    return projects.filter(project => {
      if (filters.dateRange) {
        const projectDate = new Date(project.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (projectDate < startDate || projectDate > endDate) {
          return false;
        }
      }

      if (filters.projects && filters.projects.length > 0 && !filters.projects.includes(project.id)) {
        return false;
      }

      if (filters.status && filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Dépenses réelles par projet, calculées depuis les paiements effectivement payés.
   * Aucune valeur placeholder : si aucun paiement, la dépense vaut 0.
   */
  private async getSpentByProject(): Promise<Map<string, number>> {
    const spent = new Map<string, number>();
    try {
      const payments = await this.paymentRepository.findAll();
      for (const payment of payments) {
        if (payment.status !== 'paid') continue;
        const projectId = payment.projectId;
        if (!projectId) continue;
        spent.set(projectId, (spent.get(projectId) ?? 0) + (payment.amount || 0));
      }
    } catch (error) {
      console.warn('Failed to compute spent budget from payments:', error);
    }
    return spent;
  }

  private calculateMonitoringOverview(
    projects: ProjectDTO[], 
    filters?: MonitoringFiltersDTO,
    openTasks: number = 0,
    overdueTasks: number = 0,
    spentByProject: Map<string, number> = new Map()
  ): MonitoringOverviewDTO {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        atRiskProjects: 0,
        delayedProjects: 0,
        totalBudget: 0,
        spentBudget: 0,
        budgetUtilization: 0,
        healthScore: 100,
        riskLevel: 'low' as const,
        teamSize: 0,
        openTasks: 0,
        overdueTasks: 0
      };
    }

    const filteredProjects = this.filterProjects(projects, filters);

    const activeProjects = filteredProjects.filter(p => 
      ['en_cours', 'en_construction', 'en_inspection', 'en_attente'].includes(p.status)
    ).length;
    const completedProjects = filteredProjects.filter(p => p.status === 'termine').length;
    const atRiskProjects = filteredProjects.filter(p => 
      (p.progress || 0) < 50 && p.status !== 'termine'
    ).length;
    const delayedProjects = filteredProjects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'termine';
    }).length;

    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const spentBudget = filteredProjects.reduce((sum, p) => sum + (spentByProject.get(p.id) ?? 0), 0);
    const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
    const teamSize = filteredProjects.reduce((sum, p) => sum + (p.teamSize || 0), 0);

    const healthScore = filteredProjects.length > 0
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress || 50), 0) / filteredProjects.length)
      : 100;

    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 
      atRiskProjects > filteredProjects.length * 0.3 ? 'critical' :
      atRiskProjects > filteredProjects.length * 0.2 ? 'high' :
      atRiskProjects > filteredProjects.length * 0.1 ? 'medium' : 'low';

    return {
      totalProjects: filteredProjects.length,
      activeProjects,
      completedProjects,
      atRiskProjects,
      delayedProjects,
      totalBudget,
      spentBudget,
      budgetUtilization,
      healthScore,
      riskLevel,
      teamSize,
      openTasks,
      overdueTasks
    };
  }

  private createProjectMonitoring(
    project: ProjectDTO,
    spentByProject: Map<string, number> = new Map()
  ): ProjectMonitoringDTO {
    const budgetUtilization = this.calculateBudgetUtilization(project, spentByProject.get(project.id) ?? 0);
    const healthScore = this.calculateProjectHealthScore(project, budgetUtilization);
    return {
      id: project.id,
      projectId: project.id,
      title: project.title,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || 0,
      progress: project.progress || 0,
      healthScore,
      riskLevel: healthScore >= 80 ? 'faible' : healthScore >= 60 ? 'moyen' : healthScore >= 40 ? 'eleve' : 'critique',
      milestonesProgress: project.progress || 0,
      budgetUtilization,
      teamPerformance: healthScore,
      upcomingDeadlines: this.getUpcomingDeadlines(project),
      recentActivities: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  /**
   * Score de santé dérivé des données réelles : avancement, retard et consommation budgétaire.
   */
  private calculateProjectHealthScore(project: ProjectDTO, budgetUtilization: number): number {
    let score = 100;
    const progress = project.progress || 0;

    if (project.endDate && new Date(project.endDate) < new Date() && project.status !== 'termine') {
      score -= 30;
    }
    // Dérive budgétaire : consommation supérieure à l'avancement
    const drift = budgetUtilization - progress;
    if (drift > 20) score -= 25;
    else if (drift > 10) score -= 15;
    else if (drift > 0) score -= 5;

    if (progress < 25 && project.status !== 'en_attente') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Métriques de performance agrégées depuis les projets réels (aucune valeur figée).
   */
  private calculatePerformanceMetrics(
    projects: ProjectDTO[],
    spentByProject: Map<string, number> = new Map(),
    openTasks: number = 0,
    overdueTasks: number = 0
  ): PerformanceMetricsDTO {
    if (!projects || projects.length === 0) {
      return { productivity: 0, quality: 0, safety: 0, budget: 0, schedule: 0, team: 0, overall: 0, trend: 'stable' };
    }

    const avg = (values: number[]) => Math.round(values.reduce((s, v) => s + v, 0) / values.length);

    const productivity = avg(projects.map(p => p.progress || 0));

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (spentByProject.get(p.id) ?? 0), 0);
    const consumption = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    // 100 = consommation alignée sur l'avancement, pénalité proportionnelle à la dérive
    const budget = Math.max(0, Math.min(100, Math.round(100 - Math.abs(consumption - productivity))));

    const onTime = projects.filter(p => !(p.endDate && new Date(p.endDate) < new Date() && p.status !== 'termine')).length;
    const schedule = Math.round((onTime / projects.length) * 100);

    const team = openTasks > 0
      ? Math.max(0, Math.min(100, Math.round(((openTasks - overdueTasks) / openTasks) * 100)))
      : schedule;

    const quality = Math.round((productivity + schedule) / 2);
    const safety = schedule;
    const overall = avg([productivity, quality, safety, budget, schedule, team]);

    return {
      productivity,
      quality,
      safety,
      budget,
      schedule,
      team,
      overall,
      trend: overall >= 75 ? 'improving' : overall >= 50 ? 'stable' : 'declining'
    };
  }

  private calculateBudgetUtilization(project: ProjectDTO, spent: number = 0): number {
    if (!project.budget || project.budget === 0) return 0;
    return Math.round((spent / project.budget) * 100);
  }


  private getUpcomingDeadlines(project: ProjectDTO): string[] {
    const deadlines: string[] = [];
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      const now = new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd > 0 && daysUntilEnd <= 30) {
        deadlines.push(project.endDate);
      }
    }
    return deadlines;
  }
}

// Import pour le RepositoryFactory
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

let monitoringDashboardServiceInstance: MonitoringDashboardService | null = null;
export function getMonitoringDashboardService(): MonitoringDashboardService {
  if (!monitoringDashboardServiceInstance) {
    monitoringDashboardServiceInstance = new MonitoringDashboardService(RepositoryFactory.getMonitoringRepository(), RepositoryFactory.getProjectRepository(), RepositoryFactory.getPaymentRepository());
  }
  return monitoringDashboardServiceInstance;
}
