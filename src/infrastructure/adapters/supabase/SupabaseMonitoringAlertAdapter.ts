/**
 * Supabase Monitoring Alert Adapter
 * Uses project_alerts table from public schema for BTP project alerts
 * Following hexagonal architecture: Adapter → Repository Interface
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

// Database row interface matching project_alerts table
export interface MonitoringAlertDbRow {
  id: string;
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  source: string | null;
  acknowledged: boolean | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean | null;
  resolved_by: string | null;
  resolved_at: string | null;
  escalation_level: number | null;
  assigned_actions: string[] | null;
  action_proofs: any | null;
  metadata: any | null;
  created_at: string;
  updated_at: string;
}

// DTO for monitoring alerts (camelCase for application layer)
export interface MonitoringAlertDTO {
  id: string;
  alertType: string;
  priority: string;
  title: string;
  description: string | null;
  stationId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  assignedTo: string | null;
}

export interface CreateMonitoringAlertDTO {
  title: string;
  alertType?: string;
  priority?: string;
  description?: string;
  stationId?: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMonitoringAlertDTO {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface IMonitoringAlertRepository {
  findAll(): Promise<MonitoringAlertDTO[]>;
  findById(id: string): Promise<MonitoringAlertDTO | null>;
  create(data: CreateMonitoringAlertDTO): Promise<MonitoringAlertDTO>;
  update(id: string, data: UpdateMonitoringAlertDTO): Promise<void>;
  delete(id: string): Promise<void>;
  acknowledge(id: string): Promise<void>;
  resolve(id: string, resolutionNotes?: string): Promise<void>;
}

export class SupabaseMonitoringAlertAdapter implements IMonitoringAlertRepository {

  private mapToDTO(row: MonitoringAlertDbRow): MonitoringAlertDTO {
    // Derive status from acknowledged/resolved flags
    let status = 'active';
    if (row.resolved) status = 'resolved';
    else if (row.acknowledged) status = 'acknowledged';

    return {
      id: row.id,
      alertType: row.type,
      priority: row.severity,
      title: row.title,
      description: row.description,
      stationId: row.project_id,
      status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionNotes: null,
      metadata: row.metadata as Record<string, unknown> | null,
      assignedTo: row.acknowledged_by
    };
  }

  async findAll(): Promise<MonitoringAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project alerts:', error);
      // Return empty array instead of throwing to keep dashboard functional
      return [];
    }

    return (data || []).map(row => this.mapToDTO(row as unknown as MonitoringAlertDbRow));
  }

  async findById(id: string): Promise<MonitoringAlertDTO | null> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch project alert: ${error.message}`);
    }

    return data ? this.mapToDTO(data as unknown as MonitoringAlertDbRow) : null;
  }

  async create(alertData: CreateMonitoringAlertDTO): Promise<MonitoringAlertDTO> {
    const { data, error } = await supabase
      .from('project_alerts')
      .insert({
        title: alertData.title,
        type: alertData.alertType || 'general',
        severity: alertData.priority || 'medium',
        description: alertData.description || null,
        project_id: alertData.stationId || '00000000-0000-0000-0000-000000000000',
        metadata: alertData.metadata || null,
        message: alertData.description || alertData.title,
        source: 'monitoring',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project alert: ${error.message}`);
    }

    return this.mapToDTO(data as unknown as MonitoringAlertDbRow);
  }

  async update(id: string, updateData: UpdateMonitoringAlertDTO): Promise<void> {
    const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updateData.title !== undefined) dbUpdate.title = updateData.title;
    if (updateData.description !== undefined) dbUpdate.description = updateData.description;
    if (updateData.priority !== undefined) dbUpdate.severity = updateData.priority;

    const { error } = await supabase
      .from('project_alerts')
      .update(dbUpdate)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update project alert: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project alert: ${error.message}`);
    }
  }

  async acknowledge(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to acknowledge project alert: ${error.message}`);
    }
  }

  async resolve(id: string, resolutionNotes?: string): Promise<void> {
    const { error } = await supabase
      .from('project_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to resolve project alert: ${error.message}`);
    }
  }
}
