import { useQuery } from '@tanstack/react-query';
import { getProjectService } from '@/application/services/ProjectService';
import { getInspectionService } from '@/application/services/InspectionService';

export function useProjectForSchedulerHex(projectId?: string) {
  return useQuery({
    queryKey: ['project-for-scheduler', projectId],
    queryFn: async () => {
      const data = await getProjectService().findById(projectId as string);
      if (!data) throw new Error('Project not found');
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
  await getInspectionService().createInspection({
    projectId: projId,
    phaseId: additionalData?.phase_id || phaseId,
    inspector,
    date: new Date(date).toISOString(),
    status: 'scheduled',
    progressAtInspection: additionalData?.target_progress || 0,
    comments: additionalData?.requirements || '',
    paymentType: additionalData?.inspection_type || 'progress',
  });
}
