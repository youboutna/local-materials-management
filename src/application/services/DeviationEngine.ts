/**
 * DeviationEngine — moteur générique de calcul d'écarts planifié vs réalisé.
 *
 * Applique les règles de `deviation-rules.referential.ts` à une entité
 * (tâche, étape, phase, projet) et produit un tableau d'écarts typés.
 *
 * Pure TS — aucun import React, aucun appel direct Supabase.
 */

import {
  DEVIATION_RULES,
  DeviationRule,
  DeviationSeverity,
  classifyDeviation,
  getDeviationRule,
} from '@/config/referentials/deviation-rules.referential';

export interface PlannedActualInput {
  plannedStartDate?: string | Date | null;
  plannedEndDate?: string | Date | null;
  actualStartDate?: string | Date | null;
  actualEndDate?: string | Date | null;
  plannedBudget?: number | null;
  actualCost?: number | null;
  plannedProgress?: number | null;
  actualProgress?: number | null;
  revenue?: number | null;
}

export interface DeviationResult {
  ruleCode: string;
  label: string;
  dimension: DeviationRule['dimension'];
  value: number;
  unit: DeviationRule['unit'];
  severity: DeviationSeverity;
  /** Signe original : positif = retard/dépassement, négatif = avance/économie. */
  sign: 1 | -1 | 0;
}

const toDate = (v?: string | Date | null): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const diffDays = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

export class DeviationEngine {
  /** Calcule tous les écarts applicables pour le scope donné. */
  static compute(
    input: PlannedActualInput,
    scope: 'task' | 'step' | 'phase' | 'project' = 'project'
  ): DeviationResult[] {
    const results: DeviationResult[] = [];

    for (const rule of DEVIATION_RULES) {
      if (!rule.scopes.includes(scope)) continue;

      let value: number | null = null;

      switch (rule.code) {
        case 'duration_deviation': {
          const pEnd = toDate(input.plannedEndDate);
          const aEnd = toDate(input.actualEndDate);
          if (pEnd && aEnd) value = diffDays(aEnd, pEnd);
          break;
        }
        case 'cost_deviation_pct': {
          if (input.plannedBudget && input.plannedBudget > 0 && input.actualCost != null) {
            value = ((input.actualCost - input.plannedBudget) / input.plannedBudget) * 100;
          }
          break;
        }
        case 'progress_deviation_pts': {
          if (input.plannedProgress != null && input.actualProgress != null) {
            value = input.plannedProgress - input.actualProgress;
          }
          break;
        }
        case 'profit_margin_eter': {
          if (input.revenue && input.revenue > 0 && input.actualCost != null) {
            const margin = ((input.revenue - input.actualCost) / input.revenue) * 100;
            // écart par rapport à la borne basse de la cible (10 %)
            value = margin < 10 ? margin - 10 : margin > 30 ? margin - 30 : 0;
          }
          break;
        }
      }

      if (value === null) continue;
      results.push({
        ruleCode: rule.code,
        label: rule.label.fr,
        dimension: rule.dimension,
        value: Number(value.toFixed(2)),
        unit: rule.unit,
        severity: classifyDeviation(rule, value),
        sign: value > 0 ? 1 : value < 0 ? -1 : 0,
      });
    }

    return results;
  }

  /** Sévérité maximale d'un lot d'écarts (utilitaire UI). */
  static maxSeverity(results: DeviationResult[]): DeviationSeverity {
    const order: DeviationSeverity[] = ['info', 'low', 'medium', 'high'];
    return results.reduce<DeviationSeverity>(
      (acc, r) => (order.indexOf(r.severity) > order.indexOf(acc) ? r.severity : acc),
      'info'
    );
  }

  /** Helper pour récupérer la règle source d'un résultat. */
  static getRule(code: string) {
    return getDeviationRule(code);
  }
}
