// @ts-nocheck
/**
 * Supabase Implementation of Alert Repository
 * Handles data access for project alerts using Supabase
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import type { 
  IAlertRepository, 
  ProjectAlertDTO, 
  CreateProjectAlertRequestDto, 
  UpdateProjectAlertRequestDto,
  AlertStatistics 
} from '@/domain/repositories/IAlertRepository';

export class SupabaseAlertRepository implements IAlertRepository {
  private supabase: any;

  constructor() {
    // Dynamic import to avoid circular dependencies
    import('@/integrations/supabase/client').then(({ supabase: client }) => {
      this.supabase = client;
    });
  }

  private async getSupabase() {
    if (!this.supabase) {
      const { supabase } = await import('@/integrations/supabase/client');
      this.supabase = supabase;
    }
    return this.supabase;
  }

  async findById(id: string): Promise<ProjectAlertDTO | null> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch alert: ${error.message}`);
      }

      return this.mapToDTO(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert');
    }
  }

  async findByProjectId(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch project alerts: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project alerts');
    }
  }

  async findAll(): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch alerts: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts');
    }
  }

  async create(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .insert({
          project_id: alertData.project_id,
          type: alertData.type,
          severity: alertData.severity,
          title: alertData.title,
          description: alertData.description,
          acknowledged: false,
          resolved: false
        })
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create alert: ${error.message}`);
      }

      return this.mapToDTO(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create alert');
    }
  }

  async update(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
        }
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update alert: ${error.message}`);
      }

      return this.mapToDTO(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update alert');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('project_alerts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete alert: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete alert');
    }
  }

  async findActive(): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch active alerts: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch active alerts');
    }
  }

  async findByType(type: string): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch alerts by type: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by type');
    }
  }

  async findBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('severity', severity)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch alerts by severity: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by severity');
    }
  }

  async acknowledge(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
        }
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to acknowledge alert: ${error.message}`);
      }

      return this.mapToDTO(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to acknowledge alert');
    }
  }

  async resolve(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
        }
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to resolve alert: ${error.message}`);
      }

      return this.mapToDTO(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve alert');
    }
  }

  async getStatistics(projectId?: string): Promise<AlertStatistics> {
    try {
      const supabase = await this.getSupabase();
      
      let query = supabase.from('project_alerts').select('*');
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch alert statistics: ${error.message}`);
      }

      const alerts = data || [];
      
      const stats: AlertStatistics = {
        total: alerts.length,
        active: alerts.filter(a => !a.resolved).length,
        resolved: alerts.filter(a => a.resolved).length,
        acknowledged: alerts.filter(a => a.acknowledged).length,
        byType: {},
        bySeverity: {}
      };

      // Calculate by type
      alerts.forEach(alert => {
        stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert statistics');
    }
  }

  async acknowledgeBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
          updated_at: new Date().toISOString()
        })
        .in('id', alertIds)
        .select();

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to acknowledge alerts batch: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to acknowledge alerts batch');
    }
  }

  async resolveBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('project_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          updated_at: new Date().toISOString()
        })
        .in('id', alertIds)
        .select();

      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to resolve alerts batch: ${error.message}`);
      }

      return (data || []).map(item => this.mapToDTO(item));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve alerts batch');
    }
  }

  private mapToDTO(data: Record<string, unknown>): ProjectAlertDTO {
    return {
      id: data.id as string,
      project_id: data.project_id as string,
      type: data.type as string,
      severity: data.severity as string,
      title: data.title as string,
      description: data.description as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string | undefined,
      acknowledged: data.acknowledged as boolean | undefined,
      acknowledged_at: data.acknowledged_at as string | undefined,
      acknowledged_by: data.acknowledged_by as string | undefined,
      resolved: data.resolved as boolean | undefined,
      resolved_at: data.resolved_at as string | undefined,
      resolved_by: data.resolved_by as string | undefined
    };
  }
}
