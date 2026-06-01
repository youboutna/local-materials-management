/**
 * Phase View Model
 *
 * Normalise les multiples formes de phase (PhaseDTO, PhaseEntity legacy,
 * snake_case DB) en un view-model **stable, typé et immuable** consommé par l'UI.
 *
 * Élimine les `(phase as any).xxx` éparpillés dans les composants/pages.
 * Respect strict de l'arch hex : pas de fetch ici, pure fonction de mapping.
 */

import type { PhaseStatus, PhaseType } from '@/dtos/entities/PhaseDTO';

export interface PhaseViewModel {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: PhaseStatus | string;
  type: PhaseType | string | undefined;
  progress: number;
  budget: number;
  actualCost: number;
  estimatedDuration: number;
  startDate: string;
  endDate: string;
  actualEndDate: string;
  location: string;
  plannedProgress: number;
}

type Raw = Record<string, unknown> | null | undefined;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
};

/** Lit la 1ère propriété définie parmi `keys` dans `obj`. */
const pick = (obj: Raw, keys: string[]): unknown => {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

/** Normalise une `location` (string | { address?, city? }) en string lisible. */
const formatLocation = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return [obj.address, obj.city, obj.country].filter(Boolean).join(', ');
  }
  return '';
};

export function toPhaseViewModel(phase: Raw): PhaseViewModel {
  return {
    id: str(pick(phase, ['id'])),
    projectId: str(pick(phase, ['projectId', 'project_id'])),
    title: str(pick(phase, ['title', 'name', 'phaseName', 'phase_name']), 'Phase'),
    description: str(pick(phase, ['description'])),
    status: str(pick(phase, ['status'])) as PhaseStatus,
    type: str(pick(phase, ['type', 'phaseType', 'phase_type'])) as PhaseType,
    progress: num(pick(phase, ['progress', 'completionPercentage', 'completion_percentage'])),
    budget: num(pick(phase, ['budget', 'estimatedCost', 'estimated_cost'])),
    actualCost: num(pick(phase, ['actualCost', 'actual_cost'])),
    estimatedDuration: num(pick(phase, ['estimatedDuration', 'estimated_duration', 'duration'])),
    startDate: str(pick(phase, ['startDate', 'start_date', 'plannedStartDate'])),
    endDate: str(pick(phase, ['endDate', 'end_date', 'plannedEndDate'])),
    actualEndDate: str(pick(phase, ['actualEndDate', 'actual_end_date'])),
    location: formatLocation(pick(phase, ['location', 'address'])),
    plannedProgress: num(pick(phase, ['plannedProgress', 'planned_progress']), 100),
  };
}
