/**
 * Unit Catalog Referential
 * Source unique des unités sélectionnables dans les UI (DQE, métré, devis, ressources).
 * Ne jamais coder de liste d'unités en dur dans un composant : importer d'ici.
 */

export type UnitDimension = 'count' | 'length' | 'area' | 'volume' | 'mass' | 'time' | 'lump';

export interface UnitCatalogEntry {
  /** Code persistant en base (colonne `unit`). */
  code: string;
  /** Libellé court affiché dans les selects. */
  label: string;
  /** Libellé long pour les listes détaillées. */
  longLabel: string;
  dimension: UnitDimension;
}

export const UNIT_CATALOG: UnitCatalogEntry[] = [
  { code: 'u', label: 'u', longLabel: 'Unité (u)', dimension: 'count' },
  { code: 'ens', label: 'ens', longLabel: 'Ensemble (ens)', dimension: 'lump' },
  { code: 'lot', label: 'lot', longLabel: 'Lot', dimension: 'lump' },
  { code: 'ff', label: 'ff', longLabel: 'Forfait (ff)', dimension: 'lump' },
  { code: 'ml', label: 'ml', longLabel: 'Mètre linéaire (ml)', dimension: 'length' },
  { code: 'm', label: 'm', longLabel: 'Mètre (m)', dimension: 'length' },
  { code: 'm2', label: 'm2', longLabel: 'Mètre carré (m2)', dimension: 'area' },
  { code: 'm²', label: 'm²', longLabel: 'Mètre carré (m²)', dimension: 'area' },
  { code: 'm3', label: 'm3', longLabel: 'Mètre cube (m3)', dimension: 'volume' },
  { code: 'm³', label: 'm³', longLabel: 'Mètre cube (m³)', dimension: 'volume' },
  { code: 'kg', label: 'kg', longLabel: 'Kilogramme (kg)', dimension: 'mass' },
  { code: 't', label: 't', longLabel: 'Tonne (t)', dimension: 'mass' },
  { code: 'h', label: 'h', longLabel: 'Heure (h)', dimension: 'time' },
  { code: 'j', label: 'j', longLabel: 'Jour (j)', dimension: 'time' },
  { code: 'unité', label: 'unité', longLabel: 'Unité', dimension: 'count' },
];

/** Unités proposées par défaut dans les DQE / devis (codes courts normalisés). */
export const DQE_UNIT_CODES: string[] = ['u', 'ml', 'm2', 'm3', 'kg', 'h', 'j', 'ff', 'ens', 'lot'];

/** Unités proposées pour un métré / quantity takeoff. */
export const TAKEOFF_UNIT_CODES: string[] = ['m', 'm²', 'm³', 'kg', 't', 'ml'];

/** Unités du calculateur de métré (dimensions géométriques). */
export const METRE_UNIT_CODES: string[] = ['m³', 'm²', 'm', 'unité'];

export const UNIT_BY_CODE: Record<string, UnitCatalogEntry> = UNIT_CATALOG.reduce(
  (acc, entry) => {
    acc[entry.code] = entry;
    return acc;
  },
  {} as Record<string, UnitCatalogEntry>,
);

export function getUnitOptions(codes: string[] = DQE_UNIT_CODES): UnitCatalogEntry[] {
  return codes
    .map((code) => UNIT_BY_CODE[code])
    .filter((entry): entry is UnitCatalogEntry => !!entry);
}

export function getUnitLabel(code: string | null | undefined): string {
  if (!code) return '';
  return UNIT_BY_CODE[code]?.label ?? code;
}
