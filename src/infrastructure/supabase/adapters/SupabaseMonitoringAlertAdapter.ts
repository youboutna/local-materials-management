// @ts-nocheck
/**
 * Supabase Monitoring Alert Adapter
 * Handles data access for monitoring_alerts table
 * Following hexagonal architecture: Adapter → Repository Interface
 */

import { fuelStationsClient as supabase } from '@/integrations/supabase/schema-clients';
import { Json } from '@/integrations/supabase/types';

// Database row interface matching monitoring_alerts table
export interface MonitoringAlertDbRow {
  id: string;
  alert_type: string;
  priority: string;
  title: string;
  description: string | null;
  station_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  metadata: Json | null;
  assigned_to: string | null;
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
    return {
      id: row.id,
      alertType: row.alert_type,
      priority: row.priority,
      title: row.title,
      description: row.description,
      stationId: row.station_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      metadata: row.metadata as Record<string, unknown> | null,
      assignedTo: row.assigned_to
    };
  }

  async findAll(): Promise<MonitoringAlertDTO[]> {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monitoring alerts:', error);
      throw new Error(`Failed to fetch monitoring alerts: ${error.message}`);
    }

    return (data || []).map(row => this.mapToDTO(row as MonitoringAlertDbRow));
  }

  async findById(id: string): Promise<MonitoringAlertDTO | null> {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch monitoring alert: ${error.message}`);
    }

    return data ? this.mapToDTO(data as MonitoringAlertDbRow) : null;
  }

  async create(alertData: CreateMonitoringAlertDTO): Promise<MonitoringAlertDTO> {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .insert({
        title: alertData.title,
        alert_type: alertData.alertType || 'general',
        priority: alertData.priority || 'medium',
        description: alertData.description || null,
        station_id: alertData.stationId || null,
        assigned_to: alertData.assignedTo || null,
        metadata: alertData.metadata || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create monitoring alert: ${error.message}`);
    }

    return this.mapToDTO(data as MonitoringAlertDbRow);
  }

  async update(id: string, updateData: UpdateMonitoringAlertDTO): Promise<void> {
    const dbUpdate: Partial<MonitoringAlertDbRow> = {};
    
    if (updateData.title !== undefined) dbUpdate.title = updateData.title;
    if (updateData.description !== undefined) dbUpdate.description = updateData.description;
    if (updateData.priority !== undefined) dbUpdate.priority = updateData.priority;
    if (updateData.status !== undefined) dbUpdate.status = updateData.status;
    if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo;
    if (updateData.resolutionNotes !== undefined) dbUpdate.resolution_notes = updateData.resolutionNotes;
    
    dbUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('monitoring_alerts')
      .update(dbUpdate)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update monitoring alert: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('monitoring_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete monitoring alert: ${error.message}`);
    }
  }

  async acknowledge(id: string): Promise<void> {
    const { error } = await supabase
      .from('monitoring_alerts')
      .update({
        status: 'acknowledged',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to acknowledge monitoring alert: ${error.message}`);
    }
  }

  async resolve(id: string, resolutionNotes?: string): Promise<void> {
    const { error } = await supabase
      .from('monitoring_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to resolve monitoring alert: ${error.message}`);
    }
  }
}
