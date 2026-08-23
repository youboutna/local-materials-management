/**
 * InvoiceBudgetGuardService — verrou budgétaire du cycle documentaire (T11).
 *
 * Empêche l'émission d'un décompte ou d'une facture dont le cumul facturé
 * dépasserait le budget projet / le montant contractuel, selon les tolérances
 * du référentiel `budget-consistency.referential`. Aucun seuil codé en dur.
 *
 * Pure TS — aucun React, aucun appel Supabase direct.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  getBudgetRule,
  type BudgetRuleSeverity,
} from '@/config/referentials/budget/budget-consistency.referential';
import type { InvoiceDocumentType } from '@/config/referentials/invoices/invoice-document-types.referential';

export interface InvoiceBudgetGuardInput {
  /** Étape documentaire que l'on souhaite produire. */
  targetType: InvoiceDocumentType;
  /** Lignes du document cible (déjà proratisées le cas échéant). */
  lines: readonly BoqLineDTO[];
  /** Budget projet (plafond de référence). */
  projectBudget?: number | null;
  /** Montant contractuel signé, s'il diffère du budget projet. */
  contractAmount?: number | null;
  /** Cumul déjà facturé (décomptes/factures antérieurs). */
  alreadyInvoiced?: number | null;
  currency?: string;
}

export interface InvoiceBudgetVerdict {
  /** `false` bloque l'émission (sévérité `error`). */
  allowed: boolean;
  severity: BudgetRuleSeverity | 'none';
  code: string | null;
  label: string | null;
  message: string | null;
  /** Montant HT du document évalué. */
  amount: number;
  /** Cumul facturé une fois ce document émis. */
  cumulative: number;
  /** Plafond retenu (contrat sinon budget projet). */
  ceiling: number;
  /** Dépassement en devise (0 si aucun). */
  overrun: number;
  /** Dépassement relatif au plafond. */
  overrunPct: number;
}

/** Étapes soumises au verrou : seules celles qui engagent un paiement. */
const GUARDED_TYPES: InvoiceDocumentType[] = ['decompte', 'facture'];

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const fmt = (n: number, ccy: string): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))} ${ccy}`;

export const InvoiceBudgetGuardService = {
  /** Montant HT d'un lot de lignes (montant stocké prioritaire, sinon qté × PU). */
  totalHt(lines: readonly BoqLineDTO[]): number {
    return lines.reduce((sum, l) => {
      const stored = l.totalHt != null && l.totalHt !== 0 ? Number(l.totalHt) : null;
      const computed = num(l.quantity) * num(l.unitPrice) + num(l.fees);
      return sum + (stored ?? computed);
    }, 0);
  },

  evaluate(input: InvoiceBudgetGuardInput): InvoiceBudgetVerdict {
    const ccy = input.currency ?? 'MRU';
    const amount = this.totalHt(input.lines);
    const already = num(input.alreadyInvoiced);
    const cumulative = amount + already;
    const ceiling = num(input.contractAmount) > 0 ? num(input.contractAmount) : num(input.projectBudget);

    const base: InvoiceBudgetVerdict = {
      allowed: true,
      severity: 'none',
      code: null,
      label: null,
      message: null,
      amount,
      cumulative,
      ceiling,
      overrun: 0,
      overrunPct: 0,
    };

    // Hors périmètre du verrou ou plafond inconnu : on laisse passer.
    if (!GUARDED_TYPES.includes(input.targetType) || ceiling <= 0) return base;

    const rule = getBudgetRule('BOQ_OVER_PROJECT_BUDGET');
    const warnRule = getBudgetRule('BOQ_ACTUAL_OVER_PLANNED');
    const tolerance = rule?.tolerancePct ?? 0;
    const overrun = Math.max(0, cumulative - ceiling);
    const overrunPct = ceiling > 0 ? overrun / ceiling : 0;

    if (overrun > 0 && overrunPct > tolerance) {
      return {
        ...base,
        allowed: false,
        severity: rule?.severity ?? 'error',
        code: rule?.code ?? 'BOQ_OVER_PROJECT_BUDGET',
        label: rule?.label ?? 'Dépassement budgétaire',
        message:
          `Cumul facturé ${fmt(cumulative, ccy)} > plafond ${fmt(ceiling, ccy)} ` +
          `(dépassement ${fmt(overrun, ccy)}, ${(overrunPct * 100).toFixed(2)} % — tolérance ${(tolerance * 100).toFixed(0)} %). ` +
          `Émission bloquée : arbitrage budgétaire requis.`,
        overrun,
        overrunPct,
      };
    }

    // Zone d'alerte : dans la tolérance, ou proche du plafond (≥ 90 %).
    if (overrun > 0 || cumulative >= ceiling * 0.9) {
      return {
        ...base,
        severity: warnRule?.severity ?? 'warning',
        code: warnRule?.code ?? 'BOQ_ACTUAL_OVER_PLANNED',
        label: warnRule?.label ?? 'Consommation budgétaire élevée',
        message:
          `Cumul facturé ${fmt(cumulative, ccy)} sur un plafond de ${fmt(ceiling, ccy)} ` +
          `(${((cumulative / ceiling) * 100).toFixed(1)} %).`,
        overrun,
        overrunPct,
      };
    }

    return base;
  },

  /** Variante impérative utilisée par les moteurs : lève si l'émission est bloquée. */
  assert(input: InvoiceBudgetGuardInput): InvoiceBudgetVerdict {
    const verdict = this.evaluate(input);
    if (!verdict.allowed) throw new Error(verdict.message ?? 'Verrou budgétaire : émission refusée');
    return verdict;
  },
};
