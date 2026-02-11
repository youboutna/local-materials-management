/**
 * Hexagonal hook for project hierarchy operations
 * Follows hexagonal architecture: UI → Hook → Service → Repository
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HierarchyNode, CreateHierarchyNodeDTO, UpdateHierarchyNodeDTO, HierarchyStatisticsDTO } from '@/dtos/entities/HierarchyDTO';
import { HierarchyService } from '@/application/services/HierarchyService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';

export interface UseProjectHierarchyResult {
  hierarchy: HierarchyNode[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseHierarchyStatisticsResult {
  statistics: HierarchyStatisticsDTO | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseHierarchyMutationResult {
  createNode: (nodeData: CreateHierarchyNodeDTO) => Promise<HierarchyNode>;
  updateNode: (id: string, updateData: UpdateHierarchyNodeDTO) => Promise<HierarchyNode>;
  deleteNode: (id: string) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook for fetching project hierarchy
 * Replaces direct supabase.rpc('get_project_hierarchy') calls
 */
export function useProjectHierarchyHex(projectId: string): UseProjectHierarchyResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize service with RepositoryFactory
  const service = new HierarchyService(RepositoryFactory.getHierarchyRepository());

  const result = useQuery({
    queryKey: ['project-hierarchy', projectId],
    queryFn: () => service.getProjectHierarchy(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Handle errors with toast notifications
  if (result.error) {
    toast({
      title: 'Erreur de chargement',
      description: 'Impossible de charger la hiérarchie du projet',
      variant: 'destructive',
    });
  }

  return {
    hierarchy: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for hierarchy statistics
 */
export function useHierarchyStatisticsHex(projectId: string): UseHierarchyStatisticsResult {
  const { toast } = useToast();
  const service = new HierarchyService(RepositoryFactory.getHierarchyRepository());

  const result = useQuery({
    queryKey: ['hierarchy-statistics', projectId],
    queryFn: () => service.getHierarchyStatistics(projectId),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (result.error) {
    toast({
      title: 'Erreur de statistiques',
      description: 'Impossible de calculer les statistiques de hiérarchie',
      variant: 'destructive',
    });
  }

  return {
    statistics: result.data || null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for hierarchy mutations (create, update, delete)
 */
export function useHierarchyMutationsHex(projectId: string): UseHierarchyMutationResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const service = new HierarchyService(RepositoryFactory.getHierarchyRepository());

  // Create node mutation
  const createMutation = useMutation({
    mutationFn: (nodeData: CreateHierarchyNodeDTO) => service.createHierarchyNode(nodeData),
    onSuccess: (newNode) => {
      toast({
        title: 'Nœud créé',
        description: `Le nœud "${newNode.name}" a été créé avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de création',
        description: error instanceof Error ? error.message : 'Impossible de créer le nœud',
        variant: 'destructive',
      });
    },
  });

  // Update node mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateHierarchyNodeDTO }) =>
      service.updateHierarchyNode(id, updateData),
    onSuccess: (updatedNode) => {
      toast({
        title: 'Nœud mis à jour',
        description: `Le nœud "${updatedNode.name}" a été mis à jour avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le nœud',
        variant: 'destructive',
      });
    },
  });

  // Delete node mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteHierarchyNode(id),
    onSuccess: () => {
      toast({
        title: 'Nœud supprimé',
        description: 'Le nœud a été supprimé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de suppression',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le nœud',
        variant: 'destructive',
      });
    },
  });

  return {
    createNode: createMutation.mutateAsync,
    updateNode: updateMutation.mutateAsync,
    deleteNode: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: createMutation.error || updateMutation.error || deleteMutation.error,
  };
}

/**
 * Hook for hierarchy path breadcrumb
 */
export function useHierarchyPathHex(nodeId: string) {
  const service = new HierarchyService(RepositoryFactory.getHierarchyRepository());

  return useQuery({
    queryKey: ['hierarchy-path', nodeId],
    queryFn: async () => {
      const hierarchy = await service.getProjectHierarchy(
        'dummy-project-id' // This would need to be passed or derived
      );
      const node = hierarchy.find(n => n.id === nodeId);
      if (!node) return [];

      // Build breadcrumb path
      const path: Array<{ id: string; name: string; type: string }> = [];
      let currentNode: HierarchyNode | undefined = node;

      while (currentNode) {
        path.unshift({
          id: currentNode.id,
          name: currentNode.name,
          type: currentNode.type,
        });
        
        if (currentNode.parentId) {
          currentNode = hierarchy.find(n => n.id === currentNode!.parentId);
        } else {
          break;
        }
      }

      return path;
    },
    enabled: !!nodeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for hierarchy search
 */
export function useHierarchySearchHex(criteria: {
  projectId: string;
  searchText?: string;
  nodeType?: HierarchyNode['type'];
  status?: string;
}) {
  const service = new HierarchyService(RepositoryFactory.getHierarchyRepository());

  return useQuery({
    queryKey: ['hierarchy-search', criteria],
    queryFn: () => service.searchHierarchy(criteria),
    enabled: !!criteria.projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
