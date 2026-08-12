/**
 * Hexagonal hook for btp.project_resources CRUD
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProjectResourceCrudService,
  type ProjectResourceInput,
} from '@/application/services/ProjectResourceCrudService';
import type { ProjectResourceRow } from '@/domain/repositories/IProjectResourceRepository';

export function useProjectResourcesCrudHex(projectId?: string, enabled = true) {
  const service = getProjectResourceCrudService();
  const queryClient = useQueryClient();

  const query = useQuery<ProjectResourceRow[]>({
    queryKey: ['project-resources', projectId],
    queryFn: () => service.getByProject(projectId as string),
    enabled: !!projectId && enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project-resources'] });

  const createMutation = useMutation({
    mutationFn: (input: ProjectResourceInput) => service.create(input),
    onSuccess: invalidate,
  });

  const createManyMutation = useMutation({
    mutationFn: (inputs: ProjectResourceInput[]) => service.createMany(inputs),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectResourceInput> }) =>
      service.update(id, updates),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: invalidate,
  });

  return {
    resources: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    createResource: createMutation.mutateAsync,
    createResources: createManyMutation.mutateAsync,
    updateResource: updateMutation.mutateAsync,
    deleteResource: deleteMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      createManyMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
