// src/config/referentials/oauth-providers.referential.ts

import type { AuthProvider } from '@/config/app';
import { getAppConfig } from '@/config/app';

export interface OAuthProviderConfig {
  name: string;
  setupUrl: string;
  instructions: string[];
  redirectUrisFormat: (domain: string, config?: any) => string[];
  domains?: string[];
  scopes?: string[];
}

// Résolution dynamique du projet Supabase
const getSupabaseProjectId = (): string => {
  try {
    const config = getAppConfig();
    return config.auth.projectId || '';
  } catch {
    return '';
  }
};

export const OAUTH_PROVIDER_CONFIGS: Record<AuthProvider, OAuthProviderConfig> = {
  supabase: {
    name: 'Supabase',
    setupUrl: `https://supabase.com/dashboard/project/${getSupabaseProjectId()}/auth/providers`,
    instructions: [
      'Aller dans le tableau de bord Supabase → Authentication → Providers',
      'Activer le fournisseur souhaité (Google, GitHub, etc.)',
      'Copier les URLs de redirection ci-dessous dans les champs appropriés du fournisseur',
      'Dans Supabase → Authentication → URL Configuration, définir Site URL: {domain}',
      'Configurer les scopes OAuth nécessaires: openid, profile, email',
    ],
    redirectUrisFormat: (domain: string) => [
      `${domain}/auth/v1/callback`,
    ],
    domains: ['supabase.co'],
    scopes: ['openid', 'profile', 'email'],
  },
  keycloak: {
    name: 'Keycloak',
    setupUrl: '', // Rempli dynamiquement depuis la config
    instructions: [
      'Aller dans l’administration Keycloak → votre realm → Clients',
      'Sélectionner votre client OIDC',
      'Ajouter les URLs de redirection ci-dessous dans "Valid Redirect URIs"',
      'Configurer "Web Origins" si nécessaire',
      'Configurer les "Valid Redirect URIs" avec {domain}/*',
    ],
    redirectUrisFormat: (domain: string) => [
      `${domain}/*`,
    ],
    scopes: ['openid', 'profile', 'email', 'roles'],
  },
  auth0: {
    name: 'Auth0',
    setupUrl: 'https://manage.auth0.com/dashboard',
    instructions: [
      'Aller dans Auth0 Dashboard → Applications → votre application',
      'Dans "Allowed Callback URLs", ajouter l’URL de redirection ci-dessous',
      'Dans "Allowed Web Origins", ajouter {domain}',
      'Configurer les scopes OAuth: openid, profile, email',
    ],
    redirectUrisFormat: (domain: string) => [
      `${domain}/auth/v1/callback`,
    ],
    scopes: ['openid', 'profile', 'email'],
  },
  gotrue: {
    name: 'GoTrue (Self-Hosted)',
    setupUrl: '',
    instructions: [
      'Configurer GoTrue avec les URLs de redirection dans l’environnement',
      'Définir GOTRUE_URI_ALLOW_LIST avec les URLs ci-dessous',
      'Vérifier la configuration de GOTRUE_SITE_URL: {domain}',
    ],
    redirectUrisFormat: (domain: string) => [
      `${domain}/auth/v1/callback`,
    ],
  },
  local: {
    name: 'Local (DEV)',
    setupUrl: '',
    instructions: ['Mode développement – aucune configuration externe requise.'],
    redirectUrisFormat: () => [],
  },
  custom: {
    name: 'Custom',
    setupUrl: '',
    instructions: ['Configuration personnalisée – veuillez consulter la documentation.'],
    redirectUrisFormat: () => [],
  },
};

export const getOAuthProviderConfig = (provider: AuthProvider): OAuthProviderConfig => {
  const config = OAUTH_PROVIDER_CONFIGS[provider];
  if (!config) {
    return OAUTH_PROVIDER_CONFIGS.custom;
  }
  
  // Si le fournisseur est Keycloak, on récupère dynamiquement l'URL
  if (provider === 'keycloak') {
    try {
      const appConfig = getAppConfig();
      const authUrl = appConfig.auth.url || '';
      const realm = appConfig.auth.realm || '';
      if (authUrl && realm) {
        return {
          ...config,
          setupUrl: `${authUrl}/admin/${realm}/console`,
        };
      }
    } catch (e) {
      console.warn('[OAuthProviderConfig] Keycloak URL non disponible');
    }
  }
  
  return config;
};