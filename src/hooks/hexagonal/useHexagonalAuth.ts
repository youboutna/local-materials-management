/**
 * Hook personnalisé pour utiliser le contexte d'authentification hexagonal
 * Respecte l'architecture : hooks/hexagonal
 * Ce fichier exporte UNIQUEMENT useHexagonalAuth, pas le contexte.
 */

import { useContext } from 'react';
import { HexagonalAuthContext } from '@/contexts/HexagonalAuthContext';
import { HexagonalAuthContextType } from '@/contexts/HexagonalAuthContext.types';

export function useHexagonalAuth(): HexagonalAuthContextType {
  const context = useContext(HexagonalAuthContext);
  if (context === undefined) {
    throw new Error('useHexagonalAuth must be used within a HexagonalAuthProvider');
  }
  return context;
}