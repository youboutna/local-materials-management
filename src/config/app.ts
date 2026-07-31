/**
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
 */

// Canonical provider taxonomy — kept in sync with src/config/app-validate.ts
// and src/infrastructure/RepositoryFactory.ts. Legacy aliases (`auth0`,
// `custom`, `mysql`, `azure`, `gcs`, `ftp`) are retained only to satisfy
// existing consumers; they map to no real adapter and are rejected by
// validateProviders() at startup.
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
  /** Alias of `database` for plan-v4 naming. */
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
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------
const env = (key: string, fallback = ''): string =>
  ((import.meta as any)?.env?.[key] as string | undefined) ?? fallback;

const envOpt = (key: string): string | undefined => {
  const v = (import.meta as any)?.env?.[key];
  return v === undefined || v === '' ? undefined : (v as string);
};

const splitList = (raw: string | undefined, fallback: string[]): string[] =>
  raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

// ---------------------------------------------------------------------------
// Constants shared across the app
// ---------------------------------------------------------------------------
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
  const viteMode = (import.meta as any)?.env?.MODE as string | undefined;
  if (viteMode === 'production') return 'production';
  return 'development';
}

function resolveEnvironment(mode: AppMode): Environment {
  if (mode === 'production') return 'production';
  return 'development';
}

// ---------------------------------------------------------------------------
// Per-mode defaults (overridable via VITE_* variables)
// ---------------------------------------------------------------------------
interface ModeDefaults {
  auth: { provider: AuthProvider; url: string; anonKey: string; projectId?: string };
  data: { provider: DatabaseProvider; url: string };
  storage: { provider: StorageProvider; endpoint: string; bucket: string };
  api: { baseUrl: string };
}

const MODE_DEFAULTS: Record<AppMode, ModeDefaults> = {
  development: {
    auth: {
      provider: 'supabase',
      url: 'http://localhost:8000',
      anonKey: 'dev-anon-key',
      projectId: 'hadratech-selfhosted',
    },
    data: { provider: 'supabase', url: 'http://localhost:8000' },
    storage: { provider: 'supabase', endpoint: 'http://localhost:9000', bucket: 'documents' },
    api: { baseUrl: 'http://localhost:4000/api' },
  },
  production: {
    auth: { provider: 'supabase', url: '', anonKey: '' },
    data: { provider: 'supabase', url: '' },
    storage: { provider: 'supabase', endpoint: '', bucket: 'documents' },
    api: { baseUrl: '/api' },
  },
  'local-bypass': {
    auth: {
      provider: 'local',
      url: 'http://localhost:5173',
      anonKey: 'dev-mock-key',
      projectId: 'local-dev',
    },
    data: { provider: 'local', url: '' },
    storage: { provider: 'local', endpoint: '', bucket: 'local' },
    api: { baseUrl: 'http://localhost:4000/api' },
  },
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------
function buildConfig(): AppConfig {
  const mode = resolveMode();
  const environment = resolveEnvironment(mode);
  const defaults = MODE_DEFAULTS[mode];

  const authProvider =
    (envOpt('VITE_AUTH_PROVIDER') as AuthProvider | undefined) ?? defaults.auth.provider;
  const dataProvider =
    (envOpt('VITE_DATA_PROVIDER') as DatabaseProvider | undefined) ??
    (envOpt('VITE_DB_PROVIDER') as DatabaseProvider | undefined) ??
    defaults.data.provider;
  const storageProvider =
    (envOpt('VITE_STORAGE_PROVIDER') as StorageProvider | undefined) ?? defaults.storage.provider;

  const authUrl =
    envOpt('VITE_SUPABASE_URL') ??
    envOpt('VITE_GOTRUE_URL') ??
    envOpt('VITE_KEYCLOAK_URL') ??
    defaults.auth.url;

  const anonKey =
    envOpt('VITE_SUPABASE_PUBLISHABLE_KEY') ??
    envOpt('VITE_SUPABASE_ANON_KEY') ??
    defaults.auth.anonKey;

  const projectId = envOpt('VITE_SUPABASE_PROJECT_ID') ?? defaults.auth.projectId;

  const dataUrl =
    envOpt('VITE_POSTGREST_URL') ??
    envOpt('VITE_SUPABASE_URL') ??
    envOpt('VITE_DATABASE_URL') ??
    defaults.data.url;

  const dataBlock = {
    provider: dataProvider,
    url: dataUrl || undefined,
    schemas: splitList(envOpt('VITE_PGRST_SCHEMAS'), DEFAULT_SCHEMAS),
    extraSearchPath: splitList(envOpt('VITE_PGRST_EXTRA_SEARCH_PATH'), DEFAULT_EXTRA_SEARCH_PATH),
    maxRows: Number(envOpt('VITE_PGRST_MAX_ROWS') ?? (mode === 'local-bypass' ? 100 : 1000)),
  };

  return {
    environment,
    mode,
    auth: {
      provider: authProvider,
      url: authUrl,
      anonKey,
      projectId,
      clientId: envOpt('VITE_AUTH_CLIENT_ID') ?? envOpt('VITE_KEYCLOAK_CLIENT_ID'),
      realm: envOpt('VITE_AUTH_REALM') ?? envOpt('VITE_KEYCLOAK_REALM'),
      redirectUri:
        envOpt('VITE_AUTH_REDIRECT_URI') ??
        (typeof window !== 'undefined' ? window.location.origin : undefined),
    },
    api: {
      baseUrl: envOpt('VITE_API_URL') ?? defaults.api.baseUrl,
      timeout: Number(envOpt('VITE_API_TIMEOUT') ?? 30000),
    },
    database: dataBlock,
    data: dataBlock,
    storage: {
      provider: storageProvider,
      endpoint: envOpt('VITE_STORAGE_ENDPOINT') ?? envOpt('VITE_SUPABASE_URL') ?? defaults.storage.endpoint,
      bucket: envOpt('VITE_STORAGE_BUCKET') ?? defaults.storage.bucket,
      region: envOpt('VITE_STORAGE_REGION'),
      accessKey: envOpt('VITE_STORAGE_ACCESS_KEY'),
      secretKey: envOpt('VITE_STORAGE_SECRET_KEY'),
      publicBaseUrl: envOpt('VITE_STORAGE_PUBLIC_URL'),
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
