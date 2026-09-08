/**
 * LoggerService — journalisation centralisée (pure TypeScript, aucun React).
 *
 * - Niveau déterminé par le mode applicatif : `development` / `local-bypass`
 *   → debug complet ; `production` → warnings/erreurs uniquement.
 * - Tampon mémoire borné + persistance locale.
 * - Export fichier `.jsonl` / `.log`.
 * - Les libellés fonctionnels proviennent du référentiel `error-codes.referential`.
 */

import { APP_VERSION, DEV_MODE, IS_LOCAL_BYPASS } from '@/config/constants';
import {
  getErrorHint,
  getErrorLabel,
  resolveErrorCode,
} from '@/config/referentials/error-codes.referential';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogSource = 'app' | 'network' | 'user' | 'system' | 'component' | 'service';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  /** Code technique du référentiel (jamais traduit). */
  errorCode?: string;
  /** Libellé fonctionnel résolu (fr par défaut). */
  errorLabel?: string;
  /** Conseil de résolution issu du référentiel. */
  errorHint?: string;
  message: string;
  details?: unknown;
  stack?: string;
  context?: { userId?: string; roles?: string[]; path?: string };
  metadata?: { appVersion?: string; userAgent?: string; url?: string };
  /** Nombre d'occurrences regroupées pour une même trace rapprochée. */
  repeatCount?: number;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  maxBufferSize: number;
  enableLocalStorage: boolean;
  storageKey: string;
  /** Écho console (désactivé en production). */
  enableConsole: boolean;
}

const LEVELS: LogLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];

/** Mode debug applicatif : development, local-bypass ou DEV_MODE actif. */
export const isDebugMode = (): boolean => {
  const appMode =
    (typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.APP_MODE) ||
    import.meta.env?.VITE_APP_MODE;
  if (appMode === 'production') return false;
  return appMode === 'development' || IS_LOCAL_BYPASS || DEV_MODE || import.meta.env?.DEV === true;
};

export class LoggerService {
  private static instance: LoggerService | null = null;
  private buffer: LogEntry[] = [];
  private config: LoggerConfig;
  private initialized = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly duplicateWindowMs = 500;

  private constructor() {
    this.config = LoggerService.defaultConfig();
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }

  private static defaultConfig(): LoggerConfig {
    const debug = isDebugMode();
    return {
      minLevel: debug ? 'debug' : 'warning',
      maxBufferSize: 1000,
      enableLocalStorage: true,
      storageKey: 'hadratech.app-logs',
      enableConsole: debug,
    };
  }

  init(config?: Partial<LoggerConfig>): void {
    if (this.initialized) return;
    this.config = { ...LoggerService.defaultConfig(), ...config };
    if (this.config.enableLocalStorage) this.restore();
    this.initialized = true;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS.indexOf(level) >= LEVELS.indexOf(this.config.minLevel);
  }

