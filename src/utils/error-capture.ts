/**
 * error-capture — capture globale des erreurs et remontée vers le journal.
 *
 * Chaque erreur est associée à un code technique du référentiel
 * `error-codes.referential` afin d'afficher un libellé fonctionnel fr/ar/en.
 */

import { logger } from '@/application/services/LoggerService';
import { resolveErrorCode } from '@/config/referentials/error-codes.referential';

/** Correspondance mots-clés → codes du référentiel (aucun libellé en dur). */
const KEYWORD_TO_CODE: Array<[RegExp, string]> = [
  [/session|expired|jwt/i, 'AUTH_SESSION_EXPIRED'],
  [/unauthor|forbidden|401|403/i, 'AUTH_FORBIDDEN'],
  [/invalid login|credential/i, 'AUTH_LOGIN_FAILED'],
  [/row level security|rls|policy/i, 'DATA_RLS_DENIED'],
  [/failed to fetch|network|timeout|econnrefused/i, 'DATA_FETCH_FAILED'],
  [/upload|storage/i, 'STORAGE_UPLOAD_FAILED'],
  [/boq|dqe|import/i, 'BOQ_IMPORT_FAILED'],
  [/parse|parsing|unexpected token/i, 'SYSTEM_CONFIG_INVALID'],
  [/render|hook|hydrat/i, 'UI_RENDER_CRASH'],
];

/** Résout un code d'erreur depuis un message libre. */
export function resolveErrorCodeFromMessage(message?: string | null): string {
  if (!message) return 'SYSTEM_UNKNOWN';
  const direct = message.match(/[A-Z]+_[A-Z_]{3,}/)?.[0];
  if (direct && resolveErrorCode(direct).code === direct) return direct;
  for (const [pattern, code] of KEYWORD_TO_CODE) {
    if (pattern.test(message)) return code;
  }
  return 'SYSTEM_UNKNOWN';
}

export function initGlobalErrorCapture(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const error = event.error as Error | undefined;
    const message = error?.message || event.message || 'Unhandled error';
    logger.error(
      'system',
      message,
      resolveErrorCodeFromMessage(message),
      {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        name: error?.name,
      },
      error?.stack
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(
      'system',
      `Unhandled rejection: ${error.message}`,
      resolveErrorCodeFromMessage(error.message),
      { name: error.name },
      error.stack
    );
  });
}
