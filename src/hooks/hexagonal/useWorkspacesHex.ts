/**
 * Workspaces Hook - Hexagonal Architecture
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { UpdateWorkspaceDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { CreateWorkspaceDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { UseWorkspacesHexResult } from '@/dtos/entities/TaskAssignmentDTO';
export iexport function useWorkspacesHex(): UseWorkspacesHexResult {
  const queryClient = useQueryClient();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      const result = await workspaceRepository.findAll();
      return (result || []).map((w: any) => ({
        id: w.id,
        name: w.name || '',
        location: w.location || '',
        status: w.status || 'active',
        contact_manager: w.contact?.manager,
        contact_phone: w.contact?.phone,
        facilities: w.facilities,
        description: w.description,
        capacity: w.capacity,
        created_at: w.createdAt,
        updated_at: w.updatedAt,
      }));
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceDTO) => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.create({
        workspaceId: crypto.randomUUID(),
        workspaceCode: `WS-${Date.now()}`,
        name: data.name,
        location: data.location,
        description: data.description,
        capacity: data.capacity,
        contact: data.contact_manager || data.contact_phone ? {
          manager: data.contact_manager || '',
          phone: data.contact_phone || ''
        } : undefined,
        facilities: data.facilities,
        status: 'active' as any
      } as any);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`L'espace de travail "${data?.name}" a été créé avec succès.`);
    },
    onError: () => {
      toast.error("Impossible de créer l'espace de travail.");
    }
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkspaceDTO }) => {
      const workspaceRepository = RepositoryFactory.getWorkspaceRepository();
      return await workspaceRepository.update(id, {
        name: data.name,
        location: data.location,
        description: data.description,
        capacity: data.capacity,
        status: data.status as any,
        contact: data.contact_manager || data.contact_phone ? {
          manager: data.contact_manager || '',
          phone: data.contact_phone || ''
        } : undefined,
        facilities: data.facilities
      } as any);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(`L'espace de travail "${data?.name}" a été mis à jour.`);
    },
    onError: () => {
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

export function useWorkspaceByIdHex(id: string) {
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

export function useWorkspacesByStatusHex(status: string) {
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