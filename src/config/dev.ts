/**
 * Development Configuration
 * Configuration for development mode, mock data, and testing
 *
 * /src/config/dev.ts
 *
 * ⚠️ AUCUN localhost codé en dur dans ce fichier.
 *    Toutes les URLs proviennent de Vite (import.meta.env) avec des
 *    fallbacks explicites, jamais de valeurs "magiques".
 */

// ============================================================================
// RÉSOLUTION D'ENVIRONNEMENT (Vite + Node compatible)
// ============================================================================

/**
 * Lit une variable d'environnement de manière compatible Vite + Node.
 * En Vite, import.meta.env est remplacé au build. En Node, process.env.
 */
function readEnv(name: string, fallback = ''): string {
  // Vite
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  if (viteEnv && typeof viteEnv[name] === 'string') {
    return viteEnv[name] as string;
  }
  // Node
  if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
    return process.env[name] as string;
  }
  return fallback;
}

function isDevMode(): boolean {
  const viteMode = (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE;
  if (viteMode) return viteMode === 'development';
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  return false;
}

/**
 * URL du frontend courant.
 * - Navigateur → window.location.origin (déjà la bonne URL, http ou https)
 * - Sinon       → '' (l'appelant décidera)
 */
function resolveFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/**
 * URL de l'API en développement.
 *
 * Priorité :
 *   1. VITE_API_URL                  (défini dans .env.development)
 *   2. VITE_SUPABASE_URL + /rest/v1  (backend Supabase résolu)
 *   3. ''                            (aucun fallback magique — l'appelant gère)
 *
 * ⚠️ Aucun localhost codé en dur. Si aucune URL n'est configurée,
 *    on retourne une chaîne vide et on log un warning explicite.
 */
function resolveDevApiUrl(): string {
  const configured = readEnv('VITE_API_URL', '');
  if (configured) return configured.replace(/\/+$/, '');

  const supabaseUrl = readEnv('VITE_SUPABASE_URL', '');
  if (supabaseUrl) return `${supabaseUrl.replace(/\/+$/, '')}/rest/v1`;

  // ⚠️ Aucun fallback magique : on log et on retourne '' pour forcer
  //    l'appelant à gérer l'absence de configuration.
  console.warn(
    '[DEV_CONFIG] Aucune URL d\'API configurée. ' +
    'Définissez VITE_API_URL ou VITE_SUPABASE_URL dans votre fichier .env.'
  );
  return '';
}

// ============================================================================

export const DEV_CONFIG = {
  // Development mode flags
  DEV_MODE: isDevMode(),

  // Jeu de données de développement local
  USE_MOCK_DATA: readEnv('USE_MOCK_DATA', 'false') === 'true',

  // API simulation delays (in ms)
  API_DELAY: {
    MIN: 500,
    MAX: 2000,
    DEFAULT: 1000
  },

  // Feature flags for development
  FEATURES: {
    ENABLE_DEV_MODE: true,
    ENABLE_MOCK_ADAPTERS: true,
    ENABLE_LOCAL_STORAGE: true,
    ENABLE_LOGGING: true
  },

  // Logging configuration
  LOGGING: {
    LEVEL: readEnv('DEV_LOG_LEVEL', 'info'),
    ENABLE_CONSOLE: true,
    ENABLE_API_LOGS: true
  }
} as const;

/**
 * Check if mock data should be used
 */
export function shouldUseMockData(): boolean {
  return DEV_CONFIG.DEV_MODE && DEV_CONFIG.USE_MOCK_DATA;
}

/**
 * Simulate API delay for development
 */
export function simulateApiDelay(min?: number, max?: number): Promise<void> {
  if (!DEV_CONFIG.DEV_MODE) {
    return Promise.resolve();
  }

  const minDelay = min ?? DEV_CONFIG.API_DELAY.MIN;
  const maxDelay = max ?? DEV_CONFIG.API_DELAY.MAX;
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Development logger
 */
export const devLogger = {
  log: (...args: unknown[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.log('[DEV]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.error('[DEV ERROR]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.warn('[DEV WARN]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.info('[DEV INFO]', ...args);
    }
  }
};

/**
 * Check if a feature is enabled in development
 */
export function isDevFeatureEnabled(feature: keyof typeof DEV_CONFIG.FEATURES): boolean {
  return DEV_CONFIG.DEV_MODE && DEV_CONFIG.FEATURES[feature];
}

/**
 * Get development API base URL.
 * ✅ Lit VITE_API_URL ou VITE_SUPABASE_URL — aucun localhost codé en dur.
 *    Retourne '' si aucune URL n'est configurée (l'appelant doit gérer).
 */
export function getDevApiUrl(): string {
  return resolveDevApiUrl();
}

/**
 * Générateurs de valeurs synthétiques pour l'outillage de développement
 * (identifiants/horodatages de test) — jamais utilisés en production.
 */
export const devValueGenerators = {
  generateId: () => `dev_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`,

  generateTimestamp: () => new Date().toISOString(),

  generateRandomNumber: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min,

  generateRandomString: (length: number) =>
    Math.random().toString(36).slice(2, 2 + length),

  generateEmail: () =>
    `user_${Math.random().toString(36).slice(2, 10)}@example.com`,

  generatePhone: () => `+33${crypto.randomUUID().slice(0, 9)}`,
} as const;

/**
 * URL du frontend courant (utile pour debug OAuth).
 */
export function getCurrentFrontendOrigin(): string {
  return resolveFrontendOrigin();
}