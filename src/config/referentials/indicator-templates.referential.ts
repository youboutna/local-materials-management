/**
 * Indicator Templates Referential — TBI (Tableau de Bord des Indicateurs)
 *
 * Source de vérité pour CPI, SPI, TEP, marge, etc.
 * Chaque indicateur : formule, unité, seuils (vert/orange/rouge), niveau de résultat.
 * Aucun seuil ne doit être codé en dur dans l'UI.
 */

export type IndicatorLevel = 'product' | 'outcome' | 'impact';
export type IndicatorDirection = 'higher_is_better' | 'lower_is_better' | 'target_band';

export interface IndicatorThresholds {
  /** Seuil bas. Pour higher_is_better: < red = rouge. Pour lower_is_better: > red = rouge. */
  red: number;
  /** Seuil intermédiaire (orange/jaune). */
  amber: number;
  /** Optionnel : bornes cibles pour target_band. */
  targetMin?: number;
  targetMax?: number;
}

export interface IndicatorTemplate {
  code: string;
  label: { fr: string; en?: string; ar?: string };
  description?: { fr: string; en?: string };
  unit: '%' | 'ratio' | 'MRU' | 'days' | 'pts';
  level: IndicatorLevel;
  direction: IndicatorDirection;
  /** Formule lisible (documentation). Le calcul réel est dans le service. */
  formula: string;
  thresholds: IndicatorThresholds;
  /** Codes des types de projet pour lesquels l'indicateur est pertinent. Vide = tous. */
  applicableProjectTypes?: string[];
  applicableTo?: Array<'project' | 'phase' | 'task'>;
  dataSource?: 'planning' | 'budget' | 'dqe' | 'inspection' | 'manual';
  calculationFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
}

export const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  {
    code: 'CPI',
    label: { fr: 'Indice de performance des coûts', en: 'Cost Performance Index' },
    description: { fr: 'Valeur acquise / coût réel — efficacité financière' },
    unit: 'ratio',
    level: 'outcome',
    direction: 'higher_is_better',
    formula: 'earnedValue / actualCost',
    thresholds: { red: 0.9, amber: 1.0 },
    applicableTo: ['project', 'phase'], dataSource: 'budget', calculationFrequency: 'monthly',
  },
  {
    code: 'SPI',
    label: { fr: 'Indice de performance des délais', en: 'Schedule Performance Index' },
    description: { fr: 'Valeur acquise / valeur planifiée — efficacité planning' },
    unit: 'ratio',
    level: 'outcome',
    direction: 'higher_is_better',
    formula: 'earnedValue / plannedValue',
    thresholds: { red: 0.9, amber: 1.0 },
    applicableTo: ['project', 'phase', 'task'], dataSource: 'planning', calculationFrequency: 'weekly',
  },
  {
    code: 'TEP',
    label: { fr: "Taux d'exécution physique", en: 'Physical execution rate' },
    description: { fr: 'Avancement pondéré par les poids du référentiel' },
    unit: '%',
    level: 'product',
    direction: 'higher_is_better',
    formula: 'Σ(taskProgress × taskWeight) / Σ(taskWeight)',
    thresholds: { red: 50, amber: 75 },
    applicableTo: ['project', 'phase', 'task'], dataSource: 'planning', calculationFrequency: 'weekly',
  },
  {
    code: 'TEF',
    label: { fr: "Taux d'exécution financière", en: 'Financial execution rate' },
    description: { fr: 'Engagements réels / budget prévisionnel' },
    unit: '%',
    level: 'outcome',
    direction: 'higher_is_better',
    formula: 'actualCost / plannedBudget × 100',
    thresholds: { red: 50, amber: 70 },
  },
  {
    code: 'MARGIN_ETER',
    label: { fr: 'Marge bénéficiaire ETER' },
    description: { fr: 'Marge cible : 10–30 % pour les chantiers entretien routier' },
    unit: '%',
    level: 'outcome',
    direction: 'target_band',
    formula: '(revenue - cost) / revenue × 100',
    thresholds: { red: 5, amber: 10, targetMin: 10, targetMax: 30 },
    applicableProjectTypes: ['ETER'],
  },
  {
    code: 'DURATION_VARIANCE',
    label: { fr: 'Écart de durée', en: 'Duration variance' },
    description: { fr: 'Jours de retard cumulés' },
    unit: 'days',
    level: 'product',
    direction: 'lower_is_better',
    formula: 'actualEnd - plannedEnd',
    thresholds: { red: 15, amber: 5 },
  },
];

/**
 * Détermine le statut feu tricolore d'un indicateur en fonction de sa valeur.
 */
export type IndicatorStatus = 'green' | 'amber' | 'red' | 'unknown';

export function evaluateIndicator(
  template: IndicatorTemplate,
  value: number | null | undefined
): IndicatorStatus {
  if (value === null || value === undefined || Number.isNaN(value)) return 'unknown';
  const { red, amber, targetMin, targetMax } = template.thresholds;
  switch (template.direction) {
    case 'higher_is_better':
      if (value >= amber) return 'green';
      if (value >= red) return 'amber';
      return 'red';
    case 'lower_is_better':
      if (value <= amber) return 'green';
      if (value <= red) return 'amber';
      return 'red';
    case 'target_band': {
      if (targetMin !== undefined && targetMax !== undefined) {
        if (value >= targetMin && value <= targetMax) return 'green';
        if (value >= red && value < targetMin) return 'amber';
        if (value > targetMax) return 'amber';
      }
      return 'red';
    }
    default:
      return 'unknown';
  }
}

export function getIndicatorTemplate(code: string): IndicatorTemplate | undefined {
  return INDICATOR_TEMPLATES.find((i) => i.code === code);
}

export function getIndicatorsForProjectType(projectType?: string): IndicatorTemplate[] {
  if (!projectType) return INDICATOR_TEMPLATES.filter((i) => !i.applicableProjectTypes);
  return INDICATOR_TEMPLATES.filter(
    (i) => !i.applicableProjectTypes || i.applicableProjectTypes.includes(projectType)
  );
}
