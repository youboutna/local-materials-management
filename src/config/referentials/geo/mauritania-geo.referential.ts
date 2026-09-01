/**
 * mauritania-geo.referential — source unique des libellés géographiques.
 *
 * Doctrine :
 * - Le domaine ne stocke que des **codes techniques** (`NKC`, `ADR`, `ALG`, `MR`).
 * - Les libellés fr / ar / en vivent ici (jamais dans l'UI, jamais en base).
 * - Les niveaux administratifs (pays / wilaya / moughataa / ville) sont eux aussi
 *   des codes traduits par référentiel.
 *
 * Les données géométriques et démographiques restent dans `@/utils/mauritania`;
 * ce fichier ne fait que projeter ces entrées en libellés multilingues.
 */

import { MAURITANIA_REGIONS, MAURITANIA_CITIES } from '@/utils/mauritania';
import type { ReferentialLabel, ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export type GeoAdminLevel = 'country' | 'wilaya' | 'moughataa' | 'city';

export interface GeoLabelEntry extends ReferentialLabel {
  level: GeoAdminLevel;
  /** Code parent (wilaya pour une ville, `MR` pour une wilaya). */
  parentCode?: string;
  /** Termes de recherche normalisés (alias, translittérations). */
  searchTerms: string[];
  lat?: number;
  lng?: number;
}

/** Normalisation commune : sans accents, minuscule, séparateurs unifiés. */
export const normalizeGeoTerm = (value?: string | null): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s'’_-]+/g, ' ');

export const GEO_ADMIN_LEVEL_LABELS: Record<GeoAdminLevel, ReferentialLabel> = {
  country: { code: 'country', fr: 'Pays', ar: 'دولة', en: 'Country' },
  wilaya: { code: 'wilaya', fr: 'Wilaya', ar: 'ولاية', en: 'Wilaya' },
  moughataa: { code: 'moughataa', fr: 'Moughataa', ar: 'مقاطعة', en: 'Moughataa' },
  city: { code: 'city', fr: 'Ville', ar: 'مدينة', en: 'City' },
};

export const GEO_COUNTRY_LABELS: Record<string, GeoLabelEntry> = {
  MR: {
    code: 'MR',
    fr: 'Mauritanie',
    ar: 'موريتانيا',
    en: 'Mauritania',
    level: 'country',
    searchTerms: ['mauritanie', 'mauritania', 'موريتانيا', 'rim', 'mr'],
  },
};

const buildTerms = (values: (string | undefined)[]): string[] =>
  Array.from(new Set(values.filter(Boolean).map((v) => normalizeGeoTerm(v)).filter((v) => v.length > 1)));

/** Wilayas : code technique → libellés fr/ar/en. */
export const GEO_WILAYA_LABELS: Record<string, GeoLabelEntry> = Object.fromEntries(
  MAURITANIA_REGIONS.map((region) => [
    region.code,
    {
      code: region.code,
      fr: region.name,
      ar: region.nameAr,
      en: region.name,
      level: 'wilaya' as GeoAdminLevel,
      parentCode: 'MR',
      searchTerms: buildTerms([region.code, region.name, region.nameAr]),
      lat: region.lat,
      lng: region.lng,
    },
  ]),
);

/** Moughataas / villes : code technique → libellés fr/ar/en + wilaya parente. */
export const GEO_CITY_LABELS: Record<string, GeoLabelEntry> = Object.fromEntries(
  MAURITANIA_CITIES.map((city) => [
    city.code,
    {
      code: city.code,
      fr: city.name,
      ar: city.nameAr,
      en: city.name,
      level: (city.isCapital ? 'city' : 'moughataa') as GeoAdminLevel,
      parentCode: city.parentCode,
      searchTerms: buildTerms([city.code, city.name, city.nameAr, ...(city.searchTerms ?? [])]),
      lat: city.lat,
      lng: city.lng,
    },
  ]),
);

export const ALL_GEO_LABELS: Record<string, GeoLabelEntry> = {
  ...GEO_COUNTRY_LABELS,
  ...GEO_WILAYA_LABELS,
  ...GEO_CITY_LABELS,
};

/** Libellé d'un code géographique dans la langue courante (fallback fr → code). */
export const resolveGeoLabel = (code?: string | null, lang: ReferentialLanguage = 'fr'): string => {
  if (!code) return '';
  const entry = ALL_GEO_LABELS[code] ?? ALL_GEO_LABELS[code.toUpperCase()];
  if (!entry) return code;
  return entry[lang] || entry.fr || entry.code;
};

/** Libellé d'un niveau administratif. */
export const resolveGeoAdminLevelLabel = (level: GeoAdminLevel, lang: ReferentialLanguage = 'fr'): string => {
  const entry = GEO_ADMIN_LEVEL_LABELS[level];
  return entry ? entry[lang] || entry.fr : level;
};
