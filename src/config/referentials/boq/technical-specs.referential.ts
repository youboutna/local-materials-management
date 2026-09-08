/**
 * technical-specs — référentiel configurable des familles de produits BTP :
 * unités de quantité admises, unités techniques présentes dans les libellés
 * (section, tension, effort…) et fourchettes de prix de marché.
 *
 * Sert au contrôle de cohérence des lignes DQE importées : distinguer une
 * caractéristique technique (« 4x150 mm² ») de l'unité de quantité (« m »),
 * et situer le prix unitaire par rapport au marché. Aucun seuil codé en dur
 * ailleurs : tout se règle ici.
 */

export type TechnicalUnitKind = 'section' | 'longueur' | 'masse' | 'tension' | 'effort' | 'puissance' | 'diametre';

export interface MarketPriceRange {
  /** Unité de quantité à laquelle la fourchette s'applique. */
  unit: string;
  min: number;
  max: number;
  currency: string;
  /** Écart relatif toléré avant alerte (0.1 = 10 %). */
  tolerance: number;
}

export interface ProductFamily {
  code: string;
  labelFr: string;
  labelAr: string;
  labelEn: string;
  /** Motifs de reconnaissance dans la désignation. */
  match: RegExp[];
  /** Unités de quantité normales pour cette famille. */
  quantityUnits: string[];
  marketPrice?: MarketPriceRange;
}

/** Unités techniques rencontrées dans les libellés (jamais des unités de quantité). */
export const TECHNICAL_UNITS: Array<{ kind: TechnicalUnitKind; labelFr: string; re: RegExp }> = [
  { kind: 'section', labelFr: 'section de conducteur', re: /\b\d+(?:[.,]\d+)?\s*mm(?:²|2)(?![0-9A-Za-z])/i },
  { kind: 'tension', labelFr: 'tension', re: /\b\d+(?:[.,]\d+)?\s*k?V\b/ },
  { kind: 'effort', labelFr: 'effort nominal', re: /\b\d+(?:[.,]\d+)?\s*daN\b/i },
  { kind: 'puissance', labelFr: 'puissance', re: /\b\d+(?:[.,]\d+)?\s*(?:kVA|kW|MVA)\b/i },
  { kind: 'diametre', labelFr: 'diamètre', re: /\b(?:DN|Ø|diam(?:[eè]tre)?\.?)\s*\d+/i },
  { kind: 'masse', labelFr: 'masse', re: /\b\d+(?:[.,]\d+)?\s*(?:kg|t)\b/i },
];

export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    code: 'CABLE_BT',
    labelFr: 'Câble électrique basse tension',
    labelAr: 'كابل كهربائي منخفض الجهد',
    labelEn: 'Low-voltage power cable',
    match: [/c[âa]ble/i, /\bU-?1000\b/i, /\bR[O0]2V\b/i, /\bH07\b/i, /\bNYY\b/i],
    quantityUnits: ['m', 'ml', 'km'],
    marketPrice: { unit: 'm', min: 3500, max: 4000, currency: 'MRU', tolerance: 0.1 },
  },
  {
    code: 'POTEAU',
    labelFr: 'Poteau / support de ligne',
    labelAr: 'عمود خط كهربائي',
    labelEn: 'Line pole',
    match: [/poteau|support\s+de\s+ligne|pyl[ôo]ne/i],
    quantityUnits: ['u', 'unité', 'pce', 'ens'],
    marketPrice: { unit: 'u', min: 45000, max: 90000, currency: 'MRU', tolerance: 0.15 },
  },
  {
    code: 'TRANSFO',
    labelFr: 'Transformateur',
    labelAr: 'محول كهربائي',
    labelEn: 'Transformer',
    match: [/transfo(?:rmateur)?/i],
    quantityUnits: ['u', 'unité', 'ens'],
    marketPrice: { unit: 'u', min: 700000, max: 1600000, currency: 'MRU', tolerance: 0.2 },
  },
  {
    code: 'BETON',
    labelFr: 'Béton',
    labelAr: 'خرسانة',
    labelEn: 'Concrete',
    match: [/b[ée]ton|dalle|massif/i],
    quantityUnits: ['m3', 'm³'],
    marketPrice: { unit: 'm3', min: 25000, max: 45000, currency: 'MRU', tolerance: 0.2 },
  },
  {
    code: 'CANALISATION',
    labelFr: 'Canalisation / conduite',
    labelAr: 'أنبوب',
    labelEn: 'Pipe',
    match: [/conduite|canalisation|tuyau|buse|\bPVC\b|\bPEHD\b/i],
    quantityUnits: ['m', 'ml'],
    marketPrice: { unit: 'ml', min: 1200, max: 6000, currency: 'MRU', tolerance: 0.25 },
  },
];

/** Décomposition des caractéristiques techniques présentes dans un libellé. */
export const SPEC_PATTERNS: Array<{ key: string; labelFr: string; re: RegExp; format?: (m: RegExpExecArray) => string }> = [
  {
    key: 'section',
    labelFr: 'Section',
    re: /\b(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*mm(?:²|2)(?![0-9A-Za-z])/i,
    format: (m) => `${m[1]} × ${m[2].replace(',', '.')} mm²`,
  },
  { key: 'norme', labelFr: 'Norme', re: /\b(U-?1000|NF\s*C\s*[\d\-\s]+)\b/i },
  { key: 'type', labelFr: 'Type', re: /\b(R[O0]2V|R2V|H07[A-Z\-]*|NYY)\b/i },
  { key: 'tension', labelFr: 'Tension', re: /\b(\d+(?:[.,]\d+)?\s*k?V)\b/ },
  { key: 'effort', labelFr: 'Effort', re: /\b(\d+(?:[.,]\d+)?\s*daN)\b/i },
  { key: 'puissance', labelFr: 'Puissance', re: /\b(\d+(?:[.,]\d+)?\s*(?:kVA|kW|MVA))\b/i },
];

const normalizeUnit = (u?: string | null): string =>
  String(u ?? '').trim().toLowerCase().replace('mètre', 'm').replace(/\s+/g, '');

/** Famille de produit détectée depuis la désignation (null si inconnue). */
export function detectProductFamily(designation?: string | null): ProductFamily | null {
  const src = String(designation ?? '');
  if (!src.trim()) return null;
  return PRODUCT_FAMILIES.find((f) => f.match.some((rx) => rx.test(src))) ?? null;
}

/** Vrai si l'unité de quantité est attendue pour cette famille. */
export function isExpectedQuantityUnit(family: ProductFamily, unit?: string | null): boolean {
  const u = normalizeUnit(unit);
  if (!u) return false;
  return family.quantityUnits.some((q) => normalizeUnit(q) === u);
}

/** Nombre de conducteurs déduit d'une section « 4x150 mm² ». */
export function extractConductors(designation?: string | null): number | null {
  const m = /\b(\d+)\s*[x×]\s*\d+(?:[.,]\d+)?\s*mm(?:²|2)(?![0-9A-Za-z])/i.exec(String(designation ?? ''));
  return m ? Number(m[1]) : null;
}
