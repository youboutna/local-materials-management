/**
 * EvmService — source UNIQUE des métriques EVM (Earned Value Management).
 *
 * Objectif : supprimer les trois implémentations divergentes (ReportCalculations,
 * ProjectCalculationService, ProjectAnalyticsService) et lever les incohérences :
 *  - CV (cost variance) = EV − AC  (et NON « budget restant »).
 *  - SV (schedule variance) = EV − PV.
 *  - CPI/SPI = `null` quand le dénominateur est nul (AC = 0 ou PV = 0) : on
 *    n'affiche plus « 1.00 / sous budget » alors que l'engagement est à 0 %.
 *  - EV pondéré par phase via PhaseWeightingService (poids explicite → budget → durée).
 *
 * Pure TS — aucun import React.
 */

import {
  PhaseWeightingService,
  type WeightablePhase,
} from '@/application/services/PhaseWeightingService';

export interface EvmInput {
  budget: number;
  /** Avancement projet [0..100] — utilisé seulement si aucune phase exploitable. */
  progress?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  /** Coût réel constaté (paiements + coûts réels de phases). */
  actualCost?: number | null;
  phases?: Array<WeightablePhase & { actualCost?: number | null }>;
  /** Date d'évaluation (par défaut : maintenant). */
  asOf?: Date;
}

export interface EvmResult {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  /** EV − AC : négatif = dépassement de coût. `null` si AC inconnu. */
  costVariance: number | null;
  /** `null` si PV = 0 (projet non démarré). */
  schedulePerformanceIndex: number | null;
  /** `null` si AC = 0 (aucun coût engagé). */
  costPerformanceIndex: number | null;
  budgetAtCompletion: number;
  /** `null` si CPI indéterminé. */
  estimateAtCompletion: number | null;
  estimateToComplete: number | null;
  varianceAtCompletion: number | null;
  /** Avancement retenu [0..100] (TEP pondéré si phases disponibles). */
  progress: number;
  /** Base de pondération utilisée pour le TEP/EV. */
  progressBasis: string;
  /** % d'engagement budgétaire = AC / BAC × 100. */
  budgetCommitmentRate: number;
  costStatus: 'under_budget' | 'on_budget' | 'over_budget' | 'not_available';
  scheduleStatus: 'ahead' | 'on_schedule' | 'behind' | 'not_available';
  /** Écart d'avancement en points : TEP − avancement planifié (négatif = retard). */
  progressGapPoints: number | null;
  /** Avancement planifié temporel [0..100], `null` si dates absentes. */
  plannedProgress: number | null;
}

const num = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : 0;
};

const round2 = (value: number): number => Number(value.toFixed(2));

export class EvmService {
  /** Avancement planifié temporel [0..100] ou null si les dates manquent. */
  static plannedProgress(
    startDate?: string | Date | null,
    endDate?: string | Date | null,
    asOf: Date = new Date(),
  ): number | null {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate as string).getTime();
    const end = new Date(endDate as string).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

