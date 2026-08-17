/**
 * Hexagonal Auth Context - Provider
 * Exporte le contexte et le Provider UNIQUEMENT
 */

import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getUnifiedAuthService, OAuthLoginData } from '@/application/services/UnifiedAuthService';
import { AuthProvider, AuthManagerConfig } from '@/config/app';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/config/auth';
import { DEV_MODE } from '@/config/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import { HexagonalAuthContextType } from './HexagonalAuthContext.types';

// Création du contexte
export const HexagonalAuthContext = createContext<HexagonalAuthContextType | undefined>(undefined);

// Provider
export function HexagonalAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  
  const unifiedAuthService = getUnifiedAuthService();

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
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const user = sessionData?.user || null;
  const session = sessionData?.session || null;
  const isAuthenticated = !!user && !!session;

  const triggerEmailEditor = useCallback((email: string) => {
    setUnconfirmedEmail(email);
    setShowEmailEditor(true);
  }, []);

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
      setShowEmailEditor(false);
      setUnconfirmedEmail(null);
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes(AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED)) {
        toast.warning(AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED);
      } else {
        toast.error(error?.message || AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    }
  });

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
      setShowEmailEditor(false);
      setUnconfirmedEmail(null);
    },
    onError: (error: any) => {
      console.error('OAuth login error:', error);
      toast.error(error?.message || 'Erreur de connexion OAuth');
    }
  });

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
      setShowEmailEditor(false);
      setUnconfirmedEmail(null);
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast.error(error?.message || "Échec de l'inscription. Veuillez réessayer.");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await unifiedAuthService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Déconnexion réussie");
      navigate('/auth');
      setShowEmailEditor(false);
      setUnconfirmedEmail(null);
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      toast.error("Erreur lors de la déconnexion");
    }
  });

  const updateEmail = useCallback(async (newEmail: string) => {
    if (!unconfirmedEmail) {
      toast.error("Aucun email à modifier.");
      return;
    }
    try {
      await unifiedAuthService.updateEmail(unconfirmedEmail, newEmail);
      toast.success(AUTH_SUCCESS_MESSAGES.EMAIL_UPDATED.replace('{email}', newEmail));
      setShowEmailEditor(false);
      setUnconfirmedEmail(null);
    } catch (error: any) {
      console.error('Update email error:', error);
      toast.error(error?.message || AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED);
    }
  }, [unconfirmedEmail, unifiedAuthService]);

  const cancelEmailEdit = useCallback(() => {
    setShowEmailEditor(false);
    setUnconfirmedEmail(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await loginMutation.mutateAsync(credentials);
    } catch (error) { throw error; }
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

  const getOAuthProviders = useCallback(async () => {
    return await unifiedAuthService.getAvailableOAuthProviders();
  }, [unifiedAuthService]);

  const generateOAuthUrl = useCallback(async (provider: string, redirectUri: string) => {
    return await unifiedAuthService.generateOAuthLoginUrl(provider, redirectUri);
  }, [unifiedAuthService]);

  const getCurrentProvider = useCallback((): AuthProvider => {
    return session?.provider || 'supabase';
  }, [session]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user?.role) return false;
    return String(user.role).toLowerCase() === roleName.toLowerCase();
  }, [user]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!user?.role) return false;
    return roleNames.some(role => String(user.role).toLowerCase() === role.toLowerCase());
  }, [user]);

  // Switch Provider (avec fallback)
  const switchProvider = useCallback(async (config: AuthManagerConfig) => {
    try {
      setLoading(true);
      console.log('🔄 Switching to provider:', config.provider);
      
      const { getAuthManager } = await import('@/application/services/AuthManager');
      const authManager = getAuthManager();
      
      if (typeof authManager.switchProvider === 'function') {
        await authManager.switchProvider(config);
      } else {
        console.warn('⚠️ authManager.switchProvider is not a function. Using fallback.');
        setCurrentProvider(config.provider);
        toast({
          title: t('common.success'),
          description: `Provider changed to ${config.provider} (local).`,
        });
        setLoading(false);
        return;
      }
      
      setCurrentProvider(config.provider);
      const sessionResult = await unifiedAuthService.getCurrentSession();
      const userResult = await unifiedAuthService.getCurrentUser();
      if (sessionResult.session && userResult.user) {
        const unifiedSession = {
          user: {
            id: userResult.user.id,
            email: userResult.user.email || '',
            full_name: userResult.user.full_name,
            phone: userResult.user.phone,
            national_id: userResult.user.national_id,
            role: userResult.user.role,
            avatar_url: undefined,
            metadata: {}
          },
          expires_at: sessionResult.session.expiresAt ? String(sessionResult.session.expiresAt) : undefined,
          provider: config.provider
        };
        setSession(unifiedSession);
        setUser(unifiedSession.user);
      }
      
      toast({
        title: t('common.success'),
        description: `Fournisseur changé pour ${config.provider}.`,
      });
    } catch (error) {
      console.error('❌ Error switching provider:', error);
      toast({
        title: t('common.error'),
        description: "Échec du changement de fournisseur d'authentification.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [unifiedAuthService, toast, t]);

  // Listener Supabase avec reset de l'éditeur
  useEffect(() => {
    if (DEV_MODE) {
      console.log('🛠️ DEV_MODE=true — skipping Supabase listener.');
      return;
    }
    console.log('🔧 Setting up hexagonal auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Hexagonal auth state changed:', event, session?.user?.email || 'no user');
        queryClient.invalidateQueries({ queryKey: ['unified-auth'] });
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
          setShowEmailEditor(false);
          setUnconfirmedEmail(null);
        } else if (event === 'SIGNED_IN' && session) {
          setTimeout(() => refetch(), 100);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [queryClient, refetch]);

  const contextValue: HexagonalAuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: error?.message || null,
    login,
    loginWithOAuth,
    register,
    logout,
    getOAuthProviders,
    generateOAuthUrl,
    refetch,
    getCurrentProvider,
    hasRole,
    hasAnyRole,
    showEmailEditor,
    unconfirmedEmail,
    updateEmail,
    cancelEmailEdit,
    triggerEmailEditor,
  };

  return (
    <HexagonalAuthContext.Provider value={contextValue}>
      {children}
    </HexagonalAuthContext.Provider>
  );
}