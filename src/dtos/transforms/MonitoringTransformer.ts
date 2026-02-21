/**
 * Monitoring Transformer - Hexagonal Architecture
 * Transforms between Monitoring entities and DTOs
 */

import {
  MonitoringDashboardDTO,
  MonitoringWidgetDTO,
  MonitoringFiltersDTO
} from '@/dtos/entities/MonitoringDTOs';

export class MonitoringTransformer {
  /**
   * Transform dashboard data to DTO
   */
  static toDashboardDTO(data: MonitoringDashboardDTO): MonitoringDashboardDTO {
    return {
      ...data,
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Create dashboard entity from partial data
   */
  static createDashboardEntity(data: Partial<MonitoringDashboardDTO> & { userId: string }): MonitoringDashboardDTO {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      userId: data.userId,
      title: data.title || 'Dashboard',
      widgets: data.widgets || [],
      filters: data.filters || {
        dateRange: { start: '', end: '' },
        projects: [],
        status: [],
        departments: [],
        severity: []
      },
      refreshInterval: data.refreshInterval || 300,
      lastRefresh: now,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Update dashboard entity with partial updates
   */
  static updateDashboardEntity(
    existing: MonitoringDashboardDTO,
    updates: Partial<MonitoringDashboardDTO>
  ): MonitoringDashboardDTO {
    return {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      updatedAt: new Date().toISOString()
    };
  }
}
