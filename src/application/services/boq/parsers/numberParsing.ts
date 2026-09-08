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

/** Espaces (y compris insécables / fines) utilisés comme séparateurs de milliers. */
const SPACE_RX = /[\s\u00A0\u202F\u2009\u2007]+/g;

/**
 * Un DQE réel écrit « 3 500,00 » (espace = séparateur de milliers). Après un
 * découpage PDF/OCR une cellule peut contenir PLUSIEURS montants collés
 * (« 3 500,00 2 500,00 ») : on ne garde alors que le premier nombre pour ne
 * jamais fabriquer une valeur fantôme.
 */
function firstNumericToken(raw: string): string {
  const s = raw.replace(SPACE_RX, ' ').trim();
  // Groupes de milliers séparés par des espaces → un seul nombre.
  const grouped = s.match(/^-?\d{1,3}(?: \d{3})+(?:[.,]\d+)?/);
  if (grouped) return grouped[0].replace(/ /g, '');
  const single = s.match(/^-?\d+(?:[.,]\d+)?/);
  if (single) return single[0];
  const anywhere = s.match(/-?\d{1,3}(?: \d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/);
  return anywhere ? anywhere[0].replace(/ /g, '') : '';
}

function cleanup(value: unknown): { s: string; negative: boolean } | null {
  if (value == null || value === '') return null;
  const original = String(value).trim();
  if (!original) return null;
  const negative = /^\(.*\)$/.test(original) || /^-/.test(original);
  // On isole d'abord le premier nombre (espaces de milliers gérés), puis on
  // nettoie les devises et symboles résiduels.
  const s = firstNumericToken(original.replace(/^[(\-]\s*/, '')).replace(/[^\d.,]/g, '');
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
