/**
 * Hexagonal Hook for Projects
 * Uses ProjectService with domain entities
 * Following hexagonal architecture principles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectMapper, ProjectResponseDto, CreateProjectRequestDto, UpdateProjectRequestDto } from '@/infrastructure/transformers/ProjectMapper';
import { toast } from 'sonner';

export function useProjects() {
  const queryClient = useQueryClient();
  
  const projectService = new ProjectService(
    RepositoryFactory.getProjectRepository()
  );

  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const projectsData = await projectService.getAllProjects();
      return projectsData.map(project => ProjectMapper.toResponseDto(project));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectRequestDto) => {
      const projectEntity = ProjectMapper.toDomainFromCreateDto(data);
      const createdProject = await projectService.createProject(projectEntity);
      return ProjectMapper.toResponseDto(createdProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: Error) => {
      toast.error('Échec de la création du projet');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequestDto }) => {
      const updateData = ProjectMapper.toUpdateData(data);
      const updatedProject = await projectService.updateProject(id, updateData);
      return ProjectMapper.toResponseDto(updatedProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error('Échec de la mise à jour du projet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await projectService.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error('Échec de la suppression du projet');
    },
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

export function useProjectById(id: string) {
  const projectService = new ProjectService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ['projects', 'id', id],
    queryFn: async () => {
      const project = await projectService.getProjectById(id);
      return project ? ProjectMapper.toResponseDto(project) : null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProjectsByStatus(status: string) {
  const projectService = new ProjectService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ['projects', 'status', status],
    queryFn: async () => {
      // Utiliser getAllProjects puis filtrer par statut
      const projects = await projectService.getAllProjects();
      return projects
        .filter(project => project.status === status)
        .map(project => ProjectMapper.toResponseDto(project));
    },
    enabled: !!status,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
