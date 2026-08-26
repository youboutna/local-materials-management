/**
 * projectLocationLabel — résolution canonique du libellé de localisation d'un projet.
 *
 * La base contient parfois le texte placeholder « Non spécifié » dans `location`
 * alors que la colonne `localisation` (JSON versionné) porte les vraies zones
 * d'intervention géocodées (adresse, ville, coordonnées). Ce résolveur ignore
 * les placeholders et reconstruit un libellé lisible :
 *   1. adresses des zones d'intervention (dédupliquées),
 *   2. champ `location` / `address` s'il est significatif,
 *   3. coordonnées formatées,
 *   4. `null` (l'appelant décide de l'état vide).
 */

const PLACEHOLDERS = new Set([
  'non spécifié',
  'non specifie',
  'non spécifiée',
  'non specifiee',
  'localisation non spécifiée',
  'localisation non specifiee',
  'n/a',
  'na',
  '-',
  '—',
  'null',
  'undefined',
]);

const isMeaningful = (value?: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && !PLACEHOLDERS.has(value.trim().toLowerCase());

interface ZoneLike {
  address?: string | null;
  label?: string | null;
  cityCode?: string | null;
  geocodingMeta?: { displayName?: string | null } | null;
}

/** Extrait les zones quel que soit le format historique (v1 objet, v2 tableau, v3 { zones }). */
export const extractZones = (localisation: unknown): ZoneLike[] => {
  if (!localisation) return [];
  if (Array.isArray(localisation)) return localisation as ZoneLike[];
  if (typeof localisation === 'object') {
    const obj = localisation as Record<string, unknown>;
    if (Array.isArray(obj.zones)) return obj.zones as ZoneLike[];
    return [obj as ZoneLike];
  }
  return [];
};

/** Adresses lisibles des zones d'intervention, dédupliquées et ordonnées. */
export const zoneAddresses = (localisation: unknown): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const zone of extractZones(localisation)) {
    const candidate = [zone?.address, zone?.geocodingMeta?.displayName, zone?.label].find(isMeaningful);
    if (!candidate) continue;
    const key = candidate.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate.trim());
  }
  return out;
};

export interface ProjectLocationSource {
  location?: string | null;
  address?: string | null;
  region?: string | null;
  wilaya?: string | null;
  localisation?: unknown;
  interventionZones?: unknown;
  coordinates?: { latitude?: number | null; longitude?: number | null } | null;
  latitude?: number | null;
  longitude?: number | null;
}

export const formatCoordinates = (source?: ProjectLocationSource | null): string | null => {
  const lat = source?.coordinates?.latitude ?? source?.latitude;
  const lng = source?.coordinates?.longitude ?? source?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

/**
 * Libellé de localisation, ou `null` si aucune source exploitable.
 * `maxZones` limite l'affichage (les zones suivantes sont résumées « +N »).
 */
export const resolveProjectLocationLabel = (
  source?: ProjectLocationSource | null,
  maxZones = 2,
): string | null => {
  if (!source) return null;

  const addresses = [
    ...zoneAddresses(source.localisation),
    ...zoneAddresses(source.interventionZones),
  ];
  const uniqueAddresses = Array.from(new Set(addresses));
  if (uniqueAddresses.length > 0) {
    const shown = uniqueAddresses.slice(0, maxZones).join(' · ');
    const rest = uniqueAddresses.length - maxZones;
    const region = [source.region, source.wilaya].find(isMeaningful);
    const base = rest > 0 ? `${shown} +${rest}` : shown;
    return region && !base.toLowerCase().includes(region.toLowerCase()) ? `${base} (${region})` : base;
  }

  const flat = [source.location, source.address, source.region, source.wilaya].find(isMeaningful);
  if (flat) return flat.trim();

  return formatCoordinates(source);
};

/** Vrai si la valeur affichée est un placeholder inutile (« Non spécifié », vide…). */
export const isPlaceholderLabel = (value?: unknown): boolean => !isMeaningful(value);
