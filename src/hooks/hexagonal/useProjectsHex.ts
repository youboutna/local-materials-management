/**
 * Hexagonal Hook for Projects
 * Uses ProjectService with domain entities
 * Following hexagonal architecture principles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectDomainTransformer, ProjectResponseDto, CreateProjectRequestDto, UpdateProjectRequestDto } from '@/dtos/transforms/projectDomainTransform';
import { Project, ProjectStatus } from '@/domain/entities/Project';
import { toast } from 'sonner';

// Types pour les hooks
export interface UseProjectsHexResult {
  projects: ProjectResponseDto[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createProject: (data: CreateProjectRequestDto) => void;
  updateProject: ({ id, data }: { id: string; data: UpdateProjectRequestDto }) => void;
  deleteProject: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseProjectHexResult {
  project: ProjectResponseDto | null;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

export function useProjects(): UseProjectsHexResult {
  const queryClient = useQueryClient();
  
  // Initialize repository and service following hexagonal architecture
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectTransformer = new ProjectDomainTransformer();
  const projectService = new ProjectService(projectRepository, projectTransformer);

  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectResponseDto[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const projects = await projectService.getAllProjects();
        
        // [Transformers]: DTOs → ResponseDTOs
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return projectTransformer.fromDtosToAdapter(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectRequestDto): Promise<ProjectResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const projectDTO = projectTransformer.toRequestDto(data);
        const project = await projectService.createProject(projectDTO);
        
        return projectTransformer.toResponseDto(project);
      } catch (error) {
        console.error('Error creating project:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create project');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: any) => {
      toast.error('Échec de la création du projet');
      console.error('Create project error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequestDto }): Promise<ProjectResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const updateDTO = projectTransformer.toUpdateDto(data);
        const project = await projectService.updateProject(id, updateDTO as any);
        
        return projectTransformer.toResponseDto(project);
      } catch (error) {
        console.error('Error updating project:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update project');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Échec de la mise à jour du projet');
      console.error('Update project error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
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
    onError: (error: any) => {
      toast.error('Échec de la suppression du projet');
      console.error('Delete project error:', error);
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
  // Initialize repository and service following hexagonal architecture
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectTransformer = new ProjectDomainTransformer();
  const projectService = new ProjectService(projectRepository, projectTransformer);

  return useQuery({
    queryKey: ['projects', 'id', id],
    queryFn: async (): Promise<ProjectResponseDto | null> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const project = await projectService.getProjectById(id);
        
        // [Transformers]: DTO → ResponseDTO
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return project ? projectTransformer.toResponseDto(project) : null;
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
  const projectTransformer = new ProjectDomainTransformer();
  const projectService = new ProjectService(projectRepository, projectTransformer);

  return useQuery({
    queryKey: ['projects', 'status', status],
    queryFn: async (): Promise<ProjectResponseDto[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const projects = await projectService.getProjectsByStatus(status);
        
        // [Transformers]: DTOs → ResponseDTOs
        // Utilisation du Transformer unifié : ProjectDomainTransformer
        return projectTransformer.fromDtosToAdapter(projects);
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

// Export pour compatibilité ascendante
export const useProjectsHex = useProjects;
