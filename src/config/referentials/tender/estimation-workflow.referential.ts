/**
 * Tender estimation referential — workflow steps of the estimator and
 * reusable estimate templates (BOQ seed lines).
 *
 * Rule (docs/ARCHITECTURE_REFERENTIELS.md): no business list hardcoded in UI.
 * The estimator UI only renders what this referential declares.
 *
 * @see docs/ARCHITECTURE_REFERENTIELS.md
 */

export type TenderEstimationStepCode =
  | 'analysis'
  | 'quantitative'
  | 'pricing'
  | 'review';

export interface TenderEstimationStepDefinition {
  code: TenderEstimationStepCode;
  title: string;
  description: string;
  /** Tab of the estimator this step drives (used to focus the workspace). */
  targetTab: 'workflow' | 'calculator' | 'devis' | 'templates' | 'analysis';
  order: number;
}

export const TENDER_ESTIMATION_STEPS: TenderEstimationStepDefinition[] = [
  {
    code: 'analysis',
    title: 'Analyse des Documents',
    description: 'Analyser les documents du tender et extraire les informations',
    targetTab: 'devis',
    order: 1,
  },
  {
    code: 'quantitative',
    title: 'Calcul Quantitatif',
    description: 'Utiliser le calculateur de métré pour estimer les quantités',
    targetTab: 'calculator',
    order: 2,
  },
  {
    code: 'pricing',
    title: 'Estimation des Prix',
    description: 'Appliquer les prix unitaires et calculer les coûts',
    targetTab: 'devis',
    order: 3,
  },
  {
    code: 'review',
    title: 'Révision et Validation',
    description: "Réviser l'estimation complète avant soumission",
    targetTab: 'analysis',
    order: 4,
  },
];

export type TenderEstimateTemplateCategory =
  | 'material'
  | 'labor'
  | 'equipment'
  | 'overhead';

export interface TenderEstimateTemplateItem {
  description: string;
  category: TenderEstimateTemplateCategory;
  unit: string;
  estimatedQuantity: number;
  estimatedUnitPrice: number;
}

export interface TenderEstimateTemplate {
  id: string;
  name: string;
  description: string;
  /** Fiscal profile code from BOQ_FISCAL_PROFILES applied to seeded lines. */
  fiscalProfileCode: string;
  items: TenderEstimateTemplateItem[];
}

export const TENDER_ESTIMATE_TEMPLATES: TenderEstimateTemplate[] = [
  {
    id: 'construction_building',
    name: 'Construction Bâtiment',
    description: 'Template pour construction de bâtiments résidentiels',
    fiscalProfileCode: 'MR_STANDARD',
    items: [
      { description: 'Dalle béton armé', category: 'material', unit: 'm³', estimatedQuantity: 0, estimatedUnitPrice: 95000 },
      { description: 'Mur en maçonnerie', category: 'material', unit: 'm²', estimatedQuantity: 0, estimatedUnitPrice: 8500 },
      { description: "Main d'œuvre spécialisée", category: 'labor', unit: 'h', estimatedQuantity: 0, estimatedUnitPrice: 1500 },
    ],
  },
  {
    id: 'road_infrastructure',
    name: 'Infrastructure Routière',
    description: 'Template pour projets routiers',
    fiscalProfileCode: 'MR_STANDARD',
    items: [
      { description: 'Terrassement', category: 'material', unit: 'm³', estimatedQuantity: 0, estimatedUnitPrice: 4500 },
      { description: 'Revêtement bitumineux', category: 'material', unit: 'm²', estimatedQuantity: 0, estimatedUnitPrice: 12000 },
    ],
  },
];

export function getTenderEstimationSteps(): TenderEstimationStepDefinition[] {
  return [...TENDER_ESTIMATION_STEPS].sort((a, b) => a.order - b.order);
}

export function getTenderEstimateTemplate(id: string): TenderEstimateTemplate | undefined {
  return TENDER_ESTIMATE_TEMPLATES.find((t) => t.id === id);
}
