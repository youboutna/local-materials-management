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
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
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
  constructor(
    private monitoringRepository: IMonitoringRepository,
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
    private paymentRepository: IPaymentRepository
  ) {}

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

      // Get user's projects via findAll (findByUserId not available on IProjectRepository)
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

      const overview = this.calculateMonitoringOverview(projects, filters);

      const projectMonitoring = projects.slice(0, 10).map(project => this.createProjectMonitoring(project));

      const alerts: MonitoringAlertDTO[] = [];

      const performance = this.calculatePerformanceMetrics(projects);

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

  private calculateMonitoringOverview(projects: ProjectDTO[], filters?: MonitoringFiltersDTO): MonitoringOverviewDTO {
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
    const spentBudget = Math.round(totalBudget * 0.65); // Placeholder
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
      openTasks: 0,
      overdueTasks: 0
    };
  }

  private createProjectMonitoring(project: ProjectDTO): ProjectMonitoringDTO {
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
      healthScore: 80,
      riskLevel: 'faible',
      milestonesProgress: project.progress || 0,
      budgetUtilization: (project.progress || 0) * 0.9,
      teamPerformance: 85,
      upcomingDeadlines: [],
      recentActivities: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  private calculatePerformanceMetrics(projects: ProjectDTO[]): PerformanceMetricsDTO {
    return {
      productivity: 85,
      quality: 90,
      safety: 95,
      budget: 75,
      schedule: 80,
      team: 88,
      overall: 87,
      trend: 'stable'
    };
  }

  private calculateBudgetUtilization(project: ProjectDTO): number {
    if (!project.budget || project.budget === 0) return 0;
    return (project.progress || 0) * 0.9;
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
