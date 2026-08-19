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

/**
 * Localisation administrative d'un couple de coordonnées, sous forme d'entité
 * `Location` : limites administratives d'abord, repli reverse geocoding
 * (base locale puis Nominatim) assuré par le service.
 */
export const useLocationAtCoordinates = (
  lat?: number | null,
  lng?: number | null,
): { location: Location | null; isLoading: boolean; isError: boolean } => {
  const enabled = Number.isFinite(lat ?? NaN) && Number.isFinite(lng ?? NaN);

  const query = useQuery({
    queryKey: ['gis', 'location-at', lat, lng],
    queryFn: () => getAdministrativeBoundaryService().resolveLocationAt(lat as number, lng as number),
    enabled,
    staleTime: Infinity,
  });

  return {
    location: query.data ?? null,
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  };
};
