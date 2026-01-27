/**
 * Hexagonal Hook for Projects
 * Uses ProjectService with domain entities
 * Following hexagonal architecture principles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectService } from '@/application/services/ProjectService';
import type { CreateProjectDTO, ProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { toast } from 'sonner';

// Types pour les hooks
export interface UseProjectsHexResult {
  projects: ProjectDTO[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  createProject: (data: CreateProjectDTO) => Promise<ProjectDTO>;
  updateProject: ({ id, data }: { id: string; data: UpdateProjectDTO }) => Promise<ProjectDTO>;
  deleteProject: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseProjectHexResult {
  project: ProjectDTO | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useProjects(): UseProjectsHexResult {
  const queryClient = useQueryClient();
  
  // Initialize repository and service following hexagonal architecture
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository);

  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectDTO[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const projects = await projectService.getAllProjects();
        
        // [Transformers]: DTOs → ResponseDTOs
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return projects;
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectDTO): Promise<ProjectDTO> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        return await projectService.createProject(data);
      } catch (error) {
        console.error('Error creating project:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create project');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: unknown) => {
      toast.error('Échec de la création du projet');
      console.error('Create project error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectDTO }): Promise<ProjectDTO> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        return await projectService.updateProject(id, data);
      } catch (error) {
        console.error('Error updating project:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update project');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error: unknown) => {
      toast.error('Échec de la mise à jour du projet');
      console.error('Update project error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        await projectService.deleteProject(id);
        return id;
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error: unknown) => {
      toast.error('Échec de la suppression du projet');
      console.error('Delete project error:', error);
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: (data) => createMutation.mutateAsync(data),
    updateProject: (args) => updateMutation.mutateAsync(args),
    deleteProject: async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProjectById(id: string) {
  // Initialize repository and service following hexagonal architecture
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository);

  return useQuery({
    queryKey: ['projects', 'id', id],
    queryFn: async (): Promise<ProjectDTO | null> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const project = await projectService.getProjectById(id);
        
        // [Transformers]: DTO → ResponseDTO
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return project;
      } catch (error) {
        console.error('Error fetching project by ID:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch project');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProjectsByStatus(status: string) {
  // Initialize repository and service following hexagonal architecture
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository);

  return useQuery({
    queryKey: ['projects', 'status', status],
    queryFn: async (): Promise<ProjectDTO[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const projects = await projectService.getProjectsByStatus(status);
        
        // [Transformers]: DTOs → ResponseDTOs
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return projects;
      } catch (error) {
        console.error('Error fetching projects by status:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects by status');
      }
    },
    enabled: !!status,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour un projet spécifique (alias de useProjectById pour compatibilité)
export function useProjectHex(id: string): UseProjectHexResult {
  const result = useProjectById(id);
  return {
    project: result.data || null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

// Export alias for useProjectsHex
export const useProjectsHex = useProjects;
