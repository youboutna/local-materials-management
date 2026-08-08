/**
 * Monitoring Dashboard Service - Hexagonal Architecture (Working Version)
 * 
 * Business use cases for monitoring and dashboard functionality
 * Simplified version that works with existing DTOs and repositories
 */

import { ProjectMonitoringDTO } from '@/dtos/entities/ProjectDTO';;
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';

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
    private projectRepository: IProjectRepository
  ) {}

  // =================== DASHBOARD OPERATIONS ===================

  async getMonitoringDashboard(userId: string): Promise<MonitoringDashboardDTO> {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Create default dashboard
      const dashboard: MonitoringDashboardDTO = {
        id: crypto.randomUUID(),
        userId,
        lastUpdated: new Date().toISOString(),
        widgets: this.getDefaultWidgets(),
        filters: this.getDefaultFilters(),
        refreshInterval: 300, // 5 minutes default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
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

      // Create dashboard DTO
      const dashboard: MonitoringDashboardDTO = {
        id: crypto.randomUUID(),
        userId,
        lastUpdated: new Date().toISOString(),
        widgets: config.widgets || this.getDefaultWidgets(),
        filters: config.filters || this.getDefaultFilters(),
        refreshInterval: config.refreshInterval || 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
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

  async updateMonitoringDashboard(dashboardId: string, updates: Partial<MonitoringDashboardDTO>): Promise<MonitoringDashboardDTO> {
    try {
      // Validate input
      if (!dashboardId) {
        throw new ValidationError('Dashboard ID is required');
      }

      // For now, return a mock updated dashboard
      // In a real implementation, this would update the dashboard in the database
      const dashboard: MonitoringDashboardDTO = {
        id: dashboardId,
        userId: updates.userId || 'default-user',
        lastUpdated: new Date().toISOString(),
        widgets: updates.widgets || this.getDefaultWidgets(),
        filters: updates.filters || this.getDefaultFilters(),
        refreshInterval: updates.refreshInterval || 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
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

      // For now, return a mock dashboard with added widget
      // In a real implementation, this would add the widget to the dashboard in the database
      const dashboard: MonitoringDashboardDTO = {
        id: dashboardId,
        userId: 'default-user',
        lastUpdated: new Date().toISOString(),
        widgets: [
          ...this.getDefaultWidgets(),
          {
            ...widget,
            id: crypto.randomUUID(),
            lastRefresh: new Date().toISOString()
          }
        ],
        filters: this.getDefaultFilters(),
        refreshInterval: 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
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

      // For now, return a mock dashboard with removed widget
      // In a real implementation, this would remove the widget from the dashboard in the database
      const dashboard: MonitoringDashboardDTO = {
        id: dashboardId,
        userId: 'default-user',
        lastUpdated: new Date().toISOString(),
        widgets: this.getDefaultWidgets().filter(w => w.id !== widgetId),
        filters: this.getDefaultFilters(),
        refreshInterval: 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
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
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get user's projects
      const projects = await this.getProjectsByUserId(userId);
      
      // Calculate overview metrics
      const overview = this.calculateMonitoringOverview(projects, filters);
      
      // Get project monitoring data
      const projectMonitoring = await Promise.all(
        projects.map(project => this.getProjectMonitoring(project.id, filters))
      );
      
      // Get alerts (empty for now)
      const alerts: MonitoringAlertDTO[] = [];
      
      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(projects, filters);

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

  private getDefaultWidgets(): MonitoringWidgetDTO[] {
    return [
      {
        id: crypto.randomUUID(),
        type: 'metric',
        title: 'Total Projects',
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: { metric: 'total_projects' },
        data: { value: 0, label: 'Projects' },
        lastRefresh: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        type: 'chart',
        title: 'Project Status',
        position: { x: 3, y: 0, width: 6, height: 4 },
        config: { chartType: 'pie' },
        data: { labels: [], values: [] },
        lastRefresh: new Date().toISOString()
      }
    ];
  }

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
      severity: [] as ('high' | 'low' | 'medium' | 'critical')[]
    };
  }

  private async getProjectsByUserId(userId: string): Promise<ProjectDTO[]> {
    // This would use the actual repository method
    // For now, return empty array as placeholder
    return [];
  }

  private calculateMonitoringOverview(projects: ProjectDTO[], filters?: MonitoringFiltersDTO): MonitoringOverviewDTO {
    const filteredProjects = this.filterProjects(projects, filters);
    
    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(p => 
      ['en_cours_v2', 'en_construction_v2', 'en_inspection_v2'].includes(p.status)
    ).length;
    
    const atRiskProjects = filteredProjects.filter(p => 
      (p.progress || 0) < 50 && p.status !== 'termine_v2'
    ).length;
    
    const delayedProjects = filteredProjects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'termine_v2';
    }).length;

    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const spentBudget = Math.round(totalBudget * 0.65); // Placeholder calculation
    const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects: filteredProjects.filter(p => p.status === 'termine_v2').length,
      atRiskProjects,
      delayedProjects,
      totalBudget,
      spentBudget,
      budgetUtilization,
      healthScore: 80,
      riskLevel: 'low' as const,
      teamSize: filteredProjects.reduce((sum, p) => sum + (p.teamSize || 0), 0),
      openTasks: 0,
      overdueTasks: 0
    };
  }

  private async getProjectMonitoring(projectId: string, filters?: MonitoringFiltersDTO): Promise<ProjectMonitoringDTO> {
    // Get project details
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new MonitoringServiceError('Project not found', 'PROJECT_NOT_FOUND');
    }

    // Calculate project-specific metrics
    const projectDTO = project as any as ProjectDTO;
    const healthScore = this.calculateHealthScore(projectDTO);
    const riskLevel = this.calculateRiskLevel(projectDTO);
    const milestonesProgress = project.progress || 0;
    const budgetUtilization = this.calculateBudgetUtilization(projectDTO);
    const teamPerformance = 85;
    const upcomingDeadlines = this.getUpcomingDeadlines(projectDTO);

    return {
      id: project.id,
      projectId: project.id,
      title: project.title,
      description: project.description || '',
      status: project.status,
      startDate: typeof project.startDate === 'string' ? project.startDate : project.startDate?.toISOString() || '',
      endDate: typeof project.endDate === 'string' ? project.endDate : project.endDate?.toISOString() || '',
      budget: project.budget || 0,
      progress: project.progress || 0,
      healthScore,
      riskLevel,
      milestonesProgress,
      budgetUtilization,
      teamPerformance,
      upcomingDeadlines,
      recentActivities: [], // Would need activity data
      createdAt: typeof project.createdAt === 'string' ? project.createdAt : project.createdAt?.toISOString() || '',
      updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : project.updatedAt?.toISOString() || ''
    };
  }

  private calculatePerformanceMetrics(projects: ProjectDTO[], filters?: MonitoringFiltersDTO): PerformanceMetricsDTO {
    const filteredProjects = this.filterProjects(projects, filters);
    
    // Placeholder calculations - would integrate with actual metrics
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

  private filterProjects(projects: ProjectDTO[], filters?: MonitoringFiltersDTO): ProjectDTO[] {
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
      if (filters.projects.length > 0 && !filters.projects.includes(project.id)) {
        return false;
      }

      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      return true;
    });
  }

  private calculateHealthScore(project: ProjectDTO): number {
    // Placeholder health score calculation
    let score = 100;
    
    // Reduce score for delays
    if (project.endDate && new Date(project.endDate) < new Date() && project.status !== 'termine_v2') {
      score -= 30;
    }
    
    // Reduce score for budget overruns
    if (project.progress && project.progress > 80 && project.budget) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  private calculateRiskLevel(project: ProjectDTO): 'faible' | 'moyen' | 'eleve' | 'critique' {
    const healthScore = this.calculateHealthScore(project);
    
    if (healthScore >= 80) return 'faible';
    if (healthScore >= 60) return 'moyen';
    if (healthScore >= 40) return 'eleve';
    return 'critique';
  }

  private calculateBudgetUtilization(project: ProjectDTO): number {
    if (!project.budget || project.budget === 0) return 0;
    // Placeholder calculation - would need actual spending data
    return (project.progress || 0) * 0.9; // Assume 90% of progress equals budget spent
  }

  private getUpcomingDeadlines(project: ProjectDTO): string[] {
    const deadlines: string[] = [];
    
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      const now = new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEnd > 0 && daysUntilEnd <= 30) {
        deadlines.push(typeof project.endDate === 'string' ? project.endDate : String(project.endDate || ''));
      }
    }
    
    return deadlines;
  }
}
