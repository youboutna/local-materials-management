/**
 * useConfig — orchestrateur React du paramétrage système (ConfigService).
 * TanStack Query v5 : aucun callback onError/onSuccess.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getConfigService } from '@/application/services/ConfigService';
import type { ConfigEntry } from '@/domain/repositories/IConfigRepository';

const QUERY_KEY = ['app-config', 'entries'] as const;

export function useConfig() {
  const service = getConfigService();
  const queryClient = useQueryClient();

  const query = useQuery<ConfigEntry[]>({
    queryKey: QUERY_KEY,
    queryFn: () => service.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value, category }: ConfigEntry) => service.set(key, value, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
    saveEntry: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: (saveMutation.error as Error) ?? null,
  };
}
