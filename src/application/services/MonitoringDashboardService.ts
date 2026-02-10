/**
 * Monitoring Dashboard Service - Hexagonal Architecture
 * 
 * Business use cases for monitoring and dashboard functionality
 * Following hexagonal architecture patterns:
 * - constructor(private repository: IEntityRepository) {}
 * - async methods with proper error handling
 * - DTO transformations via transformers
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

// Extended interface to include missing properties
interface ExtendedMonitoringFiltersDTO {
  dateRange?: {
    start: string;
    end: string;
  };
  projects?: string[];
  status?: string[];
  departments?: string[];
  severity?: string[];
}
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
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
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Fetch dashboard data
      const dashboardData = await this.monitoringRepository.findDashboardByUserId(userId);
      if (!dashboardData) {
        throw new MonitoringServiceError('Dashboard not found', 'DASHBOARD_NOT_FOUND');
      }

      // Transform to DTO
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
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Create dashboard entity
      const dashboardEntity = MonitoringTransformer.createDashboardEntity({
        userId,
        widgets: config.widgets || [],
        filters: config.filters || this.getDefaultFilters(),
        refreshInterval: config.refreshInterval || 300, // 5 minutes default
        ...config
      });

      // Save dashboard
      const savedDashboard = await this.monitoringRepository.saveDashboard(dashboardEntity);

      // Transform to DTO
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
      // Validate input
      if (!id) {
        throw new ValidationError('Dashboard ID is required');
      }

      // Get existing dashboard
      const existingDashboard = await this.monitoringRepository.findDashboardById(id);
      if (!existingDashboard) {
        throw new MonitoringServiceError('Dashboard not found', 'DASHBOARD_NOT_FOUND');
      }

      // Update dashboard entity
      const updatedEntity = MonitoringTransformer.updateDashboardEntity(existingDashboard, updates);

      // Save updated dashboard
      const savedDashboard = await this.monitoringRepository.saveDashboard(updatedEntity);

      // Transform to DTO
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
      // Validate input
      if (!dashboardId) {
        throw new ValidationError('Dashboard ID is required');
      }

      // Get dashboard
      const dashboard = await this.getMonitoringDashboard(dashboardId);

      // Create new widget
      const newWidget: MonitoringWidgetDTO = {
        ...widget,
        id: crypto.randomUUID(),
        lastRefresh: new Date().toISOString()
      };

      // Add widget to dashboard
      dashboard.widgets.push(newWidget);

      // Update dashboard
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
      // Validate input
      if (!dashboardId || !widgetId) {
        throw new ValidationError('Dashboard ID and Widget ID are required');
      }

      // Get dashboard
      const dashboard = await this.getMonitoringDashboard(dashboardId);

      // Remove widget
      dashboard.widgets = dashboard.widgets.filter((w: MonitoringWidgetDTO) => w.id !== widgetId);

      // Update dashboard
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

  async getComprehensiveMonitoring(userId: string, filters?: ExtendedMonitoringFiltersDTO): Promise<ComprehensiveMonitoringDTO> {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get user's projects
      const projects = await this.projectRepository.findByUserId(userId);

      // Calculate overview metrics
      const overview = await this.calculateMonitoringOverview(projects, filters);

      // Get project monitoring data
      const projectMonitoring = await Promise.all(
        projects.map(project => this.getProjectMonitoring(project.id, filters))
      );

      // Get alerts
      const alerts = await this.getMonitoringAlerts(userId, filters);

      // Calculate performance metrics
      const performance = await this.calculatePerformanceMetrics(projects, filters);

      // Create comprehensive monitoring DTO
      const comprehensiveMonitoring: ComprehensiveMonitoringDTO = {
        id: crypto.randomUUID(),
        userId,
        overview,
        projects: projectMonitoring,
        alerts,
        performance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return comprehensiveMonitoring;
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

  private getDefaultFilters(): ExtendedMonitoringFiltersDTO {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      dateRange: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString()
      }
    };
  }

  private filterProjects(projects: ProjectDTO[], filters?: ExtendedMonitoringFiltersDTO): ProjectDTO[] {
    if (!filters) return projects;

    return projects.filter(project => {
      // Filter by date range
      if (filters.dateRange) {
        const projectDate = new Date(project.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (projectDate < startDate || projectDate > endDate) {
          return false;
        }
      }

      // Filter by projects
      if (filters.projects && filters.projects.length > 0 && !filters.projects.includes(project.id)) {
        return false;
      }

      // Filter by status
      if (filters.status && filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      return true;
    });
  }

  private async calculateMonitoringOverview(projects: ProjectDTO[], filters?: ExtendedMonitoringFiltersDTO): Promise<MonitoringOverviewDTO> {
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
    const spentBudget = await this.calculateActualSpending(filteredProjects.map(p => p.id));
    const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
    const teamSize = filteredProjects.reduce((sum, p) => sum + (p.teamSize || 0), 0);
    const openTasks = await this.calculateOpenTasks(filteredProjects.map(p => p.id));
    const overdueTasks = await this.calculateOverdueTasks(filteredProjects.map(p => p.id));
    const healthScore = this.calculateOverallHealthScore(filteredProjects);
    const riskLevel = this.calculateOverallRiskLevel(filteredProjects);

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
