/**
 * TaskAssignment Supabase Adapter — SOURCE UNIQUE
 * Table unique : task_assignments (schéma btp)
 */

import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'task_assignments';

export class TaskAssignmentAdapter implements ITaskAssignmentRepository {
  /** Élague les colonnes absentes du cache PostgREST puis rejoue l'écriture. */
  private async writeWithSchemaFallback(
    payload: Record<string, unknown>,
    run: (data: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>,
  ): Promise<Record<string, unknown>> {
    const current = { ...payload };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await run(current);
      if (!error) return data as Record<string, unknown>;
      const missing = /Could not find the '([^']+)' column/.exec(error.message)?.[1];
      const nullColumn = /column "([^"]+)"[^"]*violates not-null/.exec(error.message)?.[1];
      if (missing && missing in current) {
        delete current[missing];
        continue;
      }
      if (nullColumn && current[nullColumn] === null) {
        delete current[nullColumn];
        continue;
      }
      throw new Error(`Failed to save task: ${error.message}`);
    }
    throw new Error('Failed to save task: too many schema fallbacks');
  }

  private mapMany(rows: unknown): TaskAssignment[] {
    return ((rows as Record<string, unknown>[]) ?? []).map((row) => TaskAssignmentTransformer.fromRepository(row));
  }

  async save(task: TaskAssignment): Promise<TaskAssignment> {
    const payload = TaskAssignmentTransformer.toRepository(task);
    const data = await this.writeWithSchemaFallback(payload, async (row) =>
      supabase.from(TABLE).upsert(row, { onConflict: 'id' }).select().single(),
    );
    return TaskAssignmentTransformer.fromRepository(data);
  }

  async findById(id: string): Promise<TaskAssignment | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return TaskAssignmentTransformer.fromRepository(data);
  }

  async findAll(): Promise<TaskAssignment[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  private async findByColumn(column: string, value: string): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq(column, value)
      .order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  findByProjectId(projectId: string): Promise<TaskAssignment[]> {
    return this.findByColumn('project_id', projectId);
  }

  findByPhaseId(phaseId: string): Promise<TaskAssignment[]> {
    return this.findByColumn('phase_id', phaseId);
  }

  findByStepId(stepId: string): Promise<TaskAssignment[]> {
    return this.findByColumn('step_id', stepId);
  }

  findByStatus(status: string): Promise<TaskAssignment[]> {
    return this.findByColumn('status', status);
  }

  findByPriority(priority: string): Promise<TaskAssignment[]> {
    return this.findByColumn('priority', priority);
  }

  findByAssignedBy(assignerId: string): Promise<TaskAssignment[]> {
    return this.findByColumn('assigned_by', assignerId);
  }

  async findByAssignee(assigneeId: string): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .contains('assigned_to', [assigneeId])
      .order('created_at', { ascending: false });
    if (!error) return this.mapMany(data);
    // Fallback colonne héritée
    return this.findByColumn('assignee_id', assigneeId);
  }

  findByAssignedTo(assigneeId: string): Promise<TaskAssignment[]> {
    return this.findByAssignee(assigneeId);
  }

  async findOverdue(): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    if (error) return [];
    return this.mapMany(data);
  }

  async findDueSoon(days: number): Promise<TaskAssignment[]> {
    const now = new Date();
    const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.findDueBetween(now.toISOString(), limit.toISOString());
  }

  async findDueBetween(start: string, end: string): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date', { ascending: true });
    if (error) return [];
    return this.mapMany(data);
  }

  async findWithFilters(filters: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    projectId?: string;
    phaseId?: string;
  }): Promise<TaskAssignment[]> {
    let query = supabase.from(TABLE).select('*');
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.phaseId) query = query.eq('phase_id', filters.phaseId);
    if (filters.assignee) query = query.contains('assigned_to', [filters.assignee]);
    if (filters.searchTerm) query = query.ilike('title', `%${filters.searchTerm}%`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  async update(id: string, task: TaskAssignment | Partial<TaskAssignment>): Promise<TaskAssignment> {
    const payload =
      task instanceof TaskAssignment
        ? TaskAssignmentTransformer.toRepository(task, false)
        : this.partialToRow(task);
    const data = await this.writeWithSchemaFallback(payload, async (row) =>
      supabase.from(TABLE).update(row).eq('id', id).select().single(),
    );
    return TaskAssignmentTransformer.fromRepository(data);
  }

  private partialToRow(partial: Partial<TaskAssignment>): Record<string, unknown> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (partial.title !== undefined) row.title = partial.title;
    if (partial.description !== undefined) row.description = partial.description ?? null;
    if (partial.status !== undefined) row.status = partial.status;
    if (partial.priority !== undefined) row.priority = partial.priority;
    if (partial.progress !== undefined) row.progress = partial.progress;
    if (partial.notes !== undefined) row.notes = partial.notes ?? null;
    if (partial.projectId !== undefined) row.project_id = partial.projectId ?? null;
    if (partial.phaseId !== undefined) row.phase_id = partial.phaseId ?? null;
    if (partial.dueDate !== undefined) row.due_date = partial.dueDate?.toISOString() ?? null;
    if (partial.completedAt !== undefined) row.completed_at = partial.completedAt?.toISOString() ?? null;
    if (partial.assignedTo !== undefined) {
      const list = partial.assignedTo ?? [];
      row.assigned_to = list.length > 0 ? `{${list.join(',')}}` : null;
    }
    return row;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`Failed to delete task: ${error.message}`);
  }
}

export default TaskAssignmentAdapter;
