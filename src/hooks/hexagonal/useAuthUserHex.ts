/**
 * Hexagonal Hook: useAuthUserHex - Wrapper autour du contexte hexagonal
 * Fournit un accès simplifié aux données utilisateur
 * 
 * Ce hook utilise le contexte HexagonalAuthContext pour obtenir l'utilisateur courant.
 * Il est conçu comme une couche de compatibilité pour les composants qui attendent
 * une interface similaire à l'ancien AuthContext.
 */

import { useHexagonalAuth } from './useHexagonalAuth';

export function useAuthUserHex() {
  const { user, isLoading, isAuthenticated } = useHexagonalAuth();

  return {
    user: user ?? null,
    userId: user?.id ?? null,
    isAuthenticated,
    isLoading,
    error: null, // Les erreurs sont gérées dans le contexte
    refetch: () => {
      // Le contexte gère les rafraîchissements automatiquement via React Query
      // On retourne une promesse résolue pour compatibilité
      return Promise.resolve();
    },
  };
}

export default useAuthUserHex;