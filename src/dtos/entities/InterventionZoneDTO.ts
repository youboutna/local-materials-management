/**
 * InterventionZoneDTO — DTO de la zone d'intervention d'un projet.
 * Sérialisé tel-quel dans `projects.localisation` (jsonb).
 *
 * v3 (rétro-compatible) : ajoute des métadonnées de géocodage
 * (région/ville Mauritanie + provider/confidence) renseignées par
 * `InterventionZonesPicker` via le `GeocodingService` singleton.
 */

export type InterventionZoneShape = 'polygon' | 'rectangle' | 'circle' | 'point';

/** Métadonnées du résultat de géocodage (provider, confiance, place_id…). */
export interface InterventionZoneGeocodingMeta {
  provider?: string;
  confidenceoordinates: InterventionZoneLatLng[];
  radiusMeters?: number;
  label?: string;
  address?: string;
  areaSqm?: number;

  // === Référentiel Mauritanie (auto-rempli par reverse-geocoding du centre) ===
  /** Code wilaya (ex. "13"). */
  regionCode?: string;
  /** Code moughataa/ville. */
  cityCode?: string;

  /** Métadonnées du dernier géocodage appliqué à cette zone. */
  geocodingMeta?: InterventionZoneGeocodingMeta;
}