  private context(): LogEntry['context'] {
    const path = typeof window !== 'undefined' ? window.location.pathname : undefined;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: string; roles?: string[] };
        return { userId: parsed?.id, roles: parsed?.roles, path };
      }
    } catch {
      /* contexte indisponible */
    }
    return { path };
  }

  private metadata(): LogEntry['metadata'] {
    if (typeof window === 'undefined') return { appVersion: APP_VERSION };
    return {
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private log(
    level: LogLevel,
    source: LogSource,
    message: string,
    errorCode?: string,
    details?: unknown,
    stack?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const now = Date.now();
    const previous = this.buffer[this.buffer.length - 1];
    if (
      previous &&
      previous.level === level &&
      previous.source === source &&
      previous.message === message &&
      previous.errorCode === errorCode &&
      now - new Date(previous.timestamp).getTime() <= this.duplicateWindowMs
    ) {
      previous.repeatCount = (previous.repeatCount ?? 1) + 1;
      previous.timestamp = new Date(now).toISOString();
      if (this.config.enableLocalStorage) this.schedulePersist();
      return;
    }

    const entry: LogEntry = {
      id: `log-${now}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(now).toISOString(),
      level,
      source,
      errorCode,
      errorLabel: errorCode ? getErrorLabel(errorCode) : undefined,
      errorHint: errorCode ? getErrorHint(errorCode) : undefined,
      message,
      details,
      stack,
      context: this.context(),
      metadata: this.metadata(),
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.config.maxBufferSize);
    }
    if (this.config.enableLocalStorage) this.schedulePersist();
    if (this.config.enableConsole) this.echo(entry);
  }

  private schedulePersist(): void {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, 500);
  }

  /** Écho console — uniquement en mode debug, via les références natives. */
  private echo(entry: LogEntry): void {
    const prefix = `${entry.level.toUpperCase()}${entry.errorCode ? ` [${entry.errorCode}]` : ''}`;
    const line = `${prefix} ${entry.message}`;
    const raw = (globalThis as any).__nativeConsole ?? console;
    if (entry.level === 'error' || entry.level === 'critical') raw.error(line, entry.details ?? '');
    else if (entry.level === 'warning') raw.warn(line, entry.details ?? '');
    else raw.log(line, entry.details ?? '');
  }

  private persist(): void {
    try {
      localStorage.setItem(
        this.config.storageKey,
        JSON.stringify({ logs: this.buffer.slice(-200), updatedAt: new Date().toISOString() })
      );
    } catch {
      /* quota / stockage indisponible */
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as { logs?: LogEntry[] };
      if (Array.isArray(data?.logs)) this.buffer = data.logs.slice(-this.config.maxBufferSize);
    } catch {
      /* journal illisible */
    }
  }

  debug(source: LogSource, message: string, details?: unknown): void {
    this.log('debug', source, message, undefined, details);
  }
  info(source: LogSource, message: string, details?: unknown): void {
    this.log('info', source, message, undefined, details);
  }
  warning(source: LogSource, message: string, errorCode?: string, details?: unknown): void {
    this.log('warning', source, message, errorCode, details);
  }
  error(
    source: LogSource,
    message: string,
    errorCode?: string,
    details?: unknown,
    stack?: string
  ): void {
    this.log('error', source, message, errorCode, details, stack);
  }
  critical(
    source: LogSource,
    message: string,
    errorCode?: string,
    details?: unknown,
    stack?: string
  ): void {
    this.log('critical', source, message, errorCode, details, stack);
  }

  /** Journalise via le référentiel : sévérité et libellé sont déduits du code. */
  logError(errorCode: string, details?: unknown, stack?: string): void {
    const def = resolveErrorCode(errorCode);
    const level: LogLevel = def.severity === 'info' ? 'info' : def.severity;
    this.log(level, 'system', getErrorLabel(def.code), def.code, details, stack);
  }

  getLogs(): LogEntry[] {
    return [...this.buffer].reverse();
  }
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.getLogs().filter((e) => e.level === level);
  }
  getLogsBySource(source: LogSource): LogEntry[] {
    return this.getLogs().filter((e) => e.source === source);
  }

  exportJsonl(): string {
    return this.buffer.map((e) => JSON.stringify(e)).join('\n');
  }

  exportText(): string {
    return this.buffer
      .map((e) => {
        const code = e.errorCode ? `[${e.errorCode}] ` : '';
        const details = e.details ? ` ${JSON.stringify(e.details)}` : '';
        return `[${e.timestamp}] ${e.level.toUpperCase()} ${code}${e.message}${details}`;
      })
      .join('\n');
  }

  downloadLogs(format: 'jsonl' | 'text' = 'jsonl'): void {
    const content = format === 'jsonl' ? this.exportJsonl() : this.exportText();
    const blob = new Blob([content], {
      type: format === 'jsonl' ? 'application/jsonl' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().slice(0, 10)}.${format === 'jsonl' ? 'jsonl' : 'log'}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  clear(): void {
    this.buffer = [];
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch {
      /* noop */
    }
  }

  getStats(): { total: number; byLevel: Record<LogLevel, number>; bySource: Record<LogSource, number> } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    const bySource: Record<LogSource, number> = {
      app: 0,
      network: 0,
      user: 0,
      system: 0,
      component: 0,
      service: 0,
    };
    for (const entry of this.buffer) {
      byLevel[entry.level] = (byLevel[entry.level] ?? 0) + 1;
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
    }
    return { total: this.buffer.length, byLevel, bySource };
  }
}

export const logger = LoggerService.getInstance();
