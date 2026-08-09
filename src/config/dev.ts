/**
 * Development Configuration
 * Configuration for development mode, mock data, and testing
 */

export const DEV_CONFIG = {
  // Development mode flags
  DEV_MODE: typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : false,
  
  // Jeu de données de développement local
  USE_MOCK_DATA: typeof process !== 'undefined' ? process.env.USE_MOCK_DATA === 'true' : false,
  
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
    LEVEL: typeof process !== 'undefined' ? process.env.DEV_LOG_LEVEL || 'info' : 'info',
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
  
  const delay = Math.random() * (max || DEV_CONFIG.API_DELAY.MAX - (min || DEV_CONFIG.API_DELAY.MIN)) + (min || DEV_CONFIG.API_DELAY.MIN);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Development logger
 */
export const devLogger = {
  log: (...args: any[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.log('[DEV]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.error('[DEV ERROR]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (DEV_CONFIG.FEATURES.ENABLE_LOGGING && DEV_CONFIG.LOGGING.ENABLE_CONSOLE) {
      console.warn('[DEV WARN]', ...args);
    }
  },
  
  info: (...args: any[]) => {
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
 * Get development API base URL
 */
export function getDevApiUrl(): string {
  return typeof process !== 'undefined' ? process.env.DEV_API_URL || 'http://localhost:3000/api' : 'http://localhost:3000/api';
}

/**
 * Générateurs de valeurs synthétiques pour l'outillage de développement
 * (identifiants/horodatages de test) — jamais utilisés en production.
 */
export const devValueGenerators = {
  generateId: () => `dev_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`,
  
  generateTimestamp: () => new Date().toISOString(),
  
  generateRandomNumber: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  generateRandomString: (length: number) => Math.random().toString(36).substr(2, length),
  
  generateEmail: () => `user_${Math.random().toString(36).substr(2, 8)}@example.com`,
  
  generatePhone: () => `+33${crypto.randomUUID().slice(0, 9)}`,
} as const;
