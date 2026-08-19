/**
 * Référentiel « limites administratives » (wilayas de Mauritanie).
 *
 * Fait le pont entre les identifiants du jeu GeoJSON source (simplemaps : MR01..MR15)
 * et les codes internes utilisés par `src/utils/mauritania.ts` (NKC, ADR, ...).
 * Aucune couleur ni libellé ne doit être codé en dur dans l'UI ou les services.
 */

export interface WilayaBoundaryReference {
  /** Identifiant de la feature GeoJSON source. */
  featureId: string;
  /** Code interne (MAURITANIA_REGIONS.code). */
  code: string;
  nameFr: string;
  nameAr: string;
  /** Couleur de restitution cartographique (hex). */
  color: string;
}

export const WILAYA_BOUNDARY_REFERENCES: WilayaBoundaryReference[] = [
  { featureId: 'MR01', code: 'HEC', nameFr: 'Hodh Ech Chargui', nameAr: 'الحوض الشرقي', color: '#e74c3c' },
  { featureId: 'MR02', code: 'HEG', nameFr: 'Hodh El Gharbi', nameAr: 'الحوض الغربي', color: '#e67e22' },
  { featureId: 'MR03', code: 'ASS', nameFr: 'Assaba', nameAr: 'العصابة', color: '#f1c40f' },
  { featureId: 'MR04', code: 'GRG', nameFr: 'Gorgol', nameAr: 'كوركول', color: '#2ecc71' },
  { featureId: 'MR05', code: 'BRK', nameFr: 'Brakna', nameAr: 'البراكنة', color: '#1abc9c' },
  { featureId: 'MR06', code: 'TRZ', nameFr: 'Trarza', nameAr: 'الترارزة', color: '#3498db' },
  { featureId: 'MR07', code: 'ADR', nameFr: 'Adrar', nameAr: 'آدرار', color: '#9b59b6' },
  { featureId: 'MR08', code: 'NDB', nameFr: 'Dakhlet Nouadhibou', nameAr: 'داخلة نواذيبو', color: '#34495e' },
  { featureId: 'MR09', code: 'TAG', nameFr: 'Tagant', nameAr: 'تكانت', color: '#16a085' },
  { featureId: 'MR10', code: 'GUD', nameFr: 'Guidimaka', nameAr: 'غيديماغا', color: '#d35400' },
  { featureId: 'MR11', code: 'TIZ', nameFr: 'Tiris Zemmour', nameAr: 'تيرس زمور', color: '#c0392b' },
  { featureId: 'MR12', code: 'INC', nameFr: 'Inchiri', nameAr: 'إينشيري', color: '#27ae60' },
  { featureId: 'MR13', code: 'NKC-O', nameFr: 'Nouakchott-Ouest', nameAr: 'نواكشوط الغربية', color: '#2980b9' },
  { featureId: 'MR14', code: 'NKC-N', nameFr: 'Nouakchott-Nord', nameAr: 'نواكشوط الشمالية', color: '#8e44ad' },
  { featureId: 'MR15', code: 'NKC-S', nameFr: 'Nouakchott-Sud', nameAr: 'نواكشوط الجنوبية', color: '#2c3e50' },
];

export const DEFAULT_BOUNDARY_COLOR = '#3b82f6';

export const getBoundaryReferenceByFeatureId = (
  featureId: string,
): WilayaBoundaryReference | undefined =>
  WILAYA_BOUNDARY_REFERENCES.find((entry) => entry.featureId === featureId);

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

/** Résolution tolérante par nom (FR) ou code interne. */
export const getBoundaryReferenceByName = (
  value: string,
): WilayaBoundaryReference | undefined => {
  const needle = normalize(value);
  if (!needle) return undefined;
  return WILAYA_BOUNDARY_REFERENCES.find(
    (entry) =>
      normalize(entry.code) === needle ||
      normalize(entry.nameFr) === needle ||
      normalize(entry.nameFr).includes(needle) ||
      needle.includes(normalize(entry.nameFr)),
  );
};
