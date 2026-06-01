/**
 * DQE Categories Referential
 *
 * Postes DQE (Devis Quantitatif Estimatif) avec unités et marges cibles
 * par entité. Inspiration captures ETER : Terrassement / Revêtement / Signalisation
 * avec cible de rentabilité 10–30 %.
 */

export type DQEUnit = 'm³' | 'm²' | 'ml' | 't' | 'unité' | 'forfait' | 'h';

export interface DQECategory {
  code: string;
  label: { fr: string; en?: string };
  /** Couleur utilisée dans les graphes (donut, barres). */
  color: string;
  unit?: DQEUnit;
  /** Marge cible appliquée à chaque ligne par défaut. */
  targetMargin: { min: number; max: number };
  applicableEntities?: string[];
  order: number;
}

export const DQE_CATEGORIES: DQECategory[] = [
  // ----- ETER (entretien routier) -----
  { code: 'MOBILISATION',  label: { fr: 'Installation & Mobilisation' }, color: '#6366f1', unit: 'forfait', targetMargin: { min: 10, max: 30 }, applicableEntities: ['ETER'], order: 10 },
  { code: 'TERRASSEMENT',  label: { fr: 'Terrassement' },                color: '#3b82f6', unit: 'm³',      targetMargin: { min: 10, max: 30 }, applicableEntities: ['ETER'], order: 20 },
  { code: 'REVETEMENT',    label: { fr: 'Revêtement' },                  color: '#10b981', unit: 'm²',      targetMargin: { min: 10, max: 30 }, applicableEntities: ['ETER'], order: 30 },
  { code: 'SIGNALISATION', label: { fr: 'Signalisation' },               color: '#f59e0b', unit: 'ml',      targetMargin: { min: 10, max: 30 }, applicableEntities: ['ETER'], order: 40 },
  { code: 'RECEPTION',     label: { fr: 'Réception' },                   color: '#8b5cf6', unit: 'forfait', targetMargin: { min: 10, max: 30 }, applicableEntities: ['ETER'], order: 50 },

  // ----- SOMELEC (infrastructure électrique) -----
  { code: 'GENIE_CIVIL',   label: { fr: 'Génie Civil' },                 color: '#0ea5e9', unit: 'm³',      targetMargin: { min: 8, max: 25 },  applicableEntities: ['SOMELEC_INFRA'], order: 10 },
  { code: 'POSE_RESEAU',   label: { fr: 'Pose réseau' },                 color: '#14b8a6', unit: 'ml',      targetMargin: { min: 8, max: 25 },  applicableEntities: ['SOMELEC_INFRA'], order: 20 },
  { code: 'EQUIPEMENT',    label: { fr: 'Équipements' },                 color: '#a855f7', unit: 'unité',   targetMargin: { min: 8, max: 25 },  applicableEntities: ['SOMELEC_INFRA'], order: 30 },
  { code: 'TESTS',         label: { fr: 'Tests & mise en service' },     color: '#ec4899', unit: 'forfait', targetMargin: { min: 8, max: 25 },  applicableEntities: ['SOMELEC_INFRA'], order: 40 },
];

export function getDQECategoriesForEntity(entityCode?: string): DQECategory[] {
  if (!entityCode) return DQE_CATEGORIES;
  const filtered = DQE_CATEGORIES.filter(
    (c) => !c.applicableEntities || c.applicableEntities.includes(entityCode),
  );
  return filtered.length ? filtered.sort((a, b) => a.order - b.order) : DQE_CATEGORIES;
}

export function getDQECategory(code: string): DQECategory | undefined {
  return DQE_CATEGORIES.find((c) => c.code === code);
}

/** Marge cible par défaut pour une entité (utilisée par les badges de rentabilité). */
export function getDefaultTargetMargin(entityCode?: string): { min: number; max: number } {
  const cats = getDQECategoriesForEntity(entityCode);
  if (!cats.length) return { min: 10, max: 30 };
  // Moyenne pondérée par défaut : on prend la première (cohérent par entité).
  return cats[0].targetMargin;
}
