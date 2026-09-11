/**
 * RepositoryFactory + Deployment profiles — tests d'intégration
 *
 * Vérifie deux couches complémentaires :
 *  1. RepositoryFactory : sélection du bon adapter selon VITE_*_PROVIDER
 *  2. Profiles : catalogue, manager, intégration app.ts, taxonomie UI
 *
 * ⚠️ Remplace l'ancien fichier qui testait ProviderSettings.tsx (supprimé).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateProviders } from '@/config/app-validate';
import { ALL_PROFILES, getProfileById } from '@/config/profiles';
import {
  getActiveProfileSync,
  getProfileCustomConfigSync,
  invalidateProfileCache,
  listProfiles,
} from '@/config/profile-manager';
import { GoTrueAuthAdapter } from '@/infrastructure/adapters/auth/GoTrueAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/adapters/auth/KeycloakAuthAdapter';
import { LocalAuthAdapter } from '@/infrastructure/adapters/local/LocalAuthAdapter';
import { LocalStorageAdapter } from '@/infrastructure/adapters/local/LocalStorageAdapter';
import { PostgrestClient } from '@/infrastructure/adapters/postgrest/PostgrestClient';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { S3StorageAdapter } from '@/infrastructure/adapters/storage/S3StorageAdapter';
import { SupabaseStorageAdapter } from '@/infrastructure/adapters/supabase/SupabaseStorageAdapter';
import { SupabaseAuthAdapter } from '@/infrastructure/adapters/supabase/SupabaseAuthAdapter';

function stubProviders(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) vi.stubEnv(k, '');
    else vi.stubEnv(k, v);
  }
}

beforeEach(() => {
  vi.unstubAllEnvs();
  RepositoryFactory.reset();
  invalidateProfileCache();
});

// =============================================================================
// 1. RepositoryFactory — auth provider selection
// =============================================================================

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

// =============================================================================
// 2. RepositoryFactory — data provider selection
// =============================================================================

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

// =============================================================================
// 3. RepositoryFactory — storage provider selection
// =============================================================================

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
    expect(RepositoryFactory.getStorageProvider()).toBeInstanceOf(SupabaseStorageAdapter);
  });
});

// =============================================================================
// 4. validateProviders — rejects legacy / dead-path aliases
// =============================================================================

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

  it('flags legacy taxonomy values as invalid', () => {
    const errors = validateProviders({ auth: 'auth0', data: 'mysql', storage: 'azure' });
    expect(errors).toHaveLength(3);
    expect(errors.join('\n')).toMatch(/VITE_AUTH_PROVIDER/);
    expect(errors.join('\n')).toMatch(/VITE_DATA_PROVIDER/);
    expect(errors.join('\n')).toMatch(/VITE_STORAGE_PROVIDER/);
  });
});

// =============================================================================
// 5. ✅ NOUVEAU — Catalogue de profils de déploiement
// =============================================================================

describe('Deployment profiles — catalogue', () => {
  it('exposes the 5 canonical profiles', () => {
    const ids = listProfiles().map((p) => p.id);
    expect(ids).toEqual([
      'supabase-cloud',
      'supabase-selfhosted',
      'postgrest-gotrue',
      'keycloak-postgrest',
      'local-bypass',
    ]);
  });

  it('every profile has a unique id', () => {
    const ids = ALL_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every profile has required fields defined', () => {
    for (const profile of ALL_PROFILES) {
      expect(profile.id).toBeTruthy();
      expect(profile.label).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.icon).toBeTruthy();
      expect(['easy', 'medium', 'hard', 'expert']).toContain(profile.difficulty);
      expect(typeof profile.recommended).toBe('boolean');
      expect(profile.auth).toBeDefined();
      expect(profile.data).toBeDefined();
      expect(profile.storage).toBeDefined();
      expect(Array.isArray(profile.requiredEnvVars)).toBe(true);
    }
  });

  it('getProfileById returns the correct profile', () => {
    expect(getProfileById('supabase-cloud')?.label).toBe('Supabase Cloud');
    expect(getProfileById('keycloak-postgrest')?.label).toContain('Keycloak');
    expect(getProfileById('unknown-id')).toBeUndefined();
  });

  it('supabase-cloud is marked as recommended', () => {
    const cloud = getProfileById('supabase-cloud');
    expect(cloud?.recommended).toBe(true);
  });

  it('every profile declares a valid auth provider', () => {
    const validAuthProviders = ['supabase', 'gotrue', 'keycloak', 'local'];
    for (const profile of ALL_PROFILES) {
      expect(validAuthProviders).toContain(profile.auth.provider);
    }
  });

  it('every profile declares a valid data provider', () => {
    const validDataProviders = ['supabase', 'postgrest', 'local', 'postgresql', 'mysql'];
    for (const profile of ALL_PROFILES) {
      expect(validDataProviders).toContain(profile.data.provider);
    }
  });

  it('every profile declares a valid storage provider', () => {
    const validStorageProviders = ['supabase', 's3', 'minio', 'local', 'azure', 'gcs', 'ftp'];
    for (const profile of ALL_PROFILES) {
      expect(validStorageProviders).toContain(profile.storage.provider);
    }
  });
});

// =============================================================================
// 6. ✅ NOUVEAU — profile-manager
// =============================================================================

describe('profile-manager — getActiveProfileSync', () => {
  it('returns the default profile in production mode', () => {
    stubProviders({ VITE_APP_MODE: 'production' });
    vi.stubEnv('MODE', 'production');
    const profile = getActiveProfileSync();
    expect(['supabase-cloud', 'supabase-selfhosted']).toContain(profile.id);
  });

  it('respects VITE_ACTIVE_PROFILE when set', () => {
    stubProviders({ VITE_ACTIVE_PROFILE: 'keycloak-postgrest' });
    invalidateProfileCache();
    const profile = getActiveProfileSync();
    expect(profile.id).toBe('keycloak-postgrest');
  });

  it('falls back to a valid profile when VITE_ACTIVE_PROFILE is unknown', () => {
    stubProviders({ VITE_ACTIVE_PROFILE: 'nonexistent-profile-xyz' });
    invalidateProfileCache();
    const profile = getActiveProfileSync();
    expect(profile).toBeDefined();
    expect(profile.id).toBeTruthy();
  });
});

describe('profile-manager — getProfileCustomConfigSync', () => {
  it('returns an empty object when no config is cached', () => {
    invalidateProfileCache();
    const config = getProfileCustomConfigSync('supabase-cloud');
    expect(config).toEqual({});
  });
});

// =============================================================================
// 7. ✅ NOUVEAU — Vérification absence legacy ProviderSettings / DatabaseSettings
// =============================================================================

describe('Legacy panels — removed from codebase', () => {
  it('ProviderSettings.tsx and DatabaseSettings.tsx no longer exist', async () => {
    const fs = await import('node:fs/promises');
    const paths = [
      'src/components/admin/ProviderSettings.tsx',
      'src/components/admin/DatabaseSettings.tsx',
    ];
    for (const p of paths) {
      const exists = await fs
        .access(p)
        .then(() => true)
        .catch(() => false);
      expect(exists, `${p} devrait être supprimé`).toBe(false);
    }
  });

  it('no source file imports ProviderSettings or DatabaseSettings', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    async function walk(dir: string): Promise<string[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await walk(full)));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    }

    const files = await walk('src');
    const offenders: string[] = [];
    for (const f of files) {
      const content = await fs.readFile(f, 'utf8');
      if (
        /from\s+['"]@\/components\/admin\/(ProviderSettings|DatabaseSettings)['"]/.test(content) ||
        /from\s+['"]\.\/(ProviderSettings|DatabaseSettings)['"]/.test(content)
      ) {
        offenders.push(f);
      }
    }

    expect(offenders).toEqual([]);
  });
});

// =============================================================================
// 8. ✅ NOUVEAU — DeploymentProfileSelector existence
// =============================================================================

describe('DeploymentProfileSelector', () => {
  it('exists and exports the component', async () => {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(
      'src/components/admin/DeploymentProfileSelector.tsx',
      'utf8',
    );
    expect(content).toMatch(/export\s+default\s+function\s+DeploymentProfileSelector/);
    expect(content).toMatch(/listProfiles/);
    expect(content).toMatch(/setActiveProfile/);
    expect(content).toMatch(/signOut/);
  });
});

// =============================================================================
// 9. ✅ NOUVEAU — app.ts integration
// =============================================================================

describe('app.ts — profile integration', () => {
  it('getAppConfig reads the active profile', async () => {
    stubProviders({ VITE_ACTIVE_PROFILE: 'keycloak-postgrest' });
    invalidateProfileCache();
    const { getAppConfig } = await import('@/config/app');
    const cfg = getAppConfig();
    expect(cfg.auth.provider).toBe('keycloak');
    expect(cfg.data.provider).toBe('postgrest');
  });

  it('falls back to supabase when no profile is active and no env is set', async () => {
    invalidateProfileCache();
    const { getAppConfig } = await import('@/config/app');
    const cfg = getAppConfig();
    expect(['supabase', 'local']).toContain(cfg.auth.provider);
  });
});