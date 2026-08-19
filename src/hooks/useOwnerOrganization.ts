import { useQuery } from '@tanstack/react-query';
import { getOrganizationService } from '@/application/services/OrganizationService';
import type { OrganizationDTO } from '@/dtos/entities/OrganizationDTO';

/**
 * Organisation propriétaire (maître d'ouvrage) de l'ensemble des projets.
 *
 * Source de vérité = table des organisations (`isDefault` = propriétaire par
 * défaut des nouveaux projets). Aucun libellé codé en dur ici : le repli
 * éventuel est assuré par le référentiel de branding côté UI.
 */
export function useOwnerOrganization() {
  const service = getOrganizationService();

  const query = useQuery<OrganizationDTO | null>({
    queryKey: ['organizations', 'owner'],
    queryFn: async () => {
      const orgs = await service.list();
      const active = (orgs ?? []).filter((o) => o.isActive !== false);
      // Priorité : organisation par défaut → organisation racine → première active
      return (
        active.find((o) => o.isDefault) ??
        active.find((o) => !o.parentId) ??
        active[0] ??
        null
      );
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    organization: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
