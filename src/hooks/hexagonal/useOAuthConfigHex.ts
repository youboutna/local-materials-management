// OAuth Configuration Hook - Architecture Hexagonale
// Uses ConfigurationService for OAuth setup and configuration

import { useMemo } from 'react';
import { useConfiguration } from './useConfigurationHex';

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  setupUrl: string;
  redirectUris: string[];
  setupInstructions: string[];
}

export interface UseOAuthConfigReturn {
  // Current OAuth configuration
  currentProvider: string;
  currentDomain: string;
  
  // OAuth providers
  providers: OAuthProvider[];
  
  // Configuration helpers
  getProviderConfig: (providerId: string) => OAuthProvider | null;
  getRedirectUris: () => string[];
  getSetupInstructions: (providerId: string) => string[];
  
  // Validation
  isValidProvider: (providerId: string) => boolean;
}

export function useOAuthConfigHex(): UseOAuthConfigReturn {
  const { getOAuthConfig, getAuthConfig } = useConfiguration();
  
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const currentProvider = useMemo(() => {
    const authConfig = getAuthConfig();
    return authConfig?.provider || 'supabase';
  }, [getAuthConfig]);

  // OAuth providers configuration
  const providers: OAuthProvider[] = useMemo(() => {
    const baseProviders = [
      {
        id: 'google',
        name: 'Google OAuth',
        icon: '🔍',
        description: 'Google OAuth 2.0 authentication',
        setupUrl: 'https://console.cloud.google.com/apis/credentials',
        redirectUris: [currentDomain],
        setupInstructions: []
      },
      {
        id: 'keycloak',
        name: 'Keycloak',
        icon: '🔑',
        description: 'Keycloak identity and access management',
        setupUrl: '',
        redirectUris: [currentDomain],
        setupInstructions: []
      },
      {
        id: 'auth0',
        name: 'Auth0',
        icon: '🛡️',
        description: 'Auth0 authentication platform',
        setupUrl: '',
        redirectUris: [currentDomain],
        setupInstructions: []
      }
    ];

    return baseProviders.map(provider => {
      try {
        const config = getOAuthConfig(provider.id);
        return {
          ...provider,
          setupUrl: config.setupUrl,
          redirectUris: config.redirectUris,
          setupInstructions: config.setupInstructions
        };
      } catch {
        return provider;
      }
    });
  }, [currentDomain, getOAuthConfig]);

  // Get provider configuration
  const getProviderConfig = (providerId: string): OAuthProvider | null => {
    return providers.find(p => p.id === providerId) || null;
  };

  // Get redirect URIs for current provider
  const getRedirectUris = (): string[] => {
    try {
      const config = getOAuthConfig(currentProvider);
      return config.redirectUris;
    } catch {
      return [currentDomain];
    }
  };

  // Get setup instructions for provider
  const getSetupInstructions = (providerId: string): string[] => {
    try {
      const config = getOAuthConfig(providerId);
      return config.setupInstructions;
    } catch {
      return [];
    }
  };

  // Validate provider
  const isValidProvider = (providerId: string): boolean => {
    return providers.some(p => p.id === providerId);
  };

  return {
    currentProvider,
    currentDomain,
    providers,
    getProviderConfig,
    getRedirectUris,
    getSetupInstructions,
    isValidProvider
  };
}
