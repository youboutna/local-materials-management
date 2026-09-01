/**
 * GeoLocationLabelService — service applicatif pur (aucun React, aucun Supabase).
 *
 * Rôle unique : convertir n'importe quelle information de localisation
 * (code technique, texte libre, zone d'intervention géocodée, coordonnées)
 * en **code technique canonique** + **libellé multilingue** issu du
 * référentiel `mauritania-geo.referential`.
 *
 * Toute la cartographie (filtres carte projets / matériaux, cartes, exports)
 * doit passer par ce service : plus de comparaison de chaînes en dur.
 */

import {
  ALL_GEO_LABELS,
  GEO_CITY_LABELS,
  GEO_WILAYA_LABELS,
  normalizeGeoTerm,
  resolveGeoAdminLevelLabel,
  resolveGeoLabel,
  type GeoAdminLevel,
  type GeoLabelEntry,
} from '@/config/referentials/geo/mauritania-geo.referential';
import type { ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export interface GeoOption {
  /** Code technique unique (jamais traduit). */
  code: string;
  /** Libellé dans la langue demandée. */
  label: string;
  /** Libellé secondaire (autre langue, utile pour la recherche bilingue). */
  secondaryLabel: string;
  level: GeoAdminLevel;
  levelLabel: string;
  parentCode?: string;
  parentLabel?: string;
}

/** Entrée générique acceptée par le service (projet, matériau, zone…). */
export interface GeoResolvableInput {
  regionCode?: string | null;
  cityCode?: string | null;
  region?: string | null;
  wilaya?: string | null;
  city?: string | null;
  location?: string | null;
  address?: string | null;
  originLocation?: string | null;
  /** Zones d'intervention (jsonb `localisation`) ou tableau équivalent. */
  localisation?: unknown;
  interventionZones?: unknown;
}

const asZones = (value: unknown): Record<string, unknown>[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.zones)) return obj.zones as Record<string, unknown>[];
    return [obj];
  }
  return [];
};

export class GeoLocationLabelService {
  /** Code wilaya depuis un code (wilaya ou ville) déjà technique. */
  resolveRegionCodeFromCode(code?: string | null): string | undefined {
    if (!code) return undefined;
    const upper = code.toUpperCase();
    if (GEO_WILAYA_LABELS[upper]) return upper;
    const city = GEO_CITY_LABELS[upper];
    return city?.parentCode;
  }

  /** Code géographique depuis un texte libre (fr/ar/alias/translittération). */
  resolveCodeFromText(text?: string | null): GeoLabelEntry | undefined {
    const normalized = normalizeGeoTerm(text);
    if (normalized.length < 2) return undefined;

    const entries = Object.values(ALL_GEO_LABELS);
    // 1. Correspondance exacte sur un terme du référentiel.
    const exact = entries.find((entry) => entry.searchTerms.includes(normalized));
    if (exact) return exact;

    // 2. Le texte contient un terme du référentiel (ville prioritaire, plus précise).
    const contained = entries
      .filter((entry) => entry.searchTerms.some((term) => normalized.includes(term)))
      .sort((a, b) => {
        const levelRank = (l: GeoAdminLevel) => (l === 'city' || l === 'moughataa' ? 0 : l === 'wilaya' ? 1 : 2);
        return levelRank(a.level) - levelRank(b.level);
      });
    return contained[0];
  }

  /** Code wilaya canonique de n'importe quelle entité localisable. */
  resolveRegionCode(input?: GeoResolvableInput | null): string | undefined {
    if (!input) return undefined;

    // 1. Codes techniques explicites.
    const fromCode =
      this.resolveRegionCodeFromCode(input.regionCode) ?? this.resolveRegionCodeFromCode(input.cityCode);
    if (fromCode) return fromCode;

    // 2. Zones d'intervention géocodées.
    for (const zone of [...asZones(input.localisation), ...asZones(input.interventionZones)]) {
      const zoneCode =
        this.resolveRegionCodeFromCode(zone.regionCode as string | undefined) ??
        this.resolveRegionCodeFromCode(zone.cityCode as string | undefined);
      if (zoneCode) return zoneCode;
      const fromZoneText = this.resolveCodeFromText(
        [zone.address, zone.label].filter((v) => typeof v === 'string').join(' '),
      );
      if (fromZoneText) return fromZoneText.level === 'wilaya' ? fromZoneText.code : fromZoneText.parentCode;
    }

    // 3. Texte libre (region / wilaya / ville / adresse / origine matériau).
    for (const raw of [input.region, input.wilaya, input.city, input.originLocation, input.location, input.address]) {
      const entry = this.resolveCodeFromText(raw);
      if (entry) return entry.level === 'wilaya' ? entry.code : entry.parentCode;
    }
    return undefined;
  }

