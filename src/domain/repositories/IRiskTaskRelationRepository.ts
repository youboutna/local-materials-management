// Repository interface for Risk-Task relations (table public.risk_task_relations)

export interface RiskTaskRelationRecord {
  id: string;
  riskId: string;
  taskId: string;
  createdAt?: string;
}

export interface IRiskTaskRelationRepository {
  findByRiskIds(riskIds: string[]): Promise<RiskTaskRelationRecord[]>;
  findByProjectRisks(riskIds: string[]): Promise<RiskTaskRelationRecord[]>;
  create(relation: { riskId: string; taskId: string }): Promise<RiskTaskRelationRecord>;
  delete(id: string): Promise<void>;
  deleteByRiskAndTask(riskId: string, taskId: string): Promise<void>;
}
