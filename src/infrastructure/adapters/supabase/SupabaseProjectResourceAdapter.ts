/**
 * Supabase adapter for btp.project_resources
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import { BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import type {
  IProjectResourceRepository,
  ProjectResourceRow,
} from '@/domain/repositories/IProjectResourceRepository';
import { camelizeRow, camelizeRows, snakeizeRow } from '@/infrastructure/adapters/rowMapping';

// La table réelle `project_resources` n'a pas de colonne `phase_id`.
function stripUnsupportedFields(resource: Partial<ProjectResourceRow>): Partial<ProjectResourceRow> {
  const { phaseId: _phaseId, ...rest } = resource as Partial<ProjectResourceRow> & { phaseId?: string };
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
    return camelizeRows<ProjectResourceRow>(data);
  }

  async create(resource: Partial<ProjectResourceRow>): Promise<ProjectResourceRow> {
    const { data, error } = await btpClient
      .from('project_resources')
      .insert(stripUnsupportedFields(resource) as BtpTablesInsert<'project_resources'>)
      .select()
      .single();

    if (error) throw error;
    return camelizeRow<ProjectResourceRow>(data);
  }

  async createMany(resources: Partial<ProjectResourceRow>[]): Promise<ProjectResourceRow[]> {
    if (!resources.length) return [];
    const { data, error } = await btpClient
      .from('project_resources')
      .insert(resources.map((r) => snakeizeRow(stripUnsupportedFields(r))) as BtpTablesInsert<'project_resources'>[])
      .select();

    if (error) throw error;
    return camelizeRows<ProjectResourceRow>(data);
  }

  async update(id: string, updates: Partial<ProjectResourceRow>): Promise<ProjectResourceRow> {
    const { data, error } = await btpClient
      .from('project_resources')
      .update(stripUnsupportedFields(updates) as BtpTablesUpdate<'project_resources'>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return camelizeRow<ProjectResourceRow>(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('project_resources').delete().eq('id', id);
    if (error) throw error;
  }
}
