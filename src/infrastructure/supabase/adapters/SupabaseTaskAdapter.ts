// @ts-nocheck
// Supabase Adapter for Task Repository
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';

export class SupabaseTaskAdapter implements ITaskRepository {
  /** Legacy persistence enum → canonical domain enum. */
  private toDomainStatus(status?: string): TaskStatus {
    if (status === 'pending' || status === 'assigned') return 'not_started' as TaskStatus;
    return (status || 'not_started') as TaskStatus;
  }

  /** Canonical domain enum → enum currently enforced by task_assignments. */
  private toPersistenceStatus(status?: TaskStatus): string {
    if (!status || status === ('not_started' as TaskStatus)) return 'pending';
    if (status === ('delayed' as TaskStatus) || status === ('blocked' as TaskStatus)) return 'pending';
    return status;
  }

  private mapToEntity(data: any): Task {
    const assigneeId = data.assignee_id ?? data.assigned_to;
    return Task.create({
      id: data.id,
      projectId: data.project_id,
      phaseId: data.phase_id || undefined,
      stepId: data.step_id || undefined,
      title: data.title,
      description: data.description || undefined,
      status: this.toDomainStatus(data.status),
      priority: (data.priority || 'medium') as TaskPriority,
      progress: data.progress || 0,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      dueDate: data.due_date || undefined,
      estimatedDuration: data.estimated_duration || undefined,
      notes: data.notes || undefined,
      assignedTo: assigneeId ? [assigneeId] : [],
      assignedById: data.assigned_by || undefined
    });
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

  /**
   * Écrit en élaguant les colonnes absentes du cache de schéma (PGRST204).
   * Garantit la persistance même si l'environnement cible n'a pas encore reçu
   * toutes les migrations (ex. `assigned_to`, `step_id`, `progress`).
   */
  private async writeWithSchemaFallback(
    payload: Record<string, unknown>,
    run: (data: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>,
  ): Promise<void> {
    const data = { ...payload };
    const dropped: string[] = [];

    for (let attempt = 0; attempt <= 10; attempt += 1) {
      const { error } = await run(data);
      if (!error) {
        if (dropped.length > 0) {
          console.warn('[SupabaseTaskAdapter] colonnes absentes ignorées:', dropped);
        }
        return;
      }
      const missing = error.code === 'PGRST204'
        ? /'([^']+)' column/.exec(error.message ?? '')?.[1]
        : undefined;
      if (!missing || !(missing in data)) {
        throw new Error(`Failed to save task: ${error.message}`);
      }
      delete data[missing];
      dropped.push(missing);
    }
    throw new Error('SupabaseTaskAdapter: schéma incompatible après plusieurs tentatives');
  }

  async save(task: Task): Promise<void> {
    const assigneeId = task.assignedTo[0] || null;
    await this.writeWithSchemaFallback(
      {
        id: task.id,
        project_id: task.projectId || null,
        phase_id: task.phaseId || null,
        step_id: task.stepId || null,
        title: task.title,
        description: task.description,
        status: this.toPersistenceStatus(task.status),
        priority: task.priority,
        // Canonical assignment plus the transitional legacy mirror.
        assignee_id: assigneeId,
        assigned_to: assigneeId,
        assigned_by: task.assignedBy || null,
        due_date: task.dueDate || null,
        start_date: task.startDate || null,
        end_date: task.endDate || null,
        progress: task.progress ?? 0,
        notes: task.notes || null,
      },
      (data) => supabase.from('task_assignments').insert(data),
    );
  }

  async update(id: string, data: Partial<Task> & Record<string, any>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = this.toPersistenceStatus(data.status);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.phaseId !== undefined) updateData.phase_id = data.phaseId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if ((data as any).assignedTo !== undefined) {
      const list = (data as any).assignedTo as string[] | undefined;
      const assigneeId = list && list.length ? list[0] : null;
      updateData.assignee_id = assigneeId;
      updateData.assigned_to = assigneeId;
    }

    await this.writeWithSchemaFallback(updateData, (payload) =>
      supabase.from('task_assignments').update(payload).eq('id', id),
    );
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
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('phase_id', phaseId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
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
    let { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false });

    if (error?.code === 'PGRST204') {
      const fallback = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

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
