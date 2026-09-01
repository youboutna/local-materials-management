// src/hooks/hexagonal/useHexagonalAuth.ts

import type { HexagonalAuthContextType } from '@/contexts/HexagonalAuthContext';
import { useHexagonalAuth as useHexAuth } from '@/contexts/HexagonalAuthContext';

/**
 * Hook pour utiliser le contexte d'authentification hexagonal
 * 
 * @example
 * ```tsx
 * const { user, login, logout, getOAuthProviders } = useHexagonalAuth();
 * 
 * // Récupérer les providers OAuth
 * const providers = await getOAuthProviders();
 * ```
 */
export const useHexagonalAuth = (): HexagonalAuthContextType => {
  return useHexAuth();
};

export default useHexagonalAuth;