/**
 * useProjectBudgetLinkHex - Hexagonal hook for project-budget linkage
 * Following hexagonal architecture: UI → Hook → Service → Repository → DB
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectBudgetLinkService } from '@/application/services/ProjectBudgetLinkService';
import type {
  ProjectBudgetLinkDTO,
  CreateProjectBudgetLinkDTO,
  UpdateProjectBudgetLinkDTO,
} from '@/dtos/entities/ProjectBudgetLinkDTO';

// Singleton service instance
const getBudgetLinkService = getProjectBudgetLinkService;

export function useProjectBudgetLinkHex(projectId?: string) {
  const queryClient = useQueryClient();
  const service = getBudgetLinkService();

  // Query: Get all budget links for a project
  const useProjectLinks = () => {
    return useQuery({
      queryKey: ['project-budget-links', projectId],
      queryFn: () => service.getLinksByProjectId(projectId!),
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Mutation: Create a new budget link
  const useCreateLink = () => {
    return useMutation({
      mutationFn: (dto: CreateProjectBudgetLinkDTO) => service.createLink(dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-budget-links', projectId] });
      },
    });
  };

  // Mutation: Update a budget link
  const useUpdateLink = () => {
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectBudgetLinkDTO }) =>
        service.updateLink(id, dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-budget-links', projectId] });
      },
    });
  };

  // Mutation: Delete a budget link
  const useDeleteLink = () => {
    return useMutation({
      mutationFn: (id: string) => service.deleteLink(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-budget-links', projectId] });
      },
    });
  };

  // Mutation: Batch create links
  const useBatchCreateLinks = () => {
    return useMutation({
      mutationFn: (links: CreateProjectBudgetLinkDTO[]) =>
        service.batchCreateLinks(projectId!, links),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-budget-links', projectId] });
      },
    });
  };

  return {
    useProjectLinks,
    useCreateLink,
    useUpdateLink,
    useDeleteLink,
    useBatchCreateLinks,
    calculateTotalAllocations: service.calculateTotalAllocations,
  };
}

// Export standalone service for direct use
export { getBudgetLinkService };
