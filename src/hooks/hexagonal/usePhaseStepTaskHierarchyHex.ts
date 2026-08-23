import { useQuery } from '@tanstack/react-query';

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
    queryFn: async () => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient.from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map((row: any) => ({
        phase_id: row.id,
        phase_name: row.phase_name || row.name || 'Phase',
        phase_code: row.construction_phase || '',
        status: row.status || 'planned',
        progress: row.progress || 0,
        start_date: row.start_date,
        end_date: row.end_date,
      })) as PhaseStepTaskRow[];
    },
    enabled: !!projectId && projectId !== 'new-project',
  });
}
