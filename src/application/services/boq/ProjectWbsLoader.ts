/**
 * ProjectWbsLoader — charge dynamiquement les phases/étapes/tâches réelles
 * d'un projet (btp.project_phases) et les convertit au format WbsPhase
 * consommé par WbsSelector.
 *
 * Bypass autorisé (voir mem://architecture/phase-hierarchy-query-bypass) car
 * l'entité Phase n'expose ni steps ni tasks (stockés dans custom_phase_data).
 */
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';

interface RawStep {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  title?: string;
  order_index?: number;
  order?: number;
  tasks?: RawTask[];
}
interface RawTask {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  title?: string;
  order_index?: number;
  order?: number;
}

const pickLabel = (...values: unknown[]) => {
  const match = values.find((v) => typeof v === 'string' && v.trim().length > 0);
  return typeof match === 'string' ? match.trim() : undefined;
};

const pickOrder = (value: { order_index?: number; order?: number }, fallback: number) => {
  const n = value.order_index ?? value.order;
  return Number.isFinite(n) ? Number(n) : fallback;
};

export async function loadProjectWbs(projectId: string): Promise<WbsPhase[]> {
  if (!projectId) return [];
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { data, error } = await btpClient
    .from('project_phases')
    .select('id, phase_name, order_index, custom_phase_data')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const raw = (row.custom_phase_data ?? {}) as { steps?: RawStep[] };
    const steps = Array.isArray(raw.steps) ? [...raw.steps].sort((a, b) => pickOrder(a, 0) - pickOrder(b, 0)) : [];
    const milestones = steps.map((s, i) => ({
      id: s.id ?? s.code ?? `step-${i}`,
      label: pickLabel(s.name, s.label, s.title) ?? `Étape ${i + 1}`,
      tasks: (Array.isArray(s.tasks) ? [...s.tasks].sort((a, b) => pickOrder(a, 0) - pickOrder(b, 0)) : []).map((t, j) => ({
        id: t.id ?? t.code ?? `task-${i}-${j}`,
        label: pickLabel(t.name, t.label, t.title) ?? `Tâche ${j + 1}`,
      })),
    }));
    return {
      id: row.id,
      label: row.phase_name ?? 'Phase',
      milestones,
    } satisfies WbsPhase;
  });
}
