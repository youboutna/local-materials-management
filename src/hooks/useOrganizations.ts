// src/hooks/useOrganizations.ts

import { getOrganizationService } from '@/application/services/OrganizationService';
import type {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
} from '@/dtos/entities/OrganizationDTO';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  all: ['organizations'] as const,
  byId: (id: string) => ['organizations', id] as const,
  byType: (type: string) => ['organizations', 'type', type] as const,
  byCategory: (category: string) => ['organizations', 'category', category] as const,
  children: (parentId: string) => ['organizations', 'children', parentId] as const,
  default: ['organizations', 'default'] as const,
};

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useOrganizations() {
  const service = getOrganizationService();
  const queryClient = useQueryClient();

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const query = useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => service.list(),
    staleTime: 30_000,
  });

  const defaultQuery = useQuery({
    queryKey: QUERY_KEYS.default,
    queryFn: () => service.getDefault(),
    staleTime: 30_000,
  });

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.default });
  };

  const create = useMutation({
    mutationFn: (data: CreateOrganizationDTO) => service.create(data),
    onSuccess: () => invalidateAll(),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationDTO }) =>
      service.update(id, data),
    onSuccess: () => invalidateAll(),
  });

  const upsert = useMutation({
    mutationFn: (data: CreateOrganizationDTO) => service.upsert(data),
    onSuccess: () => invalidateAll(),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => service.setDefault(id),
    onSuccess: () => invalidateAll(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => invalidateAll(),
  });

  const importMany = useMutation({
    mutationFn: (rows: CreateOrganizationDTO[]) => service.importMany(rows),
    onSuccess: () => invalidateAll(),
  });

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    // Data
    data: query.data,
    organizations: query.data ?? [],
    defaultOrganization: defaultQuery.data ?? null,

    // Status
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isMutating:
      create.isPending ||
      update.isPending ||
      upsert.isPending ||
      setDefault.isPending ||
      remove.isPending ||
      importMany.isPending,

    // Mutations
    create: create.mutateAsync,
    update: update.mutateAsync,
    upsert: upsert.mutateAsync,
    setDefault: setDefault.mutateAsync,
    remove: remove.mutateAsync,
    importMany: importMany.mutateAsync,

    // Refetch
    refetch: query.refetch,
  };
}

// ============================================================
// HOOKS SPÉCIALISÉS
// ============================================================

/**
 * Récupère une organisation par son ID
 */
export function useOrganization(id: string | undefined): UseQueryResult {
  const service = getOrganizationService();

  return useQuery({
    queryKey: id ? QUERY_KEYS.byId(id) : ['organizations', 'noop'],
    queryFn: () => (id ? service.get(id) : null),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Récupère les organisations d'un type donné
 */
export function useOrganizationsByType(orgType: string | undefined) {
  const service = getOrganizationService();

  return useQuery({
    queryKey: orgType ? QUERY_KEYS.byType(orgType) : ['organizations', 'type', 'noop'],
    queryFn: () => (orgType ? service.listByType(orgType) : []),
    enabled: !!orgType,
    staleTime: 30_000,
  });
}

/**
 * Récupère les organisations d'une catégorie
 */
export function useOrganizationsByCategory(category: string | undefined) {
  const service = getOrganizationService();

  return useQuery({
    queryKey: category ? QUERY_KEYS.byCategory(category) : ['organizations', 'category', 'noop'],
    queryFn: () => (category ? service.listByCategory(category) : []),
    enabled: !!category,
    staleTime: 30_000,
  });
}

/**
 * Récupère les enfants d'une organisation parente
 */
export function useOrganizationChildren(parentOrganizationId: string | undefined) {
  const service = getOrganizationService();

  return useQuery({
    queryKey: parentOrganizationId
      ? QUERY_KEYS.children(parentOrganizationId)
      : ['organizations', 'children', 'noop'],
    queryFn: () => (parentOrganizationId ? service.getChildren(parentOrganizationId) : []),
    enabled: !!parentOrganizationId,
    staleTime: 30_000,
  });
}

/**
 * Hook utilitaire : liste des organisations communautaires
 * (Wali, oasis, femmes, éleveurs, etc.)
 */
export function useCommunityOrganizations() {
  return useOrganizationsByCategory('communautaire');
}

/**
 * Hook utilitaire : liste des organisations institutionnelles
 */
export function useInstitutionalOrganizations() {
  return useOrganizationsByCategory('institutionnel');
}