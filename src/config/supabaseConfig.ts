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
 *
 * ⚠️ NE PAS CONFONDRE :
 *   - getOAuthRedirectUrl()  → URL de RETOUR du FRONTEND (/auth/callback)
 *                              Passée à supabase.auth.signInWithOAuth({ redirectTo })
 *   - getOAuthCallbackUrl()  → URL de CALLBACK OAuth (côté Supabase/GoTrue)
 *                              À déclarer dans Google Cloud Console / GitHub OAuth Apps
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

// ---------------------------------------------------------------------------
// URLs publiques de l'application (OAuth externes)
// ---------------------------------------------------------------------------

/**
 * Détecte si le navigateur est sur un domaine public (≠ localhost).
 * En preview Lovable ou en prod, on doit TOUJOURS utiliser l'origine du
 * navigateur, jamais une valeur `localhost` figée dans .env.
 */
function isBrowserOnPublicDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(host);
}

/** Détecte si une URL est en HTTPS. */
function isHttps(url: string): boolean {
  return /^https:\/\//i.test(url);
}

/**
 * URL publique du site (frontend).
 *
 * ⚠️ CORRECTIONS :
 *  1. Si le navigateur est sur un domaine public, on IGNORE VITE_SITE_URL s'il
 *     pointe vers localhost (cas typique de la preview Lovable où .env.development
 *     contient VITE_SITE_URL=http://localhost:5173).
 *  2. On force HTTPS dès que le navigateur est en HTTPS — jamais de redirect_to
 *     en http:// depuis une page https://.
 */
export function getSiteUrl(): string {
  const env = buildEnv();
  const configured = (env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');
  const browserOnPublic = isBrowserOnPublicDomain();
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Priorité 1 : navigateur sur domaine public → utiliser son origine (déjà en https)
  if (browserOnPublic && browserOrigin) {
    const configuredIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(configured);
    if (configuredIsLocalhost) {
      console.warn(
        `[SupabaseConfig] VITE_SITE_URL="${configured}" ignoré : navigateur sur "${browserOrigin}" (domaine public).`
      );
    } else if (configured && configured !== browserOrigin) {
      console.warn(
        `[SupabaseConfig] VITE_SITE_URL="${configured}" diffère de window.location.origin="${browserOrigin}". On utilise l'origine du navigateur.`
      );
    }
    return browserOrigin;
  }

  // Priorité 2 : valeur configurée (dev local, SSR, CLI)
  if (configured) return configured;

  // Priorité 3 : origine du navigateur en dernier recours
  if (browserOrigin) {
    // En local, on accepte http:// ; en public, on force https://
    if (browserOnPublic && !isHttps(browserOrigin)) {
      return browserOrigin.replace(/^http:\/\//i, 'https://');
    }
    return browserOrigin;
  }

  return '';
}

/**
 * URL de RETOUR après login (Supabase → frontend).
 * C'est cette URL qu'on passe à `supabase.auth.signInWithOAuth({ redirectTo })`.
 * Elle DOIT pointer vers le frontend, pas vers Supabase.
 */
export function getOAuthRedirectUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

/**
 * URL de CALLBACK OAuth (Google/GitHub → Supabase/GoTrue).
 * ⚠️ NE PAS utiliser cette URL comme `redirectTo` dans signInWithOAuth.
 * Elle doit être déclarée dans Google Cloud Console et GitHub OAuth Apps.
 */
export function getOAuthCallbackUrl(): string {
  const { url } = resolveSupabaseConfig();
  if (!url) return '';
  return `${url.replace(/\/+$/, '')}/auth/v1/callback`;
}

/**
 * URL de base du service d'authentification (GoTrue) : toujours celle du projet
 * Supabase résolu, jamais une valeur de repli locale lorsque l'URL est connue.
 */
export function getAuthBaseUrl(): string {
  return resolveSupabaseConfig().url;
}