// src/contexts/HexagonalAuthContext.tsx

import { getAuthManager, type AuthManagerConfig } from '@/application/services/AuthManager';
import type { AuthProvider } from '@/config/app';
import { getAppConfig } from '@/config/app';
import { getOAuthProviderConfig } from '@/config/referentials/oauth-providers.referential';
import { getOAuthRedirectUrl } from '@/config/supabaseConfig';
import type { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import type { AuthUser } from '@/dtos/entities/AuthDTO';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  session: { user: AuthUser | null; provider?: string; expires_at?: string | number } | null;
  error: Error | null;
  isAuthenticated: boolean;
  currentProvider: AuthProvider;

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Connexion rapide DEV (LocalAuthAdapter, aucun appel réseau) */
  devLogin: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Alias de `logout` (compat présentation) */
  signOut: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  loginWithOAuth: (provider: string | { provider: string; code?: string; state?: string; redirectUri?: string }) => Promise<void>;

  // OAuth specific
  getOAuthProviders: () => Promise<OAuthProviderConfig[]>;
  generateOAuthUrl: (provider: string, redirectUri?: string) => Promise<string>;

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

/**
 * Contexte partagé via un singleton global : en développement, le rechargement
 * à chaud (HMR) peut évaluer ce module plusieurs fois. Deux objets de contexte
 * distincts feraient échouer `useContext` côté consommateur.
 */
type ContextGlobal = typeof globalThis & {
  __hexAuthContext__?: React.Context<HexagonalAuthContextType | undefined>;
};
const contextGlobal = globalThis as ContextGlobal;
const HexagonalAuthContext =
  contextGlobal.__hexAuthContext__ ??
  (contextGlobal.__hexAuthContext__ = createContext<HexagonalAuthContextType | undefined>(undefined));

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
      if (session?.user) setUser(session.user);
      toast.success('Connexion réussie');
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erreur de connexion');
      setError(e);
      toast.error(e.message || 'Erreur de connexion');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const devLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const { getUnifiedAuthService } = await import('@/application/services/UnifiedAuthService');
      const { user: devUser } = await getUnifiedAuthService().devLogin(credentials);
      if (devUser) setUser(devUser as any);
      toast.success('Connexion DEV réussie');
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erreur de connexion DEV');
      setError(e);
      toast.error(e.message || 'Erreur de connexion DEV');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authManager.signOut();
      setUser(null);
      toast.success('Vous avez été déconnecté');
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erreur de déconnexion');
      setError(e);
      toast.error(e.message || 'Erreur de déconnexion');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      const { user, error } = await authManager.signUp(data);
      if (error) throw error;
      if (user) setUser(user);
      toast.success('Compte créé. Vérifiez votre email.');
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Erreur d'inscription");
      setError(e);
      toast.error(e.message || "Erreur d'inscription");
      throw e;
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
  // OAuth FUNCTIONS
  // ==========================================================================

  /**
   * Récupère la liste des fournisseurs OAuth disponibles.
   */
  const getOAuthProviders = useCallback(async (): Promise<OAuthProviderConfig[]> => {
    try {
      const config = getAppConfig();
      const provider = config.auth.provider;
      const providerConfig = getOAuthProviderConfig(provider);

      const providers: OAuthProviderConfig[] = [];

      switch (provider) {
        case 'supabase':
          providers.push(
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
          );
          break;
        case 'keycloak':
          providers.push({
            id: 'keycloak',
            providerName: 'keycloak',
            enabled: true,
            scopes: providerConfig.scopes || ['openid', 'profile', 'email', 'roles'],
          });
          break;
        case 'auth0':
          providers.push({
            id: 'auth0',
            providerName: 'auth0',
            enabled: true,
            scopes: providerConfig.scopes || ['openid', 'profile', 'email'],
          });
          break;
        default:
          break;
      }

      return providers;
    } catch (error) {
      console.error('Erreur lors de la récupération des providers OAuth:', error);
      return [];
    }
  }, []);

  /**
   * Génère l'URL d'authentification OAuth.
   *
   * ⚠️ `redirectUri` (optionnel) = URL de RETOUR après login (frontend).
   *    Ne jamais passer l'URL de callback Supabase ici.
   */
  const generateOAuthUrl = useCallback(async (
    provider: string,
    redirectUri?: string,
  ): Promise<string> => {
    try {
      const config = getAppConfig();
      const providerConfig = getOAuthProviderConfig(config.auth.provider as AuthProvider);

      // ✅ URL de retour vers le frontend (jamais localhost dans un build publié)
      const effectiveRedirect = redirectUri || getOAuthRedirectUrl();

      console.debug('[OAuth] generateOAuthUrl', {
        provider,
        effectiveRedirect,
        authProvider: config.auth.provider,
      });

      let authUrl = '';

      switch (config.auth.provider) {
        case 'supabase': {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider as 'github' | 'google' | 'gitlab' | 'azure',
            options: { redirectTo: effectiveRedirect, skipBrowserRedirect: true },
          });
          if (error) throw error;
          if (!data?.url) throw new Error(`URL OAuth introuvable pour ${provider}`);
          authUrl = data.url;
          break;
        }
        case 'keycloak':
          // ✅ Utilise effectiveRedirect (pas redirectUri brut)
          authUrl = `${config.auth.url}/realms/${config.auth.realm}/protocol/openid-connect/auth?client_id=${config.auth.clientId}&redirect_uri=${encodeURIComponent(effectiveRedirect)}&response_type=code&scope=${(providerConfig.scopes || ['openid', 'profile', 'email']).join('%20')}`;
          break;
        case 'auth0':
          // ✅ Utilise effectiveRedirect (pas redirectUri brut)
          authUrl = `${config.auth.url}/authorize?client_id=${config.auth.clientId}&redirect_uri=${encodeURIComponent(effectiveRedirect)}&response_type=code&scope=${(providerConfig.scopes || ['openid', 'profile', 'email']).join(' ')}`;
          break;
        default:
          throw new Error(`OAuth non supporté pour le fournisseur ${config.auth.provider}`);
      }

      console.debug('[OAuth] authUrl generated:', authUrl);
      return authUrl;
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL OAuth:", error);
      throw error;
    }
  }, []);

  /**
   * Connexion avec OAuth.
   *
   * ⚠️ Ne PAS remettre setLoading(false) après window.location.href : la page
   *    va se recharger, et le state React va être détruit. Un setLoading(false)
   *    ici provoquerait un flash visuel inutile.
   */
  const loginWithOAuth = useCallback(async (
    input: string | { provider: string; code?: string; state?: string; redirectUri?: string },
  ) => {
    const provider = typeof input === 'string' ? input : input.provider;

    // ✅ Respecter input.redirectUri s'il est fourni (callback flow)
    const redirectUri =
      typeof input === 'object' && input.redirectUri
        ? input.redirectUri
        : getOAuthRedirectUrl();

    try {
      setLoading(true);

      const authUrl = await generateOAuthUrl(provider, redirectUri);

      console.info('[OAuth] Redirection vers:', authUrl);
      window.location.href = authUrl;

      // ⚠️ Pas de setLoading(false) : la page se recharge, le state est détruit.
      //    En cas d'erreur uniquement, on remet loading à false (catch ci-dessous).
    } catch (err) {
      setLoading(false);
      const e = err instanceof Error ? err : new Error('Erreur de connexion OAuth');
      setError(e);
      console.error('[OAuth] Erreur:', e);
      throw e;
    }
  }, [generateOAuthUrl]);

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user) return false;
    return user.role === roleName || !!user.roles?.includes(roleName);
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
    isLoading: loading,
    session: user ? { user } : null,
    error,
    isAuthenticated: !!user,
    currentProvider,
    isDevelopmentMode,

    signOut: logout,
    login,
    devLogin,
    logout,
    register,
    resetPassword,
    updatePassword,
    loginWithOAuth,

    getOAuthProviders,
    generateOAuthUrl,

    hasRole,
    hasAnyRole,
    switchProvider,
    refetch,
    getCurrentProvider,

    showEmailEditor,
    unconfirmedEmail,
    updateEmail,
    cancelEmailEdit,
    triggerEmailEditor,

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
    throw new Error("useHexagonalAuth doit être utilisé à l'intérieur d'un HexagonalAuthProvider");
  }
  return context;
};

// ============================================================================
// EXPORT
// ============================================================================

export default HexagonalAuthContext;