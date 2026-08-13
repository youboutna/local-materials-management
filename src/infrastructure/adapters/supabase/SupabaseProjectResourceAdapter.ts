/**
 * Supabase adapter for btp.project_resources
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IProjectResourceRepository,
  ProjectResourceRow,
} from '@/domain/repositories/IProjectResourceRepository';

export class SupabaseProjectResourceAdapter implements IProjectResourceRepository {
  async findByProjectId(projectId: string): Promise<ProjectResourceRow[]> {
    const { data, error } = await btpClient
      .from('project_resources')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectResourceRow[];
  }

  async create(resource: Partial<ProjectResourceRow>): Promise<ProjectResourceRow> {
    const { data, error } = await btpClient
      .from('project_resources')
      .insert(resource)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectResourceRow;
  }

  async createMany(resources: Partial<ProjectResourceRow>[]): Promise<ProjectResourceRow[]> {
    if (!resources.length) return [];
    const { data, error } = await btpClient
      .from('project_resources')
      .insert(resources)
      .select();

    if (error) throw error;
    return (data || []) as ProjectResourceRow[];
  }

  async update(id: string, updates: Partial<ProjectResourceRow>): Promise<ProjectResourceRow> {
    const { data, error } = await btpClient
      .from('project_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectResourceRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('project_resources').delete().eq('id', id);
    if (error) throw error;
  }
}
