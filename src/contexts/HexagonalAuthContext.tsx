// src/contexts/HexagonalAuthContext.tsx

import { getAuthManager, type AuthManagerConfig } from '@/application/services/AuthManager';
import type { AuthProvider } from '@/config/app';
import { getAppConfig } from '@/config/app';
import { getOAuthProviderConfig } from '@/config/referentials/oauth-providers.referential';
import type { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import type { AuthUser } from '@/dtos/entities/AuthDTO';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface OAuthProviderConfig {
  id: string;
  providerName: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  metadata?: Record<string, unknown>;
}

export interface HexagonalAuthContextType {
  // Core auth state
  user: AuthUser | null;
  loading: boolean;
  /** Alias de `loading` (compat présentation) */
  isLoading: boolean;
  /** Session courante (compat présentation) */
  session: { user: AuthUser | null } | null;
  error: Error | null;
  isAuthenticated: boolean;
  currentProvider: AuthProvider;
  
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  loginWithOAuth: (provider: string) => Promise<void>;
  
  // OAuth specific - ✅ AJOUTÉ
  getOAuthProviders: () => Promise<OAuthProviderConfig[]>;
  generateOAuthUrl: (provider: string, redirectUri: string) => Promise<string>;
  
  // Utility
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  
  // Email editor
  showEmailEditor: boolean;
  unconfirmedEmail: string | null;
  updateEmail: (newEmail: string) => Promise<void>;
  cancelEmailEdit: () => void;
  triggerEmailEditor: (email: string) => void;
  
  // Provider switch
  switchProvider: (config: AuthManagerConfig) => Promise<void>;
  supportedProviders: Array<{ value: AuthProvider; label: string; description: string }>;
  refetch: () => void;
  getCurrentProvider: () => AuthProvider;
  isDevelopmentMode: boolean;
}

// ============================================================================
// CONTEXTE
// ============================================================================

const HexagonalAuthContext = createContext<HexagonalAuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const HexagonalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentProvider, setCurrentProvider] = useState<AuthProvider>('supabase');
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const authManager = getAuthManager();

  // ==========================================================================
  // CHARGEMENT DE LA CONFIGURATION
  // ==========================================================================

  useEffect(() => {
    try {
      const config = getAppConfig();
      setCurrentProvider(config.auth.provider);
      setIsDevelopmentMode(config.mode === 'development' || config.mode === 'local-bypass');
    } catch (e) {
      console.warn('Erreur de configuration:', e);
    }
  }, []);

  // ==========================================================================
  // CHARGEMENT DE L'UTILISATEUR
  // ==========================================================================

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const { user: currentUser } = await authManager.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ==========================================================================
  // ACTIONS D'AUTHENTIFICATION
  // ==========================================================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const { session, error } = await authManager.signInWithCredentials(credentials);
      if (error) throw error;
      if (session?.user) {
        setUser(session.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de connexion'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authManager.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de déconnexion'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      const { user, error } = await authManager.signUp(data);
      if (error) throw error;
      if (user) {
        setUser(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur d\'inscription'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { error } = await authManager.resetPassword(email);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de réinitialisation'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      const { error } = await authManager.updatePassword(newPassword);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de mise à jour'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  // ==========================================================================
  // OAuth FUNCTIONS - ✅ AJOUTÉ
  // ==========================================================================

  /**
   * Récupère la liste des fournisseurs OAuth disponibles
   */
  const getOAuthProviders = useCallback(async (): Promise<OAuthProviderConfig[]> => {
    try {
      const config = getAppConfig();
      const provider = config.auth.provider;
      const providerConfig = getOAuthProviderConfig(provider);

      // Construire la liste des providers disponibles
      let providers: OAuthProviderConfig[] = [];

      switch (provider) {
        case 'supabase':
          providers = [
            {
              id: 'google',
              providerName: 'google',
              enabled: true,
              scopes: providerConfig.scopes || ['openid', 'profile', 'email'],
            },
            {
              id: 'github',
              providerName: 'github',
              enabled: true,
              scopes: ['user:email'],
            },
          ];
          break;
        case 'keycloak':
          providers = [
            {
              id: 'keycloak',
              providerName: 'keycloak',
              enabled: true,
              scopes: providerConfig.scopes || ['openid', 'profile', 'email', 'roles'],
            },
          ];
          break;
        case 'auth0':
          providers = [
            {
              id: 'auth0',
              providerName: 'auth0',
              enabled: true,
              scopes: providerConfig.scopes || ['openid', 'profile', 'email'],
            },
          ];
          break;
        default:
          providers = [];
      }

      return providers;
    } catch (error) {
      console.error('Erreur lors de la récupération des providers OAuth:', error);
      return [];
    }
  }, []);

  /**
   * Génère l'URL d'authentification OAuth pour un fournisseur
   */
  const generateOAuthUrl = useCallback(async (provider: string, redirectUri: string): Promise<string> => {
    try {
      const config = getAppConfig();
      const providerConfig = getOAuthProviderConfig(config.auth.provider as AuthProvider);
      
      let authUrl = '';
      
      switch (config.auth.provider) {
        case 'supabase':
          authUrl = `${config.auth.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}`;
          break;
        case 'keycloak':
          authUrl = `${config.auth.url}/realms/${config.auth.realm}/protocol/openid-connect/auth?client_id=${config.auth.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${(providerConfig.scopes || ['openid', 'profile', 'email']).join('%20')}`;
          break;
        case 'auth0':
          authUrl = `${config.auth.url}/authorize?client_id=${config.auth.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${(providerConfig.scopes || ['openid', 'profile', 'email']).join(' ')}`;
          break;
        default:
          throw new Error(`OAuth non supporté pour le fournisseur ${config.auth.provider}`);
      }
      
      return authUrl;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL OAuth:', error);
      throw error;
    }
  }, []);

  /**
   * Connexion avec OAuth
   */
  const loginWithOAuth = useCallback(async (provider: string) => {
    try {
      setLoading(true);
      const config = getAppConfig();
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = await generateOAuthUrl(provider, redirectUri);
      
      // Rediriger l'utilisateur vers l'URL d'authentification
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de connexion OAuth'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [generateOAuthUrl]);

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user) return false;
    return user.role === roleName || (user.roles && user.roles.includes(roleName));
  }, [user]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!user) return false;
    return roleNames.some(role => hasRole(role));
  }, [user, hasRole]);

  const switchProvider = useCallback(async (config: AuthManagerConfig) => {
    try {
      await authManager.switchProvider(config);
      setCurrentProvider(config.provider);
      await loadUser();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de changement de fournisseur'));
      throw err;
    }
  }, [authManager, loadUser]);

  const refetch = useCallback(() => {
    loadUser();
  }, [loadUser]);

  const getCurrentProvider = useCallback(() => currentProvider, [currentProvider]);

  // ==========================================================================
  // ÉDITEUR D'EMAIL
  // ==========================================================================

  const updateEmail = useCallback(async (newEmail: string) => {
    try {
      setLoading(true);
      // Logique de mise à jour d'email
      // À implémenter selon le provider
      setUnconfirmedEmail(null);
      setShowEmailEditor(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de mise à jour'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelEmailEdit = useCallback(() => {
    setShowEmailEditor(false);
    setUnconfirmedEmail(null);
  }, []);

  const triggerEmailEditor = useCallback((email: string) => {
    setUnconfirmedEmail(email);
    setShowEmailEditor(true);
  }, []);

  // ==========================================================================
  // FOURNISSEURS SUPPORTÉS
  // ==========================================================================

  const supportedProviders = useMemo(() => {
    return [
      { value: 'supabase' as AuthProvider, label: 'Supabase', description: 'Géré par Supabase' },
      { value: 'keycloak' as AuthProvider, label: 'Keycloak', description: 'SSO Entreprise' },
      { value: 'auth0' as AuthProvider, label: 'Auth0', description: 'Plateforme Auth0' },
      { value: 'local' as AuthProvider, label: 'Local (DEV)', description: 'Mode développement' },
      { value: 'custom' as AuthProvider, label: 'Custom', description: 'Personnalisé' },
    ];
  }, []);

  // ==========================================================================
  // VALUE
  // ==========================================================================

  const value: HexagonalAuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    currentProvider,
    isDevelopmentMode,
    
    // Auth actions
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    loginWithOAuth,
    
    // OAuth specific - ✅ EXPOSÉ
    getOAuthProviders,
    generateOAuthUrl,
    
    // Utility
    hasRole,
    hasAnyRole,
    switchProvider,
    refetch,
    getCurrentProvider,
    
    // Email editor
    showEmailEditor,
    unconfirmedEmail,
    updateEmail,
    cancelEmailEdit,
    triggerEmailEditor,
    
    // Providers
    supportedProviders,
  };

  return (
    <HexagonalAuthContext.Provider value={value}>
      {children}
    </HexagonalAuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useHexagonalAuth = (): HexagonalAuthContextType => {
  const context = useContext(HexagonalAuthContext);
  if (!context) {
    throw new Error('useHexagonalAuth doit être utilisé à l\'intérieur d\'un HexagonalAuthProvider');
  }
  return context;
};

// ============================================================================
// EXPORT
// ============================================================================

export default HexagonalAuthContext;