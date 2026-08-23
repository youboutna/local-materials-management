/**
 * useConfigurableReferential — accès UI aux référentiels configurables en base.
 *
 * Résolution : base (label_fr/ar/en) → référentiel code → code technique.
 * Le code technique reste la valeur persistée (`value` des Select) ; seul
 * l'affichage est traduit selon la langue courante.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { getReferentialItemService } from '@/application/services/ReferentialItemService';
import type {
  ReferentialDomain,
  UpsertReferentialItemDTO,
} from '@/dtos/entities/ReferentialItemDTO';
import type { ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export const useConfigurableReferential = (
  domain: ReferentialDomain,
  projectId?: string | null
) => {
  const { language } = useLanguage();
  const lang = language as ReferentialLanguage;
  const service = getReferentialItemService();
  const queryClient = useQueryClient();
  const queryKey = ['referential-items', domain, projectId ?? null];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => service.list(domain, projectId),
    staleTime: 5 * 60 * 1000,
  });

  const items = data ?? [];

  const label = useCallback(
    (code?: string | null) => {
      if (!code) return '';
      const item = items.find((i) => i.code === code);
      return item ? service.labelOf(item, lang) : code;
    },
    [items, lang, service]
  );

  const options = useMemo(() => service.toOptions(items, lang), [items, lang, service]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpsertReferentialItemDTO) => service.save(dto),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    items,
    options,
    label,
    isLoading,
    isError,
    error,
    save: saveMutation.mutate,
    saveAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    remove: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
};
