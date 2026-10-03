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

/** Phase WBS enrichie du statut réel (sert au pré-remplissage de la phase active). */
export type ProjectWbsPhase = WbsPhase & { status?: string | null };

/** Statuts considérés comme « phase active » (codes techniques base, EN/normalisés). */
const ACTIVE_PHASE_STATUSES = new Set([
  'in_progress',
  'en_cours',
  'active',
  'ongoing',
  'started',
  'IN_PROGRESS',
]);

/** Vrai si le statut de phase désigne une phase en cours. */
export const isActivePhaseStatus = (status?: string | null): boolean =>
  !!status && ACTIVE_PHASE_STATUSES.has(String(status).toLowerCase());

export async function loadProjectWbs(projectId: string): Promise<ProjectWbsPhase[]> {
  if (!projectId) return [];
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { data, error } = await btpClient
    .from('project_phases')
    .select('id, phase_name, status, order_index, custom_phase_data')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error || !data) return [];

  // Jalons et tâches persistés en tables (projets importés / saisis hors custom_phase_data).
  const [msRes, taskRes] = await Promise.all([
    btpClient.from('project_milestones').select('id, title, phase_id, order_index').eq('project_id', projectId),
    btpClient.from('task_assignments').select('id, title, phase_id').eq('project_id', projectId),
  ]);
  const dbMilestones = (msRes.data ?? []) as unknown as { id: string; title: string | null; phase_id: string | null; order_index: number | null }[];
  const dbTasks = (taskRes.data ?? []) as { id: string; title: string | null; phase_id: string | null }[];

  return data.map((row) => {
    const raw = (row.custom_phase_data ?? {}) as { steps?: RawStep[] };
    const steps = Array.isArray(raw.steps) ? [...raw.steps].sort((a, b) => pickOrder(a, 0) - pickOrder(b, 0)) : [];
    const phaseTasks = dbTasks
      .filter((t) => t.phase_id === row.id)
      .map((t, j) => ({ id: t.id, label: pickLabel(t.title) ?? `Tâche ${j + 1}` }));
    const milestones = steps.map((s, i) => ({
      id: s.id ?? s.code ?? `step-${i}`,
      label: pickLabel(s.name, s.label, s.title) ?? `Étape ${i + 1}`,
      tasks: (Array.isArray(s.tasks) ? [...s.tasks].sort((a, b) => pickOrder(a, 0) - pickOrder(b, 0)) : []).map((t, j) => ({
        id: t.id ?? t.code ?? `task-${i}-${j}`,
        label: pickLabel(t.name, t.label, t.title) ?? `Tâche ${j + 1}`,
      })),
    }));
    const known = new Set(milestones.map((m) => m.id));
    dbMilestones
      .filter((m) => m.phase_id === row.id && !known.has(m.id))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .forEach((m, i) => milestones.push({ id: m.id, label: pickLabel(m.title) ?? `Jalon ${i + 1}`, tasks: [] }));
    // Les tâches en table sont rattachées à la phase : proposées sous chaque jalon de la phase.
    if (phaseTasks.length) {
      if (!milestones.length) milestones.push({ id: `phase-${row.id}-tasks`, label: row.phase_name ?? 'Phase', tasks: [] });
      milestones.forEach((m) => {
        const ids = new Set(m.tasks.map((t) => t.id));
        m.tasks.push(...phaseTasks.filter((t) => !ids.has(t.id)));
      });
    }
    return {
      id: row.id,
      label: row.phase_name ?? 'Phase',
      status: (row as { status?: string | null }).status ?? null,
      milestones,
    } satisfies ProjectWbsPhase;
  });
}

