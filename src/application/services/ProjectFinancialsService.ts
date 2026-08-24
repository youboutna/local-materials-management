/**
 * ProjectFinancialsService — SOURCE UNIQUE de la doctrine financière.
 *
 *   Budget (DQE validé) → Engagé (devis acceptés) → Dépensé (décomptes validés)
 *   → Payé (paiements) → Restant (Budget − Dépensé)
 *
 * Tous les modules (projets, phases, contrôle des paiements, portails
 * prestataire/consultant, appels d'offres, tableau de bord, rapports) doivent
 * consommer ce service — jamais recalculer un « dépensé » local.
 *
 * Pure TS — aucun import React.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  emptyProjectFinancial,
  type FinancialScope,
  type ProjectFinancialDTO,
} from '@/dtos/entities/ProjectFinancialDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { getDecompteService } from '@/application/services/DecompteService';
import { DecompteService } from '@/application/services/DecompteService';

const round2 = (v: number): number => Number((Number.isFinite(v) ? v : 0).toFixed(2));

/** Étapes documentaires assimilées à un DQE de référence. */
const DQE_STAGES = ['dqe', 'previsionnel', 'prévisionnel', 'estimate'];
/** Étapes documentaires assimilées à un devis / offre contractuelle. */
const QUOTE_STAGES = ['devis', 'quote', 'offre', 'contrat', 'contract'];
/** Statuts métier valant acceptation contractuelle. */
const ACCEPTED_STATUSES = [
  'accepted',
  'accepte',
  'accepté',
  'signe',
  'signé',
  'signed',
  'valide',
  'validé',
  'validated',
  'awarded',
  'attribue',
  'attribué',
];

const stageOf = (line: BoqLineDTO): string =>
  String(line.documentType ?? line.dqeType ?? '').toLowerCase();

const businessStatusOf = (line: BoqLineDTO): string =>
  String(line.businessStatus ?? line.status ?? '').toLowerCase();

const lineTotal = (line: BoqLineDTO): number => {
  if (typeof line.totalHt === 'number' && Number.isFinite(line.totalHt)) return line.totalHt;
  return (line.quantity ?? 0) * (line.unitPrice ?? 0);
};

const isValidatedLine = (line: BoqLineDTO): boolean => {
  const status = String(line.status ?? '').toLowerCase();
  const business = businessStatusOf(line);
  return (
    ['validated', 'invoiced', 'paid', 'archived'].includes(status) ||
    ACCEPTED_STATUSES.some((s) => business.includes(s))
  );
};

export interface FinancialScopeInput {
  scope: FinancialScope;
  entityId: string;
  /** Budget déclaré (projet.budget ou phase.estimated_cost) — repli documenté. */
  declaredBudget?: number | null;
  currency?: string;
}

export class ProjectFinancialsService {
  /**
   * Synthèse doctrinale d'un projet ou d'une phase.
   * `boqLines` est optionnel : fourni par l'appelant s'il les a déjà chargées.
   */
  async getSummary(input: FinancialScopeInput): Promise<ProjectFinancialDTO> {
    const { scope, entityId } = input;
    const currency = input.currency || 'MRU';
    if (!entityId) return emptyProjectFinancial(scope, '', currency);

    const [lines, decomptes] = await Promise.all([
      this.loadLines(scope, entityId),
      this.loadDecomptes(scope, entityId),
    ]);

    return ProjectFinancialsService.build({
      scope,
      entityId,
      currency,
      declaredBudget: input.declaredBudget ?? 0,
      lines,
      decomptes: decomptes.decomptes,
      payments: decomptes.payments,
    });
  }

  private async loadLines(scope: FinancialScope, entityId: string): Promise<BoqLineDTO[]> {
    try {
      return await boqRepository.list(
        scope === 'phase'
          ? { source: 'dqe', phaseId: entityId }
          : { source: 'dqe', contextId: entityId, projectId: entityId },
      );
    } catch {
      return [];
    }
  }

  private async loadDecomptes(scope: FinancialScope, entityId: string) {
    try {
      const service = getDecompteService();
      return scope === 'phase'
        ? await service.getPhaseFinancials(entityId)
        : await service.getProjectFinancials(entityId);
    } catch {
      return { decomptes: [], payments: [], summary: null } as any;
    }
  }

  /** Calcul pur — testable et réutilisable côté UI sans nouvel appel réseau. */
  static build(args: {
    scope: FinancialScope;
    entityId: string;
    currency: string;
    declaredBudget: number;
    lines: BoqLineDTO[];
    decomptes: Parameters<typeof DecompteService.sumValidated>[0];
    payments: Parameters<typeof DecompteService.sumPaid>[1];
  }): ProjectFinancialDTO {
    const { scope, entityId, currency, declaredBudget, lines, decomptes, payments } = args;

    const dqeValidated = (lines ?? [])
      .filter((l) => DQE_STAGES.includes(stageOf(l)) && isValidatedLine(l))
      .reduce((sum, l) => sum + lineTotal(l), 0);

    const engaged = (lines ?? [])
      .filter((l) => QUOTE_STAGES.includes(stageOf(l)) && isValidatedLine(l))
      .reduce((sum, l) => sum + lineTotal(l), 0);

    let budgetTotal = round2(dqeValidated);
    let budgetSource: ProjectFinancialDTO['budgetSource'] = 'dqe';
    if (budgetTotal <= 0) {
      budgetTotal = round2(declaredBudget || 0);
      budgetSource = budgetTotal > 0 ? 'declared' : 'none';
    }

    const spent = round2(DecompteService.sumValidated(decomptes ?? []));
    const paid = round2(DecompteService.sumPaid(decomptes ?? [], payments ?? []));
    const validatedCount = (decomptes ?? []).filter((d) =>
      ['validated', 'paid'].includes(d.status),
    ).length;
    const pendingCount = (decomptes ?? []).filter((d) =>
      ['draft', 'submitted'].includes(d.status),
    ).length;

    return {
      scope,
      entityId,
      currency,
      budgetTotal,
      budgetSource,
      engaged: round2(engaged),
      spent,
      paid,
      remainingToPay: round2(Math.max(0, spent - paid)),
      remaining: round2(budgetTotal - spent),
      consumptionRate: budgetTotal > 0 ? round2((spent / budgetTotal) * 100) : 0,
      engagementRate: budgetTotal > 0 ? round2((engaged / budgetTotal) * 100) : 0,
      decompteCount: (decomptes ?? []).length,
      validatedDecompteCount: validatedCount,
      pendingDecompteCount: pendingCount,
    };
  }
}

let instance: ProjectFinancialsService | null = null;
export function getProjectFinancialsService(): ProjectFinancialsService {
  if (!instance) instance = new ProjectFinancialsService();
  return instance;
}
