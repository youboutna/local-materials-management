/**
 * Référentiel générique « Suivi & Évaluation » des rapports projet.
 *
 * Lego métier applicable à TOUT type de projet (énergie, BTP, hydraulique,
 * social, numérique…). Chaque axe décrit une question de décision et
 * l'indicateur réel qui l'éclaire. Aucune valeur codée en dur dans l'UI :
 * les composants PDF consomment ce référentiel via
 * `buildMonitoringInsights()` (src/utils/monitoringInsights.ts).
 */

export type MonitoringAxisCode =
  | 'planification'
  | 'avancement'
  | 'execution_budgetaire'
  | 'couverture_territoriale'
  | 'controle_qualite'
  | 'documentation'
  | 'maitrise_risques';

export type MonitoringUnit = 'percent' | 'count' | 'index';

export interface MonitoringAxis {
  code: MonitoringAxisCode;
  order: number;
  /** Libellé de l'axe de suivi. */
  label: string;
  /** Question de décision à laquelle l'axe répond. */
  decisionQuestion: string;
  /** Libellé de l'indicateur affiché. */
  indicatorLabel: string;
  unit: MonitoringUnit;
  /** Seuils d'appréciation (sur la valeur de l'indicateur). */
  thresholds?: { good: number; warning: number };
  /** true si un indicateur plus bas est meilleur (ex. risques critiques). */
  lowerIsBetter?: boolean;
}

export const MONITORING_AXES: Record<MonitoringAxisCode, MonitoringAxis> = {
  planification: {
    code: 'planification',
    order: 1,
    label: 'Planification',
    decisionQuestion: 'Le projet est-il structuré en phases exploitables ?',
    indicatorLabel: 'Phases planifiées',
    unit: 'count',
    thresholds: { good: 3, warning: 1 },
  },
  avancement: {
    code: 'avancement',
    order: 2,
    label: 'Avancement physique',
    decisionQuestion: 'Où en est la réalisation sur le terrain ?',
    indicatorLabel: 'Progression (%)',
    unit: 'percent',
    thresholds: { good: 75, warning: 40 },
  },
  execution_budgetaire: {
    code: 'execution_budgetaire',
    order: 3,
    label: 'Exécution budgétaire',
    decisionQuestion: 'Les crédits sont-ils consommés au rythme des travaux ?',
    indicatorLabel: 'Budget engagé (%)',
    unit: 'percent',
    thresholds: { good: 80, warning: 40 },
  },
  couverture_territoriale: {
    code: 'couverture_territoriale',
    order: 4,
    label: 'Couverture territoriale',
    decisionQuestion: "Quelle est l'emprise géographique du projet ?",
    indicatorLabel: "Zones d'intervention",
    unit: 'count',
    thresholds: { good: 2, warning: 1 },
  },
  controle_qualite: {
    code: 'controle_qualite',
    order: 5,
    label: 'Contrôle & supervision',
    decisionQuestion: 'Le projet est-il effectivement contrôlé ?',
    indicatorLabel: 'Inspections réalisées',
    unit: 'count',
    thresholds: { good: 3, warning: 1 },
  },
  documentation: {
    code: 'documentation',
    order: 6,
    label: 'Documentation & conformité',
    decisionQuestion: 'Les pièces justificatives sont-elles disponibles ?',
    indicatorLabel: 'Documents enregistrés',
    unit: 'count',
    thresholds: { good: 5, warning: 1 },
  },
  maitrise_risques: {
    code: 'maitrise_risques',
    order: 7,
    label: 'Maîtrise des risques',
    decisionQuestion: 'Des risques non traités menacent-ils le projet ?',
    indicatorLabel: 'Risques élevés ouverts',
    unit: 'count',
    thresholds: { good: 0, warning: 2 },
    lowerIsBetter: true,
  },
};

export const MONITORING_AXIS_LIST: MonitoringAxis[] = Object.values(MONITORING_AXES).sort(
  (a, b) => a.order - b.order,
);
