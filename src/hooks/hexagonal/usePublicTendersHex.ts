/**
 * Hooks hexagonaux pour la consultation publique des appels d'offres
 * (portail fournisseur, accès anonyme).
 */
import { PublicTenderService } from '@/application/services/PublicTenderService';
import { useQuery } from '@tanstack/react-query';

export function usePublicOpenTenders() {
  return useQuery({
    queryKey: ['public-tenders-open'],
    queryFn: () => PublicTenderService.getOpenTenders(),
    staleTime: 60_000,
  });
}

export function usePublicTenderById(id: string | null) {
  return useQuery({
    queryKey: ['public-tender', id],
    queryFn: () => (id ? PublicTenderService.getTenderById(id) : null),
    enabled: !!id,
  });
}
