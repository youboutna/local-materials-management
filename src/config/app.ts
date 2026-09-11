/**
 * src/config/app.ts
 * Application Configuration – Centralized
 *
 * Single source of truth for provider/environment variables.
 * All services, adapters, hooks and UI should read config via `getAppConfig()`
 * rather than `import.meta.env` directly.
 *
 * Three modes are supported:
 *   - development  : self-hosted Supabase (local Kong/Storage/GoTrue)
 *   - production   : Supabase Cloud (or fully-managed self-hosted)
 *   - local-bypass : offline mock (DEV_USERS, no network calls)
 *
 * Mode is selected via VITE_APP_MODE. Legacy behaviour (based on Vite MODE +
 * VITE_AUTH_PROVIDER / VITE_DATA_PROVIDER / VITE_STORAGE_PROVIDER) is preserved
 * as an override: any explicit VITE_* provider variable wins over the mode
 * defaults, so existing .env files keep working during migration.
 *
 * ⚠️ AUCUN localhost codé en dur dans les fallbacks.
 *    Les valeurs runtime sont lues depuis le profil de déploiement actif
 *    (btp.system_settings) et depuis window.__APP_CONFIG__.
 */

import { resolveSupabaseConfig } from '@/config/supabaseConfig';
import { getActiveProfileSync, getProfileCustomConfigSync } from './profile-manager';

export type Environment = 'development' | 'production' | 'staging';
export type AppMode = 'development' | 'production' | 'local-bypass';
export type AuthProvider = 'supabase' | 'gotrue' | 'keycloak' | 'local' | 'auth0' | 'custom';
export type DatabaseProvider = 'supabase' | 'postgrest' | 'local' | 'postgresql' | 'mysql';
export type StorageProvider = 'supabase' | 's3' | 'minio' | 'local' | 'azure' | 'gcs' | 'ftp';

