/**
 * Project List Views Referential
 *
 * Vues de la liste /projects (onglets affichés dans l'en-tête de page).
 * Centralise les modes d'affichage pour éviter les listes en dur dans Projects.tsx.
 */

export type ProjectListViewKey = 'grid' | 'waterfall' | 'map' | 'interactive';

export interface ProjectListViewDef {
  key: ProjectListViewKey;
  /** Valeur `TabsTrigger.value` côté UI. */
  uiValue: string;
  label: { fr: string; en?: string };
  /** Icône lucide-react à utiliser dans l'UI. */
  icon: 'Grid' | 'Filter' | 'Map';
  order: number;
  /** Description courte (tooltip / aria). */
  description?: { fr: string; en?: string };
}

export const PROJECT_LIST_VIEWS: Record<ProjectListViewKey, ProjectListViewDef> = {
  grid: {
    key: 'grid',
    uiValue: 'grid',
    label: { fr: 'Vue Grille' },
    icon: 'Grid',
    order: 10,
    description: { fr: 'Liste paginée des projets avec filtres et sélection multiple' },
  },
  waterfall: {
    key: 'waterfall',
    uiValue: 'waterfall',
    label: { fr: 'Gestion Waterfall' },
    icon: 'Filter',
    order: 20,
    description: { fr: 'Pilotage des projets par phases waterfall' },
  },
  map: {
    key: 'map',
    uiValue: 'map',
    label: { fr: 'Carte des Projets' },
    icon: 'Map',
    order: 30,
    description: { fr: 'Carte statique des projets par localisation' },
  },
  interactive: {
    key: 'interactive',
    uiValue: 'interactive',
    label: { fr: 'Carte Interactive' },
    icon: 'Map',
    order: 40,
    description: { fr: 'Carte interactive avec filtres et drill-down' },
  },
};

export interface ProjectListViewProfile {
  /** Code d'entité ou contexte (DEFAULT, ETER, SOMELEC_INFRA, ...). */
  entityCode: string;
  views: ProjectListViewKey[];
  defaultView: ProjectListViewKey;
}

export const PROJECT_LIST_VIEW_PROFILES: ProjectListViewProfile[] = [
  { entityCode: 'DEFAULT',        views: ['grid', 'waterfall', 'map', 'interactive'], defaultView: 'grid' },
  { entityCode: 'ETER',           views: ['grid', 'waterfall', 'map', 'interactive'], defaultView: 'grid' },
  { entityCode: 'SOMELEC_INFRA',  views: ['grid', 'waterfall', 'map', 'interactive'], defaultView: 'grid' },
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
