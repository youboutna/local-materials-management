/**
 * WeightedProgressCalculator — calcule le TEP (taux d'exécution physique).
 *
 * Utilise un modèle de pondération (`weighting-models.referential.ts`)
 * pour pondérer l'avancement par phase/étape/tâche.
 *
 * Pure TS — aucun import React.
 */

import {
  WeightingModel,
  getDefaultWeightingForProjectType,
  getWeightingModel,
} from '@/config/referentials/weighting-models.referential';

export interface WeightedItem {
  /** Code utilisé pour résoudre le poids dans le modèle (phase code, step code, etc.). */
  code: string;
  /** Avancement [0..100]. */
  progress: number;
  /** Poids explicite (prioritaire sur le modèle). */
  weight?: number;
}

export class WeightedProgressCalculator {
  /**
   * Calcule le TEP pondéré.
   * @param items Liste d'items avec progress (et éventuellement weight explicite).
   * @param model Modèle de pondération (résolu par projectType si absent).
   * @param projectType Type de projet (SOMELEC_INFRA, ETER, ...).
   */
  static compute(
    items: WeightedItem[],
    model?: WeightingModel | string,
    projectType?: string
  ): number {
    if (!items || items.length === 0) return 0;

    const resolvedModel =
      typeof model === 'string'
        ? getWeightingModel(model)
        : model ?? getDefaultWeightingForProjectType(projectType);

    let totalWeight = 0;
    let totalWeighted = 0;

    for (const it of items) {
      const w =
        it.weight ??
        resolvedModel?.defaultWeights?.[it.code] ??
        // fallback : poids égal
        1;
      const p = Math.max(0, Math.min(100, it.progress ?? 0));
      totalWeight += w;
      totalWeighted += w * p;
    }

    if (totalWeight === 0) return 0;
    return Number((totalWeighted / totalWeight).toFixed(1));
  }
}