export interface AppConfig {
  environment: Environment;
  mode: AppMode;
  auth: {
    provider: AuthProvider;
    url?: string;
    anonKey?: string;
    projectId?: string;
    clientId?: string;
    realm?: string;
    redirectUri?: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  database: {
    provider: DatabaseProvider;
    url?: string;
    schemas: string[];
    extraSearchPath: string[];
    maxRows: number;
  };
  data: {
    provider: DatabaseProvider;
    url?: string;
    schemas: string[];
    extraSearchPath: string[];
    maxRows: number;
  };
  storage: {
    provider: StorageProvider;
    endpoint?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    publicBaseUrl?: string;
  };
  email?: {
    provider: 'smtp' | 'resend' | 'sendgrid';
    from?: string;
  };
}

// ---------------------------------------------------------------------------
// Env helpers — lecture Vite + runtime __APP_CONFIG__
// ---------------------------------------------------------------------------

/**
 * Lit une variable d'environnement en donnant la priorité à window.__APP_CONFIG__
 * (runtime override, modifiable à chaud) puis à import.meta.env (build-time).
 */
const env = (key: string, fallback = ''): string => {
  if (typeof window !== 'undefined') {
    const runtime = (window as Window & { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    if (runtime && typeof runtime[key] === 'string' && runtime[key] !== '') {
      return runtime[key];
    }
  }
  const v = (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
  return v !== undefined && v !== '' ? v : fallback;
};

const envOpt = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    const runtime = (window as Window & { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    if (runtime && typeof runtime[key] === 'string' && runtime[key] !== '') {
      return runtime[key];
    }
  }
  const v = (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
  return v === undefined || v === '' ? undefined : v;
};

const splitList = (raw: string | undefined, fallback: string[]): string[] =>
  raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

export const DEFAULT_SCHEMAS = ['public', 'btp', 'auth', 'storage', 'graphql_public'];
export const BTP_SCHEMA = 'btp';
export const DEFAULT_EXTRA_SEARCH_PATH = ['public', 'extensions', 'btp'];

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

function resolveMode(): AppMode {
  const explicit = envOpt('VITE_APP_MODE') as AppMode | undefined;
  if (explicit === 'development' || explicit === 'production' || explicit === 'local-bypass') {
    return explicit;
  }
  const viteMode = (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE;
  if (viteMode === 'production') return 'production';
  return 'development';
}

function resolveEnvironment(mode: AppMode): Environment {
  if (mode === 'production') return 'production';
  return 'development';
}

// ---------------------------------------------------------------------------
// Per-mode defaults
// ---------------------------------------------------------------------------
// ⚠️ AUCUN localhost codé en dur. Les URLs vides sont complétées par
//    le profil de déploiement actif ou par les variables d'environnement.
// ---------------------------------------------------------------------------

interface ModeDefaults {
  auth: { provider: AuthProvider; url: string; anonKey: string; projectId?: string };
  data: { provider: DatabaseProvider; url: string };
  storage: { provider: StorageProvider; endpoint: string; bucket: string };
  api: { baseUrl: string };
  email: { provider: 'smtp' | 'resend' | 'sendgrid'; from: string };
}

const MODE_DEFAULTS: Record<AppMode, ModeDefaults> = {
  development: {
    auth: { provider: 'supabase', url: '', anonKey: '', projectId: '' },
    data: { provider: 'supabase', url: '' },
    storage: { provider: 'supabase', endpoint: '', bucket: 'documents' },
    api: { baseUrl: '/api' },
    email: { provider: 'resend', from: 'onboarding@resend.dev' },
  },
  production: {
    auth: { provider: 'supabase', url: '', anonKey: '', projectId: '' },
    data: { provider: 'supabase', url: '' },
    storage: { provider: 'supabase', endpoint: '', bucket: 'documents' },
    api: { baseUrl: '/api' },
    email: { provider: 'resend', from: 'onboarding@resend.dev' },
  },
  'local-bypass': {
    auth: { provider: 'local', url: '', anonKey: 'dev-mock-key', projectId: 'local-dev' },
    data: { provider: 'local', url: '' },
    storage: { provider: 'local', endpoint: '', bucket: 'local' },
    api: { baseUrl: '' },
    email: { provider: 'resend', from: 'onboarding@resend.dev' },
  },
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function buildConfig(): AppConfig {
  const mode = resolveMode();
  const environment = resolveEnvironment(mode);
  const defaults = MODE_DEFAULTS[mode];

  // ✅ Lire le profil actif (cache amorcé par initProfileCache() au démarrage)
  const profile = getActiveProfileSync();
  const customConfig = getProfileCustomConfigSync(profile.id);

  // ✅ Priorité : config custom (DB) > variables d'env > valeurs du profil > défauts
  const authUrl =
    customConfig.VITE_SUPABASE_URL ||
    customConfig.VITE_GOTRUE_URL ||
    customConfig.VITE_KEYCLOAK_URL ||
    envOpt('VITE_SUPABASE_URL') ||
    envOpt('VITE_GOTRUE_URL') ||
    envOpt('VITE_KEYCLOAK_URL') ||
    profile.auth.url ||
    defaults.auth.url;

  const authProvider = profile.auth.provider;

  const anonKey =
    customConfig.VITE_SUPABASE_ANON_KEY ||
    envOpt('VITE_SUPABASE_ANON_KEY') ||
    envOpt('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    defaults.auth.anonKey;

  const dataUrl =
    customConfig.VITE_POSTGREST_URL ||
    customConfig.VITE_DATABASE_URL ||
    envOpt('VITE_POSTGREST_URL') ||
    envOpt('VITE_DATABASE_URL') ||
    (profile.data.inheritFromAuth ? authUrl : '') ||
    profile.data.url ||
    defaults.data.url;

  const storageEndpoint =
    customConfig.VITE_STORAGE_ENDPOINT ||
    envOpt('VITE_STORAGE_ENDPOINT') ||
    (profile.storage.inheritFromAuth ? authUrl : '') ||
    profile.storage.url ||
    defaults.storage.endpoint;

  const dataBlock = {
    provider: profile.data.provider,
    url: dataUrl || undefined,
    schemas: splitList(envOpt('VITE_PGRST_SCHEMAS'), DEFAULT_SCHEMAS),
    extraSearchPath: splitList(envOpt('VITE_PGRST_EXTRA_SEARCH_PATH'), DEFAULT_EXTRA_SEARCH_PATH),
    maxRows: Number(envOpt('VITE_PGRST_MAX_ROWS') ?? (mode === 'local-bypass' ? 100 : 1000)),
  };

  const emailProvider =
    (envOpt('VITE_EMAIL_PROVIDER') as 'smtp' | 'resend' | 'sendgrid') || defaults.email.provider;

  // ✅ Warning explicite si aucune URL n'est disponible (hors local-bypass)
  if (mode !== 'local-bypass' && !authUrl) {
    console.warn(
      `[AppConfig] Aucune URL configurée pour le profil actif "${profile.id}". ` +
        `Rendez-vous dans Admin → Profil de déploiement.`,
    );
  }

  return {
    environment,
    mode,
    auth: {
      provider: authProvider,
      url: authUrl || undefined,
      anonKey,
      projectId: envOpt('VITE_SUPABASE_PROJECT_ID') ?? defaults.auth.projectId,
      clientId:
        customConfig.VITE_KEYCLOAK_CLIENT_ID ||
        envOpt('VITE_KEYCLOAK_CLIENT_ID') ||
        envOpt('VITE_AUTH_CLIENT_ID'),
      realm:
        customConfig.VITE_KEYCLOAK_REALM ||
        envOpt('VITE_KEYCLOAK_REALM') ||
        envOpt('VITE_AUTH_REALM'),
      redirectUri:
        envOpt('VITE_AUTH_REDIRECT_URI') ??
        (typeof window !== 'undefined' ? window.location.origin : undefined),
    },
    api: {
      baseUrl: authUrl ? `${authUrl}/rest/v1` : envOpt('VITE_API_URL') ?? defaults.api.baseUrl,
      timeout: Number(envOpt('VITE_API_TIMEOUT') ?? 30000),
    },
    database: dataBlock,
    data: dataBlock,
    storage: {
      provider: profile.storage.provider,
      endpoint: storageEndpoint || undefined,
      bucket:
        customConfig.VITE_STORAGE_BUCKET ||
        envOpt('VITE_STORAGE_BUCKET') ||
        defaults.storage.bucket,
      region: envOpt('VITE_STORAGE_REGION'),
      accessKey:
        customConfig.VITE_STORAGE_ACCESS_KEY || envOpt('VITE_STORAGE_ACCESS_KEY'),
      secretKey:
        customConfig.VITE_STORAGE_SECRET_KEY || envOpt('VITE_STORAGE_SECRET_KEY'),
      publicBaseUrl: envOpt('VITE_STORAGE_PUBLIC_URL'),
    },
    email: {
      provider: emailProvider,
      from: envOpt('VITE_RESEND_FROM') ?? envOpt('VITE_EMAIL_FROM') ?? defaults.email.from,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getAppConfig = (): AppConfig => buildConfig();

export const isSupabaseProvider = (): boolean => {
  const config = getAppConfig();
  return config.auth.provider === 'supabase' || config.database.provider === 'supabase';
};

export const isKeycloakProvider = (): boolean => getAppConfig().auth.provider === 'keycloak';

export const isLocalBypass = (): boolean => getAppConfig().mode === 'local-bypass';

export const getApiUrl = (endpoint: string): string => {
  const config = getAppConfig();
  return `${config.api.baseUrl}${endpoint}`;
};

export const getEmailProvider = (): string => {
  return getAppConfig().email?.provider || 'resend';
};

// ---------------------------------------------------------------------------
// Helpers runtime (compatibilité ascendante)
// ---------------------------------------------------------------------------

/**
 * Met à jour une variable d'environnement à chaud.
 * ⚠️ Préférer désormais Admin → Profil de déploiement (btp.system_settings).
 */
export function setRuntimeConfig(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __APP_CONFIG__?: Record<string, string> };
  w.__APP_CONFIG__ = { ...(w.__APP_CONFIG__ ?? {}), [key]: value };
}

/**
 * Récupère une variable runtime (window.__APP_CONFIG__).
 */
export function getRuntimeConfig(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { __APP_CONFIG__?: Record<string, string> };
  return w.__APP_CONFIG__?.[key];
}

// Note : `resolveSupabaseConfig` reste importé pour compatibilité avec les
// modules existants (supabaseConfig.ts). Il peut être retiré si aucun autre
// module ne l'utilise.
void resolveSupabaseConfig;