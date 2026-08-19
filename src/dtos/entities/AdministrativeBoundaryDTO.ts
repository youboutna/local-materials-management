/**
 * DTOs des limites administratives (wilayas) — camelCase, consommés par l'UI.
 */
import type { Feature, MultiPolygon, Polygon } from 'geojson';

export interface AdministrativeBoundaryDTO {
  /** Identifiant de la feature source (ex. MR07). */
  featureId: string;
  /** Code interne du référentiel (ex. ADR). */
  code: string;
  nameFr: string;
  nameAr: string;
  /** Couleur de restitution cartographique. */
  color: string;
  /** Géométrie normalisée (Polygon ou MultiPolygon). */
  geometry: Polygon | MultiPolygon;
  /** Centroïde approximatif [lat, lng] pour les libellés. */
  center: { lat: number; lng: number };
  /** Emprise [southWest, northEast]. */
  bounds: { south: number; west: number; north: number; east: number };
}

export type AdministrativeBoundaryFeature = Feature<Polygon | MultiPolygon, { id?: string }>;

/** Résultat d'une localisation administrative d'un point. */
export interface BoundaryLookupResultDTO {
  featureId: string;
  code: string;
  nameFr: string;
  nameAr: string;
}
