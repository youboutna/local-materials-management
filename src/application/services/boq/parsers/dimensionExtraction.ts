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

/** Étiquettes explicites (insensibles à la casse) : « largeur », « ép. », « long. ». */
const WORD_PATTERNS: Array<{ key: keyof ExtractedDimensions; re: RegExp }> = [
  { key: 'length', re: new RegExp(`(?:long(?:ueur)?\\.?|lg\\.?)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
  { key: 'width',  re: new RegExp(`(?:larg(?:eur)?\\.?)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
  { key: 'height', re: new RegExp(`(?:haut(?:eur)?\\.?|[eé]p(?:aisseur)?\\.?|prof(?:ondeur)?\\.?|diam(?:[eè]tre)?\\.?)\\s*[:=\\-]?\\s*${NUM}${UNIT}`, 'i') },
];

/**
 * Abréviations d'une seule lettre : la CASSE est significative en métré BTP.
 *   « L: 8,0 m x l: 5,0 m x H: 3,5 m »  →  L = longueur, l = largeur, H/h = hauteur.
 * Sans ce respect de la casse, la longueur était dupliquée dans la largeur.
 */
const LETTER_PATTERNS: Array<{ key: keyof ExtractedDimensions; re: RegExp }> = [
  { key: 'length', re: new RegExp(`\\bL\\s*[:=]?\\s*${NUM}${UNIT}`) },
  { key: 'width',  re: new RegExp(`\\bl\\s*[:=]?\\s*${NUM}${UNIT}`) },
  { key: 'height', re: new RegExp(`\\b[Hh]\\s*[:=]?\\s*${NUM}${UNIT}`) },
];

/** Motif « 5 x 2,5 x 0,15 m » ou « 5x2 m » (L x l [x h]). */
const TRIPLET = new RegExp(`${NUM}\\s*[x×]\\s*${NUM}(?:\\s*[x×]\\s*${NUM})?${UNIT}`, 'i');


export function extractDimensions(text?: string | null): ExtractedDimensions {
  const out: ExtractedDimensions = { length: null, width: null, height: null };
  const src = (text ?? '').trim();
  if (!src) return out;

  // 1. Étiquettes explicites, puis abréviations sensibles à la casse (L / l / H).
  for (const { key, re } of [...WORD_PATTERNS, ...LETTER_PATTERNS]) {
    if (out[key] != null) continue;
    const m = re.exec(src);
    if (m) out[key] = toMeters(m[1], m[2]);
  }

  // 2. Motif compact « 5 x 2,5 x 0,15 m » pour ce qui reste inconnu.
  if (out.length == null || out.width == null) {
    const t = TRIPLET.exec(src);
    if (t) {
      const unit = t[4];
      out.length = out.length ?? toMeters(t[1], unit);
      out.width = out.width ?? toMeters(t[2], unit);
      if (t[3] && out.height == null) out.height = toMeters(t[3], unit);
    }
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
