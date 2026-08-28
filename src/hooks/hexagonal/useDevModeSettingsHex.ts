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
  const { login, signOut, isAuthenticated, hasAnyRole } = useHexagonalAuth();
  /** Le paramétrage du mode DEV est une responsabilité administrateur. */
  const canManageDevMode = hasAnyRole(['super_admin', 'admin', 'director', 'directeur']);
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

  const setDevModeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!canManageDevMode) {
        throw new Error("Seul un administrateur peut modifier le mode développement");
      }
      setIsSwitching(true);
      setError(null);
      try {
        await service.setDevModeEnabled(enabled);
        setState(service.getState());
        window.location.reload();
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error('DEV mode update failed');
        setError(normalized);
        throw normalized;
      } finally {
        setIsSwitching(false);
      }
    },
    [service, canManageDevMode]
  );

  return {
    state,
    isAuthenticated,
    canManageDevMode,
    setDevModeEnabled,
    isSwitching,
    error,
    switchToLocal,
    switchToApi,
  };
}
