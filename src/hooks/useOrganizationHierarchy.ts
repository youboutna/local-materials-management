import { OrganizationHierarchyService } from '@/application/services/OrganizationHierarchyService';
import type { CreateOrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useOrganizationHierarchy(organizationId: string) {
  const service = getOrganizationHierarchyService();
  const queryClient = useQueryClient();
  const queryKey = ['organization-hierarchy', organizationId];
  const query = useQuery({ queryKey, queryFn: () => service.list(organizationId), enabled: !!organizationId });
  const create = useMutation({ mutationFn: (data: CreateOrganizationHierarchyDTO) => service.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationHierarchyDTO }) => service.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  const remove = useMutation({ mutationFn: (id: string) => service.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  return { ...query, create: create.mutateAsync, update: update.mutateAsync, remove: remove.mutateAsync, isMutating: create.isPending || update.isPending || remove.isPending };
}