/**
 * resourceKind — classification référentielle des ressources d'une phase.
 * Une ressource matérielle est soit un « matériau » consommable, soit un
 * « équipement » (engin / outillage). La classification s'appuie sur le code
 * de catégorie du référentiel matériaux (jamais sur un libellé traduit).
 */

export type ResourceKind = 'material' | 'equipment' | 'labor';

/** Codes de catégories considérés comme équipements (engins, outillage). */
const EQUIPMENT_CATEGORY_CODES = [
  'equipment',
  'equipements',
  'equipement',
  'engins',
  'engin',
  'machinery',
  'machine',
  'outillage',
  'tools',
  'vehicle',
  'vehicules',
];

/** Normalise un code (minuscule, sans accents ni séparateurs). */
const normalizeCode = (code?: string | null): string =>
  (code ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '');

/** Indique si une catégorie de matériau correspond à un équipement. */
export const isEquipmentCategory = (code?: string | null): boolean => {
  const normalized = normalizeCode(code);
  if (!normalized) return false;
  return EQUIPMENT_CATEGORY_CODES.some((candidate) =>
    normalized.includes(normalizeCode(candidate))
  );
};

/** Retourne le type de ressource matérielle d'après sa catégorie. */
export const getMaterialResourceKind = (code?: string | null): ResourceKind =>
  isEquipmentCategory(code) ? 'equipment' : 'material';
