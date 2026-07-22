/**
 * Application Configuration
 * Supports multiple deployment scenarios and infrastructure providers
 */

// Canonical provider taxonomy — kept in sync with src/config/app-validate.ts
// and src/infrastructure/RepositoryFactory.ts (single source of truth for
// which adapters actually exist). Legacy aliases (`auth0`, `custom`, `mysql`,
// `azure`, `gcs`, `ftp`) are retained only to satisfy existing consumers
// (ProviderSettings UI, StorageFactory) — they map to no real adapter and
// will be rejected by validateProviders() at startup.
export type Environment = 'development' | 'production' | 'staging';
export type AuthProvider = 'supabase' | 'gotrue' | 'keycloak' | 'local' | 'auth0' | 'custom';
export type DatabaseProvider = 'supabase' | 'postgrest' | 'local' | 'postgresql' | 'mysql';
export type StorageProvider = 'supabase' | 's3' | 'minio' | 'local' | 'azure' | 'gcs' | 'ftp';


export interface AppConfig {
  environment: Environment;
  auth: {
    provider: AuthProvider;
    url?: string;
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
    host?: string;
    port?: number;
    name?: string;
  };
  storage: {
    provider: StorageProvider;
    endpoint?: string;
    bucket?: string;
    region?: string;
  };
}

// Environment-based configuration
const configs: Record<Environment, AppConfig> = {
  development: {
    environment: 'development',
    auth: {
      provider: import.meta.env.VITE_AUTH_PROVIDER as AuthProvider || 'supabase',
      url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'etr-ml-frontend',
      realm: import.meta.env.VITE_KEYCLOAK_REALM || 'etr-ml',
      redirectUri: import.meta.env.VITE_AUTH_REDIRECT_URI || window.location.origin
    },
    api: {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000
    },
    database: {
      provider: import.meta.env.VITE_DB_PROVIDER as DatabaseProvider || 'supabase',
      url: import.meta.env.VITE_SUPABASE_URL || 'https://huttgbybeuzeikaqfvam.supabase.co'
    },
    storage: {
      provider: import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider || 'supabase',
      endpoint: import.meta.env.VITE_STORAGE_ENDPOINT,
      bucket: import.meta.env.VITE_STORAGE_BUCKET || 'documents'
    }
  },
  staging: {
    environment: 'staging',
    auth: {
      provider: import.meta.env.VITE_AUTH_PROVIDER as AuthProvider || 'keycloak',
      url: import.meta.env.VITE_KEYCLOAK_URL,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      realm: import.meta.env.VITE_KEYCLOAK_REALM
    },
    api: {
      baseUrl: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000
    },
    database: {
      provider: import.meta.env.VITE_DB_PROVIDER as DatabaseProvider || 'postgresql',
      url: import.meta.env.VITE_DATABASE_URL
    },
    storage: {
      provider: import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider || 'minio',
      endpoint: import.meta.env.VITE_STORAGE_ENDPOINT,
      bucket: import.meta.env.VITE_STORAGE_BUCKET || 'documents'
    }
  },
  production: {
    environment: 'production',
    auth: {
      provider: import.meta.env.VITE_AUTH_PROVIDER as AuthProvider || 'keycloak',
      url: import.meta.env.VITE_KEYCLOAK_URL,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      realm: import.meta.env.VITE_KEYCLOAK_REALM
    },
    api: {
      baseUrl: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000
    },
    database: {
      provider: import.meta.env.VITE_DB_PROVIDER as DatabaseProvider || 'postgresql',
      url: import.meta.env.VITE_DATABASE_URL
    },
    storage: {
      provider: import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider || 'minio',
      endpoint: import.meta.env.VITE_STORAGE_ENDPOINT,
      bucket: import.meta.env.VITE_STORAGE_BUCKET || 'documents'
    }
  }
};

// Get current environment
const getCurrentEnvironment = (): Environment => {
  const env = import.meta.env.MODE as Environment;
  return env in configs ? env : 'development';
};

// Get active configuration
export const getAppConfig = (): AppConfig => {
  const env = getCurrentEnvironment();
  return configs[env];
};

// Utility functions
export const isSupabaseProvider = (): boolean => {
  const config = getAppConfig();
  return config.auth.provider === 'supabase' || config.database.provider === 'supabase';
};

export const isKeycloakProvider = (): boolean => {
  return getAppConfig().auth.provider === 'keycloak';
};

export const getApiUrl = (endpoint: string): string => {
  const config = getAppConfig();
  return `${config.api.baseUrl}${endpoint}`;
};