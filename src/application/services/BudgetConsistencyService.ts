/**
 * BudgetConsistencyService — couche application (TypeScript pur, aucun React)
 *
 * Source unique de vérité pour les contrôles de cohérence budgétaire :
 *  - plafonds CE / CP issus du référentiel Loi de Finances (liens budgétaires),
 *  - encadrement du budget projet entre CP (plancher) et CE (plafond),
 *  - cumul des budgets de phases ≤ budget projet,
 *  - réconciliation planifié / réalisé (détection des résidus non affectés).
 *
 * Toutes les tolérances proviennent de `budget-consistency.referential.ts`.
 */
import {
  BUDGET_CONSISTENCY_RULES,
  getBudgetRule,
  type BudgetRuleSeverity,
} from '@/config/referentials/budget/budget-consistency.referential';
import { linkageHelpers } from '@/config/referentials/linkage/autocomplete-provider';
import type { CreateProjectBudgetLinkDTO } from '@/dtos/entities/ProjectBudgetLinkDTO';

export interface BudgetFinding {
  code: string;
  severity: BudgetRuleSeverity;
  label: string;
  message: string;
  /** Valeur observée et référence, en devise projet. */
  observed?: number;
  reference?: number;
}

export interface BudgetCeilings {
  /** Plafond d'engagement cumulé (CE) issu du référentiel LF. */
  referentialCe: number;
  /** Crédit de paiement cumulé (CP) issu du référentiel LF. */
  referentialCp: number;
  /** Total CE alloué par l'utilisateur sur les liens. */
  allocatedCe: number;
  /** Total CP alloué par l'utilisateur sur les liens. */
  allocatedCp: number;
}

export interface BoqReconciliation {
  plannedTotal: number;
  actualTotal: number;
  variance: number;
  variancePct: number;
  unassignedPlanned: number;
  unassignedActual: number;
  unassignedPct: number;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const pct = (value: number, base: number): number => (base > 0 ? value / base : 0);
const fmt = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n));

export class BudgetConsistencyService {
  /** Plafond CE/CP du référentiel pour un lien (ligne prioritaire, sinon action). */
  static referentialCeilingForLink(link: Partial<CreateProjectBudgetLinkDTO>): {
    ce: number;
    cp: number;
    source: 'line' | 'action' | 'none';
  } {
    if (link.lineCode) {
      const line = linkageHelpers.findBudgetLine(link.lineCode)?.line as
        | { ce?: number; cp?: number }
        | undefined;
      if (line) return { ce: num(line.ce), cp: num(line.cp), source: 'line' };
    }
    if (link.actionCode) {
      const action = linkageHelpers.findAction(link.actionCode)?.action as
        | { totalCE?: number; totalCP?: number }
        | undefined;
      if (action) return { ce: num(action.totalCE), cp: num(action.totalCP), source: 'action' };
    }
    return { ce: 0, cp: 0, source: 'none' };
  }

  /** Agrège les plafonds référentiels et les allocations saisies. */
  static computeCeilings(links: readonly Partial<CreateProjectBudgetLinkDTO>[]): BudgetCeilings {
    return links.reduce<BudgetCeilings>(
      (acc, link) => {
        const ceiling = this.referentialCeilingForLink(link);
        return {
          referentialCe: acc.referentialCe + ceiling.ce,
          referentialCp: acc.referentialCp + ceiling.cp,
          allocatedCe: acc.allocatedCe + num(link.allocatedCe),
          allocatedCp: acc.allocatedCp + num(link.allocatedCp),
        };
      },
      { referentialCe: 0, referentialCp: 0, allocatedCe: 0, allocatedCp: 0 },
    );
  }

