/**
 * LogExporterService — export des logs vers le serveur de journalisation.
 *
 * - Tampon mémoire alimenté depuis LoggerService (pas de console directe).
 * - Envoi groupé : tampon plein, intervalle périodique, fermeture de page.
 * - Erreurs : envoi immédiat.
 * - localStorage sert de secours ; les niveaux `debug` restent locaux.
 * - Aucune donnée sensible : les entrées sont assainies avant envoi.
 */

import { LOGGING_CONFIG } from '@/config/logging.config';
import { logger, type LogEntry, type LogLevel } from '@/application/services/LoggerService';

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'apikey',
  'api_key',
  'authorization',
  'jwt',
  'nif',
  'email',
  'phone',
];

const sanitize = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value;
  if (depth > 3) return '[deep]';
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))
      ? '[redacted]'
      : sanitize(raw, depth + 1);
  }
  return out;
};

const sanitizeEntry = (entry: LogEntry): LogEntry => ({
  ...entry,
  details: sanitize(entry.details),
  context: entry.context ? { ...entry.context } : undefined,
});

export class LogExporterService {
  private static instance: LogExporterService | null = null;
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private lastSeenId: string | null = null;
  private sending = false;

  static getInstance(): LogExporterService {
    if (!LogExporterService.instance) LogExporterService.instance = new LogExporterService();
    return LogExporterService.instance;
  }

  start(): void {
    if (this.started || !LOGGING_CONFIG.serverEnabled || typeof window === 'undefined') return;
    this.started = true;

    // Collecte périodique depuis le tampon du logger (source unique de vérité).
    this.timer = setInterval(() => {
      this.collect();
      void this.flush();
    }, Math.min(LOGGING_CONFIG.flushIntervalMs, 60_000));

    window.addEventListener('beforeunload', () => {
      this.collect();
      this.flushSync();
    });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  /** Récupère les nouvelles entrées du logger depuis le dernier passage. */
  private collect(): void {
    const all = logger.getLogs().slice().reverse(); // ordre chronologique
    const startIndex = this.lastSeenId ? all.findIndex((e) => e.id === this.lastSeenId) + 1 : 0;
    const fresh = all.slice(startIndex > 0 ? startIndex : 0);
    if (fresh.length === 0) return;
    this.lastSeenId = fresh[fresh.length - 1].id;

    for (const entry of fresh) {
      if (LOGGING_CONFIG.clientOnlyLevels.includes(entry.level as LogLevel)) continue;
      this.queue.push(sanitizeEntry(entry));
    }

    const hasError = this.queue.some((e) => e.level === 'error' || e.level === 'critical');
    if (hasError || this.queue.length >= LOGGING_CONFIG.batchSize) void this.flush();
  }

  async flush(): Promise<void> {
    if (this.sending || this.queue.length === 0 || !LOGGING_CONFIG.serverEnabled) return;
    const batch = this.queue.splice(0, Math.max(LOGGING_CONFIG.batchSize, 50));
    this.sending = true;
    try {
      const response = await fetch(LOGGING_CONFIG.serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch, sentAt: new Date().toISOString() }),
        keepalive: true,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch {
      // Serveur indisponible : on garde les entrées localement (secours localStorage).
      this.queue = [...batch, ...this.queue].slice(-500);
    } finally {
      this.sending = false;
    }
  }

  /** Envoi best-effort à la fermeture de page. */
  private flushSync(): void {
    if (this.queue.length === 0 || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
    try {
      const payload = JSON.stringify({ logs: this.queue, sentAt: new Date().toISOString() });
      navigator.sendBeacon(LOGGING_CONFIG.serverUrl, new Blob([payload], { type: 'application/json' }));
      this.queue = [];
    } catch {
      /* best effort */
    }
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}

export const logExporter = LogExporterService.getInstance();
export default logExporter;
