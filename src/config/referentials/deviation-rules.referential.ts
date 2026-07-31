/**
 * Deviation Rules Referential
 *
 * Règles d'écarts planifié vs réalisé (durée, coût, TEP).
 * Aucune règle/seuil n'est codé en dur dans l'UI ou les composants.
 */

export type DeviationDimension = 'duration' | 'cost' | 'progress' | 'margin';
export type DeviationSeverity = 'info' | 'low' | 'medium' | 'high';

export interface DeviationRule {
  code: string;
  label: { fr: string; en?: string };
  dimension: DeviationDimension;
  /** Unité du résultat (jours, %, MRU, points). */
  unit: 'days' | '%' | 'MRU' | 'pts';
  /** Formule documentaire (le calcul réel est dans DeviationEngine). */
  formula: string;
  /** Seuils en valeur absolue (positifs). */
  thresholds: { low: number; medium: number; high: number };
  /** Scopes auxquels la règle s'applique : tâche, étape, phase, projet. */
  scopes: Array<'task' | 'step' | 'phase' | 'project'>;
  applicableTo?: Array<'project' | 'phase' | 'task'>;
  projectTypes?: string[];
  autoAction?: 'notify' | 'escalate' | 'block';
  compareField?: string;
  targetField?: string;
}

export const DEVIATION_RULES: DeviationRule[] = [
  {
    code: 'duration_deviation',
    label: { fr: 'Écart de durée', en: 'Duration deviation' },
    dimension: 'duration',
    unit: 'days',
    formula: 'actualEnd - plannedEnd',
    thresholds: { low: 2, medium: 5, high: 15 },
    scopes: ['task', 'step', 'phase', 'project'],
    applicableTo: ['project', 'phase', 'task'], autoAction: 'notify', compareField: 'actualEndDate', targetField: 'plannedEndDate',
  },
  {
    code: 'cost_deviation_pct',
    label: { fr: 'Écart de coût (%)', en: 'Cost deviation (%)' },
    dimension: 'cost',
    unit: '%',
    formula: '(actualCost - plannedBudget) / plannedBudget × 100',
    thresholds: { low: 5, medium: 10, high: 20 },
    scopes: ['task', 'phase', 'project'],
    applicableTo: ['project', 'phase'], projectTypes: ['SOMELEC_INFRA', 'ETER'], autoAction: 'escalate', compareField: 'actualCost', targetField: 'plannedCost',
  },
  {
    code: 'progress_deviation_pts',
    label: { fr: "Écart d'avancement (pts)", en: 'Progress gap (pts)' },
    dimension: 'progress',
    unit: 'pts',
    formula: 'plannedProgress - actualProgress',
    thresholds: { low: 5, medium: 10, high: 20 },
    scopes: ['phase', 'project'],
  },
  {
    code: 'profit_margin_eter',
    label: { fr: 'Marge bénéficiaire ETER hors cible' },
    dimension: 'margin',
    unit: '%',
    formula: '(revenue - cost) / revenue × 100 — cible [10%, 30%]',
    thresholds: { low: 2, medium: 5, high: 10 },
    scopes: ['project'],
  },
];

export function getDeviationRule(code: string): DeviationRule | undefined {
  return DEVIATION_RULES.find((r) => r.code === code);
}

export function classifyDeviation(
  rule: DeviationRule,
  absoluteValue: number
): DeviationSeverity {
  const v = Math.abs(absoluteValue);
  if (v >= rule.thresholds.high) return 'high';
  if (v >= rule.thresholds.medium) return 'medium';
  if (v >= rule.thresholds.low) return 'low';
  return 'info';
}
