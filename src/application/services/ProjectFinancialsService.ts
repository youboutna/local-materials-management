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
import { DEFAULT_OPERATION_POLICY, type OperationPolicy } from '@/config/referentials/projects/operation-policy.referential';

const round2 = (v: number): number => Number((Number.isFinite(v) ? v : 0).toFixed(2));

const stageOf = (line: BoqLineDTO): string =>
  String(line.documentType ?? line.dqeType ?? '').toLowerCase();

const businessStatusOf = (line: BoqLineDTO): string =>
  String(line.businessStatus ?? line.status ?? '').toLowerCase();

const lineTotal = (line: BoqLineDTO): number => {
  if (typeof line.totalHt === 'number' && Number.isFinite(line.totalHt)) return line.totalHt;
  return (line.quantity ?? 0) * (line.unitPrice ?? 0);
};

const isValidatedLine = (line: BoqLineDTO, policy: OperationPolicy): boolean => {
  const status = String(line.status ?? '').toLowerCase();
  const business = businessStatusOf(line);
  return (
    policy.validatedStatuses.includes(status) ||
    policy.acceptedStatuses.includes(business)
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
    const lists = await Promise.all((['dqe', 'supplier_bid', 'invoice'] as const).map(source =>
      boqRepository.list(scope === 'phase' ? { source, phaseId: entityId } : { source, projectId: entityId })));
    return lists.flat();
  }

  private async loadDecomptes(scope: FinancialScope, entityId: string) {
    const service = getDecompteService();
    return scope === 'phase' ? service.getPhaseFinancials(entityId) : service.getProjectFinancials(entityId);
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
    policy?: OperationPolicy;
  }): ProjectFinancialDTO {
    const { scope, entityId, currency, declaredBudget, lines, decomptes, payments } = args;
    const policy = args.policy ?? DEFAULT_OPERATION_POLICY;
    const uniqueLines = [...new Map(lines.map((line, index) => [line.id ?? `unpersisted:${index}`, line])).values()];

    const dqeValidated = uniqueLines
      .filter((l) => policy.dqeStages.includes(stageOf(l)) && isValidatedLine(l, policy))
      .reduce((sum, l) => sum + lineTotal(l), 0);

    const commitmentLines = uniqueLines.filter(l => policy.commitmentStages.includes(stageOf(l)) && isValidatedLine(l, policy));
    // A signed successor replaces its accepted source offer, never adds to it.
    const supersededDocuments = new Set(commitmentLines.map(l => l.sourceDocumentId).filter(Boolean));
    const engaged = commitmentLines
      .filter(l => !l.documentId || !supersededDocuments.has(l.documentId))
      .reduce((sum, l) => sum + lineTotal(l), 0);

    let budgetTotal = round2(dqeValidated);
    let budgetSource: ProjectFinancialDTO['budgetSource'] = 'dqe';
    if (budgetTotal <= 0) {
      budgetTotal = round2(declaredBudget || 0);
      budgetSource = budgetTotal > 0 ? 'declared' : 'none';
    }

    const spent = round2(DecompteService.sumValidated(decomptes ?? []));
    const paid = round2(DecompteService.sumPaid(decomptes ?? [], payments ?? [], policy));
    const reconciliation = DecompteService.reconcile(decomptes ?? [], payments ?? [], policy);
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
      remainingToPay: round2(reconciliation.lines.reduce((sum, line) => sum + line.remainingAmount, 0)),
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
