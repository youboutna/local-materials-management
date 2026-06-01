/**
 * Project Views Referential
 *
 * Onglets dynamiques affichés sur la vue projet, par type d'entité.
 * Inspiration captures ETER : Planification, Exécution, Financier, Conformité, Localisation.
 */

export type ProjectTabKey =
  | 'planification'
  | 'execution'
  | 'financier'
  | 'conformite'
  | 'localisation'
  | 'dqe'
  | 'inspections'
  | 'documents'
  | 'rapports';

export interface ProjectTabDef {
  key: ProjectTabKey;
  label: { fr: string; en?: string };
  /** Icône lucide-react à utiliser dans l'UI. */
  icon?: string;
  order: number;
}

export const PROJECT_TABS: Record<ProjectTabKey, ProjectTabDef> = {
  planification: { key: 'planification', label: { fr: 'Planification' },  icon: 'CalendarRange', order: 10 },
  execution:     { key: 'execution',     label: { fr: 'Exécution' },      icon: 'PlayCircle',    order: 20 },
  financier:     { key: 'financier',     label: { fr: 'Financier' },      icon: 'Wallet',        order: 30 },
  conformite:    { key: 'conformite',    label: { fr: 'Conformité' },     icon: 'ShieldCheck',   order: 40 },
  localisation:  { key: 'localisation',  label: { fr: 'Localisation' },   icon: 'MapPin',        order: 50 },
  dqe:           { key: 'dqe',           label: { fr: 'DQE' },            icon: 'ListTree',      order: 25 },
  inspections:   { key: 'inspections',   label: { fr: 'Inspections' },    icon: 'ClipboardCheck', order: 35 },
  documents:     { key: 'documents',     label: { fr: 'Documents' },      icon: 'FileText',      order: 60 },
  rapports:      { key: 'rapports',      label: { fr: 'Rapports' },       icon: 'FileBarChart',  order: 70 },
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
    tabs: ['planification', 'dqe', 'execution', 'financier', 'conformite', 'localisation', 'inspections', 'rapports'],
  },
  {
    entityCode: 'SOMELEC_INFRA',
    tabs: ['planification', 'execution', 'financier', 'conformite', 'inspections', 'localisation', 'documents', 'rapports'],
  },
  {
    entityCode: 'DEFAULT',
    tabs: ['planification', 'execution', 'financier', 'inspections', 'documents', 'rapports'],
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
