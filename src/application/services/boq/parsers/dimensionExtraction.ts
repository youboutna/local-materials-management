/**
 * dimensionExtraction — récupère les dimensions inscrites dans le libellé
 * d'une ligne DQE (« Revêtement et finitions (Larg. 1.0m) », « L=12 m, ép. 20 cm »,
 * « Dalle 5 x 2,5 x 0,15 m »).
 *
 * Pure TS — consommé par le parseur (BoqImportOrchestrator) et par le moteur
 * de métré (AdvancedMeterEngine) afin que la validation « Largeur > 0 requise
 * pour m² » ne bloque plus quand la dimension est dans la désignation.
 */

export interface ExtractedDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

const UNIT_FACTOR: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001, ml: 1 };

function toMeters(value: string, unit?: string): number | null {
  const n = Number(value.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const f = unit ? (UNIT_FACTOR[unit.toLowerCase()] ?? 1) : 1;
  return n * f;
}

const NUM = '(\\d+(?:[.,]\\d+)?)';
const UNIT = '\\s*(m|ml|cm|mm)?\\b';

const PATTERNS: Array<{ key: keyof ExtractedDimensions; re: RegExp }> = [
  { key: 'length', re: new RegExp(`(?:long(?:ueur)?\\.?|lg\\.?|\\bL)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
  { key: 'width',  re: new RegExp(`(?:larg(?:eur)?\\.?|\\bla\\b|\\bl)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
  { key: 'height', re: new RegExp(`(?:haut(?:eur)?\\.?|\\bH\\b|[eé]p(?:aisseur)?\\.?|prof(?:ondeur)?\\.?|diam(?:[eè]tre)?\\.?)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
];

/** Motif « 5 x 2,5 x 0,15 m » ou « 5x2 m » (L x l [x h]). */
const TRIPLET = new RegExp(`${NUM}\\s*[x×]\\s*${NUM}(?:\\s*[x×]\\s*${NUM})?${UNIT}`, 'i');

export function extractDimensions(text?: string | null): ExtractedDimensions {
  const out: ExtractedDimensions = { length: null, width: null, height: null };
  const src = (text ?? '').trim();
  if (!src) return out;

  const t = TRIPLET.exec(src);
  if (t) {
    const unit = t[4];
    out.length = toMeters(t[1], unit);
    out.width = toMeters(t[2], unit);
    if (t[3]) out.height = toMeters(t[3], unit);
  }

  for (const { key, re } of PATTERNS) {
    if (out[key] != null) continue;
    const m = re.exec(src);
    if (m) out[key] = toMeters(m[1], m[2]);
  }
  return out;
}

/** Complète des dimensions partielles avec celles trouvées dans le libellé. */
export function mergeDimensions(
  explicit: Partial<ExtractedDimensions>,
  designation?: string | null,
): ExtractedDimensions {
  const hasAll = explicit.length && explicit.width && explicit.height;
  if (hasAll) {
    return {
      length: explicit.length ?? null,
      width: explicit.width ?? null,
      height: explicit.height ?? null,
    };
  }
  const found = extractDimensions(designation);
  return {
    length: explicit.length ?? found.length,
    width: explicit.width ?? found.width,
    height: explicit.height ?? found.height,
  };
}
