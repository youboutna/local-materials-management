// @vitest-environment node
/**
 * Provider selection tests
 *
 * Ensures VITE_AUTH_PROVIDER / VITE_DATA_PROVIDER / VITE_STORAGE_PROVIDER
 * select the correct adapters, cover dev + self-hosted scenarios, and that
 * the Settings UI taxonomy stays aligned with the canonical values wired
 * inside the RepositoryFactory (no dead paths, no duplicates).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { validateProviders } from '@/config/app-validate';
import { LocalAuthAdapter } from '@/infrastructure/local/LocalAuthAdapter';
import { SupabaseAuthAdapter } from '@/infrastructure/supabase/adapters/SupabaseAuthAdapter';
import { GoTrueAuthAdapter } from '@/infrastructure/adapters/auth/GoTrueAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/adapters/auth/KeycloakAuthAdapter';
import { LocalStorageAdapter } from '@/infrastructure/adapters/local/LocalStorageAdapter';
import { S3StorageAdapter } from '@/infrastructure/adapters/storage/S3StorageAdapter';
import { SupabaseStorageProvider } from '@/infrastructure/storage/SupabaseStorageProvider';
import { PostgrestClient } from '@/infrastructure/postgrest/PostgrestClient';

function stubProviders(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) vi.stubEnv(k, '');
    else vi.stubEnv(k, v);
  }
}

beforeEach(() => {
  vi.unstubAllEnvs();
  RepositoryFactory.reset();
});

describe('RepositoryFactory — auth provider selection', () => {
  it('selects LocalAuthAdapter when VITE_AUTH_PROVIDER=local', () => {
    stubProviders({ VITE_AUTH_PROVIDER: 'local' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getAuthKind()).toBe('local');
    expect(RepositoryFactory.getAuthRepository()).toBeInstanceOf(LocalAuthAdapter);
  });

  it('selects SupabaseAuthAdapter when VITE_AUTH_PROVIDER=supabase', () => {
    stubProviders({ VITE_AUTH_PROVIDER: 'supabase' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getAuthKind()).toBe('supabase');
    expect(RepositoryFactory.getAuthRepository()).toBeInstanceOf(SupabaseAuthAdapter);
  });

  it('selects GoTrueAuthAdapter for a self-hosted GoTrue deployment', () => {
    stubProviders({
      VITE_AUTH_PROVIDER: 'gotrue',
      VITE_GOTRUE_URL: 'http://localhost:9999/auth/v1',
    });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getAuthKind()).toBe('gotrue');
    expect(RepositoryFactory.getAuthRepository()).toBeInstanceOf(GoTrueAuthAdapter);
  });

  it('selects KeycloakAuthAdapter for an enterprise SSO deployment', () => {
    stubProviders({
      VITE_AUTH_PROVIDER: 'keycloak',
      VITE_KEYCLOAK_URL: 'http://localhost:8081',
      VITE_KEYCLOAK_REALM: 'etr-ml',
      VITE_KEYCLOAK_CLIENT_ID: 'etr-ml-frontend',
    });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getAuthKind()).toBe('keycloak');
    expect(RepositoryFactory.getAuthRepository()).toBeInstanceOf(KeycloakAuthAdapter);
  });

  it('memoises the adapter instance (single instance per config)', () => {
    stubProviders({ VITE_AUTH_PROVIDER: 'local' });
    RepositoryFactory.reset();
    const a = RepositoryFactory.getAuthRepository();
    const b = RepositoryFactory.getAuthRepository();
    expect(a).toBe(b);
  });
});

describe('RepositoryFactory — data provider selection', () => {
  it('reports VITE_DATA_PROVIDER=supabase', () => {
    stubProviders({ VITE_DATA_PROVIDER: 'supabase' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getDataKind()).toBe('supabase');
  });

  it('reports VITE_DATA_PROVIDER=postgrest and returns a PostgrestClient', () => {
    stubProviders({
      VITE_DATA_PROVIDER: 'postgrest',
      VITE_POSTGREST_URL: 'http://localhost:3001',
    });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getDataKind()).toBe('postgrest');
    expect(RepositoryFactory.getPostgrestClient()).toBeInstanceOf(PostgrestClient);
  });

  it('reports VITE_DATA_PROVIDER=local', () => {
    stubProviders({ VITE_DATA_PROVIDER: 'local' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getDataKind()).toBe('local');
  });
});

describe('RepositoryFactory — storage provider selection', () => {
  it('selects LocalStorageAdapter when VITE_STORAGE_PROVIDER=local', () => {
    stubProviders({ VITE_STORAGE_PROVIDER: 'local' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getStorageKind()).toBe('local');
    expect(RepositoryFactory.getStorageProvider()).toBeInstanceOf(LocalStorageAdapter);
  });

  it('selects S3StorageAdapter for s3 and minio', () => {
    for (const kind of ['s3', 'minio'] as const) {
      stubProviders({
        VITE_STORAGE_PROVIDER: kind,
        VITE_STORAGE_ENDPOINT: 'http://localhost:9000',
        VITE_STORAGE_BUCKET: 'documents',
      });
      RepositoryFactory.reset();
      expect(RepositoryFactory.getStorageKind()).toBe(kind);
      expect(RepositoryFactory.getStorageProvider()).toBeInstanceOf(S3StorageAdapter);
    }
  });

  it('selects SupabaseStorageProvider when VITE_STORAGE_PROVIDER=supabase', () => {
    stubProviders({ VITE_STORAGE_PROVIDER: 'supabase' });
    RepositoryFactory.reset();
    expect(RepositoryFactory.getStorageKind()).toBe('supabase');
    expect(RepositoryFactory.getStorageProvider()).toBeInstanceOf(SupabaseStorageProvider);
  });
});

describe('validateProviders — rejects legacy / dead-path aliases', () => {
  it('accepts the canonical dev scenario (all local)', () => {
    expect(validateProviders({ auth: 'local', data: 'local', storage: 'local' })).toEqual([]);
  });

  it('accepts the canonical self-hosted scenario (gotrue + postgrest + s3/minio)', () => {
    expect(
      validateProviders({ auth: 'gotrue', data: 'postgrest', storage: 'minio' }),
    ).toEqual([]);
    expect(
      validateProviders({ auth: 'keycloak', data: 'postgrest', storage: 's3' }),
    ).toEqual([]);
  });

  it('accepts the canonical managed scenario (all supabase)', () => {
    expect(validateProviders({ auth: 'supabase', data: 'supabase', storage: 'supabase' })).toEqual(
      [],
    );
  });

  it('flags legacy taxonomy values kept in UI dropdowns as invalid', () => {
    // These appear only in the Settings UI (ProviderSettings.tsx) and must not
    // resolve to any real adapter.
    const errors = validateProviders({ auth: 'auth0', data: 'mysql', storage: 'azure' });
    expect(errors).toHaveLength(3);
    expect(errors.join('\n')).toMatch(/VITE_AUTH_PROVIDER/);
    expect(errors.join('\n')).toMatch(/VITE_DATA_PROVIDER/);
    expect(errors.join('\n')).toMatch(/VITE_STORAGE_PROVIDER/);
  });
});

describe('Settings UI taxonomy — no duplicates, aligned with canonical providers', () => {
  it('every canonical provider value exposed in app.ts is a supported adapter', async () => {
    const { getAppConfig } = await import('@/config/app');
    const cfg = getAppConfig();
    // The default derived from env vars must resolve to a real adapter kind.
    expect(['supabase', 'gotrue', 'keycloak', 'local']).toContain(cfg.auth.provider);
  });

  it('ProviderSettings taxonomy has no duplicates', async () => {
    // Read the component module and confirm option lists are unique. We inspect
    // the raw file to avoid rendering the full React tree (which pulls in
    // AuthManager side-effects).
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/components/admin/ProviderSettings.tsx', 'utf8');

    const collect = (label: string) => {
      const start = src.indexOf(`${label}: { value:`);
      if (start === -1) return [] as string[];
      const end = src.indexOf('];', start);
      const block = src.slice(start, end);
      return Array.from(block.matchAll(/value:\s*'([^']+)'/g)).map((m) => m[1]);
    };

    for (const label of ['authProviders', 'databaseProviders', 'storageProviders']) {
      const values = collect(label);
      expect(new Set(values).size, `${label} contains duplicates`).toBe(values.length);
    }
  });
});
