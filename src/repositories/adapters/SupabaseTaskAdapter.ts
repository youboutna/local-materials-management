/**
 * Supabase Adapter for Task Repository
 * Implements ITaskRepository using Supabase as data source
 * Uses enhanced_project_milestones table for task management
 */

import { supabase } from '@/integrations/supabase/client';
import { TaskDTO, CreateTaskDTO, UpdateTaskDTO } from '@/types/task-dto';
import { ITaskRepository } from '../interfaces/ITaskRepository';

export class SupabaseTaskAdapter implements ITaskRepository {
  private readonly TABLE_NAME = 'enhanced_project_milestones';

  // ============= IRepository Implementation =============

  async findById(id: string): Promise<TaskDTO | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToDTO(data) : null;
  }

  async findAll(filters?: Record<string, any>): Promise<TaskDTO[]> {
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

  async create(data: CreateTaskDTO): Promise<TaskDTO> {
    const insertData = this.mapFromCreateDTO(data);
    
    const { data: result, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDTO(result);
  }

  async update(id: string, data: UpdateTaskDTO): Promise<TaskDTO> {
    const updateData = this.mapFromUpdateDTO(data);
    
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

  // ============= ITaskRepository Specific =============

  async findByProjectId(projectId: string): Promise<TaskDTO[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findByStatus(status: string): Promise<TaskDTO[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('status', status)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findByAssignee(assigneeId: string): Promise<TaskDTO[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('assigned_to', assigneeId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findOverdue(): Promise<TaskDTO[]> {
    const today = new Date();
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .lt('target_date', today.toISOString())
      .neq('status', 'completed')
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  async findUpcoming(days: number): Promise<TaskDTO[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .gte('target_date', today.toISOString())
      .lte('target_date', futureDate.toISOString())
      .neq('status', 'completed')
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDTO);
  }

  // ============= Private Mappers =============

  private mapToDTO(data: any): TaskDTO {
    const deps = data.dependencies as any;
    return {
      id: data.id,
      project_id: data.project_id,
      phase_id: data.phase_id || undefined,
      title: data.title,
      description: data.description || undefined,
      target_date: data.target_date,
      completed_date: data.completed_date || undefined,
      status: data.status || 'pending',
      priority: deps?.priority || 'normal',
      assigned_to: data.assigned_to || undefined,
      weight: data.weight || 0.1,
      notes: data.notes || undefined,
      dependencies: deps?.predecessor_ids || [],
      type: deps?.type || 'task',
      deliverables: deps?.deliverables || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private mapFromCreateDTO(data: CreateTaskDTO): any {
    return {
      project_id: data.project_id,
      phase_id: data.phase_id || null,
      title: data.title,
      description: data.description || null,
      target_date: data.target_date,
      weight: data.weight || 0.1,
      notes: data.notes || null,
      status: 'pending',
      assigned_to: data.assigned_to || null,
      dependencies: {
        priority: data.priority || 'normal',
        predecessor_ids: data.dependencies || [],
        type: data.type || 'task',
        deliverables: data.deliverables || []
      }
    };
  }

  private mapFromUpdateDTO(data: UpdateTaskDTO): any {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target_date !== undefined) updateData.target_date = data.target_date;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
    if (data.completed_date !== undefined) updateData.completed_date = data.completed_date;

    // Update dependencies if provided
    if (data.priority || data.dependencies || data.type || data.deliverables) {
      updateData.dependencies = {
        priority: data.priority || 'normal',
        predecessor_ids: data.dependencies || [],
        type: data.type || 'task',
        deliverables: data.deliverables || []
      };
    }

    return updateData;
  }
}
