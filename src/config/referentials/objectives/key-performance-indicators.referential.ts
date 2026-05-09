/**
 * Référentiel KPI unifié - agrège les objectifs mesurables de SCAPP
 */
import {
  getAllObjectives,
  searchObjectives,
  type MeasurableObjective,
  type MultiLangLabel,
} from '../strategies/scapp-national-strategy.referential';

export type { MeasurableObjective as KPIDefinition };

export interface KPICategory {
  code: string;
  label: MultiLangLabel;
  icon: string;
  objectiveCodePrefixes: string[];
}

export const kpiCategories: KPICategory[] = [
  { code: 'ECONOMIC_GROWTH', label: { code: 'CAT_GROWTH', fr: 'Croissance Économique', ar: 'النمو الاقتصادي', en: 'Economic Growth' }, icon: 'TrendingUp', objectiveCodePrefixes: ['OBJ_RICE_', 'OBJ_MEAT_', 'OBJ_MILK_'] },
  { code: 'INFRASTRUCTURE', label: { code: 'CAT_INFRA', fr: 'Infrastructure', ar: 'البنى التحتية', en: 'Infrastructure' }, icon: 'Building', objectiveCodePrefixes: ['OBJ_ELECTRICITY_', 'OBJ_RENEWABLE_'] },
  { code: 'SOCIAL_DEVELOPMENT', label: { code: 'CAT_SOCIAL', fr: 'Développement Social', ar: 'التنمية الاجتماعية', en: 'Social Development' }, icon: 'Users', objectiveCodePrefixes: ['OBJ_MATERNAL_', 'OBJ_INFANT_', 'OBJ_HEALTH_'] },
  { code: 'GOVERNANCE', label: { code: 'CAT_GOV', fr: 'Gouvernance', ar: 'الحكامة', en: 'Governance' }, icon: 'Shield', objectiveCodePrefixes: ['OBJ_PRETRIAL_'] },
];

export const unifiedKPIDatabase: MeasurableObjective[] = getAllObjectives();

export function getKPIsByCategory(categoryCode: string): MeasurableObjective[] {
  const cat = kpiCategories.find(c => c.code === categoryCode);
  if (!cat) return [];
  return unifiedKPIDatabase.filter(k => cat.objectiveCodePrefixes.some(p => k.code.startsWith(p)));
}

export function searchKPIs(query: string, options?: { categoryCode?: string }): MeasurableObjective[] {
  const base = options?.categoryCode ? getKPIsByCategory(options.categoryCode) : unifiedKPIDatabase;
  if (!query) return base;
  const q = query.toLowerCase();
  return base.filter(k =>
    k.label.fr.toLowerCase().includes(q) ||
    k.label.en.toLowerCase().includes(q) ||
    k.code.toLowerCase().includes(q) ||
    (k.sdgReference || '').toLowerCase().includes(q)
  );
}

export function calculateKPIProgress(kpi: MeasurableObjective, currentValue: number) {
  const baseline = kpi.baselineValue ?? 0;
  const calc = (target?: number) => {
    if (target === undefined || target === baseline) return 0;
    return Math.min(100, Math.max(0, ((currentValue - baseline) / (target - baseline)) * 100));
  };
  const progress2030 = calc(kpi.target2030);
  let status: 'on_track' | 'at_risk' | 'off_track' | 'not_measured' = 'not_measured';
  if (kpi.target2030 !== undefined) {
    if (progress2030 >= 80) status = 'on_track';
    else if (progress2030 >= 50) status = 'at_risk';
    else status = 'off_track';
  }
  return { progress2020: calc(kpi.target2020), progress2025: calc(kpi.target2025), progress2030, status };
}

export { searchObjectives };
