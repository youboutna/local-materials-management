import { OrganizationService } from '@/application/services/OrganizationService';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useOrganizations() {
  const service = getOrganizationService();
  const queryClient = useQueryClient();
  const queryKey = ['organizations'];
  const query = useQuery({ queryKey, queryFn: () => service.list() });
  const create = useMutation({ mutationFn: (data: CreateOrganizationDTO) => service.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationDTO }) => service.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  const upsert = useMutation({ mutationFn: (data: CreateOrganizationDTO) => service.upsert(data), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  const remove = useMutation({ mutationFn: (id: string) => service.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
  return { ...query, create: create.mutateAsync, update: update.mutateAsync, upsert: upsert.mutateAsync, remove: remove.mutateAsync, isMutating: create.isPending || update.isPending || upsert.isPending || remove.isPending };
}