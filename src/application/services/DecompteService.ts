/**
 * DecompteService — SOURCE UNIQUE du « dépensé réel ».
 *
 * Doctrine (cf. DecompteRecordDTO) :
 *   dépensé  = Σ décomptes validés (factures acceptées)
 *   payé     = Σ paiements rattachés (transactions réelles)
 *   engagé   = prévisionnel DQE / ressources (fourni par l'appelant, jamais dépensé)
 *
 * Pure TypeScript, aucun React, aucun accès Supabase direct.
 */
import type { IDecompteRepository } from '@/domain/repositories/IDecompteRepository';
import {
  isDecomptePaid,
  isDecompteValidated,
  type DecomptePaymentDTO,
  type DecompteFinancialSummaryDTO,
  type DecompteReconciliationDTO,
  type DecompteReconciliationState,
  type DecompteRecordDTO,
} from '@/dtos/entities/DecompteRecordDTO';
import type {
  ConsultantInvoiceDecision,
  ConsultantProgressInvoiceDTO,
} from '@/dtos/entities/ConsultantProgressInvoiceDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DEFAULT_OPERATION_POLICY, type OperationPolicy } from '@/config/referentials/projects/operation-policy.referential';

export interface DecompteScopeResult {
  decomptes: DecompteRecordDTO[];
  payments: DecomptePaymentDTO[];
  summary: DecompteFinancialSummaryDTO;
}

export interface DecompteScopeOptions {
  /** Budget initial du périmètre (projet ou phase). */
  initialBudget?: number;
  /** Engagements prévisionnels (lignes DQE / ressources) — informatif. */
  engaged?: number;
  currency?: string;
}

export class DecompteService {
  constructor(private readonly repository: IDecompteRepository) {}

