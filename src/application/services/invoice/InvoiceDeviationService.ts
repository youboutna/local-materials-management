/**
 * InvoiceDeviationService — branchement du cycle documentaire sur le
 * `DeviationEngine` (T12).
 *
 * Convertit un document (DQE, devis, décompte, facture) en entrée
 * planifié/réalisé, puis délègue le calcul et la classification des écarts au
 * moteur générique alimenté par `deviation-rules.referential`.
 *
 * Pure TS — aucun seuil codé en dur, aucun React.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { DeviationEngine, type DeviationResult, type PlannedActualInput } from '@/application/services/DeviationEngine';
import type { DeviationSeverity } from '@/config/referentials/deviation-rules.referential';
import { InvoiceBudgetGuardService } from './InvoiceBudgetGuardService';

export interface InvoiceDeviationInput {
  /** Lignes planifiées (DQE / contrat de référence). */
  plannedLines?: readonly BoqLineDTO[];
  /** Budget planifié explicite, prioritaire sur `plannedLines`. */
  plannedBudget?: number | null;
  /** Lignes du document émis (décompte / facture). */
  invoicedLines: readonly BoqLineDTO[];
  /** Cumul déjà facturé sur les documents antérieurs. */
  alreadyInvoiced?: number | null;
  /** Avancement physique constaté (%) — issu des phases / inspections. */
  actualProgress?: number | null;
  /** Recettes attendues (marge ETER), si connues. */
  revenue?: number | null;
  plannedEndDate?: string | null;
  actualEndDate?: string | null;
}

export interface InvoiceDeviationReport {
  deviations: DeviationResult[];
  maxSeverity: DeviationSeverity;
  plannedBudget: number;
  invoicedTotal: number;
  /** Avancement financier facturé (%) rapporté au planifié. */
  billedProgress: number;
  /** Écart financier absolu (réalisé − planifié). */
  variance: number;
  /** `true` si au moins une règle atteint la sévérité « high ». */
  requiresEscalation: boolean;
}

export const InvoiceDeviationService = {
  build(input: InvoiceDeviationInput): PlannedActualInput {
    const plannedBudget =
      input.plannedBudget != null && input.plannedBudget > 0
        ? input.plannedBudget
        : InvoiceBudgetGuardService.totalHt(input.plannedLines ?? []);
    const invoicedTotal =
      InvoiceBudgetGuardService.totalHt(input.invoicedLines) + Number(input.alreadyInvoiced ?? 0);
    const billedProgress = plannedBudget > 0 ? (invoicedTotal / plannedBudget) * 100 : 0;

    return {
      plannedBudget: plannedBudget || null,
      actualCost: invoicedTotal || null,
      plannedProgress: Number(billedProgress.toFixed(2)),
      actualProgress: input.actualProgress ?? null,
      revenue: input.revenue ?? null,
      plannedEndDate: input.plannedEndDate ?? null,
      actualEndDate: input.actualEndDate ?? null,
    };
  },

  analyze(input: InvoiceDeviationInput): InvoiceDeviationReport {
    const built = this.build(input);
    const deviations = DeviationEngine.compute(built, 'project');
    const plannedBudget = Number(built.plannedBudget ?? 0);
    const invoicedTotal = Number(built.actualCost ?? 0);
    const maxSeverity = DeviationEngine.maxSeverity(deviations);

    return {
      deviations,
      maxSeverity,
      plannedBudget,
      invoicedTotal,
      billedProgress: Number(built.plannedProgress ?? 0),
      variance: Number((invoicedTotal - plannedBudget).toFixed(2)),
      requiresEscalation: maxSeverity === 'high',
    };
  },
};
