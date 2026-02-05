/**
 * useProjectHex - Hexagonal Architecture Hook for Projects
 * 
 * Following the pattern:
 * const useEntityHex = () => {
 *   const [entities, setEntities] = useState<EntityDTO[]>([])
 *   const [loading, setLoading] = useState(false)
 * 
 *   const createEntity = async (request: CreateEntityDTO): Promise<EntityDTO>
 *   const fetchEntities = async (): Promise<EntityDTO[]>
 *   const updateEntity = async (id: string, request: UpdateEntityDTO): Promise<EntityDTO | null>
 *   const deleteEntity = async (id: string): Promise<boolean>
 * 
 *   return { entities, loading, createEntity, fetchEntities, updateEntity, deleteEntity }
 * }
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import type { 
  ProjectDTO, 
  CreateProjectDTO, 
  UpdateProjectDTO,
  ProjectDetailDTO,
  ProjectSummaryDTO 
} from '@/dtos/entities/ProjectDTO';
import { toast } from 'sonner';

// =================== TYPES ===================

export interface UseProjectHexResult {
  // State
  projects: ProjectDTO[];
  loading: boolean;
  error: unknown;
  
  // CRUD Operations
  createProject: (request: CreateProjectDTO) => Promise<ProjectDTO>;
  fetchProjects: () => Promise<ProjectDTO[]>;
  updateProject: (id: string, request: UpdateProjectDTO) => Promise<ProjectDTO | null>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Additional operations
  refetch: () => void;
  
  // Mutation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseProjectByIdHexResult {
  project: ProjectDTO | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

// =================== SERVICE FACTORY ===================

function useProjectService() {
  return useMemo(() => {
    const repository = RepositoryFactory.getProjectRepository();
    return new ProjectService(repository);
  }, []);
}

// =================== MAIN HOOK ===================

export function useProjectHex(): UseProjectHexResult {
  const queryClient = useQueryClient();
  const projectService = useProjectService();

  // Fetch all projects
  const {
    data: projects = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects-hex'],
    queryFn: async (): Promise<ProjectDTO[]> => {
      return projectService.findAll();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (request: CreateProjectDTO): Promise<ProjectDTO> => {
      return projectService.create(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error) => {
      toast.error('Échec de la création du projet');
      console.error('Create project error:', error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, request }: { id: string; request: UpdateProjectDTO }): Promise<ProjectDTO | null> => {
      return projectService.update(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Échec de la mise à jour du projet');
      console.error('Update project error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      return projectService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Échec de la suppression du projet');
      console.error('Delete project error:', error);
    },
  });

  // CRUD operations
  const createProject = useCallback(async (request: CreateProjectDTO): Promise<ProjectDTO> => {
    return createMutation.mutateAsync(request);
  }, [createMutation]);

  const fetchProjects = useCallback(async (): Promise<ProjectDTO[]> => {
    await refetch();
    return projects;
  }, [refetch, projects]);

  const updateProject = useCallback(async (id: string, request: UpdateProjectDTO): Promise<ProjectDTO | null> => {
    return updateMutation.mutateAsync({ id, request });
  }, [updateMutation]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  return {
    projects,
    loading,
    error,
    createProject,
    fetchProjects,
    updateProject,
    deleteProject,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// =================== BY ID HOOK ===================

export function useProjectByIdHex(id: string): UseProjectByIdHexResult {
  const projectService = useProjectService();

  const {
    data: project = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects-hex', 'id', id],
    queryFn: async (): Promise<ProjectDTO | null> => {
      if (!id) return null;
      return projectService.findById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    project,
    loading,
    error,
    refetch,
  };
}

// =================== SPECIALIZED HOOKS ===================

export function useProjectDetailsHex(id: string) {
  const projectService = useProjectService();

  return useQuery({
    queryKey: ['projects-hex', 'details', id],
    queryFn: async (): Promise<ProjectDetailDTO | null> => {
      if (!id) return null;
      return projectService.getProjectWithDetails(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectSummaryHex(id: string) {
  const projectService = useProjectService();

  return useQuery({
    queryKey: ['projects-hex', 'summary', id],
    queryFn: async (): Promise<ProjectSummaryDTO | null> => {
      if (!id) return null;
      return projectService.getProjectSummary(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveProjectsHex() {
  const projectService = useProjectService();

  return useQuery({
    queryKey: ['projects-hex', 'active'],
    queryFn: async (): Promise<ProjectDTO[]> => {
      return projectService.getActiveProjects();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectsByStatusHex(status: string) {
  const projectService = useProjectService();

  return useQuery({
    queryKey: ['projects-hex', 'status', status],
    queryFn: async (): Promise<ProjectDTO[]> => {
      return projectService.getProjectsByStatus(status);
    },
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectStatisticsHex() {
  const projectService = useProjectService();

  return useQuery({
    queryKey: ['projects-hex', 'statistics'],
    queryFn: async () => {
      return projectService.getProjectStatistics();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// =================== FORM INTEGRATION HOOK ===================

export function useProjectFormHex() {
  const queryClient = useQueryClient();
  const projectService = useProjectService();

  const createFromForm = useCallback(async (formData: Record<string, unknown>): Promise<ProjectDTO> => {
    const request = ProjectTransformer.formToCreateRequest(formData);
    const result = await projectService.create(request);
    queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
    toast.success('Projet créé avec succès');
    return result;
  }, [projectService, queryClient]);

  const updateFromForm = useCallback(async (id: string, formData: Record<string, unknown>): Promise<ProjectDTO | null> => {
    const request = ProjectTransformer.formToUpdateRequest(formData);
    const result = await projectService.update(id, request);
    queryClient.invalidateQueries({ queryKey: ['projects-hex'] });
    toast.success('Projet mis à jour avec succès');
    return result;
  }, [projectService, queryClient]);

  return {
    createFromForm,
    updateFromForm,
  };
}
