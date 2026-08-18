/**
 * numberParsing — lecture tolérante des nombres des DQE réels.
 *
 * Gère indifféremment les conventions FR (`1 234,56`), EN (`1,234.56`),
 * les séparateurs de milliers (`120,000` = 120000), les devises (`MRU`, `€`)
 * et les valeurs entre parenthèses (négatif comptable).
 */
export function parseLocaleNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let s = String(value).trim();
  if (!s) return null;

  const negative = /^\(.*\)$/.test(s) || /^-/.test(s);
  // Retire tout ce qui n'est pas chiffre / séparateur.
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return null;

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

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}
