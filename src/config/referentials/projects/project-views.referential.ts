/**
 * Project Views Referential
 *
 * Onglets dynamiques affichés sur la vue projet, par type d'entité.
 * Reflète les 7 onglets standards du détail projet HadraTech-GPI :
 *   Vue d'ensemble · Planification · Exécution · Financier · Conformité · Suivi & Évaluation · Localisation
 */

export type ProjectTabKey =
  | 'overview'
  | 'planification'
  | 'execution'
  | 'financier'
  | 'conformite'
  | 'suivi_evaluation'
  | 'localisation'
  | 'dqe'
  | 'inspections'
  | 'documents'
  | 'rapports';

export interface ProjectTabDef {
  key: ProjectTabKey;
  /** Valeur `TabsTrigger.value` côté UI (alignée sur ProjectDetailByDTO). */
  uiValue: string;
  label: { fr: string; en?: string };
  /** Icône lucide-react à utiliser dans l'UI. */
  icon?: string;
  order: number;
}

export const PROJECT_TABS: Record<ProjectTabKey, ProjectTabDef> = {
  overview:         { key: 'overview',         uiValue: 'overview',   label: { fr: "Vue d'ensemble" },   icon: 'LayoutDashboard', order: 5 },
  planification:    { key: 'planification',    uiValue: 'phases',     label: { fr: 'Planification' },     icon: 'CalendarRange',   order: 10 },
  execution:        { key: 'execution',        uiValue: 'tasks',      label: { fr: 'Exécution' },         icon: 'PlayCircle',      order: 20 },
  financier:        { key: 'financier',        uiValue: 'financial',  label: { fr: 'Financier' },         icon: 'Wallet',          order: 30 },
  conformite:       { key: 'conformite',       uiValue: 'compliance', label: { fr: 'Conformité' },        icon: 'ShieldCheck',     order: 40 },
  suivi_evaluation: { key: 'suivi_evaluation', uiValue: 'monitoring', label: { fr: 'Suivi & Évaluation' }, icon: 'Activity',       order: 45 },
  localisation:     { key: 'localisation',     uiValue: 'map',        label: { fr: 'Localisation' },      icon: 'MapPin',          order: 50 },
  dqe:              { key: 'dqe',              uiValue: 'dqe',        label: { fr: 'DQE' },               icon: 'ListTree',        order: 25 },
  inspections:      { key: 'inspections',      uiValue: 'inspections', label: { fr: 'Inspections' },      icon: 'ClipboardCheck',  order: 35 },
  documents:        { key: 'documents',        uiValue: 'documents',  label: { fr: 'Documents' },         icon: 'FileText',        order: 60 },
  rapports:         { key: 'rapports',         uiValue: 'rapports',   label: { fr: 'Rapports' },          icon: 'FileBarChart',    order: 70 },
};

export interface ProjectViewProfile {
  /** Code d'entité ou type de projet. */
  entityCode: string;
  tabs: ProjectTabKey[];
}

/** Profils par entité / type de projet. */
export const PROJECT_VIEW_PROFILES: ProjectViewProfile[] = [
  {
    entityCode: 'ETER',
    tabs: ['overview', 'planification', 'dqe', 'execution', 'financier', 'conformite', 'suivi_evaluation', 'localisation', 'inspections', 'rapports'],
  },
  {
    entityCode: 'SOMELEC_INFRA',
    tabs: ['overview', 'planification', 'execution', 'financier', 'conformite', 'suivi_evaluation', 'inspections', 'localisation', 'documents', 'rapports'],
  },
  {
    entityCode: 'DEFAULT',
    tabs: ['overview', 'planification', 'dqe', 'execution', 'financier', 'conformite', 'suivi_evaluation', 'localisation', 'rapports'],
  },
];

export function getProjectTabs(entityCode?: string): ProjectTabDef[] {
  const profile =
    PROJECT_VIEW_PROFILES.find((p) => p.entityCode === entityCode) ??
    PROJECT_VIEW_PROFILES.find((p) => p.entityCode === 'DEFAULT')!;
  return profile.tabs
    .map((key) => PROJECT_TABS[key])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}
