/**
 * Supabase adapter for btp.project_resources
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import { BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import type {
  IProjectResourceRepository,
  ProjectResourceRow,
} from '@/domain/repositories/IProjectResourceRepository';

// La table réelle `project_resources` n'a pas de colonne `phase_id`.
function stripUnsupportedFields(resource: Partial<ProjectResourceRow>): Partial<ProjectResourceRow> {
  const { phase_id: _phaseId, ...rest } = resource;
  return rest;
}

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
      .insert(stripUnsupportedFields(resource) as BtpTablesInsert<'project_resources'>)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectResourceRow;
  }

  async createMany(resources: Partial<ProjectResourceRow>[]): Promise<ProjectResourceRow[]> {
    if (!resources.length) return [];
    const { data, error } = await btpClient
      .from('project_resources')
      .insert(resources.map(stripUnsupportedFields) as BtpTablesInsert<'project_resources'>[])
      .select();

    if (error) throw error;
    return (data || []) as ProjectResourceRow[];
  }

  async update(id: string, updates: Partial<ProjectResourceRow>): Promise<ProjectResourceRow> {
    const { data, error } = await btpClient
      .from('project_resources')
      .update(stripUnsupportedFields(updates) as BtpTablesUpdate<'project_resources'>)
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
