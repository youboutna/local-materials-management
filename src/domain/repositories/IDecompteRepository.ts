import type {
  DecomptePaymentDTO,
  DecompteRecordDTO,
} from '@/dtos/entities/DecompteRecordDTO';

/**
 * Port des décomptes (factures acceptées) — source unique du « dépensé réel ».
 * L'implémentation possède seul l'accès à btp.progress_invoices / btp.payments.
 */
export interface IDecompteRepository {
  findByProjectId(projectId: string): Promise<DecompteRecordDTO[]>;
  findByPhaseId(phaseId: string): Promise<DecompteRecordDTO[]>;
  findById(id: string): Promise<DecompteRecordDTO | null>;
  /** Transactions rattachées (par décompte, sinon par projet/phase). */
  findPaymentsByProjectId(projectId: string): Promise<DecomptePaymentDTO[]>;
  findPaymentsByPhaseId(phaseId: string): Promise<DecomptePaymentDTO[]>;
}
