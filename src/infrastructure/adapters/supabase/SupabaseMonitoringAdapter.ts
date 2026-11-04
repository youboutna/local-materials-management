/**
 * Supabase Monitoring Adapter - Hexagonal Architecture
 *
 * Persists monitoring dashboards in public.monitoring_dashboards (owner-scoped by RLS).
 * A user without a stored dashboard gets one created from the default layout on first read.
 */

import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import {
  MonitoringDashboardDTO,
  MonitoringWidgetDTO,
  MonitoringFiltersDTO,
} from '@/dtos/entities/MonitoringDTOs';

interface DashboardRow {
  id: string;
  user_id: string;
  widgets: unknown;
  filters: unknown;
  refresh_interval: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

const TABLE = 'monitoring_dashboards';
const DEFAULT_REFRESH_SECONDS = 300;

async function client() {
  const { supabase } = await import('@/integrations/supabase/client');
  // Table is added by migration; typed client may not know it yet.
  return supabase as unknown as { from: (t: string) => any };
}

export class SupabaseMonitoringAdapter implements IMonitoringRepository {
  async findDashboardByUserId(userId: string): Promise<MonitoringDashboardDTO | null> {
    const db = await client();
    const { data, error } = await db.from(TABLE).select('*').eq('user_id', userId)
      .order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (error) throw new Error(`Failed to find monitoring dashboard: ${error.message}`);
    if (data) return this.toDTO(data as DashboardRow);
    return this.insert({
      userId,
      widgets: this.getDefaultWidgets(),
      filters: this.getDefaultFilters(),
      refreshInterval: DEFAULT_REFRESH_SECONDS,
    });
  }

  async findDashboardById(id: string): Promise<MonitoringDashboardDTO | null> {
    const db = await client();
    const { data, error } = await db.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to find dashboard by ID: ${error.message}`);
    return data ? this.toDTO(data as DashboardRow) : null;
  }

  async saveDashboard(dashboard: MonitoringDashboardDTO): Promise<MonitoringDashboardDTO> {
    if (dashboard.id) {
      const existing = await this.findDashboardById(dashboard.id);
      if (existing) return this.updateDashboard(dashboard.id, dashboard);
    }
    return this.insert(dashboard);
  }

  async updateDashboard(id: string, updates: Partial<MonitoringDashboardDTO>): Promise<MonitoringDashboardDTO> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), last_updated: new Date().toISOString() };
    if (updates.widgets !== undefined) patch.widgets = updates.widgets;
    if (updates.filters !== undefined) patch.filters = updates.filters;
    if (updates.refreshInterval !== undefined) patch.refresh_interval = updates.refreshInterval;
    const db = await client();
    const { data, error } = await db.from(TABLE).update(patch).eq('id', id).select('*').single();
    if (error) throw new Error(`Failed to update dashboard: ${error.message}`);
    return this.toDTO(data as DashboardRow);
  }

  async deleteDashboard(id: string): Promise<boolean> {
    const db = await client();
    const { data, error } = await db.from(TABLE).delete().eq('id', id).select('id');
    if (error) throw new Error(`Failed to delete dashboard: ${error.message}`);
    return Array.isArray(data) && data.length > 0;
  }

  async findDashboardsByUserId(userId: string): Promise<MonitoringDashboardDTO[]> {
    const db = await client();
    const { data, error } = await db.from(TABLE).select('*').eq('user_id', userId).order('created_at');
    if (error) throw new Error(`Failed to find dashboards: ${error.message}`);
    return (data ?? []).map((r: DashboardRow) => this.toDTO(r));
  }

  async addWidgetToDashboard(dashboardId: string, widget: MonitoringWidgetDTO): Promise<MonitoringDashboardDTO> {
    const dashboard = await this.findDashboardById(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');
    const widgets = [...dashboard.widgets.filter(w => w.id !== widget.id), widget];
    return this.updateDashboard(dashboardId, { widgets });
  }

  async removeWidgetFromDashboard(dashboardId: string, widgetId: string): Promise<MonitoringDashboardDTO> {
    const dashboard = await this.findDashboardById(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');
    return this.updateDashboard(dashboardId, { widgets: dashboard.widgets.filter(w => w.id !== widgetId) });
  }

  async findWidgetsByDashboardId(dashboardId: string): Promise<MonitoringWidgetDTO[]> {
    const dashboard = await this.findDashboardById(dashboardId);
    return dashboard ? dashboard.widgets : [];
  }

  // =================== PRIVATE ===================

  private async insert(d: Pick<MonitoringDashboardDTO, 'userId' | 'widgets' | 'filters' | 'refreshInterval'>): Promise<MonitoringDashboardDTO> {
    const db = await client();
    const { data, error } = await db.from(TABLE).insert({
      user_id: d.userId,
      widgets: d.widgets,
      filters: d.filters,
      refresh_interval: d.refreshInterval || DEFAULT_REFRESH_SECONDS,
    }).select('*').single();
    if (error) throw new Error(`Failed to save dashboard: ${error.message}`);
    return this.toDTO(data as DashboardRow);
  }

  private toDTO(row: DashboardRow): MonitoringDashboardDTO {
    const filters = (row.filters && typeof row.filters === 'object' && 'dateRange' in (row.filters as object))
      ? row.filters as MonitoringFiltersDTO
      : this.getDefaultFilters();
    return {
      id: row.id,
      userId: row.user_id,
      widgets: Array.isArray(row.widgets) ? row.widgets as MonitoringWidgetDTO[] : [],
      filters,
      refreshInterval: row.refresh_interval,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as MonitoringDashboardDTO;
  }

  /** Default layout: widget data is empty and filled by MonitoringService from real sources. */
  private getDefaultWidgets(): MonitoringWidgetDTO[] {
    const now = new Date().toISOString();
    return [
      { id: crypto.randomUUID(), type: 'metric', title: 'total_projects', position: { x: 0, y: 0, width: 3, height: 2 }, config: { metric: 'total_projects' }, data: null, lastRefresh: now },
      { id: crypto.randomUUID(), type: 'chart', title: 'project_status', position: { x: 3, y: 0, width: 6, height: 4 }, config: { chartType: 'pie', metric: 'project_status' }, data: null, lastRefresh: now },
    ];
  }

  private getDefaultFilters(): MonitoringFiltersDTO {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      dateRange: { start: start.toISOString(), end: now.toISOString() },
      projects: [],
      status: [],
      departments: [],
      severity: ['low', 'medium', 'high', 'critical'],
    };
  }
}