  async getProjectDecomptes(projectId: string): Promise<DecompteRecordDTO[]> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    return this.repository.findByProjectId(projectId);
  }

  async getPhaseDecomptes(phaseId: string): Promise<DecompteRecordDTO[]> {
    if (!phaseId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
    return this.repository.findByPhaseId(phaseId);
  }

  async getSubmittedProgressInvoices(): Promise<ConsultantProgressInvoiceDTO[]> {
    return this.repository.findSubmittedProgressInvoices();
  }

  async validateConsultantInvoice(input: {
    invoiceId: string;
    approved: boolean;
    comments: string;
    serviceFaitDocumentId: string | null;
    userId: string;
  }): Promise<void> {
    if (!input.invoiceId || !input.userId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID and user ID are required');
    }
    const existingWorkflow = await this.repository.findProgressInvoiceWorkflowHistory(input.invoiceId);
    if (!existingWorkflow) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Progress invoice not found');
    }

    const status = input.approved ? 'consultant_approved' : 'consultant_rejected';
    const validatedAt = new Date().toISOString();
    const decision: ConsultantInvoiceDecision = {
      status,
      consultantId: input.userId,
      comments: input.comments,
      approved: input.approved,
      serviceFaitDocumentId: input.serviceFaitDocumentId,
      validatedAt,
      workflowHistory: [
        ...existingWorkflow,
        {
          action: status,
          timestamp: validatedAt,
          user_id: input.userId,
          employee_id: input.userId,
          comments: input.comments,
          status,
        },
      ],
    };
    await this.repository.updateConsultantInvoiceDecision(input.invoiceId, decision);
  }

  /** Dépensé réel du projet = Σ décomptes validés. */
  async getProjectSpend(projectId: string): Promise<number> {
    const decomptes = await this.getProjectDecomptes(projectId);
    return DecompteService.sumValidated(decomptes);
  }

  async getProjectFinancials(
    projectId: string,
    options: DecompteScopeOptions = {},
  ): Promise<DecompteScopeResult> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    const [decomptes, payments] = await Promise.all([
      this.repository.findByProjectId(projectId),
      this.repository.findPaymentsByProjectId(projectId),
    ]);
    return {
      decomptes,
      payments,
      summary: DecompteService.buildSummary(decomptes, payments, options),
    };
  }

  async getPhaseFinancials(
    phaseId: string,
    options: DecompteScopeOptions = {},
  ): Promise<DecompteScopeResult> {
    if (!phaseId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
    const [decomptes, payments] = await Promise.all([
      this.repository.findByPhaseId(phaseId),
      this.repository.findPaymentsByPhaseId(phaseId),
    ]);
    return {
      decomptes,
      payments,
      summary: DecompteService.buildSummary(decomptes, payments, options),
    };
  }

  // ---------- Calculs purs (réutilisables côté UI via le hook) ----------

  static sumValidated(decomptes: DecompteRecordDTO[]): number {
    return (decomptes ?? [])
      .filter(isDecompteValidated)
      .reduce((sum, d) => sum + (d.validatedAmount ?? d.amount ?? 0), 0);
  }

  static sumPaid(
    decomptes: DecompteRecordDTO[],
    payments: DecomptePaymentDTO[] = [],
    policy: OperationPolicy = DEFAULT_OPERATION_POLICY,
  ): number {
    const fromPayments = (payments ?? [])
      .filter(p => !policy.excludedPaymentStatuses.includes(String(p.status ?? '').toLowerCase()))
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const fromDecomptes = (decomptes ?? [])
      .filter(isDecomptePaid)
      .reduce((sum, d) => sum + (d.paidAmount ?? d.validatedAmount ?? d.amount ?? 0), 0);
    // Les paiements sont la source de vérité dès qu'ils existent ; sinon on
    // retombe sur les décomptes soldés (données historiques sans transaction).
    return payments.length > 0 ? fromPayments : fromDecomptes;
  }

  // ---------- Rapprochement décomptes ↔ règlements (composition, sans table) ----------

  /**
   * Rapproche chaque décompte de ses règlements comptabilisables et isole les
   * paiements non affectés. Aucune écriture : pure lecture des sources canoniques.
   */
  static reconcile(
    decomptes: DecompteRecordDTO[],
    payments: DecomptePaymentDTO[] = [],
    policy: OperationPolicy = DEFAULT_OPERATION_POLICY,
  ): DecompteReconciliationDTO {
    const countable = (payments ?? []).filter(
      p => !policy.excludedPaymentStatuses.includes(String(p.status ?? '').toLowerCase()),
    );
    const list = (decomptes ?? []).filter(Boolean);
    const knownIds = new Set(list.map(d => d.id));
    const unallocatedPayments = countable.filter(p => !p.decompteId || !knownIds.has(p.decompteId));
    const lines = list.map(d => {
      const due = d.validatedAmount ?? d.amount ?? 0;
      const linked = countable
        .filter(p => p.decompteId === d.id)
        .reduce((sum, p) => sum + (p.amount ?? 0), 0);
      // Historique sans transaction : un décompte soldé vaut règlement complet.
      const effectivePaid = linked > 0 ? linked : (isDecomptePaid(d) ? (d.paidAmount ?? due) : 0);
      const validated = isDecompteValidated(d);
      const remainingAmount = validated ? Math.max(0, due - effectivePaid) : 0;
      const state: DecompteReconciliationState = !validated
        ? 'not_validated'
        : remainingAmount <= 0 && (effectivePaid > 0 || due <= 0)
          ? 'settled'
          : effectivePaid > 0
            ? 'partial'
            : 'unpaid';
      return { decompte: d, paidAmount: effectivePaid, remainingAmount, state };
    });
    return {
      lines,
      unallocatedPayments,
      unallocatedAmount: unallocatedPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0),
    };
  }

  static buildSummary(
    decomptes: DecompteRecordDTO[],
    payments: DecomptePaymentDTO[] = [],
    options: DecompteScopeOptions = {},
  ): DecompteFinancialSummaryDTO {
    const list = (decomptes ?? []).filter(Boolean);
    const decomptedValidated = DecompteService.sumValidated(list);
    const paid = DecompteService.sumPaid(list, payments);
    const initialBudget = options.initialBudget ?? 0;

    return {
      initialBudget,
      decomptedValidated,
      paid,
      remainingToPay: Math.max(decomptedValidated - paid, 0),
      budgetRemaining: initialBudget - decomptedValidated,
      engaged: options.engaged ?? 0,
      validatedCount: list.filter(isDecompteValidated).length,
      pendingCount: list.filter((d) => d.status === 'submitted' || d.status === 'draft').length,
      currency: options.currency ?? 'MRU',
    };
  }
}

let instance: DecompteService | null = null;

export function getDecompteService(): DecompteService {
  if (!instance) {
    instance = new DecompteService(RepositoryFactory.getDecompteRepository());
  }
  return instance;
}
