/**
 * Provider validation at startup.
 * Ensures VITE_AUTH_PROVIDER / VITE_DATA_PROVIDER / VITE_STORAGE_PROVIDER
 * are among the supported values and compatible with the chosen deployment.
 */

const AUTH = ['supabase', 'gotrue', 'keycloak', 'local'] as const;
const DATA = ['supabase', 'postgrest', 'local'] as const;
const STORAGE = ['supabase', 's3', 'minio', 'local'] as const;

export type AuthProviderKind = (typeof AUTH)[number];
export type DataProviderKind = (typeof DATA)[number];
export type StorageProviderKind = (typeof STORAGE)[number];

const env = (key: string): string => (import.meta as any)?.env?.[key] ?? '';

function requireEnv(key: string, condition: boolean, errors: string[]) {
  if (condition && !env(key)) {
    errors.push(`${key} is required for the chosen provider combination`);
  }
}

export function validateProviders(cfg: {
  auth: string;
  data: string;
  storage: string;
}) {
  const errors: string[] = [];
  if (!AUTH.includes(cfg.auth as AuthProviderKind))
    errors.push(`VITE_AUTH_PROVIDER="${cfg.auth}" invalide (attendu: ${AUTH.join(', ')})`);
  if (!DATA.includes(cfg.data as DataProviderKind))
    errors.push(`VITE_DATA_PROVIDER="${cfg.data}" invalide (attendu: ${DATA.join(', ')})`);
  if (!STORAGE.includes(cfg.storage as StorageProviderKind))
    errors.push(`VITE_STORAGE_PROVIDER="${cfg.storage}" invalide (attendu: ${STORAGE.join(', ')})`);

  // Matrice de compatibilité auth × data.
  // Mode B (local auth + supabase data) est valide : LocalAuthAdapter signe des
  // JWT HS256 avec VITE_JWT_SECRET (partagé avec GoTrue) que la RLS accepte.
  const validCombos = new Set([
    'supabase-supabase',
    'gotrue-supabase',
    'gotrue-postgrest',
    'keycloak-supabase',
    'keycloak-postgrest',
    'local-supabase',   // Mode B
    'local-postgrest',  // variante self-hosted légère
    'local-local',      // Mode local-bypass offline
  ]);

  if (errors.length === 0 && !validCombos.has(`${cfg.auth}-${cfg.data}`)) {
    errors.push(`Invalid auth/data combination: auth=${cfg.auth} is not compatible with data=${cfg.data}`);
  }

  requireEnv('VITE_SUPABASE_URL', cfg.auth === 'supabase' || cfg.data === 'supabase' || cfg.storage === 'supabase', errors);
  requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY', cfg.auth === 'supabase' || cfg.data === 'supabase' || cfg.storage === 'supabase', errors);
  requireEnv('VITE_GOTRUE_URL', cfg.auth === 'gotrue', errors);
  requireEnv('VITE_KEYCLOAK_URL', cfg.auth === 'keycloak', errors);
  requireEnv('VITE_KEYCLOAK_REALM', cfg.auth === 'keycloak', errors);
  requireEnv('VITE_KEYCLOAK_CLIENT_ID', cfg.auth === 'keycloak', errors);
  requireEnv('VITE_POSTGREST_URL', cfg.data === 'postgrest', errors);
  requireEnv('VITE_STORAGE_ENDPOINT', cfg.storage === 's3' || cfg.storage === 'minio', errors);
  requireEnv('VITE_STORAGE_BUCKET', cfg.storage === 's3' || cfg.storage === 'minio', errors);

  // Mode B / self-hosted: LocalAuthAdapter must sign JWTs the backend can verify.
  if (cfg.auth === 'local' && (cfg.data === 'supabase' || cfg.data === 'postgrest')) {
    requireEnv('VITE_JWT_SECRET', true, errors);
  }

  if (errors.length) {
    console.error('[ProviderValidation]', errors.join('\n'));
  } else {
    console.info(
      `[ProviderValidation] auth=${cfg.auth} data=${cfg.data} storage=${cfg.storage}`
    );
  }
  return errors;
}

/**
 * Startup validation for the full AppConfig, called from main.tsx.
 * Enforces required variables per mode and warns on insecure defaults.
 */
export function validateAppConfig(): string[] {
  // Local import to avoid a cycle at module load.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAppConfig } = require('./app') as typeof import('./app');
  const config = getAppConfig();
  const errors: string[] = [];

  if (config.mode === 'production') {
    if (!config.auth.url) errors.push('VITE_SUPABASE_URL is required in production');
    if (!config.auth.anonKey) errors.push('VITE_SUPABASE_ANON_KEY is required in production');
    if (!config.auth.projectId) errors.push('VITE_SUPABASE_PROJECT_ID is required in production');
  }

  if (config.mode === 'development') {
    if (!config.auth.anonKey || config.auth.anonKey === 'dev-anon-key') {
      console.warn('[AppConfig] Using default ANON_KEY for development. Generate one with scripts/generate-keys.sh');
    }
  }

  errors.push(
    ...validateProviders({
      auth: config.auth.provider,
      data: config.database.provider,
      storage: config.storage.provider,
    })
  );

  if (errors.length) {
    console.error('[AppConfig]', errors.join('\n'));
  } else {
    console.info(
      `[AppConfig] mode=${config.mode} auth=${config.auth.provider} data=${config.database.provider} storage=${config.storage.provider}`
    );
  }
  return errors;
}

