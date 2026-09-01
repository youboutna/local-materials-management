/**
 * Référentiel « socle projet » — sert à compléter automatiquement un projet
 * importé ou créé vide : répartition du budget sur les phases, lignes DQE
 * prévisionnelles par famille de ressources, et règles de bascule de statut
 * des phases en fonction du calendrier.
 *
 * Doctrine : aucune valeur métier codée en dur dans les services ou l'UI.
 */

export type BaselineFamily = 'material' | 'labor' | 'equipment';

export interface BaselineLineTemplate {
  /** Code de ligne DQE (nomenclature interne réutilisable). */
  code: string;
  designationFr: string;
  designationAr: string;
  designationEn: string;
  /** Famille de ressource déduite côté planification. */
  family: BaselineFamily;
  /** Unité du référentiel des unités (forfait par défaut pour un socle). */
  unit: string;
  /** Part du budget de la phase affectée à cette ligne (somme = 1). */
  share: number;
  /** Catégorie DQE (référentiel DQE_CATEGORIES). */
  category: string;
}

export interface ProjectBaselineReferential {
  code: string;
  label: string;
  /** Poids budgétaires par position de phase (fallback : répartition égale). */
  phaseWeights: number[];
  /** Modèle de lignes DQE générées pour chaque phase. */
  lineTemplates: BaselineLineTemplate[];
  /** Type de cycle documentaire des lignes générées. */
  dqeType: string;
  /** Statut des lignes générées (doit être transférable vers le WBS). */
  lineStatus: 'submitted';
  /** Tolérance (jours) avant de basculer une phase en cours. */
  statusRules: {
    startToleranceDays: number;
    /** Progression minimale pour clôturer automatiquement une phase. */
    autoCompleteProgress: number;
  };
}

export const PROJECT_BASELINE_REFERENTIAL: ProjectBaselineReferential = {
  code: 'MR_BTP_BASELINE',
  label: 'Socle projet BTP – Mauritanie',
  phaseWeights: [0.1, 0.2, 0.4, 0.2, 0.1],
  dqeType: 'previsionnel',
  lineStatus: 'submitted',
  lineTemplates: [
    {
      code: 'SOC-MAT',
      designationFr: 'Fournitures et matériaux',
      designationAr: 'اللوازم والمواد',
      designationEn: 'Supplies and materials',
      family: 'material',
      unit: 'ff',
      share: 0.55,
      category: 'materiaux',
    },
    {
      code: 'SOC-MO',
      designationFr: "Main d'œuvre et prestations",
      designationAr: 'اليد العاملة والخدمات',
      designationEn: 'Labour and services',
      family: 'labor',
      unit: 'ff',
      share: 0.3,
      category: 'main_oeuvre',
    },
    {
      code: 'SOC-EQP',
      designationFr: 'Équipements et engins',
      designationAr: 'التجهيزات والآليات',
      designationEn: 'Equipment and plant',
      family: 'equipment',
      unit: 'ff',
      share: 0.15,
      category: 'equipements',
    },
  ],
  statusRules: {
    startToleranceDays: 0,
    autoCompleteProgress: 100,
  },
};

/** Poids budgétaire d'une phase selon sa position (fallback : équirépartition). */
export function resolveBaselinePhaseWeights(phaseCount: number): number[] {
  if (phaseCount <= 0) return [];
  const configured = PROJECT_BASELINE_REFERENTIAL.phaseWeights;
  if (phaseCount === configured.length) return [...configured];
  return Array.from({ length: phaseCount }, () => 1 / phaseCount);
}

/** Désignation localisée d'un modèle de ligne socle. */
export function baselineDesignation(
  template: BaselineLineTemplate,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  if (lang === 'ar') return template.designationAr;
  if (lang === 'en') return template.designationEn;
  return template.designationFr;
}
