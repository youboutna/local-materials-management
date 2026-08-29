/**
 * ConfigService — source unique du paramétrage système exposé à l'administration.
 *
 * - Lecture : cache mémoire → repository (DB ou localStorage) → valeurs d'environnement.
 * - Écriture : repository selon le mode (local-bypass → localStorage, sinon Supabase).
 * - Pure TypeScript : aucun hook ni composant React.
 */

import { getAppConfig } from '@/config/app';
import { resolveSupabaseConfig } from '@/config/supabaseConfig';
import { IS_LOCAL_BYPASS, APP_NAME, APP_VERSION } from '@/config/constants';
import type { IConfigRepository, ConfigEntry } from '@/domain/repositories/IConfigRepository';
import { SupabaseConfigRepository } from '@/infrastructure/adapters/supabase/SupabaseConfigRepository';
import { LocalStorageConfigRepository } from '@/infrastructure/adapters/localStorage/LocalStorageConfigRepository';

/** Fragments de nom indiquant une valeur sensible : jamais exposée dans l'UI. */
const SENSITIVE_FRAGMENTS = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'JWT'];

export class ConfigService {
  private static instance: ConfigService | null = null;
  private readonly repository: IConfigRepository;
  private readonly cache = new Map<string, ConfigEntry>();
  private readonly envDefaults: Record<string, unknown> = {};

  private constructor() {
    this.repository = IS_LOCAL_BYPASS
      ? new LocalStorageConfigRepository()
      : new SupabaseConfigRepository();
    this.loadEnvDefaults();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) ConfigService.instance = new ConfigService();
    return ConfigService.instance;
  }

  private loadEnvDefaults(): void {
    Object.assign(this.envDefaults, this.flatten(getAppConfig() as unknown as Record<string, unknown>));

    const supabase = resolveSupabaseConfig();
    this.envDefaults['SUPABASE_URL'] = supabase.url;
    this.envDefaults['SUPABASE_PROJECT_REF'] = supabase.projectRef;
    this.envDefaults['SUPABASE_IGNORED_KEYS'] = supabase.ignoredKeys;

    this.envDefaults['APP_NAME'] = APP_NAME;
    this.envDefaults['APP_VERSION'] = APP_VERSION;
    this.envDefaults['APP_MODE'] = import.meta.env?.VITE_APP_MODE || 'development';

    const env = (import.meta.env ?? {}) as Record<string, unknown>;
    for (const key of Object.keys(env)) {
      if (key.startsWith('VITE_')) this.envDefaults[key] = env[key];
    }
  }

  private flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value as Record<string, unknown>, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    return result;
  }

  static isSensitive(key: string): boolean {
    const upper = key.toUpperCase();
    return SENSITIVE_FRAGMENTS.some((fragment) => upper.includes(fragment));
  }

  async get<T = unknown>(key: string, fallback?: T): Promise<T> {
    const cached = this.cache.get(key);
    if (cached) return cached.value as T;

    try {
      const entry = await this.repository.findByKey(key);
      if (entry && entry.value !== undefined) {
        this.cache.set(key, entry);
        return entry.value as T;
      }
    } catch (error) {
      console.warn(`[ConfigService] lecture indisponible pour ${key}:`, error);
    }

    const envValue = this.envDefaults[key];
    return (envValue !== undefined ? (envValue as T) : (fallback as T));
  }

  async set(key: string, value: unknown, category = 'general'): Promise<void> {
    await this.repository.upsert({ key, value, category });
    this.cache.set(key, { key, value, category });
  }

  /** Valeurs persistées + valeurs d'environnement (secrets exclus). */
  async getAll(): Promise<ConfigEntry[]> {
    let persisted: ConfigEntry[] = [];
    try {
      persisted = await this.repository.findAll();
    } catch (error) {
      console.warn('[ConfigService] paramètres persistés indisponibles:', error);
    }

    const persistedKeys = new Set(persisted.map((entry) => entry.key));
    const envEntries: ConfigEntry[] = Object.keys(this.envDefaults)
      .filter((key) => !persistedKeys.has(key) && !ConfigService.isSensitive(key))
      .map((key) => ({ key, value: this.envDefaults[key], category: 'env' }));

    return [...persisted, ...envEntries].sort((a, b) => a.key.localeCompare(b.key));
  }

  resetCache(): void {
    this.cache.clear();
  }
}

export const getConfigService = (): ConfigService => ConfigService.getInstance();
