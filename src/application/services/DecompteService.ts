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
  type DecompteRecordDTO,
} from '@/dtos/entities/DecompteRecordDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

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
      .reduce((sum, d) => sum + (d.validatedAmount || d.amount || 0), 0);
  }

  static sumPaid(
    decomptes: DecompteRecordDTO[],
    payments: DecomptePaymentDTO[] = [],
  ): number {
    const fromPayments = (payments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const fromDecomptes = (decomptes ?? [])
      .filter(isDecomptePaid)
      .reduce((sum, d) => sum + (d.paidAmount || d.validatedAmount || d.amount || 0), 0);
    // Les paiements sont la source de vérité dès qu'ils existent ; sinon on
    // retombe sur les décomptes soldés (données historiques sans transaction).
    return fromPayments > 0 ? fromPayments : fromDecomptes;
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
