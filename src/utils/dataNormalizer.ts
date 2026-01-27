export type NormalizedStep = {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  start_date?: string | null;
  end_date?: string | null;
  position?: number;
  rawData?: any;
};

const getField = (raw: any, alternatives: string[]) => {
  if (!raw) return undefined;
  for (const alt of alternatives) {
    if (raw[alt] !== undefined) return raw[alt];
  }
  return undefined;
};

const ensureNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (v: any) => {
  if (!v) return null;
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
};

export const normalizeStep = (rawStep: any, index = 0): NormalizedStep => {
  const id = getField(rawStep, ['id', '_id', 'stepId', 'step_id']) || `step-${index}-${Date.now()}`;
  const name = getField(rawStep, ['name', 'step_name', 'title', 'label', 'stepName']) || `Étape ${index + 1}`;
  const description = getField(rawStep, ['description', 'step_description', 'desc', 'stepDesc']) || '';
  const status = (getField(rawStep, ['status', 'state', 'step_status', 'stepState']) || 'pending') as string;
  const progress = ensureNumber(getField(rawStep, ['progress', 'percentage', 'completion', 'stepProgress']) || 0);
  const start_date = parseDate(getField(rawStep, ['start_date', 'startDate', 'planned_start']));
  const end_date = parseDate(getField(rawStep, ['end_date', 'endDate', 'planned_end']));
  const position = ensureNumber(getField(rawStep, ['position', 'order', 'index']) ?? index);

  return {
    id,
    name,
    description,
    status,
    progress,
    start_date,
    end_date,
    position,
    rawData: rawStep,
  };
};

export const normalizeSteps = (rawSteps: any[] | undefined | null): NormalizedStep[] => {
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
