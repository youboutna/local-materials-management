/**
 * Profile Manager — Gestion du profil de déploiement actif.
 *
 * Persistance : table btp.system_settings (source de vérité unique).
 * Convention :
 *   category = 'deployment'
 *   key      = 'active_profile'              → { id: string }
 *   key      = 'profile_config.<profile_id>' → { VITE_XXX: value, ... }
 *
 * Fallback : variable d'env VITE_ACTIVE_PROFILE (premier démarrage).
 *
 * ⚠️ L'accès à btp.system_settings passe par SystemSettingsService
 *    (injecté via RepositoryFactory), pas par l'adapter directement.
 *    Cela respecte l'architecture hexagonale et évite les cycles avec
 *    le client Supabase.
 */

import {
  ALL_PROFILES,
  getDefaultProfileId,
  getProfileById,
  type DeploymentProfile,
} from './profiles';
import { getSystemSettingsService } from '@/application/services/SystemSettingsService';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CATEGORY = 'deployment';
const KEY_ACTIVE_PROFILE = 'active_profile';
const KEY_PROFILE_CONFIG_PREFIX = 'profile_config.';

// ---------------------------------------------------------------------------
// Accès au service (lazy — évite tout cycle au chargement du module)
// ---------------------------------------------------------------------------

type ServiceAccessor = ReturnType<typeof getSystemSettingsService>;

function getService(): ServiceAccessor {
  return getSystemSettingsService();
}

// ---------------------------------------------------------------------------
// Cache en mémoire
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry<unknown>>();

const cacheKey = (category: string, key: string): string => `${category}:${key}`;

function getCached<T>(category: string, key: string): T | undefined {
  const entry = cache.get(cacheKey(category, key));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(category, key));
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(category: string, key: string, value: T): void {
  cache.set(cacheKey(category, key), { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateProfileCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Helpers env
// ---------------------------------------------------------------------------

function envValue(key: string): string | undefined {
  if (typeof window !== 'undefined') {
    const runtime = (window as Window & { __APP_CONFIG__?: Record<string, string> })
      .__APP_CONFIG__;
    const fromRuntime = runtime?.[key];
    if (fromRuntime) return fromRuntime;
  }
  const value = (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
  return value || undefined;
}

// ---------------------------------------------------------------------------
// Lecture / écriture via SystemSettingsService
// ---------------------------------------------------------------------------

async function readSetting<T = unknown>(
  category: string,
  key: string
): Promise<T | null> {
  const cached = getCached<T>(category, key);
  if (cached !== undefined) return cached;

  try {
    const service = getService();
    const config = await service.getByCategoryAndKey(category, key);
    if (config === null) return null;
    const value = config as T;
    setCached(category, key, value);
    return value;
  } catch (err) {
    console.warn(`[ProfileManager] Erreur lecture "${category}/${key}":`, err);
    return null;
  }
}

async function writeSetting(
  category: string,
  key: string,
  value: unknown
): Promise<void> {
  const service = getService();
  await service.upsertByCategoryAndKey(
    category,
    key,
    value as Record<string, unknown>
  );
  cache.delete(cacheKey(category, key));
}

// ---------------------------------------------------------------------------
// API publique — Profil actif
// ---------------------------------------------------------------------------

export async function getActiveProfile(): Promise<DeploymentProfile> {
  const stored = await readSetting<{ id: string }>(CATEGORY, KEY_ACTIVE_PROFILE);
  if (stored?.id) {
    const profile = getProfileById(stored.id);
    if (profile) return profile;
  }
  return getActiveProfileSync();
}

export function getActiveProfileSync(): DeploymentProfile {
  const cached = getCached<{ id: string }>(CATEGORY, KEY_ACTIVE_PROFILE);
  if (cached?.id) {
    const profile = getProfileById(cached.id);
    if (profile) return profile;
  }
  const envProfileId = envValue('VITE_ACTIVE_PROFILE');
  if (envProfileId) {
    const profile = getProfileById(envProfileId);
    if (profile) return profile;
  }
  return getProfileById(getDefaultProfileId()) ?? ALL_PROFILES[0];
}

export async function setActiveProfile(profileId: string): Promise<void> {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profil inconnu : ${profileId}`);
  await writeSetting(CATEGORY, KEY_ACTIVE_PROFILE, { id: profileId });
  setCached(CATEGORY, KEY_ACTIVE_PROFILE, { id: profileId });
}

// ---------------------------------------------------------------------------
// API publique — Config custom
// ---------------------------------------------------------------------------

export async function getProfileCustomConfig(
  profileId: string
): Promise<Record<string, string>> {
  const config = await readSetting<Record<string, string>>(
    CATEGORY,
    `${KEY_PROFILE_CONFIG_PREFIX}${profileId}`
  );
  return config ?? {};
}

export function getProfileCustomConfigSync(
  profileId: string
): Record<string, string> {
  return (
    getCached<Record<string, string>>(
      CATEGORY,
      `${KEY_PROFILE_CONFIG_PREFIX}${profileId}`
    ) ?? {}
  );
}

export async function setProfileCustomConfig(
  profileId: string,
  config: Record<string, string>
): Promise<void> {
  const key = `${KEY_PROFILE_CONFIG_PREFIX}${profileId}`;
  await writeSetting(CATEGORY, key, config);
  setCached(CATEGORY, key, config);
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export function listProfiles(): DeploymentProfile[] {
  return ALL_PROFILES;
}

// ---------------------------------------------------------------------------
// Amorçage du cache (appelé depuis main.tsx)
// ---------------------------------------------------------------------------

/**
 * Préchauffe le cache au démarrage : les lectures synchrones de app.ts
 * disposent alors du profil persisté sans requête bloquante.
 *
 * ⚠️ À appeler dans main.tsx AVANT createRoot().render().
 */
export async function initProfileCache(): Promise<void> {
  try {
    const profile = await getActiveProfile();
    await getProfileCustomConfig(profile.id);
    console.info('[ProfileManager] Cache préchargé pour le profil :', profile.id);
  } catch (err) {
    console.warn('[ProfileManager] Préchargement du profil impossible:', err);
  }
}