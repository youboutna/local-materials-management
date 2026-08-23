/**
 * Référentiel des unités documentaires (D3 / D6).
 *
 * Source unique de vérité pour :
 *   • le libellé standardisé affiché dans les documents (`m`, `m2`, `m3`, `kg`, `unité`…)
 *   • le code UN/CEFACT Recommendation 20 exigé par EN 16931 / Factur-X
 *   • les libellés trilingues (fr / ar / en)
 *
 * Pure TS — aucune dépendance React / Supabase.
 */

export interface DocumentUnitDefinition {
  /** Code technique canonique (stocké / affiché en colonne « Unité »). */
  code: string;
  /** Code UN/CEFACT Rec. 20 pour l'attribut `unitCode` du XML CII. */
  unCefactCode: string;
  labels: { fr: string; ar: string; en: string };
  /** Variantes acceptées en entrée (import, parseur, saisie libre). */
  aliases: string[];
}

export const DOCUMENT_UNITS: DocumentUnitDefinition[] = [
  { code: 'm', unCefactCode: 'MTR', labels: { fr: 'm', ar: 'م', en: 'm' }, aliases: ['m', 'ml', 'metre', 'mètre', 'metres', 'mètres', 'lineaire', 'linéaire'] },
  { code: 'm2', unCefactCode: 'MTK', labels: { fr: 'm²', ar: 'م²', en: 'm²' }, aliases: ['m2', 'm²', 'm^2', 'metre carre', 'mètre carré'] },
  { code: 'm3', unCefactCode: 'MTQ', labels: { fr: 'm³', ar: 'م³', en: 'm³' }, aliases: ['m3', 'm³', 'm^3', 'metre cube', 'mètre cube'] },
  { code: 'kg', unCefactCode: 'KGM', labels: { fr: 'kg', ar: 'كغ', en: 'kg' }, aliases: ['kg', 'kilo', 'kilogramme', 'kilogram'] },
  { code: 't', unCefactCode: 'TNE', labels: { fr: 't', ar: 'طن', en: 't' }, aliases: ['t', 'tonne', 'tonnes', 'ton'] },
  { code: 'l', unCefactCode: 'LTR', labels: { fr: 'l', ar: 'ل', en: 'l' }, aliases: ['l', 'litre', 'litres', 'liter'] },
  { code: 'unite', unCefactCode: 'C62', labels: { fr: 'unité', ar: 'وحدة', en: 'unit' }, aliases: ['u', 'un', 'unite', 'unité', 'unites', 'unités', 'pce', 'piece', 'pièce', 'unit'] },
  { code: 'jour', unCefactCode: 'DAY', labels: { fr: 'jour', ar: 'يوم', en: 'day' }, aliases: ['j', 'jour', 'jours', 'hj', 'homme jour', 'homme·jour', 'day'] },
  { code: 'mois', unCefactCode: 'MON', labels: { fr: 'mois', ar: 'شهر', en: 'month' }, aliases: ['mois', 'month'] },
  { code: 'forfait', unCefactCode: 'LS', labels: { fr: 'forfait', ar: 'مبلغ جزافي', en: 'lump sum' }, aliases: ['forfait', 'ft', 'lump sum', 'ff', 'ens', 'ensemble'] },
];

const FALLBACK = DOCUMENT_UNITS.find((u) => u.code === 'unite') as DocumentUnitDefinition;

const INDEX: Record<string, DocumentUnitDefinition> = (() => {
  const idx: Record<string, DocumentUnitDefinition> = {};
  for (const u of DOCUMENT_UNITS) {
    idx[u.code] = u;
    idx[u.unCefactCode.toLowerCase()] = u;
    for (const a of u.aliases) idx[a] = u;
    idx[u.labels.fr.toLowerCase()] = u;
    idx[u.labels.en.toLowerCase()] = u;
  }
  return idx;
})();

const normalizeKey = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

/** Résout une unité brute (import, saisie, base) vers sa définition normalisée. */
export function resolveDocumentUnit(raw: unknown): DocumentUnitDefinition {
  const key = normalizeKey(raw);
  if (!key) return FALLBACK;
  return INDEX[key] ?? FALLBACK;
}

/** Libellé standardisé affiché dans les documents (PDF, tableaux). */
export function documentUnitLabel(raw: unknown, lang: 'fr' | 'ar' | 'en' = 'fr'): string {
  return resolveDocumentUnit(raw).labels[lang];
}

/** Code UN/CEFACT Rec. 20 exigé par EN 16931 (`unitCode`). */
export function documentUnitCefactCode(raw: unknown): string {
  return resolveDocumentUnit(raw).unCefactCode;
}
