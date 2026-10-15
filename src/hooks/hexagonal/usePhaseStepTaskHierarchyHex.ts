import { useQuery } from '@tanstack/react-query';
import { getPhaseService } from '@/application/services/PhaseService';

export interface PhaseStepTaskRow {
  phase_id: string;
  phase_name: string;
  phase_code: string;
  status: string;
  progress?: number;
  start_date?: string;
  end_date?: string;
  step_id?: string;
  step_name?: string;
  step_code?: string;
  task_id?: string;
  task_name?: string;
  task_description?: string;
  assigned_to?: string[];
}

export function usePhaseStepTaskHierarchyHex(projectId: string) {
  return useQuery({
    queryKey: ['project-phase-hierarchy', projectId],
    queryFn: async () => (await getPhaseService().getPhasesByProject(projectId)).map((phase) => ({
        phase_id: phase.id,
        phase_name: phase.phaseName || 'Phase',
        phase_code: phase.constructionPhase || '',
        status: phase.status || 'planned',
        progress: phase.progress || 0,
        start_date: phase.startDate || undefined,
        end_date: phase.endDate || undefined,
      })) as PhaseStepTaskRow[];
    enabled: !!projectId && projectId !== 'new-project',
  });
}
