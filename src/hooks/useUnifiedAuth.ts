/**
 * Unified Auth Hooks
 * React hooks for using the unified auth context
 */

import { useContext } from 'react';
import { UnifiedAuthContext } from '@/contexts/UnifiedAuthContext';
import { UnifiedAuthContextType } from '@/dtos/entities/AuthDTO';

// Hook for using the unified auth context
export function useUnifiedAuthHex(): UnifiedAuthContextType {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}

// Backward compatibility hook
export function useAuthHex(): UnifiedAuthContextType {
  return useUnifiedAuth();
}
