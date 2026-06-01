/**
 * Weighting Models Referential
 *
 * Définit les modèles de pondération utilisés par WeightedProgressCalculator
 * pour calculer le TEP (taux d'exécution physique).
 *
 * - Pareto : pondération 80/20 sur les tâches critiques
 * - SOMELEC : équilibrée par étape standard infra électrique
 * - ETER : pondération orientée chantier entretien routier
 */

export interface WeightingModel {
  code: string;
  label: { fr: string; en?: string };
  description?: { fr: string };
  /** Poids par défaut par code de phase/étape (somme indicative = 100). */
  defaultWeights: Record<string, number>;
  /** Type de projet cible (informatif). */
  applicableProjectTypes?: string[];
}

export const WEIGHTING_MODELS: WeightingModel[] = [
  {
    code: 'pareto',
    label: { fr: 'Pareto 80/20' },
    description: { fr: '80 % du poids sur 20 % des tâches critiques' },
    defaultWeights: { CRITICAL: 80, STANDARD: 20 },
  },
  {
    code: 'somelec_standard',
    label: { fr: 'SOMELEC standard' },
    defaultWeights: {
      PLANIFICATION: 15,
      DAO: 10,
      ATTRIBUTION: 5,
      EXECUTION: 55,
      RECEPTION: 10,
      CLOTURE: 5,
    },
    applicableProjectTypes: ['SOMELEC_INFRA'],
  },
  {
    code: 'eter_road_maintenance',
    label: { fr: 'ETER entretien routier' },
    defaultWeights: {
      MOBILISATION: 10,
      TERRASSEMENT: 30,
      REVETEMENT: 40,
      SIGNALISATION: 10,
      RECEPTION: 10,
    },
    applicableProjectTypes: ['ETER'],
  },
];

export function getWeightingModel(code: string): WeightingModel | undefined {
  return WEIGHTING_MODELS.find((m) => m.code === code);
}

export function getDefaultWeightingForProjectType(projectType?: string): WeightingModel {
  if (projectType) {
    const m = WEIGHTING_MODELS.find((w) => w.applicableProjectTypes?.includes(projectType));
    if (m) return m;
  }
  return WEIGHTING_MODELS[0];
}
