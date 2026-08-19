/**
 * useAdministrativeBoundaries — accès UI aux limites administratives via le service.
 * (TanStack Query v5 : pas de callbacks onError/onSuccess.)
 */
import { useQuery } from '@tanstack/react-query';
import { getAdministrativeBoundaryService } from '@/application/services/gis/AdministrativeBoundaryServiceFactory';
import type { AdministrativeBoundaryDTO } from '@/dtos/entities/AdministrativeBoundaryDTO';

export const ADMINISTRATIVE_BOUNDARIES_QUERY_KEY = ['gis', 'administrative-boundaries'] as const;

export interface UseAdministrativeBoundariesResult {
  boundaries: AdministrativeBoundaryDTO[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const useAdministrativeBoundaries = (
  enabled = true,
): UseAdministrativeBoundariesResult => {
  const query = useQuery({
    queryKey: ADMINISTRATIVE_BOUNDARIES_QUERY_KEY,
    queryFn: () => getAdministrativeBoundaryService().listBoundaries(),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    boundaries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: (query.error as Error) ?? null,
  };
};
