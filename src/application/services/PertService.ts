/**
 * PertService — moteur PERT UNIQUE (estimation probabiliste).
 *
 * Remplace les implémentations divergentes de `ProjectCalculationService`
 * et `ReportCalculations` : une seule formule bêta (O + 4M + P) / 6, une seule
 * variance ((P − O) / 6)², aucune activité fictive.
 *
 * Règle métier : la durée PERT est une ESTIMATION. La durée de référence
 * affichée dans les en-têtes reste la durée calendaire du projet.
 *
 * Pure TS — aucun import React.
 */

export interface PertActivityInput {
  id?: string;
  name?: string | null;
  /** Durée la plus probable (jours). À défaut, calculée depuis les dates. */
  durationDays?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  optimistic?: number | null;
  pessimistic?: number | null;
}

export interface PertActivity {
  id: string;
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  pertEstimate: number;
  standardDeviation: number;
  variance: number;
}

export interface PertResult {
  activities: PertActivity[];
  expectedDurations: Record<string, number>;
  variances: Record<string, number>;
  criticalPath: string[];
  /** Somme des estimations PERT (jours), 2 décimales. */
  totalExpectedDuration: number;
  /** Écart-type global (racine de la somme des variances). */
  standardDeviation: number;
  /** false quand aucune activité réelle n'est exploitable. */
  isEstimated: boolean;
}

const OPTIMISTIC_FACTOR = 0.8;
const PESSIMISTIC_FACTOR = 1.5;

const round2 = (n: number): number => Number(n.toFixed(2));

const durationOf = (activity: PertActivityInput): number => {
  const explicit = Number(activity.durationDays);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (activity.startDate && activity.endDate) {
    const start = new Date(activity.startDate as string).getTime();
    const end = new Date(activity.endDate as string).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return (end - start) / 86400000;
    }
  }
  return 0;
};

export class PertService {
  static compute(activitiesInput: PertActivityInput[] = []): PertResult {
    const activities: PertActivity[] = (activitiesInput || [])
      .map((raw, index) => {
        const mostLikely = durationOf(raw);
        if (mostLikely <= 0) return null;
        const optimistic =
          Number.isFinite(Number(raw.optimistic)) && Number(raw.optimistic) > 0
            ? Number(raw.optimistic)
            : mostLikely * OPTIMISTIC_FACTOR;
        const pessimistic =
          Number.isFinite(Number(raw.pessimistic)) && Number(raw.pessimistic) > optimistic
            ? Number(raw.pessimistic)
            : mostLikely * PESSIMISTIC_FACTOR;
        const pertEstimate = (optimistic + 4 * mostLikely + pessimistic) / 6;
        const standardDeviation = (pessimistic - optimistic) / 6;
        return {
          id: raw.id || `activity-${index}`,
          name: raw.name || `Activité ${index + 1}`,
          optimistic: round2(optimistic),
          mostLikely: round2(mostLikely),
          pessimistic: round2(pessimistic),
          pertEstimate: round2(pertEstimate),
          standardDeviation: round2(standardDeviation),
          variance: round2(standardDeviation ** 2),
        } as PertActivity;
      })
      .filter((a): a is PertActivity => a !== null);

    const expectedDurations: Record<string, number> = {};
    const variances: Record<string, number> = {};
    for (const a of activities) {
      expectedDurations[a.id] = a.pertEstimate;
      variances[a.id] = a.variance;
    }

    const totalExpectedDuration = round2(activities.reduce((sum, a) => sum + a.pertEstimate, 0));
    const standardDeviation = round2(
      Math.sqrt(activities.reduce((sum, a) => sum + a.variance, 0)),
    );

    return {
      activities,
      expectedDurations,
      variances,
      criticalPath: activities.map((a) => a.id),
      totalExpectedDuration,
      standardDeviation,
      isEstimated: activities.length > 0,
    };
  }

  /** Probabilité (approx. normale) de tenir une durée cible en jours. */
  static probabilityOfDuration(result: PertResult, targetDays: number | null | undefined): number | null {
    if (!result.isEstimated || !Number.isFinite(Number(targetDays))) return null;
    if (result.standardDeviation <= 0) return result.totalExpectedDuration <= Number(targetDays) ? 100 : 0;
    const z = (Number(targetDays) - result.totalExpectedDuration) / result.standardDeviation;
    // Approximation de la fonction de répartition normale (Zelen & Severo).
    const cdf = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI)));
    return round2(Math.max(0, Math.min(1, cdf)) * 100);
  }
}
