/**
 * Provider validation at startup.
 * Ensures VITE_AUTH_PROVIDER / VITE_DATA_PROVIDER / VITE_STORAGE_PROVIDER
 * are among the supported values.
 */

const AUTH = ['supabase', 'gotrue', 'keycloak', 'local'] as const;
const DATA = ['supabase', 'postgrest', 'local'] as const;
const STORAGE = ['supabase', 's3', 'minio', 'local'] as const;

export type AuthProviderKind = (typeof AUTH)[number];
export type DataProviderKind = (typeof DATA)[number];
export type StorageProviderKind = (typeof STORAGE)[number];

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
  if (errors.length) {
    console.error('[ProviderValidation]', errors.join('\n'));
  } else {
    console.info(
      `[ProviderValidation] auth=${cfg.auth} data=${cfg.data} storage=${cfg.storage}`
    );
  }
  return errors;
}