    const ratio = (asOf.getTime() - start) / (end - start);
    return round2(Math.max(0, Math.min(1, ratio)) * 100);
  }

  static compute(input: EvmInput): EvmResult {
    const asOf = input.asOf ?? new Date();
    const budget = num(input.budget);
    const phases = input.phases || [];

    // --- Avancement canonique : TEP pondéré si phases exploitables ---
    const weighted = PhaseWeightingService.computeWeightedProgress(phases);
    const progress = weighted.isEmpty
      ? Math.max(0, Math.min(100, num(input.progress)))
      : weighted.progress;

    // --- Coût réel : phases (actual_cost) sinon valeur fournie ---
    const phaseActual = PhaseWeightingService.sumActualCost(phases);
    const actualCost = phaseActual > 0 ? phaseActual : num(input.actualCost);

    // --- Valeurs EVM ---
    const budgetAtCompletion = budget;
    const plannedProgress = this.plannedProgress(input.startDate, input.endDate, asOf);
    const plannedValue = round2(budget * ((plannedProgress ?? 0) / 100));
    const earnedValue = weighted.isEmpty
      ? round2(budget * (progress / 100))
      : PhaseWeightingService.computeEarnedValue(phases, budget);

    const scheduleVariance = round2(earnedValue - plannedValue);
    const costVariance = actualCost > 0 ? round2(earnedValue - actualCost) : null;

    const schedulePerformanceIndex =
      plannedValue > 0 ? Number((earnedValue / plannedValue).toFixed(3)) : null;
    const costPerformanceIndex =
      actualCost > 0 ? Number((earnedValue / actualCost).toFixed(3)) : null;

    const estimateAtCompletion =
      costPerformanceIndex && costPerformanceIndex > 0
        ? round2(budgetAtCompletion / costPerformanceIndex)
        : null;
    const estimateToComplete =
      estimateAtCompletion !== null ? round2(Math.max(0, estimateAtCompletion - actualCost)) : null;
    const varianceAtCompletion =
      estimateAtCompletion !== null ? round2(budgetAtCompletion - estimateAtCompletion) : null;

    // --- Statuts explicites, jamais « sous budget » par défaut ---
    let costStatus: EvmResult['costStatus'] = 'not_available';
    if (costPerformanceIndex !== null) {
      if (costPerformanceIndex > 1.02) costStatus = 'under_budget';
      else if (costPerformanceIndex < 0.98) costStatus = 'over_budget';
      else costStatus = 'on_budget';
    }

    let scheduleStatus: EvmResult['scheduleStatus'] = 'not_available';
    if (schedulePerformanceIndex !== null) {
      if (schedulePerformanceIndex > 1.02) scheduleStatus = 'ahead';
      else if (schedulePerformanceIndex < 0.98) scheduleStatus = 'behind';
      else scheduleStatus = 'on_schedule';
    }

    return {
      plannedValue,
      earnedValue,
      actualCost: round2(actualCost),
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex,
      budgetAtCompletion,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
      progress,
      progressBasis: weighted.isEmpty ? 'project' : weighted.basis,
      budgetCommitmentRate: budget > 0 ? round2((actualCost / budget) * 100) : 0,
      costStatus,
      scheduleStatus,
      // Signe cohérent : négatif = retard (avant, un retard s'affichait « +75 pts »).
      progressGapPoints: plannedProgress !== null ? round2(progress - plannedProgress) : null,
      plannedProgress,
    };
  }

  /**
   * Vue compatible avec l'ancien contrat `EVMMetrics` (champs non nullables).
   * Les indices indéterminés sont exposés à 0 et signalés par les drapeaux
   * `hasActualCost` / `hasPlannedValue` pour que l'UI affiche « N/A ».
   */
  static toLegacyMetrics(result: EvmResult) {
    return {
      plannedValue: result.plannedValue,
      earnedValue: result.earnedValue,
      actualCost: result.actualCost,
      scheduleVariance: result.scheduleVariance,
      costVariance: result.costVariance ?? 0,
      schedulePerformanceIndex: result.schedulePerformanceIndex ?? 0,
      costPerformanceIndex: result.costPerformanceIndex ?? 0,
      budgetAtCompletion: result.budgetAtCompletion,
      estimateAtCompletion: result.estimateAtCompletion ?? result.budgetAtCompletion,
      estimateToComplete: result.estimateToComplete ?? Math.max(0, result.budgetAtCompletion - result.actualCost),
      varianceAtCompletion: result.varianceAtCompletion ?? 0,
      // Métadonnées additionnelles (optionnelles côté consommateurs).
      hasActualCost: result.costPerformanceIndex !== null,
      hasPlannedValue: result.schedulePerformanceIndex !== null,
      progress: result.progress,
      progressBasis: result.progressBasis,
      budgetCommitmentRate: result.budgetCommitmentRate,
      costStatus: result.costStatus,
      scheduleStatus: result.scheduleStatus,
      progressGapPoints: result.progressGapPoints,
      plannedProgress: result.plannedProgress,
    };
  }
}
