// OAuth Configuration Hook - Architecture Hexagonale
// Uses ConfigurationService for OAuth setup and configuration
/**
 * /src/hooks/hexagonal/useOAuthConfigHex.ts
 *
 * ⚠️ RÈGLE D'OR :
 *   - redirectUris (affichés ici) = URL de CALLBACK OAuth (côté Supabase/GoTrue)
 *     → C'est ce que vous devez déclarer dans Google Cloud Console / GitHub
 *   - redirect_to (utilisé au login) = URL du FRONTEND après login
 *     → C'est ce que supabase.auth.signInWithOAuth({ redirectTo }) utilise
 *
 * Ces DEUX valeurs ne doivent JAMAIS être confondues.
 */
import { resolveSupabaseConfig } from '@/config/supabaseConfig';
import { useMemo } from 'react';
import { useConfiguration } from './useConfigurationHex';

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  setupUrl: string;
  /** URL de CALLBACK (Supabase) — à déclarer dans Google/GitHub */
  redirectUris: string[];
  setupInstructions: string[];
}

export interface UseOAuthConfigReturn {
  /** Provider actif (supabase, keycloak, auth0...) */
  currentProvider: string;
  /** Origine du frontend courant (window.location.origin) */
  currentDomain: string;
  /** URL de CALLBACK OAuth (côté Supabase) */
  oauthCallbackUri: string;

  providers: OAuthProvider[];

  getProviderConfig: (providerId: string) => OAuthProvider | null;
  getRedirectUris: () => string[];
  getSetupInstructions: (providerId: string) => string[];

  isValidProvider: (providerId: string) => boolean;
}

// ============================================================================
// Résolution des URLs (aucun localhost codé en dur)
// ============================================================================

function resolveFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/**
 * Retourne l'URL de callback OAuth (destination Google/GitHub → Supabase).
 * ✅ Cette URL est celle à déclarer dans les consoles OAuth.
 */
function resolveOAuthCallbackUri(): string {
  const { url } = resolveSupabaseConfig();
  if (!url) return '';
  return `${url.replace(/\/+$/, '')}/auth/v1/callback`;
}

// ============================================================================

export function useOAuthConfig(): UseOAuthConfigReturn {
  const { getOAuthConfig, getAuthConfig } = useConfiguration();

  // ✅ URL du FRONTEND (utilisée pour redirect_to après login)
  const currentDomain = resolveFrontendOrigin();

  // ✅ URL de CALLBACK OAuth (côté Supabase) — à déclarer dans Google/GitHub
  const oauthCallbackUri = useMemo(() => resolveOAuthCallbackUri(), []);

  const currentProvider = useMemo(() => {
    const authConfig = getAuthConfig();
    return authConfig?.provider || 'supabase';
  }, [getAuthConfig]);

  const providers: OAuthProvider[] = useMemo(() => {
    const baseProviders: OAuthProvider[] = [
      {
        id: 'google',
        name: 'Google OAuth',
        icon: '🔍',
        description: 'Google OAuth 2.0 authentication',
        setupUrl: 'https://console.cloud.google.com/apis/credentials',
        // ⚠️ Ces URLs sont celles à déclarer dans Google Cloud Console.
        //    Elles pointent vers SUPABASE, pas vers le frontend.
        redirectUris: [oauthCallbackUri].filter(Boolean),
        setupInstructions: [
          'Google Cloud Console → APIs & Services → Credentials',
          `URI de redirection autorisés : ${oauthCallbackUri}`,
          `Origines JavaScript autorisées : ${currentDomain}`,
          'Vérifiez que le Client Secret dans Supabase = celui de Google Cloud (sans espaces)',
        ],
      },
      {
        id: 'keycloak',
        name: 'Keycloak',
        icon: '🔑',
        description: 'Keycloak identity and access management',
        setupUrl: '',
        redirectUris: [oauthCallbackUri].filter(Boolean),
        setupInstructions: [],
      },
      {
        id: 'auth0',
        name: 'Auth0',
        icon: '🛡️',
        description: 'Auth0 authentication platform',
        setupUrl: '',
        redirectUris: [oauthCallbackUri].filter(Boolean),
        setupInstructions: [],
      },
    ];

    return baseProviders.map(provider => {
      try {
        const config = getOAuthConfig(provider.id);
        return {
          ...provider,
          setupUrl: config.setupUrl || provider.setupUrl,
          // On garde les redirectUris calculés localement (Supabase callback)
          // sauf si ConfigurationService en a fourni.
          redirectUris: provider.redirectUris.length > 0
            ? provider.redirectUris
            : config.redirectUris,
          setupInstructions: config.setupInstructions.length > 0
            ? config.setupInstructions
            : provider.setupInstructions,
        };
      } catch {
        return provider;
      }
    });
  }, [currentDomain, oauthCallbackUri, getOAuthConfig]);

  const getProviderConfig = (providerId: string): OAuthProvider | null => {
    return providers.find(p => p.id === providerId) || null;
  };

  const getRedirectUris = (): string[] => {
    try {
      const config = getOAuthConfig(currentProvider);
      if (config.redirectUris.length > 0) return config.redirectUris;
    } catch {
      // Ignore : fallback ci-dessous
    }
    return [oauthCallbackUri].filter(Boolean);
  };

  const getSetupInstructions = (providerId: string): string[] => {
    try {
      const config = getOAuthConfig(providerId);
      return config.setupInstructions;
    } catch {
      return [];
    }
  };

  const isValidProvider = (providerId: string): boolean => {
    return providers.some(p => p.id === providerId);
  };

  return {
    currentProvider,
    currentDomain,
    oauthCallbackUri,
    providers,
    getProviderConfig,
    getRedirectUris,
    getSetupInstructions,
    isValidProvider
  };
}