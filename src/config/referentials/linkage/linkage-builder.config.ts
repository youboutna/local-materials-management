/**
 * Configuration du builder de liaison stratégique pour le workflow projet
 * Toutes les sections et tous les champs sont optionnels.
 */
import type { MultiLangLabel } from '../strategies/scapp-national-strategy.referential';

export interface LinkageSectionConfig {
  code: 'STRATEGY' | 'OBJECTIVES' | 'BUDGET' | 'JUSTIFICATION';
  label: MultiLangLabel;
  description: MultiLangLabel;
  order: number;
}

export const linkageSections: LinkageSectionConfig[] = [
  {
    code: 'STRATEGY',
    label: { code: 'SEC_STRATEGY', fr: 'Rattachement stratégique', ar: 'الربط الاستراتيجي', en: 'Strategic linkage' },
    description: { code: 'SEC_STRATEGY_DESC', fr: 'Liez votre projet à la SCAPP (optionnel).', ar: 'اربط مشروعك بالاستراتيجية الوطنية.', en: 'Link your project to the National Strategy.' },
    order: 1,
  },
  {
    code: 'OBJECTIVES',
    label: { code: 'SEC_OBJECTIVES', fr: 'Objectifs mesurables (KPIs)', ar: 'الأهداف القابلة للقياس', en: 'Measurable objectives' },
    description: { code: 'SEC_OBJECTIVES_DESC', fr: 'Associez des objectifs mesurables à votre projet.', ar: 'اربط أهدافا قابلة للقياس بمشروعك.', en: 'Associate measurable objectives with your project.' },
    order: 2,
  },
  {
    code: 'BUDGET',
    label: { code: 'SEC_BUDGET', fr: 'Rattachement budgétaire (LF 2026)', ar: 'الربط الميزانياتي', en: 'Budgetary linkage (FY 2026)' },
    description: { code: 'SEC_BUDGET_DESC', fr: 'Liez votre projet à la Loi de Finances 2026.', ar: 'اربط مشروعك بقانون المالية.', en: 'Link your project to the Finance Law.' },
    order: 3,
  },
  {
    code: 'JUSTIFICATION',
    label: { code: 'SEC_JUSTIF', fr: 'Justification', ar: 'التبرير', en: 'Justification' },
    description: { code: 'SEC_JUSTIF_DESC', fr: 'Justifiez le rattachement stratégique.', ar: 'برر الربط الاستراتيجي.', en: 'Justify the strategic linkage.' },
    order: 4,
  },
];

export interface StrategyLinkageFormState {
  sourceReferential: 'SCAPP' | 'PNDS_2021_2030' | 'SDAU_NKC_2018_2040' | 'OTHER';
  leverCode?: string;
  chantierCode?: string;
  interventionCode?: string;
  objectiveCodes: string[];     // multi-select objectives
  contributionPct: number;       // 0-100
  justification?: string;
}

export interface BudgetLinkageRow {
  ministryCode?: string;
  programCode?: string;
  actionCode?: string;
  chapterCode?: string;
  lineCode?: string;
  allocatedCe: number;
  allocatedCp: number;
  fiscalYear: number;
  notes?: string;
}

export const emptyStrategyForm = (): StrategyLinkageFormState => ({
  sourceReferential: 'SCAPP',
  objectiveCodes: [],
  contributionPct: 0,
});

export const emptyBudgetRow = (): BudgetLinkageRow => ({
  allocatedCe: 0,
  allocatedCp: 0,
  fiscalYear: 2026,
});
