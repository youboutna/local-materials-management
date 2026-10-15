import type {
  DecomptePaymentDTO,
  DecompteRecordDTO,
} from '@/dtos/entities/DecompteRecordDTO';
import type {
  ConsultantInvoiceDecision,
  ConsultantProgressInvoiceDTO,
} from '@/dtos/entities/ConsultantProgressInvoiceDTO';

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
  findSubmittedProgressInvoices(): Promise<ConsultantProgressInvoiceDTO[]>;
  findProgressInvoiceWorkflowHistory(id: string): Promise<ConsultantInvoiceDecision['workflowHistory'] | null>;
  updateConsultantInvoiceDecision(id: string, decision: ConsultantInvoiceDecision): Promise<void>;
}
