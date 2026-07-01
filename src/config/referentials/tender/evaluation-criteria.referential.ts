/**
 * Evaluation Criteria Referential
 * Critères pondérés admin/technique/financier pour l'évaluation des soumissions.
 * Poids modifiables par admin sans redéploiement.
 */

export type EvaluationCategory = 'administrative' | 'technical' | 'financial';

export interface EvaluationCriterion {
  code: string;
  category: EvaluationCategory;
  label: string;
  description: string;
  maxScore: number;
  weight: number; // % dans la catégorie
  required: boolean;
}

export interface CategoryWeighting {
  category: EvaluationCategory;
  label: string;
  globalWeight: number; // % dans le score final
}

/** Pondération globale par défaut — modifiable via admin UI. */
export const DEFAULT_CATEGORY_WEIGHTS: CategoryWeighting[] = [
  { category: 'administrative', label: 'Recevabilité administrative', globalWeight: 20 },
  { category: 'technical', label: 'Valeur technique', globalWeight: 50 },
  { category: 'financial', label: 'Offre financière', globalWeight: 30 },
];

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  // === Administratif ===
  { code: 'adm_registration', category: 'administrative', label: 'Registre de commerce', description: 'RCS valide et à jour', maxScore: 100, weight: 25, required: true },
  { code: 'adm_tax', category: 'administrative', label: 'Attestation fiscale', description: 'À jour des obligations fiscales', maxScore: 100, weight: 25, required: true },
  { code: 'adm_social', category: 'administrative', label: 'Attestation sociale', description: 'Cotisations sociales à jour', maxScore: 100, weight: 25, required: true },
  { code: 'adm_bank_guarantee', category: 'administrative', label: 'Caution de soumission', description: 'Garantie bancaire présentée', maxScore: 100, weight: 25, required: true },

  // === Technique ===
  { code: 'tech_experience', category: 'technical', label: 'Expérience similaire', description: 'Références projets similaires (5 ans)', maxScore: 100, weight: 30, required: true },
  { code: 'tech_team', category: 'technical', label: 'Équipe proposée', description: 'CV, qualifications, effectifs clés', maxScore: 100, weight: 25, required: true },
  { code: 'tech_methodology', category: 'technical', label: 'Méthodologie', description: 'Approche technique et planning détaillé', maxScore: 100, weight: 25, required: true },
  { code: 'tech_equipment', category: 'technical', label: 'Moyens matériels', description: 'Équipements mobilisables', maxScore: 100, weight: 20, required: false },

  // === Financier ===
  { code: 'fin_price', category: 'financial', label: 'Prix global (DQE)', description: 'Score = 100 × (min / offre)', maxScore: 100, weight: 70, required: true },
  { code: 'fin_coherence', category: 'financial', label: 'Cohérence des prix unitaires', description: 'Analyse ratio détaillée', maxScore: 100, weight: 20, required: true },
  { code: 'fin_payment_terms', category: 'financial', label: 'Modalités de paiement', description: 'Échéancier proposé', maxScore: 100, weight: 10, required: false },
];

/** Calcul du score pondéré d'une catégorie. */
export function computeCategoryScore(
  scores: Record<string, number>,
  category: EvaluationCategory,
  criteria: EvaluationCriterion[] = DEFAULT_EVALUATION_CRITERIA,
): number {
  const catCriteria = criteria.filter((c) => c.category === category);
  if (catCriteria.length === 0) return 0;
  const totalWeight = catCriteria.reduce((s, c) => s + c.weight, 0) || 1;
  const weighted = catCriteria.reduce((s, c) => s + (scores[c.code] ?? 0) * (c.weight / totalWeight), 0);
  return Math.round(weighted * 100) / 100;
}

/** Calcul du score global (0-100). */
export function computeGlobalScore(
  scores: Record<string, number>,
  weights: CategoryWeighting[] = DEFAULT_CATEGORY_WEIGHTS,
  criteria: EvaluationCriterion[] = DEFAULT_EVALUATION_CRITERIA,
): { global: number; byCategory: Record<EvaluationCategory, number> } {
  const byCategory = {} as Record<EvaluationCategory, number>;
  let global = 0;
  const totalGlobalWeight = weights.reduce((s, w) => s + w.globalWeight, 0) || 100;
  for (const w of weights) {
    const catScore = computeCategoryScore(scores, w.category, criteria);
    byCategory[w.category] = catScore;
    global += catScore * (w.globalWeight / totalGlobalWeight);
  }
  return { global: Math.round(global * 100) / 100, byCategory };
}

/** Vérifie que tous les critères requis d'une catégorie ont un score. */
export function checkCategoryCompleteness(
  scores: Record<string, number>,
  category: EvaluationCategory,
  criteria: EvaluationCriterion[] = DEFAULT_EVALUATION_CRITERIA,
): { complete: boolean; missing: string[] } {
  const missing = criteria
    .filter((c) => c.category === category && c.required && (scores[c.code] === undefined || scores[c.code] === null))
    .map((c) => c.label);
  return { complete: missing.length === 0, missing };
}
