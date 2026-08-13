import type {
  IPhaseMaterialRepository,
  PhaseMaterialInput,
  PhaseMaterialRow,
} from '@/domain/repositories/IPhaseMaterialRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class PhaseMaterialService {
  constructor(private readonly repository: IPhaseMaterialRepository) {}

  async getByPhase(phaseId: string): Promise<PhaseMaterialRow[]> {
    if (!phaseId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
    return this.repository.findByPhaseId(phaseId);
  }

  async assign(input: PhaseMaterialInput): Promise<PhaseMaterialRow> {
    if (!input.phaseId || !input.materialId || input.quantity <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase, material and positive quantity are required');
    }
    return this.repository.upsert(input);
  }

  async updateQuantity(id: string, quantity: number): Promise<PhaseMaterialRow> {
    if (!id || quantity <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Material assignment and positive quantity are required');
    }
    return this.repository.updateQuantity(id, quantity);
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Material assignment ID is required');
    await this.repository.delete(id);
  }
}

let instance: PhaseMaterialService | null = null;

export function getPhaseMaterialService(): PhaseMaterialService {
  if (!instance) instance = new PhaseMaterialService(RepositoryFactory.getPhaseMaterialRepository());
  return instance;
}