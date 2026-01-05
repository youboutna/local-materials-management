/**
 * Supabase Adapter for Milestone Repository
 * Implements IMilestoneRepository using Supabase as data source
 * 
 * This adapter can be replaced by:
 * - JavaApiMilestoneAdapter (for Spring Boot backend)
 * - PrismaMilestoneAdapter (for Node.js/Prisma backend)
 * - PostGISMilestoneAdapter (for spatial queries)
 */

import { supabase } from '@/integrations/supabase/client';
import { MilestoneDTO, MilestoneFormDTO } from '@/types/milestone-dto';
import { IMilestoneRepository } from '../interfaces/IMilestoneRepository';
import { addDays, format, parseISO, isBefore, differenceInDays } from 'date-fns';

export class SupabaseMilestoneAdapter implements IMilestoneRepository {
  private readonly TABLE_NAME = 'enhanced_project_milestones';

  // ============= IRepository Implementation =============

  async findById(id: string): Promise<MilestoneDTO | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToDTO(data) : null;
  }

  async findAll(filters?: Record<string, any>): Promise<MilestoneDTO[]> {
    let query = supabase.from(this.TABLE_NAME).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query.order('target_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async create(data: MilestoneFormDTO): Promise<MilestoneDTO> {
    const insertData = this.mapFromFormDTO(data);
    
    const { data: result, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDTO(result);
  }

  async update(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO> {
    // Get current dependencies to merge
    const { data: current } = await supabase
      .from(this.TABLE_NAME)
      .select('dependencies')
      .eq('id', id)
      .single();

    const currentDeps = (current?.dependencies as any) || {};
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target_date !== undefined) updateData.target_date = data.target_date;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if ((data as any).status !== undefined) updateData.status = (data as any).status;
    if ((data as any).completed_date !== undefined) updateData.completed_date = (data as any).completed_date;

    // Merge dependencies metadata
    if (data.type || data.priority || data.deliverables || data.dependencies) {
      updateData.dependencies = {
        ...currentDeps,
        ...(data.type && { type: data.type }),
        ...(data.priority && { priority: data.priority }),
        ...(data.deliverables && { deliverables: data.deliverables }),
        ...(data.dependencies && { predecessor_ids: data.dependencies })
      };
    }

    const { data: result, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDTO(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= IMilestoneRepository Specific =============

  async findByProjectId(projectId: string): Promise<MilestoneDTO[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findByPhaseId(projectId: string, phaseId: string): Promise<MilestoneDTO[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_id', phaseId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findCriticalPath(projectId: string): Promise<MilestoneDTO[]> {
    const milestones = await this.findByProjectId(projectId);
    return milestones.filter(m => m.is_on_critical_path || m.priority === 'critical');
  }

  async findOverdue(projectId: string): Promise<MilestoneDTO[]> {
    const today = new Date();
    const milestones = await this.findByProjectId(projectId);
    
    return milestones.filter(m => 
      m.status !== 'completed' && 
      m.target_date && 
      isBefore(parseISO(m.target_date), today)
    );
  }

  async findUpcoming(projectId: string, days: number): Promise<MilestoneDTO[]> {
    const today = new Date();
    const futureDate = addDays(today, days);
    const milestones = await this.findByProjectId(projectId);

    return milestones.filter(m => {
      if (m.status === 'completed') return false;
      const targetDate = parseISO(m.target_date);
      return !isBefore(targetDate, today) && isBefore(targetDate, futureDate);
    });
  }

  async createBulk(projectId: string, milestones: MilestoneFormDTO[]): Promise<MilestoneDTO[]> {
    const insertData = milestones.map(m => ({
      ...this.mapFromFormDTO(m),
      project_id: projectId
    }));

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(insertData)
      .select();

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async deleteTemplateByPhaseId(phaseId: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from(this.TABLE_NAME)
      .select('id, dependencies')
      .eq('phase_id', phaseId);

    if (fetchError) throw fetchError;

    const templateIds = (data || [])
      .filter(m => m.dependencies && (m.dependencies as any).from_template)
      .map(m => m.id);

    if (templateIds.length === 0) return;

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .in('id', templateIds);

    if (error) throw error;
  }

  async updateStatus(id: string, status: string, completedDate?: string): Promise<MilestoneDTO> {
    const updateData: any = { status };
    if (completedDate !== undefined) {
      updateData.completed_date = completedDate;
    }

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDTO(data);
  }

  // ============= Private Mappers =============

  private mapToDTO(data: any): MilestoneDTO {
    const deps = data.dependencies as any;
    return {
      id: data.id,
      project_id: data.project_id,
      phase_id: data.phase_id || undefined,
      title: data.title,
      description: data.description || undefined,
      target_date: data.target_date,
      early_start_date: deps?.early_start_date,
      late_finish_date: deps?.late_finish_date,
      completed_date: data.completed_date || undefined,
      status: data.status || 'pending',
      type: deps?.type || 'checkpoint',
      priority: deps?.priority || 'normal',
      weight: data.weight || 0.1,
      notes: data.notes || undefined,
      is_from_template: deps?.from_template || false,
      template_id: deps?.template_id,
      dependencies: deps?.predecessor_ids,
      float_days: deps?.float_days,
      is_on_critical_path: deps?.is_critical || deps?.priority === 'critical',
      deliverables: deps?.deliverables,
      approval_status: deps?.approval_status,
      approved_by: deps?.approved_by,
      approval_date: deps?.approval_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private mapFromFormDTO(data: MilestoneFormDTO & { project_id?: string }): any {
    return {
      project_id: data.project_id,
      phase_id: data.phase_id || null,
      title: data.title,
      description: data.description || null,
      target_date: data.target_date,
      weight: data.weight,
      notes: data.notes || null,
      status: 'pending',
      dependencies: {
        type: data.type || 'checkpoint',
        priority: data.priority || 'normal',
        deliverables: data.deliverables || [],
        predecessor_ids: data.dependencies || [],
        from_template: false
      }
    };
  }
}
