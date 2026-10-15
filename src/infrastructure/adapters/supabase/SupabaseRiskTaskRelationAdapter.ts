// Supabase adapter for risk-task relations in the BTP schema.
import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IRiskTaskRelationRepository,
  RiskTaskRelationRecord
} from '@/domain/repositories/IRiskTaskRelationRepository';
import type { BtpTables } from '@/integrations/supabase/btp-types';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

type RiskTaskRelationRow = BtpTables<'risk_task_relations'>;

const toRecord = (row: RiskTaskRelationRow): RiskTaskRelationRecord => ({
  id: row.id,
  riskId: row.risk_id,
  taskId: row.task_id,
  createdAt: row.created_at ?? undefined
});

function throwDatabaseError(operation: string, error: unknown): never {
  const appError = new AppError(
    ErrorCode.DATABASE_ERROR,
    `Failed to ${operation} risk-task relation`,
    error
  );
  ErrorLogger.logAndThrow(appError, `SupabaseRiskTaskRelationAdapter.${operation}`);
}

export class SupabaseRiskTaskRelationAdapter implements IRiskTaskRelationRepository {
  async findByRiskIds(riskIds: string[]): Promise<RiskTaskRelationRecord[]> {
    if (riskIds.length === 0) return [];

    const { data, error } = await btpClient.from('risk_task_relations')
      .select('id, risk_id, task_id, created_at')
      .in('risk_id', riskIds);

    if (error) throwDatabaseError('find', error);
    return data.map(toRecord);
  }

  async findByProjectRisks(riskIds: string[]): Promise<RiskTaskRelationRecord[]> {
    return this.findByRiskIds(riskIds);
  }

  async create(relation: { riskId: string; taskId: string }): Promise<RiskTaskRelationRecord> {
    const { data, error } = await btpClient.from('risk_task_relations')
      .insert({ risk_id: relation.riskId, task_id: relation.taskId })
      .select('id, risk_id, task_id, created_at')
      .single();

    if (error) throwDatabaseError('create', error);
    return toRecord(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('risk_task_relations')
      .delete()
      .eq('id', id);

    if (error) throwDatabaseError('delete', error);
  }

  async deleteByRiskAndTask(riskId: string, taskId: string): Promise<void> {
    const { error } = await btpClient.from('risk_task_relations')
      .delete()
      .eq('risk_id', riskId)
      .eq('task_id', taskId);

    if (error) throwDatabaseError('delete', error);
  }
}
