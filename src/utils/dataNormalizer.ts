import { NormalizedStep } from '@/dtos/entities/PhaseDTO';
;

const getField = (raw: Record<string, unknown>, alternatives: string[]): unknown => {
  if (!raw) return undefined;
  for (const alt of alternatives) {
    if (raw[alt] !== undefined) return raw[alt];
  }
  return undefined;
};

const ensureNumber = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (v: unknown) => {
  if (!v) return null;
  if (typeof v !== 'string' && typeof v !== 'number' && !(v instanceof Date)) return null;
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
};

export const normalizeStep = (rawStep: Record<string, unknown>, index = 0): NormalizedStep => {
  const id = (getField(rawStep, ['id', '_id', 'stepId', 'step_id']) || `step-${index}-${Date.now()}`) as string;
  const name = (getField(rawStep, ['name', 'step_name', 'title', 'label', 'stepName']) || `Étape ${index + 1}`) as string;
  const description = (getField(rawStep, ['description', 'step_description', 'desc', 'stepDesc']) || '') as string;
  const status = (getField(rawStep, ['status', 'state', 'step_status', 'stepState']) || 'pending') as string;
  const progress = ensureNumber(getField(rawStep, ['progress', 'percentage', 'completion', 'stepProgress']) || 0);
  const start_date = parseDate(getField(rawStep, ['start_date', 'startDate', 'planned_start']) as string | undefined);
  const end_date = parseDate(getField(rawStep, ['end_date', 'endDate', 'planned_end']) as string | undefined);
  const position = ensureNumber(getField(rawStep, ['position', 'order', 'index'])) ?? index;

  return {
    id,
    name,
    description,
    status,
    progress,
    start_date,
    end_date,
    position,
    rawData: rawStep as Record<string, unknown>,
  };
};

export const normalizeSteps = (rawSteps: Record<string, unknown>[] | undefined | null): NormalizedStep[] => {
  if (!Array.isArray(rawSteps)) return [];
  return rawSteps
    .map((s, idx) => {
      try {
        if (!s) return null;
        return normalizeStep(s, idx);
      } catch {
        return null;
      }
    })
    .filter((s): s is NormalizedStep => s !== null);
};

export default normalizeSteps;