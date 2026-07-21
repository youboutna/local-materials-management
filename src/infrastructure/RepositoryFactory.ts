/**
 * Unified RepositoryFactory
 * Single switch for auth / data / storage providers.
 *
 * Env vars:
 *   VITE_AUTH_PROVIDER    supabase | gotrue | keycloak | local
 *   VITE_DATA_PROVIDER    supabase | postgrest | local
 *   VITE_STORAGE_PROVIDER supabase | s3 | minio | local
 *
 * This factory does NOT replace domain-specific repository factories overnight —
 * it exposes the primitives (auth, storage, postgrest client) that the app can
 * switch centrally, and legacy per-entity factories delegate to it.
 */
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { DEV_MODE } from '@/config/constants';
import { SupabaseAuthAdapter } from '@/infrastructure/supabase/adapters/SupabaseAuthAdapter';
import { LocalAuthAdapter } from '@/infrastructure/local/LocalAuthAdapter';
import { GoTrueAuthAdapter } from '@/infrastructure/adapters/auth/GoTrueAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/adapters/auth/KeycloakAuthAdapter';
import { LocalNotificationAdapter } from '@/infrastructure/adapters/local/LocalNotificationAdapter';
import { LocalStorageAdapter } from '@/infrastructure/adapters/local/LocalStorageAdapter';
import { S3StorageAdapter } from '@/infrastructure/adapters/storage/S3StorageAdapter';
import { SupabaseStorageProvider } from '@/infrastructure/storage/SupabaseStorageProvider';
import { PostgrestClient } from '@/infrastructure/postgrest/PostgrestClient';
import { validateProviders } from '@/config/app-validate';

export type AuthProviderKind = 'supabase' | 'gotrue' | 'keycloak' | 'local';
export type DataProviderKind = 'supabase' | 'postgrest' | 'local';
export type StorageProviderKind = 'supabase' | 's3' | 'minio' | 'local';

function env(key: string, fallback?: string): string | undefined {
  return (import.meta as any)?.env?.[key] ?? fallback;
}

function resolveAuth(): AuthProviderKind {
  const v = env('VITE_AUTH_PROVIDER') as AuthProviderKind | undefined;
  if (v === 'supabase' || v === 'gotrue' || v === 'keycloak' || v === 'local') return v;
  return DEV_MODE ? 'local' : 'supabase';
}
function resolveData(): DataProviderKind {
  const v = env('VITE_DATA_PROVIDER') as DataProviderKind | undefined;
  if (v === 'supabase' || v === 'postgrest' || v === 'local') return v;
  return DEV_MODE ? 'local' : 'supabase';
}
function resolveStorage(): StorageProviderKind {
  const v = env('VITE_STORAGE_PROVIDER') as StorageProviderKind | undefined;
  if (v === 'supabase' || v === 's3' || v === 'minio' || v === 'local') return v;
  return DEV_MODE ? 'local' : 'supabase';
}

export class RepositoryFactory {
  private static auth?: IAuthRepository;
  private static storage?: IStorageProvider;
  private static notifications?: INotificationRepository;
  private static postgrest?: PostgrestClient;

  static init() {
    validateProviders({
      auth: resolveAuth(),
      data: resolveData(),
      storage: resolveStorage(),
    });
  }

  static getAuthKind(): AuthProviderKind {
    return resolveAuth();
  }
  static getDataKind(): DataProviderKind {
    return resolveData();
  }
  static getStorageKind(): StorageProviderKind {
    return resolveStorage();
  }

  static getAuthRepository(): IAuthRepository {
    if (this.auth) return this.auth;
    switch (resolveAuth()) {
      case 'local':
        this.auth = new LocalAuthAdapter();
        break;
      case 'gotrue':
        this.auth = new GoTrueAuthAdapter(
          env('VITE_GOTRUE_URL', env('VITE_SUPABASE_URL', '') + '/auth/v1')!,
          env('VITE_SUPABASE_PUBLISHABLE_KEY')
        );
        break;
      case 'keycloak':
        this.auth = new KeycloakAuthAdapter({
          url: env('VITE_KEYCLOAK_URL', '')!,
          realm: env('VITE_KEYCLOAK_REALM', '')!,
          clientId: env('VITE_KEYCLOAK_CLIENT_ID', '')!,
          clientSecret: env('VITE_KEYCLOAK_CLIENT_SECRET'),
        });
        break;
      case 'supabase':
      default:
        this.auth = new SupabaseAuthAdapter();
        break;
    }
    return this.auth;
  }

  static getStorageProvider(): IStorageProvider {
    if (this.storage) return this.storage;
    switch (resolveStorage()) {
      case 'local':
        this.storage = new LocalStorageAdapter();
        break;
      case 's3':
      case 'minio':
        this.storage = new S3StorageAdapter({
          endpoint: env('VITE_STORAGE_ENDPOINT', '')!,
          bucket: env('VITE_STORAGE_BUCKET', 'documents')!,
          region: env('VITE_STORAGE_REGION'),
          publicBaseUrl: env('VITE_STORAGE_PUBLIC_URL'),
        });
        break;
      case 'supabase':
      default:
        this.storage = new SupabaseStorageProvider() as unknown as IStorageProvider;
        break;
    }
    return this.storage;
  }

  static getNotificationRepository(): INotificationRepository {
    if (this.notifications) return this.notifications;
    // Only local adapter is provided in this pass; other providers still route
    // through legacy services until fully migrated.
    this.notifications = new LocalNotificationAdapter();
    return this.notifications;
  }

  static getPostgrestClient(): PostgrestClient {
    if (this.postgrest) return this.postgrest;
    this.postgrest = new PostgrestClient({
      baseUrl: env('VITE_POSTGREST_URL', env('VITE_SUPABASE_URL', '') + '/rest/v1')!,
      apiKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
      defaultSchema: env('VITE_BTP_SCHEMA', 'public'),
      getToken: () => {
        try {
          const raw =
            localStorage.getItem('gotrue_session') ??
            localStorage.getItem('keycloak_session') ??
            localStorage.getItem('dev_session');
          if (!raw) return null;
          return JSON.parse(raw)?.access_token ?? null;
        } catch {
          return null;
        }
      },
    });
    return this.postgrest;
  }

  static reset() {
    this.auth = undefined;
    this.storage = undefined;
    this.notifications = undefined;
    this.postgrest = undefined;
  }
}
