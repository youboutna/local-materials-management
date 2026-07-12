/**
 * BOQ Element Types — bridge between raw designations (extracted from PDF/Excel)
 * and normalized construction element codes used by the calculation dispatcher.
 *
 * Extending: add a new entry with { code, label, keywords, defaultUnit }.
 */

export type ElementTypeCode =
  | 'concrete_slab'
  | 'masonry_wall'
  | 'concrete_beam'
  | 'concrete_column'
  | 'concrete_footing'
  | 'plaster'
  | 'excavation'
  | 'cable'
  | 'wooden_door'
  | 'window'
  | 'painting'
  | 'roofing'
  | 'generic';

export interface ElementTypeDef {
  code: ElementTypeCode;
  label: string;
  /** Regex applied on the designation to detect this type. */
  keywords: RegExp;
  defaultUnit: string;
  /** Which dimensions are meaningful for this element (drives quantity calc). */
  dimensions: { length: boolean; width: boolean; height: boolean };
}

export const ELEMENT_TYPES: ElementTypeDef[] = [
  { code: 'concrete_slab',    label: 'Dalle béton',       keywords: /dalle|plancher|paillasse/i,                       defaultUnit: 'm³', dimensions: { length: true, width: true, height: true } },
  { code: 'masonry_wall',     label: 'Mur maçonnerie',    keywords: /mur|ma[cç]onnerie|parpaing|agglo|brique/i,        defaultUnit: 'm²', dimensions: { length: true, width: false, height: true } },
  { code: 'concrete_beam',    label: 'Poutre béton',      keywords: /poutre|linteau|chainage/i,                        defaultUnit: 'm³', dimensions: { length: true, width: true, height: true } },
  { code: 'concrete_column',  label: 'Poteau béton',      keywords: /poteau|raidisseur|colonne/i,                      defaultUnit: 'm³', dimensions: { length: true, width: true, height: true } },
  { code: 'concrete_footing', label: 'Semelle / radier',  keywords: /semelle|radier|fondation/i,                       defaultUnit: 'm³', dimensions: { length: true, width: true, height: true } },
  { code: 'plaster',          label: 'Enduit / crépi',    keywords: /enduit|cr[eé]pi|chape/i,                          defaultUnit: 'm²', dimensions: { length: true, width: true, height: false } },
  { code: 'excavation',       label: 'Fouille / terrass.', keywords: /fouille|terrassement|d[eé]blai|remblai/i,        defaultUnit: 'm³', dimensions: { length: true, width: true, height: true } },
  { code: 'cable',            label: 'Câble / réseau',    keywords: /c[aâ]bl|gaine|r[eé]seau/i,                        defaultUnit: 'm',  dimensions: { length: true, width: false, height: false } },
  { code: 'wooden_door',      label: 'Porte bois',        keywords: /porte(?!\s*fen)/i,                                defaultUnit: 'unité', dimensions: { length: true, width: false, height: false } },
  { code: 'window',           label: 'Fenêtre',           keywords: /fen[eê]tre/i,                                     defaultUnit: 'unité', dimensions: { length: true, width: false, height: false } },
  { code: 'painting',         label: 'Peinture',          keywords: /peinture/i,                                       defaultUnit: 'm²', dimensions: { length: true, width: true, height: false } },
  { code: 'roofing',          label: 'Couverture',        keywords: /couverture|toiture|tuile|bac\s*acier/i,          defaultUnit: 'm²', dimensions: { length: true, width: true, height: false } },
];

/** Detect the element type code from a free-text designation. */
export function detectElementType(designation: string | null | undefined): ElementTypeCode {
  if (!designation) return 'generic';
  const found = ELEMENT_TYPES.find((e) => e.keywords.test(designation));
  return found?.code ?? 'generic';
}

/** Lookup by code (returns `generic` sentinel if unknown). */
export function getElementType(code: ElementTypeCode): ElementTypeDef | undefined {
  return ELEMENT_TYPES.find((e) => e.code === code);
}
