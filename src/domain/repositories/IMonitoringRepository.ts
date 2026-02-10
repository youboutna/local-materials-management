/**
 * Monitoring Repository Interface - Hexagonal Architecture
 * 
 * Repository interface for monitoring and dashboard operations
 * Following hexagonal architecture patterns with proper abstraction
 */

import { 
  MonitoringDashboardDTO, 
  MonitoringWidgetDTO, 
  MonitoringFiltersDTO 
} from '@/dtos/entities/MonitoringDTOs';

export interface IMonitoringRepository {
  /**
   * Get monitoring dashboard by user ID
   * @param userId User identifier
   * @returns Monitoring dashboard data
   */
  findDashboardByUserId(userId: string): Promise<MonitoringDashboardDTO | null>;

  /**
   * Get monitoring dashboard by ID
   * @param id Dashboard identifier
   * @returns Monitoring dashboard data
   */
  findDashboardById(id: string): Promise<MonitoringDashboardDTO | null>;

  /**
   * Save monitoring dashboard
   * @param dashboard Dashboard data to save
   * @returns Saved dashboard data
   */
  saveDashboard(dashboard: MonitoringDashboardDTO): Promise<MonitoringDashboardDTO>;

  /**
   * Update monitoring dashboard
   * @param id Dashboard identifier
   * @param updates Dashboard updates
   * @returns Updated dashboard data
   */
  updateDashboard(id: string, updates: Partial<MonitoringDashboardDTO>): Promise<MonitoringDashboardDTO>;

  /**
   * Delete monitoring dashboard
   * @param id Dashboard identifier
   * @returns Success status
   */
  deleteDashboard(id: string): Promise<boolean>;

  /**
   * Get monitoring dashboards by user ID
   * @param userId User identifier
   * @returns Array of user dashboards
   */
  findDashboardsByUserId(userId: string): Promise<MonitoringDashboardDTO[]>;

  /**
   * Add widget to dashboard
   * @param dashboardId Dashboard identifier
   * @param widget Widget data to add
   * @returns Updated dashboard
   */
  addWidgetToDashboard(dashboardId: string, widget: MonitoringWidgetDTO): Promise<MonitoringDashboardDTO>;

  /**
   * Remove widget from dashboard
   * @param dashboardId Dashboard identifier
   * @param widgetId Widget identifier
   * @returns Updated dashboard
   */
  removeWidgetFromDashboard(dashboardId: string, widgetId: string): Promise<MonitoringDashboardDTO>;

  /**
   * Get widgets for dashboard
   * @param dashboardId Dashboard identifier
   * @returns Array of widgets
   */
  findWidgetsByDashboardId(dashboardId: string): Promise<MonitoringWidgetDTO[]>;
}
