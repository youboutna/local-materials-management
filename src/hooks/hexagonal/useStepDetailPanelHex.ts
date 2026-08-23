import { useQuery } from '@tanstack/react-query';

export function useProjectForSchedulerHex(projectId?: string) {
  return useQuery({
    queryKey: ['project-for-scheduler', projectId],
    queryFn: async () => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient.from('projects')
        .select('id, title, location, status, project_reference, budget, progress, main_contractor')
        .eq('id', projectId as string)
        .single();

      if (error) throw error;
      return {
        id: data.id || '',
        title: data.title || '',
        location: data.location || undefined,
        status: data.status || undefined,
        project_reference: data.project_reference || '',
        budget: data.budget || undefined,
        progress: data.progress || undefined,
        contractor_name: data.main_contractor || undefined,
        contractor_contact: undefined
      };
    },
    enabled: !!projectId
  });
}

export async function scheduleStepInspectionHex(params: {
  projId: string;
  phaseId: string;
  inspector: string;
  date: string;
  additionalData?: any;
}) {
  const { projId, phaseId, inspector, date, additionalData } = params;
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { error } = await btpClient.from('inspections')
    .insert({
      project_id: projId,
      phase_id: additionalData?.phase_id || phaseId,
      inspector,
      date: new Date(date).toISOString(),
      status: 'scheduled',
      progress_at_inspection: additionalData?.target_progress || 0,
      comments: additionalData?.requirements || '',
      payment_type: additionalData?.inspection_type || 'progress'
    });

  if (error) throw error;
}
