/**
 * Workspaces Hook - Hexagonal Architecture
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface UseWorkspacesHexResult {
  workspaces: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    contact_manager?: string;
    contact_phone?: string;
    facilities?: string[];
    created_at?: string;
    updated_at?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createWorkspace: (data: CreateWorkspaceDTO) => void;
  updateWorkspace: { mutate: (params: { id: string; data: UpdateWorkspaceDTO }) => void; isPending: boolean };
  deleteWorkspace: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface CreateWorkspaceDTO {
  name: string;
  location: string;
  status?: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: string[];
}

export interface UpdateWorkspaceDTO {
  name?: string;
  location?: string;
  status?: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: string[];
}

/**
 * Main workspaces management hook
 */
export function useWorkspacesHex(): UseWorkspacesHexResult {
  const queryClient = useQueryClient();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async (): Promise<any[]> => {
      try {
        const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
        return await workspaceRepository.findAll();
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceDTO) => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.create(data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`L'espace de travail "${data?.name}" a été créé avec succès.`);
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast.error("Impossible de créer l'espace de travail.");
    }
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkspaceDTO }) => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.update(id, data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`L'espace de travail "${data?.name}" a été mis à jour.`);
    },
    onError: (error: Error) => {
      console.error('Error updating workspace:', error);
      toast.error("Impossible de mettre à jour l'espace de travail.");
    }
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      await workspaceRepository.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success("L'espace de travail a été supprimé.");
    },
    onError: () => {
      toast.error("Impossible de supprimer l'espace de travail.");
    }
  });

  return {
    workspaces,
    isLoading,
    error: error ? String(error) : null,
    refetch,
    createWorkspace: createWorkspaceMutation.mutate,
    updateWorkspace: updateWorkspaceMutation,
    deleteWorkspace: deleteWorkspaceMutation.mutate,
    isCreating: createWorkspaceMutation.isPending,
    isUpdating: updateWorkspaceMutation.isPending,
    isDeleting: deleteWorkspaceMutation.isPending,
  };
}

export function useWorkspaceById(id: string) {
  return useQuery({
    queryKey: ['workspaces', 'id', id],
    queryFn: async () => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.findById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspacesByStatus(status: string) {
  return useQuery({
    queryKey: ['workspaces', 'status', status],
    queryFn: async () => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.findByStatus(status);
    },
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
}
