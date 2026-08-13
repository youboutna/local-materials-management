/**
 * Dérive, à partir des données réelles du projet, une lecture "missions DGEER".
 * Pure TypeScript — aucun accès données, aucune valeur simulée.
 */
import {
  DGEER_MISSION_LIST,
  type DgeerMission,
  type DgeerMissionCode,
} from '@/config/referentials/reports/dgeer-missions.referential';

export interface DgeerMissionInsight {
  code: DgeerMissionCode;
  label: string;
  description: string;
  /** true si le projet contribue explicitement à cette mission. */
  relevant: boolean;
  /** Indicateur chiffré (déjà formaté à 2 décimales) ou 'n/d'. */
  indicator: string;
  indicatorLabel: string;
}

const normalize = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export interface DgeerInsightInput {
  title?: string | null;
  description?: string | null;
  projectType?: string | null;
  sector?: string | null;
  location?: string | null;
  progress?: number | null;
  budget?: number | null;
  actualCost?: number | null;
  interventionZonesCount?: number;
  inspectionsCount?: number;
  phasesCount?: number;
  tags?: string[] | null;
}

const twoDigits = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : 'n/d';

const matches = (mission: DgeerMission, haystack: string): boolean =>
  mission.keywords.some((kw) => haystack.includes(normalize(kw)));

export function buildDgeerMissionInsights(input: DgeerInsightInput): DgeerMissionInsight[] {
  const haystack = normalize(
    [input.title, input.description, input.projectType, input.sector, ...(input.tags || [])].join(' '),
  );

  return DGEER_MISSION_LIST.map((mission) => {
    const relevant = matches(mission, haystack);

    let indicator = 'n/d';
    let indicatorLabel = '';

    switch (mission.code) {
      case 'politique_energetique':
        indicatorLabel = 'Phases planifiées';
        indicator = twoDigits(input.phasesCount ?? null);
        break;
      case 'infrastructures':
        indicatorLabel = 'Avancement physique (%)';
        indicator = twoDigits(input.progress ?? null);
        break;
      case 'energies_propres':
        indicatorLabel = 'Budget engagé (%)';
        indicator =
          input.budget && input.budget > 0
            ? twoDigits(((input.actualCost || 0) / input.budget) * 100)
            : 'n/d';
        break;
      case 'electrification':
        indicatorLabel = "Zones d'intervention";
        indicator = twoDigits(input.interventionZonesCount ?? null);
        break;
      case 'supervision':
        indicatorLabel = 'Inspections réalisées';
        indicator = twoDigits(input.inspectionsCount ?? null);
        break;
    }

    return {
      code: mission.code,
      label: mission.label,
      description: mission.description,
      relevant,
      indicator,
      indicatorLabel,
    };
  });
}