  /** Contrôles sur les liens budgétaires + budget projet + phases. */
  static evaluate(input: {
    projectBudget?: number | null;
    budgetLinks?: readonly Partial<CreateProjectBudgetLinkDTO>[];
    phaseBudgets?: readonly number[];
    currency?: string;
  }): { findings: BudgetFinding[]; ceilings: BudgetCeilings; phasesTotal: number } {
    const links = input.budgetLinks ?? [];
    const ceilings = this.computeCeilings(links);
    const budget = num(input.projectBudget);
    const ccy = input.currency ?? 'MRU';
    const findings: BudgetFinding[] = [];

    // 1. Allocation > plafond référentiel (par lien)
    const overRule = getBudgetRule('ALLOCATION_OVER_REFERENTIAL_CEILING')!;
    links.forEach((link, index) => {
      const ceiling = this.referentialCeilingForLink(link);
      if (ceiling.source === 'none') return;
      if (ceiling.ce > 0 && num(link.allocatedCe) > ceiling.ce * (1 + overRule.tolerancePct)) {
        findings.push({
          code: overRule.code,
          severity: overRule.severity,
          label: overRule.label,
          message: `Lien ${index + 1} : CE alloué ${fmt(num(link.allocatedCe))} ${ccy} > plafond LF ${fmt(ceiling.ce)} ${ccy}.`,
          observed: num(link.allocatedCe),
          reference: ceiling.ce,
        });
      }
      if (ceiling.cp > 0 && num(link.allocatedCp) > ceiling.cp * (1 + overRule.tolerancePct)) {
        findings.push({
          code: overRule.code,
          severity: overRule.severity,
          label: overRule.label,
          message: `Lien ${index + 1} : CP alloué ${fmt(num(link.allocatedCp))} ${ccy} > crédit de paiement LF ${fmt(ceiling.cp)} ${ccy}.`,
          observed: num(link.allocatedCp),
          reference: ceiling.cp,
        });
      }
    });

    // 2. Budget projet encadré par CP (plancher) et CE (plafond)
    const floor = ceilings.allocatedCp || ceilings.referentialCp;
    const cap = ceilings.allocatedCe || ceilings.referentialCe;
    if (links.length > 0 && budget > 0 && cap > 0) {
      const overCe = getBudgetRule('PROJECT_BUDGET_OVER_CE')!;
      const within = getBudgetRule('PROJECT_BUDGET_WITHIN_CP_CE')!;
      if (budget > cap * (1 + overCe.tolerancePct)) {
        findings.push({
          code: overCe.code,
          severity: overCe.severity,
          label: overCe.label,
          message: `Budget projet ${fmt(budget)} ${ccy} supérieur aux CE liés ${fmt(cap)} ${ccy}.`,
          observed: budget,
          reference: cap,
        });
      } else if (floor > 0 && budget < floor * (1 - within.tolerancePct)) {
        findings.push({
          code: within.code,
          severity: within.severity,
          label: within.label,
          message: `Budget projet ${fmt(budget)} ${ccy} inférieur aux CP liés ${fmt(floor)} ${ccy} : le budget doit être compris entre CP et CE.`,
          observed: budget,
          reference: floor,
        });
      }
    }

    // 3. Cumul des phases vs budget projet
    const phasesTotal = (input.phaseBudgets ?? []).reduce((s, v) => s + num(v), 0);
    if (budget > 0 && phasesTotal > 0) {
      const over = getBudgetRule('PHASES_BUDGET_OVER_PROJECT')!;
      const under = getBudgetRule('PHASES_BUDGET_UNDER_COVERAGE')!;
      if (phasesTotal > budget * (1 + over.tolerancePct)) {
        findings.push({
          code: over.code,
          severity: over.severity,
          label: over.label,
          message: `Cumul des phases ${fmt(phasesTotal)} ${ccy} > budget projet ${fmt(budget)} ${ccy} (écart ${fmt(phasesTotal - budget)} ${ccy}).`,
          observed: phasesTotal,
          reference: budget,
        });
      } else if (phasesTotal < budget * (1 - under.tolerancePct)) {
        findings.push({
          code: under.code,
          severity: under.severity,
          label: under.label,
          message: `Reste à répartir sur les phases : ${fmt(budget - phasesTotal)} ${ccy} (${((1 - pct(phasesTotal, budget)) * 100).toFixed(1)} %).`,
          observed: phasesTotal,
          reference: budget,
        });
      }
    }

    return { findings, ceilings, phasesTotal };
  }

  /**
   * Réconciliation planifié / réalisé : garantit l'absence de résidu silencieux
   * (lignes hors WBS) et signale les dépassements.
   */
  static reconcileBoq(input: {
    plannedTotal: number;
    actualTotal: number;
    unassignedPlanned?: number;
    unassignedActual?: number;
    projectBudget?: number | null;
    currency?: string;
  }): { reconciliation: BoqReconciliation; findings: BudgetFinding[] } {
    const ccy = input.currency ?? 'MRU';
    const planned = num(input.plannedTotal);
    const actual = num(input.actualTotal);
    const unassignedPlanned = num(input.unassignedPlanned);
    const unassignedActual = num(input.unassignedActual);
    const base = Math.max(planned, actual);
    const unassignedPct = pct(unassignedPlanned + unassignedActual, base || 1);

    const reconciliation: BoqReconciliation = {
      plannedTotal: planned,
      actualTotal: actual,
      variance: actual - planned,
      variancePct: pct(actual - planned, planned) * 100,
      unassignedPlanned,
      unassignedActual,
      unassignedPct: unassignedPct * 100,
    };

    const findings: BudgetFinding[] = [];
    const residual = getBudgetRule('BOQ_RESIDUAL_UNASSIGNED')!;
    if (unassignedPlanned + unassignedActual > 0 && unassignedPct > residual.tolerancePct) {
      findings.push({
        code: residual.code,
        severity: residual.severity,
        label: residual.label,
        message: `Résidu hors WBS : ${fmt(unassignedPlanned + unassignedActual)} ${ccy} (${(unassignedPct * 100).toFixed(1)} % du suivi). Affectez ces lignes à une phase / un jalon.`,
        observed: unassignedPlanned + unassignedActual,
        reference: base,
      });
    }

    const overPlanned = getBudgetRule('BOQ_ACTUAL_OVER_PLANNED')!;
    if (planned > 0 && actual > planned * (1 + overPlanned.tolerancePct)) {
      findings.push({
        code: overPlanned.code,
        severity: overPlanned.severity,
        label: overPlanned.label,
        message: `Réalisé ${fmt(actual)} ${ccy} > planifié ${fmt(planned)} ${ccy} (écart ${fmt(actual - planned)} ${ccy}).`,
        observed: actual,
        reference: planned,
      });
    }

    const budget = num(input.projectBudget);
    const overBudget = getBudgetRule('BOQ_OVER_PROJECT_BUDGET')!;
    if (budget > 0 && actual > budget * (1 + overBudget.tolerancePct)) {
      findings.push({
        code: overBudget.code,
        severity: overBudget.severity,
        label: overBudget.label,
        message: `Réalisé ${fmt(actual)} ${ccy} > budget projet ${fmt(budget)} ${ccy}.`,
        observed: actual,
        reference: budget,
      });
    }

    return { reconciliation, findings };
  }

  static get rules() {
    return BUDGET_CONSISTENCY_RULES;
  }
}

export default BudgetConsistencyService;
