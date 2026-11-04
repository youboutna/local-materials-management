import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * TenderLotService - Persistence for tender lots.
 * Hexagonal service (pure TS, no React).
 */
import { TenderLotTransformer, type TenderLotRecord } from '@/dtos/transforms/TenderLotTransformer';
const repo = () => RepositoryFactory.getTenderCatalogRepository();


export type { TenderLotRecord };

export class TenderLotService {
  async listByTender(tenderId: string): Promise<TenderLotRecord[]> {
    if (!tenderId) return [];
    return (await repo().findLotsByTender(tenderId)).map((row) => TenderLotTransformer.fromRow(row as any));
  }

  async create(lot: Omit<TenderLotRecord, 'id'>): Promise<TenderLotRecord> {
    return TenderLotTransformer.fromRow((await repo().insertLot(TenderLotTransformer.toRow(lot) as any)) as any);
  }

  async update(id: string, lot: Partial<TenderLotRecord> & { tenderId: string }): Promise<TenderLotRecord> {
    return TenderLotTransformer.fromRow((await repo().updateLot(id, TenderLotTransformer.toRow(lot) as any)) as any);
  }

  async delete(id: string): Promise<void> {
    await repo().deleteLot(id);
  }

  /** Transition de statut du lot (brouillon → publié → en évaluation → attribué / annulé). */
  async setStatus(id: string, status: TenderLotRecord['status']): Promise<TenderLotRecord> {
    return TenderLotTransformer.fromRow((await repo().updateLot(id, { status })) as any);
  }

  /** Attribue un lot à un prestataire à partir d'une soumission retenue. */
  async award(
    id: string,
    params: { awardedTo: string; awardedSubmissionId?: string | null; awardedAmount?: number | null },
  ): Promise<TenderLotRecord> {
    return TenderLotTransformer.fromRow((await repo().updateLot(id, {
      status: 'awarded',
      awarded_to: params.awardedTo,
      awarded_submission_id: params.awardedSubmissionId ?? null,
      awarded_amount: params.awardedAmount ?? null,
      awarded_at: new Date().toISOString(),
    })) as any);
  }

  /** Soumissions rattachées à un lot. */
  async listSubmissionsByLot(lotId: string): Promise<any[]> {
    if (!lotId) return [];
    return repo().findSubmissionsByLot(lotId);
  }
}

let instance: TenderLotService | null = null;
export function getTenderLotService(): TenderLotService {
  if (!instance) instance = new TenderLotService();
  return instance;
}
