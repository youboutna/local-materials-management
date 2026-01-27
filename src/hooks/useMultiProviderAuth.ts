/**
 * Multi-Provider Auth Hook
 * Hook for accessing the multi-provider authentication context
 * Separated to avoid fast refresh warnings
 */

import { useContext } from 'react';
import { MultiProviderAuthContext } from '@/contexts/MultiProviderAuthContext';

export function useMultiProviderAuth() {
  const context = useContext(MultiProviderAuthContext);
  if (context === undefined) {
    throw new Error('useMultiProviderAuth must be used within a MultiProviderAuthProvider');
  }
  return context;
}
