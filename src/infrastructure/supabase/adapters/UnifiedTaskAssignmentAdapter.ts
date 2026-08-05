/**
 * Unified TaskAssignment Supabase Adapter
 * Table unique : task_assignments (schéma btp)
 */

import { UnifiedTaskAssignment } from '@/domain/entities/UnifiedTaskAssignment';
import { IUnifiedTaskAssignmentRepository } from '@/domain/repositories/IUnifiedTaskAssignmentRepository';
import { UnifiedTaskAssignmentTransformer } from '@/dtos/transforms/UnifiedTaskAssignmentTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'task_assignments';

export class UnifiedTaskAssignmentAdapter implements IUnifiedTaskAssignmentRepository {
  /** Élague les colonnes absentes du cache PostgREST puis rejoue l'écriture. */
  private async writeWithSchemaFallback(
    payload: Record<string, unknown>,
    run: (data: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>,
  ): Promise<Record<string, unknown>> {
    let current = { ...payload };
    for (let attempt = 0; attempt < 8; attempt += 1) {
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

  private mapMany(rows: unknown): UnifiedTaskAssignment[] {
    return ((rows as Record<string, unknown>[]) ?? []).map((row) =>
      UnifiedTaskAssignmentTransformer.fromRepository(row),
    );
  }

  async save(task: UnifiedTaskAssignment): Promise<UnifiedTaskAssignment> {
    const payload = UnifiedTaskAssignmentTransformer.toRepository(task);
    const data = await this.writeWithSchemaFallback(payload, async (row) =>
      supabase.from(TABLE).insert(row).select().single(),
    );
    return UnifiedTaskAssignmentTransformer.fromRepository(data);
  }

  async findById(id: string): Promise<UnifiedTaskAssignment | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return UnifiedTaskAssignmentTransformer.fromRepository(data);
  }

  async findAll(): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  async findByProjectId(projectId: string): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  async findByPhaseId(phaseId: string): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phase_id', phaseId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  async findByAssignee(assigneeId: string): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .contains('assigned_to', [assigneeId])
      .order('created_at', { ascending: false });
    if (!error) return this.mapMany(data);
    // Fallback colonne héritée
    const legacy = await supabase
      .from(TABLE)
      .select('*')
      .eq('assignee_id', assigneeId)
      .order('created_at', { ascending: false });
    if (legacy.error) return [];
    return this.mapMany(legacy.data);
  }

  async findByStatus(status: string): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) return [];
    return this.mapMany(data);
  }

  async findOverdue(): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    if (error) return [];
    return this.mapMany(data);
  }

  async findDueBetween(start: string, end: string): Promise<UnifiedTaskAssignment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date', { ascending: true });
    if (error) return [];
    return this.mapMany(data);
  }

  async update(id: string, task: UnifiedTaskAssignment): Promise<UnifiedTaskAssignment> {
    const payload = UnifiedTaskAssignmentTransformer.toRepository(task, false);
    const data = await this.writeWithSchemaFallback(payload, async (row) =>
      supabase.from(TABLE).update(row).eq('id', id).select().single(),
    );
    return UnifiedTaskAssignmentTransformer.fromRepository(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }
}
