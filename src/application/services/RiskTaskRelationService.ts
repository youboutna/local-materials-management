// Service for managing Risk <-> Task relations
import { IRiskTaskRelationRepository } from '@/domain/repositories/IRiskTaskRelationRepository';

export interface RiskTaskRelationDTO {
  id: string;
  riskId: string;
  taskId: string;
}

export class RiskTaskRelationService {
  constructor(private readonly repository: IRiskTaskRelationRepository) {}

  async getByRiskIds(riskIds: string[]): Promise<RiskTaskRelationDTO[]> {
    const relations = await this.repository.findByRiskIds(riskIds);
    return relations.map(({ id, riskId, taskId }) => ({ id, riskId, taskId }));
  }

  async createRelation(relation: { riskId: string; taskId: string }): Promise<RiskTaskRelationDTO> {
    const created = await this.repository.create(relation);
    return { id: created.id, riskId: created.riskId, taskId: created.taskId };
  }

  async deleteRelation(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByRiskAndTask(riskId: string, taskId: string): Promise<void> {
    await this.repository.deleteByRiskAndTask(riskId, taskId);
  }
}
