/**
 * EscalationThresholdService — btp.escalation_thresholds
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type {
  IEscalationThresholdRepository,
  EscalationThresholdRow,
} from '@/domain/repositories/IEscalationThresholdRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class EscalationThresholdService {
  constructor(private repository: IEscalationThresholdRepository) {}

  async getAll(): Promise<EscalationThresholdRow[]> {
    return this.repository.findAll();
  }

  async update(
    id: string,
    updates: Partial<EscalationThresholdRow>
  ): Promise<EscalationThresholdRow> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Threshold ID is required');
    if (updates.threshold_value !== undefined && updates.threshold_value < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Le seuil doit être positif');
    }
    return this.repository.update(id, updates);
  }

  async updateMany(
    items: Array<{ id: string; updates: Partial<EscalationThresholdRow> }>
  ): Promise<void> {
    for (const item of items) {
      await this.update(item.id, item.updates);
    }
  }
}

let instance: EscalationThresholdService | null = null;

export function getEscalationThresholdService(): EscalationThresholdService {
  if (!instance) {
    instance = new EscalationThresholdService(RepositoryFactory.getEscalationThresholdRepository());
  }
  return instance;
}
