// Supabase Adapter for Risk-Task Relations (public.risk_task_relations)
import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';
import {
  IRiskTaskRelationRepository,
  RiskTaskRelationRecord
} from '@/domain/repositories/IRiskTaskRelationRepository';

const toRecord = (row: {
  id: string;
  risk_id: string;
  task_id: string;
  created_at: string | null;
}): RiskTaskRelationRecord => ({
  id: row.id,
  riskId: row.risk_id,
  taskId: row.task_id,
  createdAt: row.created_at ?? undefined
});

export class SupabaseRiskTaskRelationAdapter implements IRiskTaskRelationRepository {
  async findByRiskIds(riskIds: string[]): Promise<RiskTaskRelationRecord[]> {
    if (riskIds.length === 0) return [];

    const { data, error } = await btpClient.from('risk_task_relations')
      .select('*')
      .in('risk_id', riskIds);

    if (error) throw error;
    return (data || []).map(toRecord);
  }

  async findByProjectRisks(riskIds: string[]): Promise<RiskTaskRelationRecord[]> {
    return this.findByRiskIds(riskIds);
  }

  async create(relation: { riskId: string; taskId: string }): Promise<RiskTaskRelationRecord> {
    const { data, error } = await btpClient.from('risk_task_relations')
      .insert({ risk_id: relation.riskId, task_id: relation.taskId })
      .select()
      .single();

    if (error) throw error;
    return toRecord(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('risk_task_relations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByRiskAndTask(riskId: string, taskId: string): Promise<void> {
    const { error } = await btpClient.from('risk_task_relations')
      .delete()
      .eq('risk_id', riskId)
      .eq('task_id', taskId);

    if (error) throw error;
  }
}
