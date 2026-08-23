/**
 * Project List Views Referential
 *
 * Vues de la liste /projects (onglets affichés dans l'en-tête de page).
 * Centralise les modes d'affichage pour éviter les listes en dur dans Projects.tsx.
 * La vue Waterfall a été retirée (Phase 7) : le pilotage par phases est unifié
 * dans le détail projet (Gantt/Suivi-Évaluation alimentés par l'orchestrateur).
 */

export type ProjectListViewKey = 'grid' | 'map' | 'interactive';

export interface ProjectListViewDef {
  key: ProjectListViewKey;
  /** Valeur `TabsTrigger.value` côté UI. */
  uiValue: string;
  label: { fr: string; en?: string; ar?: string };
  /** Icône lucide-react à utiliser dans l'UI. */
  icon: 'Grid' | 'Filter' | 'Map';
  order: number;
  /** Description courte (tooltip / aria). */
  description?: { fr: string; en?: string; ar?: string };
}

export const PROJECT_LIST_VIEWS: Record<ProjectListViewKey, ProjectListViewDef> = {
  grid: {
    key: 'grid',
    uiValue: 'grid',
    label: { fr: 'Vue Grille', en: 'Grid view', ar: 'عرض شبكي' },
    icon: 'Grid',
    order: 10,
    description: { fr: 'Liste paginée des projets avec filtres et sélection multiple', en: 'Paginated project list with filters and multi-selection', ar: 'قائمة مشاريع مرقّمة مع مرشحات وتحديد متعدد' },
  },
  map: {
    key: 'map',
    uiValue: 'map',
    label: { fr: 'Carte des Projets', en: 'Projects map', ar: 'خريطة المشاريع' },
    icon: 'Map',
    order: 30,
    description: { fr: 'Carte statique des projets par localisation', en: 'Static map of projects by location', ar: 'خريطة ثابتة للمشاريع حسب الموقع' },
  },
  interactive: {
    key: 'interactive',
    uiValue: 'interactive',
    label: { fr: 'Carte Interactive', en: 'Interactive map', ar: 'خريطة تفاعلية' },
    icon: 'Map',
    order: 40,
    description: { fr: 'Carte interactive avec filtres et drill-down', en: 'Interactive map with filters and drill-down', ar: 'خريطة تفاعلية مع مرشحات وتفصيل' },
  },
};

export interface ProjectListViewProfile {
  /** Code d'entité ou contexte (DEFAULT, ETER, SOMELEC_INFRA, ...). */
  entityCode: string;
  views: ProjectListViewKey[];
  defaultView: ProjectListViewKey;
}

export const PROJECT_LIST_VIEW_PROFILES: ProjectListViewProfile[] = [
  { entityCode: 'DEFAULT',        views: ['grid', 'map', 'interactive'], defaultView: 'grid' },
  { entityCode: 'ETER',           views: ['grid', 'map', 'interactive'], defaultView: 'grid' },
  { entityCode: 'SOMELEC_INFRA',  views: ['grid', 'map', 'interactive'], defaultView: 'grid' },
];

export function getProjectListViews(entityCode?: string): ProjectListViewDef[] {
  const profile =
    PROJECT_LIST_VIEW_PROFILES.find((p) => p.entityCode === entityCode) ??
    PROJECT_LIST_VIEW_PROFILES.find((p) => p.entityCode === 'DEFAULT')!;
  return profile.views
    .map((key) => PROJECT_LIST_VIEWS[key])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function getDefaultProjectListView(entityCode?: string): ProjectListViewKey {
  const profile =
    PROJECT_LIST_VIEW_PROFILES.find((p) => p.entityCode === entityCode) ??
    PROJECT_LIST_VIEW_PROFILES.find((p) => p.entityCode === 'DEFAULT')!;
  return profile.defaultView;
}
