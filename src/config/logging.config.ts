/**
 * logging.config.ts — configuration de la journalisation pilotée par .env.
 *
 * Variables (client) :
 *  VITE_LOG_LEVEL           debug | info | warning | error   (défaut: info)
 *  VITE_LOG_SERVER_ENABLED  true | false                     (défaut: true)
 *  VITE_LOG_SERVER_URL      endpoint d'export                (défaut: /api/logs/export)
 *  VITE_LOG_BATCH_SIZE      taille du tampon avant envoi     (défaut: 50)
 *  VITE_LOG_FLUSH_INTERVAL  intervalle d'envoi en ms         (défaut: 300000)
 */

import type { LogLevel } from '@/application/services/LoggerService';

const env = (import.meta.env ?? {}) as Record<string, string | undefined>;

const bool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
};

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const level = (value: string | undefined, fallback: LogLevel): LogLevel => {
  const allowed: LogLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];
  return allowed.includes(value as LogLevel) ? (value as LogLevel) : fallback;
};

export interface LoggingConfig {
  minLevel: LogLevel;
  serverEnabled: boolean;
  serverUrl: string;
  batchSize: number;
  flushIntervalMs: number;
  /** Niveaux jamais envoyés au serveur (bruit technique). */
  clientOnlyLevels: LogLevel[];
}

export const LOGGING_CONFIG: LoggingConfig = {
  minLevel: level(env.VITE_LOG_LEVEL, 'info'),
  serverEnabled: bool(env.VITE_LOG_SERVER_ENABLED, false),
  serverUrl: env.VITE_LOG_SERVER_URL || '/api/logs/export',
  batchSize: num(env.VITE_LOG_BATCH_SIZE, 50),
  flushIntervalMs: num(env.VITE_LOG_FLUSH_INTERVAL, 300_000),
  clientOnlyLevels: ['debug'],
};

export default LOGGING_CONFIG;
