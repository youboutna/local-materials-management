import { getProjectService } from '@/application/services/ProjectService';

export async function getProjectCreatedByHex(projectId: string): Promise<string | null> {
  const project = await getProjectService().findById(projectId);
  return project?.createdBy ?? null;
}
