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
  name?: string;
  order_index?: number;
  tasks?: RawTask[];
}
interface RawTask {
  id?: string;
  name?: string;
  order_index?: number;
}

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
    const steps = Array.isArray(raw.steps) ? raw.steps : [];
    const milestones = steps.map((s, i) => ({
      id: s.id ?? `step-${i}`,
      label: s.name ?? `Étape ${i + 1}`,
      tasks: (Array.isArray(s.tasks) ? s.tasks : []).map((t, j) => ({
        id: t.id ?? `task-${i}-${j}`,
        label: t.name ?? `Tâche ${j + 1}`,
      })),
    }));
    return {
      id: row.id,
      label: row.phase_name ?? 'Phase',
      milestones,
    } satisfies WbsPhase;
  });
}
