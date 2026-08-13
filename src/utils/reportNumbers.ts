/**
 * Formatage numérique unifié des rapports (compact & détaillé).
 *
 * Règle métier : TOUT nombre affiché dans un rapport est arrondi et affiché
 * avec exactement 2 décimales, quel que soit le mode de séparateur
 * (fr-FR « 1 234,56 » / en-US « 1,234.56 »).
 */

const DIGITS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

export function formatNumber2(value: unknown, locale = 'fr-FR'): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0,00'.replace(',', locale.startsWith('fr') ? ',' : '.');
  return n.toLocaleString(locale, DIGITS);
}

export function formatAmount2(value: unknown, currency = 'MRU', locale = 'fr-FR'): string {
  return `${formatNumber2(value, locale)} ${currency}`;
}

export function formatPercent2(value: unknown, locale = 'fr-FR'): string {
  return `${formatNumber2(value, locale)}%`;
}

/** Ratio/indice (SPI, CPI, probabilité...) — 2 décimales, sans séparateur de milliers. */
export function formatRatio2(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

/**
 * Indice EVM (CPI/SPI) : « N/A » quand la métrique est indéterminée
 * (aucun coût engagé pour le CPI, projet non démarré pour le SPI).
 * Évite d'afficher « 1,00 / sous budget » sur un projet à 0 % d'engagement.
 */
export function formatIndex2(value: unknown, isAvailable?: boolean): string {
  const n = Number(value);
  if (isAvailable === false || !Number.isFinite(n) || n === 0) return 'N/A';
  return n.toFixed(2);
}

/** Écart signé (points, MRU...) : signe explicite, 2 décimales. */
export function formatSigned2(value: unknown, unit = '', locale = 'fr-FR'): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'N/A';
  const sign = n > 0 ? '+' : '';
  return `${sign}${formatNumber2(n, locale)}${unit ? ` ${unit}` : ''}`;
}

