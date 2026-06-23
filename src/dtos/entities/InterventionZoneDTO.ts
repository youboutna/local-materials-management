/**
 * InterventionZoneDTO — DTO de la zone d'intervention d'un projet.
 * Sérialisé tel-quel dans `projects.localisation` (jsonb).
 */

export type InterventionZoneShape = 'polygon' | 'rectangle' | 'circle' | 'point';

export interface InterventionZoneLatLng {
  lat: number;
  lng: number;
}

export interface InterventionZoneDTO {
  type: InterventionZoneShape;
  coordinates: InterventionZoneLatLng[];
  radiusMeters?: number;
  label?: string;
  address?: string;
  areaSqm?: number;
}
