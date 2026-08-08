/**
 * Hexagonal hook for project hierarchy operations
 */

import { HierarchyService, getHierarchyService} from '@/application/services/HierarchyService';
import { CreateHierarchyNodeDTO, HierarchyNode, HierarchyStatisticsDTO, UpdateHierarchyNodeDTO } from '@/dtos/entities/HierarchyDTO';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  updateNode: (params: { id: string; updateData: UpdateHierarchyNodeDTO }) => Promise<HierarchyNode>;
  deleteNode: (id: string) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
}

export function useProjectHierarchyHex(projectId: string): UseProjectHierarchyResult {
  const { toast } = useToast();
  const service = getHierarchyService();

  const result = useQuery({
    queryKey: ['project-hierarchy', projectId],
    queryFn: () => service.getProjectHierarchy(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

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

export function useHierarchyStatisticsHex(projectId: string): UseHierarchyStatisticsResult {
  const { toast } = useToast();
  const service = getHierarchyService();

  const result = useQuery({
    queryKey: ['hierarchy-statistics', projectId],
    queryFn: async (): Promise<HierarchyStatisticsDTO> => {
      const stats = await service.getHierarchyStatistics(projectId);
      // Ensure stats matches HierarchyStatisticsDTO shape
      return {
        projectId,
        totalNodes: (stats as any).totalNodes || 0,
        maxDepth: (stats as any).maxDepth || 0,
        nodeTypes: (stats as any).nodeTypes || {},
        totalTasks: (stats as any).totalTasks || 0,
        completedTasks: (stats as any).completedTasks || 0,
        totalBudget: (stats as any).totalBudget || 0,
        actualCost: (stats as any).actualCost || 0,
        overallProgress: (stats as any).overallProgress || 0,
      };
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000,
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

export function useHierarchyMutationsHex(projectId: string): UseHierarchyMutationResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const service = getHierarchyService();

  const createMutation = useMutation({
    mutationFn: (nodeData: CreateHierarchyNodeDTO) => service.createHierarchyNode(nodeData),
    onSuccess: (newNode) => {
      toast({ title: 'Nœud créé', description: `Le nœud "${newNode.name}" a été créé` });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({ title: 'Erreur de création', description: error instanceof Error ? error.message : 'Erreur', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateHierarchyNodeDTO }) =>
      service.updateHierarchyNode(id, updateData),
    onSuccess: (updatedNode) => {
      toast({ title: 'Nœud mis à jour', description: `Le nœud "${updatedNode.name}" a été mis à jour` });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({ title: 'Erreur de mise à jour', description: error instanceof Error ? error.message : 'Erreur', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteHierarchyNode(id),
    onSuccess: () => {
      toast({ title: 'Nœud supprimé', description: 'Le nœud a été supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-statistics', projectId] });
    },
    onError: (error) => {
      toast({ title: 'Erreur de suppression', description: error instanceof Error ? error.message : 'Erreur', variant: 'destructive' });
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

export function useHierarchyPathHex(nodeId: string) {
  const service = getHierarchyService();

  return useQuery({
    queryKey: ['hierarchy-path', nodeId],
    queryFn: async () => {
      // Simplified - would need project context
      return [] as Array<{ id: string; name: string; type: string }>;
    },
    enabled: !!nodeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHierarchySearchHex(criteria: {
  projectId: string;
  searchText?: string;
  nodeType?: HierarchyNode['type'];
  status?: string;
}) {
  const service = getHierarchyService();

  return useQuery({
    queryKey: ['hierarchy-search', criteria],
    queryFn: async () => {
      // searchHierarchy doesn't exist on HierarchyService, filter locally
      const hierarchy = await service.getProjectHierarchy(criteria.projectId);
      let results = hierarchy;
      
      if (criteria.searchText) {
        const term = criteria.searchText.toLowerCase();
        results = results.filter(n => n.name.toLowerCase().includes(term));
      }
      if (criteria.nodeType) {
        results = results.filter(n => n.type === criteria.nodeType);
      }
      
      return results;
    },
    enabled: !!criteria.projectId,
    staleTime: 2 * 60 * 1000,
  });
}
