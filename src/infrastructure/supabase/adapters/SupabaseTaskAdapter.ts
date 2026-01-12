// Supabase Adapter for Task Repository
import { supabase } from '@/integrations/supabase/client';
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';

export class SupabaseTaskAdapter implements ITaskRepository {
  private mapToEntity(data: any): Task {
    return new Task(
      data.id,
      data.project_id,
      data.phase_id || null,
      data.step_id || null,
      data.title,
      data.description || null,
      (data.status || 'not_started') as TaskStatus,
      (data.priority || 'medium') as TaskPriority,
      data.progress || 0,
      data.assigned_to ? [data.assigned_to] : [],
      data.assigned_by || null,
      data.start_date || null,
      data.end_date || null,
      data.due_date || null,
      data.completion_date || null,
      data.estimated_duration || null,
      data.actual_duration || null,
      data.dependencies || [],
      data.notes || null,
      data.created_at,
      data.updated_at
    );
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(task: Task): Promise<void> {
    const { error } = await supabase
      .from('task_assignments')
      .insert({
        id: task.id,
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assignedTo[0] || null,
        assigned_by: task.assignedBy,
        due_date: task.dueDate,
        notes: task.notes
      });

    if (error) throw new Error(`Failed to save task: ${error.message}`);
  }

  async update(id: string, data: Partial<Task>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabase
      .from('task_assignments')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update task: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete task: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPhaseId(phaseId: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(t => t.phaseId === phaseId);
  }

  async findByStepId(stepId: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(t => t.stepId === stepId);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByAssignee(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findDueBetween(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findOverdue(): Promise<Task[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .lt('due_date', now)
      .neq('status', 'completed')
      .order('due_date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findDueToday(): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    
    return this.findDueBetween(startOfDay, endOfDay);
  }

  async countByStatus(projectId: string): Promise<Record<TaskStatus, number>> {
    const tasks = await this.findByProjectId(projectId);
    const counts: Record<string, number> = {};
    
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    return counts as Record<TaskStatus, number>;
  }

  async getCompletionRate(projectId: string): Promise<number> {
    const tasks = await this.findByProjectId(projectId);
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }
}
