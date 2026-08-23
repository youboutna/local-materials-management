/**
 * Supabase Monitoring Alert Adapter
 * Uses project_alerts table from public schema for BTP project alerts
 * Following hexagonal architecture: Adapter → Repository Interface
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { Json } from '@/integrations/supabase/types';
import { canonicalAlertType } from '@/config/referentials/notifications/alerts.referential';

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
  action_proofs: unknown | null;
  metadata: Record<string, unknown> | null;
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
  /** Contexte projet (obligatoire en base). */
  projectId: string;
  /** Contexte phase, porté par metadata.phase_id. */
  phaseId: string | null;
  /** @deprecated alias historique de projectId */
  stationId: string | null;
  status: string;
  escalationLevel: number;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  assignedTo: string | null;
  assignedActions: string[];
}

export interface CreateMonitoringAlertDTO {
  title: string;
  alertType?: string;
  priority?: string;
  description?: string;
  projectId?: string;
  phaseId?: string | null;
  /** @deprecated alias historique de projectId */
  stationId?: string;
  assignedTo?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMonitoringAlertDTO {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  phaseId?: string | null;
  assignedTo?: string;
  escalationLevel?: number;
  resolutionNotes?: string;
}

export interface IMonitoringAlertRepository {
  findAll(): Promise<MonitoringAlertDTO[]>;
  findById(id: string): Promise<MonitoringAlertDTO | null>;
  findByProjectId(projectId: string): Promise<MonitoringAlertDTO[]>;
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

    const metadata = (row.metadata ?? null) as Record<string, unknown> | null;
    const phaseId =
      (metadata?.phase_id as string | undefined) ??
      (metadata?.phaseId as string | undefined) ??
      null;

    return {
      id: row.id,
      alertType: canonicalAlertType(row.type),
      priority: row.severity,
      title: row.title,
      description: row.description,
      projectId: row.project_id,
      phaseId,
      stationId: row.project_id,
      status,
      escalationLevel: row.escalation_level ?? 0,
      acknowledged: Boolean(row.acknowledged),
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionNotes: (metadata?.resolution_notes as string | undefined) ?? null,
      metadata,
      assignedTo: row.acknowledged_by,
      assignedActions: row.assigned_actions ?? [],
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

  async findByProjectId(projectId: string): Promise<MonitoringAlertDTO[]> {
    if (!projectId) return [];

    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project alerts by project:', error);
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
    const projectId = alertData.projectId || alertData.stationId;
    if (!projectId) {
      throw new Error('project_id is required to create a project alert');
    }

    const metadata: Record<string, unknown> = { ...(alertData.metadata ?? {}) };
    if (alertData.phaseId) metadata.phase_id = alertData.phaseId;
    if (alertData.assignedTo) metadata.assigned_to = alertData.assignedTo;

    const { data, error } = await supabase
      .from('project_alerts')
      .insert({
        title: alertData.title,
        type: canonicalAlertType(alertData.alertType || 'other'),
        severity: alertData.priority || 'medium',
        description: alertData.description || null,
        project_id: projectId,
        source: alertData.source || 'monitoring',
        metadata: (Object.keys(metadata).length ? metadata : null) as unknown as Json,
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
    if (updateData.escalationLevel !== undefined) dbUpdate.escalation_level = updateData.escalationLevel;

    if (updateData.status === 'acknowledged') {
      dbUpdate.acknowledged = true;
      dbUpdate.acknowledged_at = new Date().toISOString();
    }
    if (updateData.status === 'resolved') {
      dbUpdate.resolved = true;
      dbUpdate.resolved_at = new Date().toISOString();
    }

    // phaseId / resolutionNotes vivent dans metadata : merge non destructif
    if (updateData.phaseId !== undefined || updateData.resolutionNotes !== undefined) {
      const { data: current } = await supabase
        .from('project_alerts')
        .select('metadata')
        .eq('id', id)
        .maybeSingle();

      const metadata: Record<string, unknown> = {
        ...(((current as { metadata?: Record<string, unknown> } | null)?.metadata) ?? {}),
      };
      if (updateData.phaseId !== undefined) metadata.phase_id = updateData.phaseId;
      if (updateData.resolutionNotes !== undefined) metadata.resolution_notes = updateData.resolutionNotes;
      dbUpdate.metadata = metadata as unknown as Json;
    }

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
    if (resolutionNotes !== undefined) {
      await this.update(id, { resolutionNotes });
    }

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
