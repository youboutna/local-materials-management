/**
 * PhaseWeightingService — source unique de vérité pour la pondération des phases.
 *
 * Cascade de résolution du poids (première règle applicable) :
 *  1. Poids explicite (`weight`) saisi/persisté et significatif (> 0).
 *  2. Poids budgétaire  : budget de la phase / budget total des phases.
 *  3. Poids temporel    : durée de la phase / durée totale des phases.
 *  4. Poids égalitaire  : 1 / nombre de phases.
 *
 * Les poids sont toujours normalisés pour sommer à 1 — la base autorise un
 * défaut `0.1` par phase, ce qui ne somme pas à 1 dès qu'il y a ≠ 10 phases.
 *
 * Pure TS — aucun import React (règle « No React in Services »).
 */

export type PhaseWeightBasis = 'explicit' | 'budget' | 'duration' | 'equal';

export interface WeightablePhase {
  id?: string;
  name?: string;
  /** Poids explicite [0..1] ou [0..100] — normalisé ensuite. */
  weight?: number | null;
  /** Budget (ou coût estimé) de la phase. */
  budget?: number | null;
  estimatedCost?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  /** Avancement physique [0..100]. */
  progress?: number | null;
}

export interface PhaseWeight {
  phaseId: string;
  name: string;
  /** Poids normalisé [0..1]. */
  weight: number;
  progress: number;
  basis: PhaseWeightBasis;
}

export interface WeightedProgressResult {
  /** TEP pondéré [0..100], arrondi à 2 décimales. */
  progress: number;
  basis: PhaseWeightBasis;
  weights: PhaseWeight[];
  /** true si aucune phase exploitable — le TEP ne doit alors pas écraser la valeur projet. */
  isEmpty: boolean;
}

const toNumber = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : 0;
};

const durationDays = (phase: WeightablePhase): number => {
  if (!phase.startDate || !phase.endDate) return 0;
  const start = new Date(phase.startDate as string).getTime();
  const end = new Date(phase.endDate as string).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

const phaseBudget = (phase: WeightablePhase): number =>
  toNumber(phase.budget) || toNumber(phase.estimatedCost);

const clampProgress = (value: unknown): number =>
  Math.max(0, Math.min(100, toNumber(value)));

const round2 = (value: number): number => Number(value.toFixed(2));

export class PhaseWeightingService {
  /**
   * Détermine la base de pondération utilisable pour un jeu de phases.
   */
  static resolveBasis(phases: WeightablePhase[]): PhaseWeightBasis {
    if (!phases || phases.length === 0) return 'equal';

    // 1. Poids explicites : exploitables uniquement si au moins un poids > 0
    //    ET s'ils ne sont pas tous égaux au défaut base (0.1) de façon incohérente.
    const explicit = phases.map((p) => toNumber(p.weight));
    const explicitSum = explicit.reduce((s, w) => s + w, 0);
    const allExplicit = explicit.every((w) => w > 0);
    if (allExplicit && explicitSum > 0) {
      const isDbDefault =
        phases.length !== 10 && explicit.every((w) => Math.abs(w - 0.1) < 1e-9);
      if (!isDbDefault) return 'explicit';
    }

    // 2. Poids budgétaire
    if (phases.some((p) => phaseBudget(p) > 0)) return 'budget';

    // 3. Poids temporel
    if (phases.some((p) => durationDays(p) > 0)) return 'duration';

    return 'equal';
  }

  /**
   * Calcule les poids normalisés (somme = 1) des phases.
   */
  static computeWeights(phases: WeightablePhase[], forcedBasis?: PhaseWeightBasis): PhaseWeight[] {
    if (!phases || phases.length === 0) return [];

    const basis = forcedBasis ?? this.resolveBasis(phases);

    const raw = phases.map((phase) => {
      switch (basis) {
        case 'explicit':
          return toNumber(phase.weight);
        case 'budget':
          return phaseBudget(phase);
        case 'duration':
          return durationDays(phase);
        default:
          return 1;
      }
    });

    const total = raw.reduce((sum, value) => sum + value, 0);

    return phases.map((phase, index) => ({
      phaseId: phase.id || `phase-${index}`,
      name: phase.name || `Phase ${index + 1}`,
      weight: total > 0 ? raw[index] / total : 1 / phases.length,
      progress: clampProgress(phase.progress),
      basis,
    }));
  }

  /**
   * Taux d'exécution physique (TEP) pondéré du projet — valeur canonique
   * de `project.progress` pour tous les rapports.
   */
  static computeWeightedProgress(
    phases: WeightablePhase[],
    forcedBasis?: PhaseWeightBasis,
  ): WeightedProgressResult {
    if (!phases || phases.length === 0) {
      return { progress: 0, basis: 'equal', weights: [], isEmpty: true };
    }

    const weights = this.computeWeights(phases, forcedBasis);
    const progress = weights.reduce((sum, w) => sum + w.weight * w.progress, 0);

    return {
      progress: round2(progress),
      basis: weights[0]?.basis ?? 'equal',
      weights,
      isEmpty: false,
    };
  }

  /**
   * Valeur acquise (EV) pondérée : somme(poids × avancement × budget total).
   * Si les budgets de phase sont connus, on les utilise directement.
   */
  static computeEarnedValue(phases: WeightablePhase[], projectBudget: number): number {
    if (!phases || phases.length === 0) return 0;

    const hasPhaseBudgets = phases.some((p) => phaseBudget(p) > 0);
    if (hasPhaseBudgets) {
      return round2(
        phases.reduce(
          (sum, phase) => sum + phaseBudget(phase) * (clampProgress(phase.progress) / 100),
          0,
        ),
      );
    }

    const { progress } = this.computeWeightedProgress(phases);
    return round2(toNumber(projectBudget) * (progress / 100));
  }

  /** Coût réel agrégé depuis les phases (`actual_cost`), 0 si non renseigné. */
  static sumActualCost(phases: Array<WeightablePhase & { actualCost?: number | null }>): number {
    if (!phases || phases.length === 0) return 0;
    return round2(phases.reduce((sum, phase) => sum + toNumber(phase.actualCost), 0));
  }
}
