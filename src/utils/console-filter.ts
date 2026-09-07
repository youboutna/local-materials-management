/**
 * console-filter — neutralise les traces console en production.
 *
 * - Mode `development` / `local-bypass` : rien n'est modifié.
 * - Mode `production` : `console.log/debug/info` sont neutralisés,
 *   `console.warn/error` sont redirigés vers le LoggerService (fichier de log).
 */

import { isDebugMode, logger } from '@/application/services/LoggerService';

const nativeConsole = {
  log: console.log.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/** Références natives réutilisées par le logger pour éviter les boucles. */
(globalThis as any).__nativeConsole = nativeConsole;

const stringify = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export function initConsoleFilter(): void {
  if (isDebugMode()) return;

  const noop = () => undefined;
  console.log = noop;
  console.debug = noop;
  console.info = noop;

  console.warn = (message?: unknown, ...rest: unknown[]) => {
    logger.warning('component', stringify(message), undefined, rest.length ? rest : undefined);
  };

  console.error = (message?: unknown, ...rest: unknown[]) => {
    const err = [message, ...rest].find((p) => p instanceof Error) as Error | undefined;
    logger.error(
      'component',
      stringify(message),
      undefined,
      rest.length ? rest : undefined,
      err?.stack
    );
  };
}

export function restoreConsole(): void {
  console.log = nativeConsole.log;
  console.debug = nativeConsole.debug;
  console.info = nativeConsole.info;
  console.warn = nativeConsole.warn;
  console.error = nativeConsole.error;
}
