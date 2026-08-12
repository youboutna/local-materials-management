// @ts-nocheck
/**
 * Supabase adapter for btp.task_dependencies
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  ITaskDependencyRepository,
  TaskDependencyRow,
} from '@/domain/repositories/ITaskDependencyRepository';

export class SupabaseTaskDependencyAdapter implements ITaskDependencyRepository {
  async findByTaskIds(taskIds: string[]): Promise<TaskDependencyRow[]> {
    if (!taskIds?.length) return [];
    const { data, error } = await btpClient
      .from('task_dependencies')
      .select('*')
      .in('task_id', taskIds);

    if (error) throw error;
    return (data || []) as TaskDependencyRow[];
  }

  async create(dependency: Partial<TaskDependencyRow>): Promise<TaskDependencyRow> {
    const { data, error } = await btpClient
      .from('task_dependencies')
      .insert(dependency)
      .select()
      .single();

    if (error) throw error;
    return data as TaskDependencyRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('task_dependencies').delete().eq('id', id);
    if (error) throw error;
  }
}