  /** Code ville/moughataa canonique si résoluble. */
  resolveCityCode(input?: GeoResolvableInput | null): string | undefined {
    if (!input) return undefined;
    if (input.cityCode && GEO_CITY_LABELS[input.cityCode.toUpperCase()]) return input.cityCode.toUpperCase();
    for (const zone of [...asZones(input.localisation), ...asZones(input.interventionZones)]) {
      const code = zone.cityCode as string | undefined;
      if (code && GEO_CITY_LABELS[code.toUpperCase()]) return code.toUpperCase();
    }
    for (const raw of [input.city, input.originLocation, input.location, input.address]) {
      const entry = this.resolveCodeFromText(raw);
      if (entry && entry.level !== 'wilaya' && entry.level !== 'country') return entry.code;
    }
    return undefined;
  }

  /** Vrai si l'entité appartient à la wilaya donnée (comparaison par code). */
  matchesRegion(input: GeoResolvableInput | null | undefined, regionCode: string): boolean {
    if (!regionCode || regionCode === 'all') return true;
    return this.resolveRegionCode(input) === regionCode.toUpperCase();
  }

  translate(code?: string | null, lang: ReferentialLanguage = 'fr'): string {
    return resolveGeoLabel(code, lang);
  }

  translateLevel(level: GeoAdminLevel, lang: ReferentialLanguage = 'fr'): string {
    return resolveGeoAdminLevelLabel(level, lang);
  }

  private toOption(entry: GeoLabelEntry, lang: ReferentialLanguage): GeoOption {
    const secondaryLang: ReferentialLanguage = lang === 'ar' ? 'fr' : 'ar';
    return {
      code: entry.code,
      label: entry[lang] || entry.fr,
      secondaryLabel: entry[secondaryLang] || '',
      level: entry.level,
      levelLabel: this.translateLevel(entry.level, lang),
      parentCode: entry.parentCode,
      parentLabel: entry.parentCode ? resolveGeoLabel(entry.parentCode, lang) : undefined,
    };
  }

  /** Toutes les wilayas, triées par libellé de la langue courante. */
  listRegionOptions(lang: ReferentialLanguage = 'fr'): GeoOption[] {
    return Object.values(GEO_WILAYA_LABELS)
      .map((entry) => this.toOption(entry, lang))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }

  /** Villes/moughataas d'une wilaya. */
  listCityOptions(regionCode?: string | null, lang: ReferentialLanguage = 'fr'): GeoOption[] {
    return Object.values(GEO_CITY_LABELS)
      .filter((entry) => !regionCode || regionCode === 'all' || entry.parentCode === regionCode.toUpperCase())
      .map((entry) => this.toOption(entry, lang))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }

  /** Wilayas réellement représentées dans un jeu de données (filtres contextuels). */
  listRegionOptionsFrom(inputs: (GeoResolvableInput | null | undefined)[], lang: ReferentialLanguage = 'fr'): GeoOption[] {
    const codes = new Set<string>();
    inputs.forEach((input) => {
      const code = this.resolveRegionCode(input);
      if (code) codes.add(code);
    });
    return this.listRegionOptions(lang).filter((option) => codes.has(option.code));
  }

  /**
   * Libellé de localisation canonique : « Ville, Wilaya, Pays » dans la langue
   * courante, complété par l'adresse brute quand aucun code n'est résoluble.
   */
  formatLocationLabel(input?: GeoResolvableInput | null, lang: ReferentialLanguage = 'fr'): string {
    if (!input) return '';
    const cityCode = this.resolveCityCode(input);
    const regionCode = this.resolveRegionCode(input);
    const parts = [
      cityCode ? this.translate(cityCode, lang) : undefined,
      regionCode ? this.translate(regionCode, lang) : undefined,
      this.translate('MR', lang),
    ].filter(Boolean) as string[];

    if (parts.length > 1) return Array.from(new Set(parts)).join(', ');

    const fallback = [input.address, input.location, input.originLocation, input.region].find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    return (fallback as string | undefined)?.trim() ?? '';
  }
}

let instance: GeoLocationLabelService | null = null;

export const getGeoLocationLabelService = (): GeoLocationLabelService => {
  if (!instance) instance = new GeoLocationLabelService();
  return instance;
};
