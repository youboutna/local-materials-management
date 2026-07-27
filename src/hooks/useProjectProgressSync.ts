/**
 * Hook pour synchroniser automatiquement la progression d'un projet
 * avec la base de données lorsque des modifications sont effectuées
 */
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useProjectProgressSync = (projectId?: string) => {
  const projectRepository = RepositoryFactory.getProjectRepository();

  const syncProgress = useCallback(async () => {
    if (!projectId) return;

    try {
      const updatedProgress = await projectRepository.synchronizeProgress(projectId);
      console.log(`Progress synchronized for project ${projectId}: ${updatedProgress}%`);
      return updatedProgress;
    } catch (error) {
      console.error('Failed to synchronize project progress:', error);
      toast.error('Erreur lors de la synchronisation de la progression');
    }
  }, [projectId, projectRepository]);

  return { syncProgress };
};
