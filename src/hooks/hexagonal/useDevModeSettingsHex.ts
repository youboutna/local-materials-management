/**
 * useDevModeSettingsHex — unique orchestrateur React du mode DEV/API.
 * Consomme DevModeService (qui réutilise SystemSettingsService) + la session hexagonale.
 */

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDevModeService } from '@/application/services/DevModeService';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import type { DevModeStateDTO } from '@/dtos/dev/DevModeDTO';

export function useDevModeSettingsHex() {
  const service = useMemo(() => getDevModeService(), []);
  const queryClient = useQueryClient();
  const { login, signOut, isAuthenticated } = useHexagonalAuth();
  const [state, setState] = useState<DevModeStateDTO>(() => service.getState());
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const switchToLocal = useCallback(
    async (roleCode: string) => {
      setIsSwitching(true);
      setError(null);
      try {
        const profile = await service.switchToLocal(roleCode);
        if (!profile.password) {
          throw new Error(`Profil DEV incomplet: aucun mot de passe local pour ${profile.email}`);
        }
        await login({ email: profile.email, password: profile.password });
        await queryClient.invalidateQueries();
        setState(service.getState());
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error('DEV switch failed');
        setError(normalized);
        throw normalized;
      } finally {
        setIsSwitching(false);
      }
    },
    [service, login, queryClient]
  );

  const switchToApi = useCallback(async () => {
    setIsSwitching(true);
    setError(null);
    try {
      await service.switchToApi();
      await signOut();
      queryClient.clear();
      setState(service.getState());
      window.location.href = '/auth';
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error('API switch failed');
      setError(normalized);
      throw normalized;
    } finally {
      setIsSwitching(false);
    }
  }, [service, signOut, queryClient]);

  return {
    state,
    isAuthenticated,
    isSwitching,
    error,
    switchToLocal,
    switchToApi,
  };
}
