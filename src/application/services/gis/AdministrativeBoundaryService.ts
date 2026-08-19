/**
 * AdministrativeBoundaryService — service applicatif pur (aucun React, aucun Leaflet).
 *
 * Responsabilités :
 *  - charger les limites administratives via le port IAdministrativeBoundaryRepository ;
 *  - enrichir les features avec le référentiel wilayas (code interne, libellés, couleur) ;
 *  - localiser un point (point-in-polygon, MultiPolygon et trous gérés) ;
 *  - fournir l'emprise / le centroïde utiles au rendu cartographique.
 */
import type { IAdministrativeBoundaryRepository } from '@/domain/repositories/IAdministrativeBoundaryRepository';
import type {
  AdministrativeBoundaryDTO,
  BoundaryLookupResultDTO,
} from '@/dtos/entities/AdministrativeBoundaryDTO';
import {
  DEFAULT_BOUNDARY_COLOR,
  getBoundaryReferenceByFeatureId,
  getBoundaryReferenceByName,
} from '@/config/referentials/gis/wilaya-boundaries.referential';
import { Location } from '@/domain/entities/Location';
import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import type { MultiPolygon, Polygon, Position } from 'geojson';

type Ring = Position[];

const ringsOf = (geometry: Polygon | MultiPolygon): Ring[][] =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

const pointInRing = (lng: number, lat: number, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

/** Point dans une géométrie Polygon/MultiPolygon (anneau extérieur moins les trous). */
export const isPointInGeometry = (
  lat: number,
  lng: number,
  geometry: Polygon | MultiPolygon,
): boolean =>
  ringsOf(geometry).some((polygon) => {
    const [outer, ...holes] = polygon;
    if (!outer || !pointInRing(lng, lat, outer)) return false;
    return !holes.some((hole) => pointInRing(lng, lat, hole));
  });

const boundsOf = (geometry: Polygon | MultiPolygon) => {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  ringsOf(geometry).forEach((polygon) =>
    polygon.forEach((ring) =>
      ring.forEach(([lng, lat]) => {
        south = Math.min(south, lat);
        north = Math.max(north, lat);
        west = Math.min(west, lng);
        east = Math.max(east, lng);
      }),
    ),
  );
  return { south, west, north, east };
};

export class AdministrativeBoundaryService {
  private enriched: AdministrativeBoundaryDTO[] | null = null;

  constructor(private readonly repository: IAdministrativeBoundaryRepository) {}

  /** Limites administratives enrichies (référentiel appliqué). */
  async listBoundaries(): Promise<AdministrativeBoundaryDTO[]> {
    if (this.enriched) return this.enriched;

    const features = await this.repository.findAll();
    this.enriched = features.map((feature) => {
      const featureId = String(feature.properties?.id ?? '');
      const reference = getBoundaryReferenceByFeatureId(featureId);
      const geometry = feature.geometry as Polygon | MultiPolygon;
      const bounds = boundsOf(geometry);
      return {
        featureId,
        code: reference?.code ?? featureId,
        nameFr: reference?.nameFr ?? featureId,
        nameAr: reference?.nameAr ?? '',
        color: reference?.color ?? DEFAULT_BOUNDARY_COLOR,
        geometry,
        center: {
          lat: (bounds.south + bounds.north) / 2,
          lng: (bounds.west + bounds.east) / 2,
        },
        bounds,
      };
    });
    return this.enriched;
  }

  /** Wilaya contenant le point fourni (null si hors territoire couvert). */
  async findBoundaryAt(lat: number, lng: number): Promise<BoundaryLookupResultDTO | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const boundaries = await this.listBoundaries();
    const match = boundaries.find((boundary) => isPointInGeometry(lat, lng, boundary.geometry));
    if (!match) return null;
    return {
      featureId: match.featureId,
      code: match.code,
      nameFr: match.nameFr,
      nameAr: match.nameAr,
    };
  }

  /**
   * Projection d'une limite administrative sur l'entité de domaine `Location`
   * (type `region`) : un seul objet géographique dans tout le système, pas de
   * concept dupliqué. La géométrie reste portée par le DTO cartographique.
   */
  toLocation(boundary: AdministrativeBoundaryDTO): Location {
    return Location.create({
      id: boundary.featureId,
      code: boundary.code,
      name: boundary.nameFr,
      nameAr: boundary.nameAr,
      type: 'region',
      coordinates: boundary.center,
    });
  }

  /** Toutes les wilayas exposées comme entités `Location` (régions). */
  async listLocations(): Promise<Location[]> {
    const boundaries = await this.listBoundaries();
    return boundaries.map((boundary) => this.toLocation(boundary));
  }

  /**
   * Localisation d'un point sous forme d'entité `Location` :
   *  1. point-in-polygon sur les limites administratives (source de vérité locale) ;
   *  2. à défaut (hors couverture / géométries absentes), repli sur le
   *     reverse geocoding (base locale puis Nominatim) via `GeocodingService`.
   */
  async resolveLocationAt(lat: number, lng: number): Promise<Location | null> {
    const boundaries = await this.listBoundaries().catch(() => [] as AdministrativeBoundaryDTO[]);
    const match = boundaries.find((boundary) => isPointInGeometry(lat, lng, boundary.geometry));
    if (match) return this.toLocation(match);

    // Repli Nominatim / base locale : on réutilise le service de géocodage existant.
    const [reverse] = await getGeocodingService()
      .reverseGeocode(lat, lng)
      .catch(() => []);
    if (!reverse) return null;

    const regionName = reverse.components?.region ?? reverse.components?.state ?? '';
    const reference = regionName ? getBoundaryReferenceByName(regionName) : undefined;

    return Location.create({
      id: reference?.featureId ?? reverse.metadata?.code ?? `geo-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      code: reference?.code ?? reverse.metadata?.code ?? 'UNKNOWN',
      name: reference?.nameFr ?? regionName ?? reverse.address,
      nameAr: reference?.nameAr ?? '',
      type: reverse.type === 'city' ? 'city' : 'region',
      coordinates: { lat, lng },
      parentCode: reverse.metadata?.parentCode,
    });
  }

  /** Limite administrative par code interne ou nom (tolérant aux accents/casse). */
  async findBoundaryByName(value: string): Promise<AdministrativeBoundaryDTO | null> {
    const reference = getBoundaryReferenceByName(value);
    if (!reference) return null;
    const boundaries = await this.listBoundaries();
    return boundaries.find((b) => b.featureId === reference.featureId) ?? null;
  }
}
