/**
 * Hexagonal Hook for Projects
 * Uses ProjectService with domain entities
 * Following hexagonal architecture principles
 */

import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import { CreateProjectDTO, ProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useProjects() {
  const queryClient = useQueryClient();
  
  const projectService = getProjectService();

  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects-hex'],
    queryFn: async (): Promise<ProjectDTO[]> => {
      return await projectService.getAllProjects();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectDTO): Promise<ProjectDTO> => {
      return await projectService.createProject(data);
    },
    onSuccess: () => {
      toast.success('Projet créé');
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectDTO }): Promise<ProjectDTO> => {
      return await projectService.updateProject(id, data);
    },
    onSuccess: () => {
      toast.success('Projet mis à jour');
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await projectService.deleteProject(id);
    },
    onSuccess: () => {
      toast.success('Projet supprimé');
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProject(id: string) {
  const projectService = getProjectService();

  const {
    data: project,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['project-hex', id],
    queryFn: async (): Promise<ProjectDTO | null> => {
      return await projectService.getProjectById(id);
    },
    enabled: !!id
  });

  return {
    project,
    isLoading,
    error,
    refetch,
  };
}