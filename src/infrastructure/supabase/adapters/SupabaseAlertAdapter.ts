/**
 * Supabase Alert Repository
 * Implements IAlertRepository using project_alerts table (public schema)
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import {
  IAlertRepository,
  ProjectAlertDTO,
  CreateProjectAlertRequestDto,
  UpdateProjectAlertRequestDto,
  AlertStatistics
} from '@/domain/repositories/IAlertRepository';

export class SupabaseAlertAdapter implements IAlertRepository {

  private mapRow(row: any): ProjectAlertDTO {
    return {
      id: row.id,
      project_id: row.project_id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      acknowledged: row.acknowledged,
      acknowledged_at: row.acknowledged_at,
      acknowledged_by: row.acknowledged_by,
      resolved: row.resolved,
      resolved_at: row.resolved_at,
      resolved_by: row.resolved_by,
    };
  }

  async findAll(): Promise<ProjectAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project alerts:', error);
      return [];
    }
    return (data || []).map(row => this.mapRow(row));
  }

  async findById(id: string): Promise<ProjectAlertDTO | null> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? this.mapRow(data) : null;
  }

  async findByProjectId(projectId: string): Promise<ProjectAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(row => this.mapRow(row));
  }

  async create(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    const { data, error } = await supabase
      .from('project_alerts')
      .insert({
        project_id: alertData.project_id,
        type: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create alert: ${error.message}`);
    return this.mapRow(data);
  }

  async update(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updateData.title !== undefined) dbUpdate.title = updateData.title;
    if (updateData.description !== undefined) dbUpdate.description = updateData.description;
    if (updateData.severity !== undefined) dbUpdate.severity = updateData.severity;
    if (updateData.type !== undefined) dbUpdate.type = updateData.type;
    if (updateData.acknowledged !== undefined) dbUpdate.acknowledged = updateData.acknowledged;
    if (updateData.resolved !== undefined) dbUpdate.resolved = updateData.resolved;

    const { data, error } = await supabase
      .from('project_alerts')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update alert: ${error.message}`);
    return this.mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_alerts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete alert: ${error.message}`);
  }

  async findActive(): Promise<ProjectAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .or('acknowledged.is.null,acknowledged.eq.false')
      .or('resolved.is.null,resolved.eq.false')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(row => this.mapRow(row));
  }

  async findByType(type: string): Promise<ProjectAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(row => this.mapRow(row));
  }

  async findBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    const { data, error } = await supabase
      .from('project_alerts')
      .select('*')
      .eq('severity', severity)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(row => this.mapRow(row));
  }

  async acknowledge(id: string, userId: string): Promise<ProjectAlertDTO> {
    const { data, error } = await supabase
      .from('project_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to acknowledge alert: ${error.message}`);
    return this.mapRow(data);
  }

  async resolve(id: string, userId: string): Promise<ProjectAlertDTO> {
    const { data, error } = await supabase
      .from('project_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to resolve alert: ${error.message}`);
    return this.mapRow(data);
  }

  async getStatistics(projectId?: string): Promise<AlertStatistics> {
    let query = supabase.from('project_alerts').select('*');
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;
    const alerts = error ? [] : (data || []);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    alerts.forEach((a: any) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    });

    return {
      total: alerts.length,
      active: alerts.filter((a: any) => !a.resolved && !a.acknowledged).length,
      resolved: alerts.filter((a: any) => a.resolved).length,
      acknowledged: alerts.filter((a: any) => a.acknowledged).length,
      byType,
      bySeverity,
    };
  }

  async acknowledgeBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    const results: ProjectAlertDTO[] = [];
    for (const id of alertIds) {
      results.push(await this.acknowledge(id, userId));
    }
    return results;
  }

  async resolveBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    const results: ProjectAlertDTO[] = [];
    for (const id of alertIds) {
      results.push(await this.resolve(id, userId));
    }
    return results;
  }
}
