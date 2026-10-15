import { getInspectionService } from '@/application/services/InspectionService';

export async function createInspectionWithContextHex(params: {
  projectId: string;
  date: string;
  status: string;
  inspectorName: string;
  progress: number;
  comments: string | null;
  phaseId: string | null;
}) {
  return getInspectionService().createInspection({
    projectId: params.projectId,
    date: params.date,
    status: params.status,
    inspector: params.inspectorName,
    progressAtInspection: params.progress,
    comments: params.comments ?? undefined,
    phaseId: params.phaseId ?? undefined,
  });
}
