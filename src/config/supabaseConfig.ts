/**
 * SupabaseConfigService — résolution cohérente et unique de la configuration Supabase.
 *
 * Problème résolu : le dépôt contient des clés héritées de plusieurs projets
 * (`VITE_SUPABASE_ANON_KEY` d'un projet, `VITE_SUPABASE_URL` /
 * `VITE_SUPABASE_PUBLISHABLE_KEY` d'un autre). Un fallback naïf peut donc
 * signer les requêtes avec la clé d'un projet différent de l'URL appelée
 * (401 / RLS incohérente / données absentes).
 *
 * Règle : la clé retenue DOIT appartenir au même projet que l'URL. Le `ref`
 * du JWT anon est comparé au sous-domaine de l'URL ; toute clé incohérente est
 * ignorée (et tracée) au lieu d'être utilisée. `.env` n'est jamais modifié :
 * cette couche rend l'incohérence inoffensive.
 */

export interface SupabaseResolvedConfig {
  url: string;
  publishableKey: string;
  /** Référence de projet déduite de l'URL (ex: huttgbybeuzeikaqfvam). */
  projectRef: string | null;
  /** Noms des variables ignorées car appartenant à un autre projet. */
  ignoredKeys: string[];
}

type EnvRecord = Record<string, string | undefined>;

const runtimeConfig = (): EnvRecord =>
  typeof window !== 'undefined'
    ? ((window as Window & { __APP_CONFIG__?: EnvRecord }).__APP_CONFIG__ ?? {})
    : {};

const buildEnv = (): EnvRecord => {
  const viteEnv = (import.meta as unknown as { env?: EnvRecord }).env ?? {};
  return { ...viteEnv, ...runtimeConfig() };
};

/** Référence de projet contenue dans une URL Supabase. */
export function projectRefFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = /^https?:\/\/([a-z0-9-]+)\.supabase\./i.exec(url.trim());
  return match ? match[1] : null;
}

/** Référence de projet contenue dans un JWT anon/publishable (sans vérification de signature). */
export function projectRefFromKey(key?: string | null): string | null {
  if (!key) return null;
  const parts = key.split('.');
  if (parts.length !== 3) return null; // clés `sb_publishable_…` : pas de ref lisible
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(
      typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf-8')
    ) as { ref?: string };
    return decoded.ref ?? null;
  } catch {
    return null;
  }
}

const KEY_CANDIDATES = ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'] as const;

/** Résout URL + clé publiable cohérentes. Ne lève pas : l'appelant décide. */
export function resolveSupabaseConfig(): SupabaseResolvedConfig {
  const env = buildEnv();
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const projectRef = projectRefFromUrl(url);
  const ignoredKeys: string[] = [];
  let publishableKey = '';

  for (const name of KEY_CANDIDATES) {
    const candidate = (env[name] ?? '').trim();
    if (!candidate) continue;
    const keyRef = projectRefFromKey(candidate);
    // `null` = clé non-JWT (format sb_publishable_…) : on ne peut pas la rejeter.
    if (keyRef && projectRef && keyRef !== projectRef) {
      ignoredKeys.push(name);
      continue;
    }
    publishableKey = candidate;
    break;
  }

  if (ignoredKeys.length > 0) {
    console.warn(
      `[SupabaseConfig] clés ignorées (projet différent de ${projectRef}): ${ignoredKeys.join(', ')}`
    );
  }

  return { url, publishableKey, projectRef, ignoredKeys };
}

/** Variante stricte pour les points d'entrée qui ne peuvent pas démarrer sans configuration. */
export function requireSupabaseConfig(): SupabaseResolvedConfig {
  const config = resolveSupabaseConfig();
  if (!config.url || !config.publishableKey) {
    throw new Error(
      'Supabase configuration missing or inconsistent: a URL and a publishable key belonging to the same project are required'
    );
  }
  return config;
}
