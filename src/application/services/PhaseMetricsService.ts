/**
 * PhaseMetricsService — source unique de vérité des métriques d'une phase.
 *
 * Architecture Hexagonale :
 * - Pur TypeScript (aucun hook, aucun accès Supabase, aucun React)
 * - Consommé par les hooks (usePhaseDetails, usePhasePayments) puis par l'UI
 * - Toute progression affichée dans l'application passe par `normalizeProgressPercent`
 *   afin d'éviter les valeurs aberrantes (ex : 807500% causé par un montant
 *   mappé à tort sur un pourcentage).
 */

export interface PhaseProgressInput {
  /** Progression persistée en base (0-100). */
  storedProgress?: number | null;
  /** Tâches de la phase. */
  totalTasks?: number;
  completedTasks?: number;
  /** Étapes (steps) de la phase. */
  stepsCount?: number;
  completedSteps?: number;
  /** Progression maximale constatée sur les paiements (décomptes). */
  paymentsProgress?: number | null;
}

export type PhaseProgressSource = 'stored' | 'tasks' | 'steps' | 'payments' | 'none';

export interface PhaseProgressResult {
  /** Valeur retenue, toujours bornée à [0, 100]. */
  value: number;
  /** Origine de la valeur retenue (traçabilité UI). */
  source: PhaseProgressSource;
  /** Progression calculée depuis les tâches (null si aucune tâche). */
  tasksProgress: number | null;
  /** Progression calculée depuis les étapes (null si aucune étape). */
  stepsProgress: number | null;
  /** Progression déclarée sur les paiements (null si aucun paiement chiffré). */
  paymentsProgress: number | null;
  /** true si la valeur persistée diverge de la valeur dérivée (> 5 points). */
  isDivergent: boolean;
  /** Valeur dérivée des faits (tâches > étapes > paiements). */
  derivedValue: number | null;
}

export interface PhaseFinancialsInput {
  estimatedCost?: number | null;
  actualCost?: number | null;
  paymentAmounts?: number[];
}

export interface PhaseFinancialsResult {
  budget: number;
  /** Dépensé = max(coût réel saisi, somme des paiements). */
  spent: number;
  paidAmount: number;
  remaining: number;
  /** Taux de consommation budgétaire (0-100+, non borné : un dépassement doit se voir). */
  consumptionRate: number;
  isOverBudget: boolean;
}

export interface PhaseCompletionInput {
  progress: number;
  totalTasks?: number;
  completedTasks?: number;
  stepsCount?: number;
  completedSteps?: number;
  requiredProgress?: number;
}

export interface PhaseCompletionResult {
  canComplete: boolean;
  reasons: string[];
  /** Clés i18n des blocages (l'UI résout les libellés). */
  reasonKeys: string[];
  progressMet: boolean;
  requiredProgress: number;
  currentProgress: number;
}

const DIVERGENCE_TOLERANCE = 5;
const DEFAULT_REQUIRED_PROGRESS = 100;

/**
 * Borne et nettoie un pourcentage. Toute valeur non finie devient 0,
 * toute valeur > 100 est ramenée à 100 (protection anti « 807500% »).
 */
export function normalizeProgressPercent(value: unknown): number {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num * 100) / 100;
}

const ratio = (done: number, total: number): number | null =>
  total > 0 ? normalizeProgressPercent((done / total) * 100) : null;

/**
 * Calcule la progression d'une phase depuis les faits (tâches, étapes, paiements)
 * et la confronte à la valeur persistée.
 */
export class PhaseMetricsService {
  static computeProgress(input: PhaseProgressInput): PhaseProgressResult {
    const tasksProgress = ratio(input.completedTasks ?? 0, input.totalTasks ?? 0);
    const stepsProgress = ratio(input.completedSteps ?? 0, input.stepsCount ?? 0);
    const paymentsProgress =
      input.paymentsProgress == null ? null : normalizeProgressPercent(input.paymentsProgress);

    const derivedValue = tasksProgress ?? stepsProgress ?? paymentsProgress;
    const stored = input.storedProgress == null ? null : normalizeProgressPercent(input.storedProgress);

    let value: number;
    let source: PhaseProgressSource;

    if (stored != null && stored > 0) {
      value = stored;
      source = 'stored';
    } else if (derivedValue != null) {
      value = derivedValue;
      source = tasksProgress != null ? 'tasks' : stepsProgress != null ? 'steps' : 'payments';
    } else {
      value = 0;
      source = 'none';
    }

    const isDivergent =
      stored != null && derivedValue != null && Math.abs(stored - derivedValue) > DIVERGENCE_TOLERANCE;

    return { value, source, tasksProgress, stepsProgress, paymentsProgress, isDivergent, derivedValue };
  }

  /** Agrège le budget et les dépenses réelles d'une phase. */
  static computeFinancials(input: PhaseFinancialsInput): PhaseFinancialsResult {
    const budget = Math.max(0, Number(input.estimatedCost) || 0);
    const paidAmount = (input.paymentAmounts ?? []).reduce(
      (sum, amount) => sum + (Number.isFinite(amount) ? Number(amount) : 0),
      0
    );
    const actualCost = Math.max(0, Number(input.actualCost) || 0);
    const spent = Math.max(actualCost, paidAmount);
    const remaining = budget - spent;
    const consumptionRate = budget > 0 ? Math.round((spent / budget) * 10000) / 100 : 0;

    return {
      budget,
      spent,
      paidAmount,
      remaining,
      consumptionRate,
      isOverBudget: budget > 0 && spent > budget,
    };
  }

  /**
   * Détermine si une phase peut être clôturée et expose les motifs de blocage
   * sous forme de clés i18n (l'UI ne construit aucun libellé métier).
   */
  static computeCompletionReadiness(input: PhaseCompletionInput): PhaseCompletionResult {
    const requiredProgress = input.requiredProgress ?? DEFAULT_REQUIRED_PROGRESS;
    const currentProgress = normalizeProgressPercent(input.progress);
    const reasonKeys: string[] = [];
    const reasons: string[] = [];

    const progressMet = currentProgress >= requiredProgress;
    if (!progressMet) {
      reasonKeys.push('phase.completion.progress_insufficient');
      reasons.push(`Progression ${currentProgress}% < ${requiredProgress}%`);
    }

    const totalTasks = input.totalTasks ?? 0;
    const completedTasks = input.completedTasks ?? 0;
    if (totalTasks > 0 && completedTasks < totalTasks) {
      reasonKeys.push('phase.completion.tasks_pending');
      reasons.push(`${totalTasks - completedTasks} tâche(s) non terminée(s)`);
    }

    const stepsCount = input.stepsCount ?? 0;
    const completedSteps = input.completedSteps ?? 0;
    if (stepsCount > 0 && completedSteps < stepsCount) {
      reasonKeys.push('phase.completion.steps_pending');
      reasons.push(`${stepsCount - completedSteps} étape(s) non terminée(s)`);
    }

    return {
      canComplete: reasonKeys.length === 0,
      reasons,
      reasonKeys,
      progressMet,
      requiredProgress,
      currentProgress,
    };
  }
}

export const getPhaseMetricsService = (): typeof PhaseMetricsService => PhaseMetricsService;
