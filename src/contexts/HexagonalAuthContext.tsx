/**
 * Hexagonal Auth Context
 * Unified authentication context following hexagonal architecture
 * Replaces multiple auth contexts with a single, provider-agnostic solution
 * Following PROMPTS.md: UI Component → Transformer → DTO → Service → Domain ← Adapter → DB
 */

import { OAuthLoginData, getUnifiedAuthService, UnifiedAuthSession, UnifiedAuthUser } from '@/application/services/UnifiedAuthService';
import { AuthProvider } from '@/config/app';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { DEV_MODE } from '@/config/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface HexagonalAuthContextType {
  // Core auth state
  user: UnifiedAuthUser | null;
  session: UnifiedAuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (oAuthData: OAuthLoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // OAuth specific
  getOAuthProviders: () => Promise<any[]>;
  generateOAuthUrl: (provider: string, redirectUri: string) => Promise<string>;
  
  // Session management
  refetch: () => void;
  getCurrentProvider: () => AuthProvider;
  
  // Utility
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

const HexagonalAuthContext = createContext<HexagonalAuthContextType | undefined>(undefined);

export function HexagonalAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize unified auth service
  const unifiedAuthService = getUnifiedAuthService();

  // Query for current session
  const {
    data: sessionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-auth', 'session'],
    queryFn: async () => {
      try {
        const result = await unifiedAuthService.getCurrentSession();
        return result;
      } catch (err) {
        console.error('Error fetching current session:', err);
        return { user: null, session: null };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const user = sessionData?.user || null;
  const session = sessionData?.session || null;
  const isAuthenticated = !!user && !!session;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await unifiedAuthService.login(credentials);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-auth'] });
      const userName = data.user?.fullName || data.user?.email || 'Utilisateur';
      toast.success(`Bienvenue ${userName}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error(error?.message || AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
  });

  // OAuth login mutation
  const oAuthLoginMutation = useMutation({
    mutationFn: async (oAuthData: OAuthLoginData) => {
      const result = await unifiedAuthService.loginWithOAuth(oAuthData);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-auth'] });
      const userName = data.user?.fullName || data.user?.email || 'Utilisateur';
      toast.success(`Bienvenue ${userName}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('OAuth login error:', error);
      toast.error(error?.message || 'Erreur de connexion OAuth');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const result = await unifiedAuthService.register(userData);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-auth'] });
      const userName = data?.fullName || data?.email || 'Utilisateur';
      toast.success(`Compte créé avec succès! Bienvenue ${userName}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast.error(error?.message || "Échec de l'inscription. Veuillez réessayer.");
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await unifiedAuthService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Déconnexion réussie");
      navigate('/auth');
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      toast.error("Erreur lors de la déconnexion");
    }
  });

  // Auth action handlers
  const login = useCallback(async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const loginWithOAuth = useCallback(async (oAuthData: OAuthLoginData) => {
    await oAuthLoginMutation.mutateAsync(oAuthData);
  }, [oAuthLoginMutation]);

  const register = useCallback(async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // OAuth helpers
  const getOAuthProviders = useCallback(async () => {
    return await unifiedAuthService.getAvailableOAuthProviders();
  }, [unifiedAuthService]);

  const generateOAuthUrl = useCallback(async (provider: string, redirectUri: string) => {
    return await unifiedAuthService.generateOAuthLoginUrl(provider, redirectUri);
  }, [unifiedAuthService]);

  // Utility functions
  const getCurrentProvider = useCallback((): AuthProvider => {
    return session?.provider || 'supabase';
  }, [session]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user?.role) return false;
    return String(user.role).toLowerCase() === roleName.toLowerCase();
  }, [user]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!user?.role) return false;
    return roleNames.some(role => 
      String(user.role).toLowerCase() === role.toLowerCase()
    );
  }, [user]);

  // Set up auth state listener for real-time updates
  useEffect(() => {
    if (DEV_MODE) {
      console.log('🛠️ DEV_MODE=true — skipping Supabase listener; local session remains login-gated.');
      return;
    }
    console.log('🔧 Setting up hexagonal auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Hexagonal auth state changed:', event, session?.user?.email || 'no user');
        
        // Invalidate and refetch session data
        queryClient.invalidateQueries({ queryKey: ['unified-auth'] });
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
        } else if (event === 'SIGNED_IN' && session) {
          // Trigger refetch to get updated session data
          setTimeout(() => refetch(), 100);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up hexagonal auth subscription');
      subscription.unsubscribe();
    };
  }, [queryClient, refetch]);

  const contextValue: HexagonalAuthContextType = {
    // Core auth state
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: error?.message || null,

    // Auth actions
    login,
    loginWithOAuth,
    register,
    logout,

    // OAuth specific
    getOAuthProviders,
    generateOAuthUrl,

    // Session management
    refetch,
    getCurrentProvider,

    // Utility
    hasRole,
    hasAnyRole
  };

  return (
    <HexagonalAuthContext.Provider value={contextValue}>
      {children}
    </HexagonalAuthContext.Provider>
  );
}

// Hook for using hexagonal auth context
export function useHexagonalAuth(): HexagonalAuthContextType {
  const context = useContext(HexagonalAuthContext);
  if (context === undefined) {
    throw new Error('useHexagonalAuth must be used within a HexagonalAuthProvider');
  }
  return context;
}

// Export context for compatibility
export { HexagonalAuthContext };
