/**
 * useProjectStrategyLinkHex - Hexagonal hook for project-strategy linkage
 * Following hexagonal architecture: UI → Hook → Service → Repository → DB
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectStrategyLinkService } from '@/application/services/ProjectStrategyLinkService';
import type {
  ProjectStrategyLinkDTO,
  CreateProjectStrategyLinkDTO,
  UpdateProjectStrategyLinkDTO,
} from '@/dtos/entities/ProjectStrategyLinkDTO';

// Singleton service instance
const getStrategyLinkService = getProjectStrategyLinkService;

export function useProjectStrategyLinkHex(projectId?: string) {
  const queryClient = useQueryClient();
  const service = getStrategyLinkService();

  // Query: Get all strategy links for a project
  const useProjectLinks = () => {
    return useQuery({
      queryKey: ['project-strategy-links', projectId],
      queryFn: () => service.getLinksByProjectId(projectId!),
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Mutation: Create a new strategy link
  const useCreateLink = () => {
    return useMutation({
      mutationFn: (dto: CreateProjectStrategyLinkDTO) => service.createLink(dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-strategy-links', projectId] });
      },
    });
  };

  // Mutation: Update a strategy link
  const useUpdateLink = () => {
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectStrategyLinkDTO }) =>
        service.updateLink(id, dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-strategy-links', projectId] });
      },
    });
  };

  // Mutation: Delete a strategy link
  const useDeleteLink = () => {
    return useMutation({
      mutationFn: (id: string) => service.deleteLink(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-strategy-links', projectId] });
      },
    });
  };

  // Mutation: Batch create links
  const useBatchCreateLinks = () => {
    return useMutation({
      mutationFn: (links: CreateProjectStrategyLinkDTO[]) =>
        service.batchCreateLinks(projectId!, links),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-strategy-links', projectId] });
      },
    });
  };

  return {
    useProjectLinks,
    useCreateLink,
    useUpdateLink,
    useDeleteLink,
    useBatchCreateLinks,
    calculateTotalContribution: service.calculateTotalContribution,
  };
}

// Export standalone service for direct use
export { getStrategyLinkService };
