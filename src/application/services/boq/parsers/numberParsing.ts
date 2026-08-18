/**
 * numberParsing — lecture tolérante des nombres des DQE réels.
 *
 * Gère indifféremment les conventions FR (`1 234,56`), EN (`1,234.56`),
 * les séparateurs de milliers (`120,000` = 120000), les devises (`MRU`, `€`)
 * et les valeurs entre parenthèses (négatif comptable).
 *
 * Le mode peut être forcé à l'import (choix utilisateur) car `120,000` est
 * ambigu : 120 en convention FR (décimale), 120000 en convention anglophone
 * (séparateur de milliers).
 */
export type NumberFormatMode = 'auto' | 'fr' | 'en';

export const NUMBER_FORMAT_OPTIONS: { value: NumberFormatMode; label: string; hint: string }[] = [
  { value: 'auto', label: 'Détection automatique', hint: 'Déduit la convention ligne par ligne (recommandé).' },
  { value: 'fr', label: 'Format français — 1 234,56', hint: 'La virgule est la décimale (« 120,000 » = 120).' },
  { value: 'en', label: 'Format anglophone — 1,234.56', hint: 'La virgule sépare les milliers (« 120,000 » = 120000).' },
];

function cleanup(value: unknown): { s: string; negative: boolean } | null {
  if (value == null || value === '') return null;
  let s = String(value).trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s) || /^-/.test(s);
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return null;
  return { s, negative };
}

function finish(s: string, negative: boolean): number | null {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

export function parseLocaleNumber(value: unknown, mode: NumberFormatMode = 'auto'): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const cleaned = cleanup(value);
  if (!cleaned) return null;
  let { s } = cleaned;
  const { negative } = cleaned;

  if (mode === 'fr') {
    // Point = séparateur de milliers, virgule = décimale.
    s = s.split('.').join('');
    const idx = s.lastIndexOf(',');
    s = idx < 0 ? s : `${s.slice(0, idx).split(',').join('')}.${s.slice(idx + 1)}`;
    return finish(s, negative);
  }

  if (mode === 'en') {
    // Virgule = séparateur de milliers, point = décimale.
    s = s.split(',').join('');
    const idx = s.lastIndexOf('.');
    s = idx < 0 ? s : `${s.slice(0, idx).split('.').join('')}.${s.slice(idx + 1)}`;
    return finish(s, negative);
  }

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    // Le dernier séparateur rencontré est le séparateur décimal.
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';
    s = s.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const parts = s.split(sep);
    const isThousands = parts.length > 1
      && parts.slice(1).every((p) => p.length === 3)
      && parts[0].length <= 3;
    s = isThousands ? parts.join('') : `${parts.slice(0, -1).join('')}.${parts[parts.length - 1]}`;
  }

  return finish(s, negative);
}
