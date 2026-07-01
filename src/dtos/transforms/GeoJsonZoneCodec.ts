/**
 * GeoJsonZoneCodec
 *
 * Codec bidirectionnel unique entre `InterventionZoneDTO[]` et une
 * `GeoJSON.FeatureCollection` (RFC 7946 + propriétés d'extension).
 *
 * Contrat de round-trip :
 *   zones ── toFeatureCollection ──▶ FeatureCollection
 *   FeatureCollection ── fromFeatureCollection ──▶ zones'
 * On garantit `zones ≡ zones'` (type, coordonnées, radiusMeters, label,
 * address, areaSqm, regionCode, cityCode, geocodingMeta).
 *
 * Formes supportées :
 *  - `polygon` / `rectangle` → `geometry.type = "Polygon"` + `properties.shape`
 *  - `circle`               → `geometry.type = "Point"`   + `properties.shape="circle"`
 *                             + `properties.radiusMeters`
 *  - `point`                → `geometry.type = "Point"`   + `properties.shape="point"`
 *  - MultiPolygon en entrée → 1 zone `polygon` par sous-polygone (ring 0).
 *
 * Aucun impact DB : ce codec n'intervient que sur les payloads d'export/import.
 */

import type {
  InterventionZoneDTO,
  InterventionZoneLatLng,
  InterventionZoneShape,
  InterventionZoneGeocodingMeta,
} from '@/dtos/entities/InterventionZoneDTO';

// ---------------------------------------------------------------------------
// Types GeoJSON minimaux (évite la dépendance @types/geojson).
// ---------------------------------------------------------------------------

type Position = [number, number] | number[];

interface PointGeometry {
  type: 'Point';
  coordinates: Position;
}
interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Position[][];
}
interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}
type Geometry = PointGeometry | PolygonGeometry | MultiPolygonGeometry;

export interface ZoneFeatureProperties {
  label?: string;
  shape?: InterventionZoneShape;
  radiusMeters?: number;
  areaSqm?: number;
  address?: string;
  regionCode?: string;
  cityCode?: string;
  geocodingMeta?: InterventionZoneGeocodingMeta;
  [key: string]: unknown;
}

export interface ZoneFeature {
  type: 'Feature';
  properties: ZoneFeatureProperties;
  geometry: Geometry;
}

export interface ZoneFeatureCollection {
  type: 'FeatureCollection';
  features: ZoneFeature[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toLngLat = (p: InterventionZoneLatLng): Position => [p.lng, p.lat];
const fromLngLat = (c: Position): InterventionZoneLatLng => ({
  lat: Number(c[1]),
  lng: Number(c[0]),
});

const closeRing = (ring: Position[]): Position[] => {
  if (ring.length === 0) return ring;
  const [fx, fy] = ring[0];
  const last = ring[ring.length - 1];
  if (last[0] === fx && last[1] === fy) return ring;
  return [...ring, [fx, fy]];
};

const openRing = (ring: Position[]): Position[] => {
  if (ring.length < 2) return ring;
  const [fx, fy] = ring[0];
  const last = ring[ring.length - 1];
  return last[0] === fx && last[1] === fy ? ring.slice(0, -1) : ring;
};

const isRaw = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object';

// Drop undefined keys so round-trip equality holds against JSON-parsed payloads.
const compact = <T extends Record<string, unknown>>(o: T): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
};

// ---------------------------------------------------------------------------
// Codec
// ---------------------------------------------------------------------------

export class GeoJsonZoneCodec {
  // -------------------- Encode --------------------

  static toFeature(zone: InterventionZoneDTO, index = 0): ZoneFeature {
    const props: ZoneFeatureProperties = compact({
      label: zone.label ?? `Zone ${index + 1}`,
      shape: zone.type,
      radiusMeters: zone.radiusMeters,
      areaSqm: zone.areaSqm,
      address: zone.address,
      regionCode: zone.regionCode,
      cityCode: zone.cityCode,
      geocodingMeta: zone.geocodingMeta,
    });

    let geometry: Geometry;
    if (zone.type === 'circle' || zone.type === 'point') {
      const c = zone.coordinates[0] ?? { lat: 0, lng: 0 };
      geometry = { type: 'Point', coordinates: toLngLat(c) };
    } else {
      // polygon | rectangle → Polygon fermé
      const ring = closeRing(zone.coordinates.map(toLngLat));
      geometry = { type: 'Polygon', coordinates: [ring] };
    }

    return { type: 'Feature', properties: props, geometry };
  }

  static toFeatureCollection(zones: InterventionZoneDTO[]): ZoneFeatureCollection {
    return {
      type: 'FeatureCollection',
      features: zones.map((z, i) => GeoJsonZoneCodec.toFeature(z, i)),
    };
  }

  // -------------------- Decode --------------------

  static fromFeature(feature: unknown): InterventionZoneDTO[] {
    if (!isRaw(feature)) return [];
    const props = (isRaw(feature.properties) ? feature.properties : {}) as ZoneFeatureProperties;
    const geom = feature.geometry as Geometry | undefined;
    if (!geom || typeof geom !== 'object') return [];

    const commonProps = compact({
      label: props.label,
      address: props.address,
      areaSqm: props.areaSqm,
      regionCode: props.regionCode,
      cityCode: props.cityCode,
      geocodingMeta: props.geocodingMeta,
    });

    // Point → circle | point (selon properties.shape)
    if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      const center = fromLngLat(geom.coordinates as Position);
      const shape: InterventionZoneShape =
        props.shape === 'circle' || props.radiusMeters ? 'circle' : 'point';
      const zone: InterventionZoneDTO = compact({
        type: shape,
        coordinates: [center],
        radiusMeters: shape === 'circle' ? props.radiusMeters : undefined,
        ...commonProps,
      }) as InterventionZoneDTO;
      return [zone];
    }

    // Polygon → polygon | rectangle (selon properties.shape)
    if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
      const ring = openRing((geom.coordinates[0] ?? []) as Position[])
        .filter((c) => Array.isArray(c) && c.length >= 2)
        .map(fromLngLat);
      if (ring.length === 0) return [];
      const shape: InterventionZoneShape =
        props.shape === 'rectangle' ? 'rectangle' : 'polygon';
      return [
        compact({
          type: shape,
          coordinates: ring,
          ...commonProps,
        }) as InterventionZoneDTO,
      ];
    }

    // MultiPolygon → une zone `polygon` par sous-polygone (ring extérieur).
    if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
      return (geom.coordinates as Position[][][])
        .map((poly, idx) => {
          const ring = openRing((poly[0] ?? []) as Position[])
            .filter((c) => Array.isArray(c) && c.length >= 2)
            .map(fromLngLat);
          if (ring.length === 0) return null;
          return compact({
            type: 'polygon' as InterventionZoneShape,
            coordinates: ring,
            ...commonProps,
            label: commonProps.label
              ? `${commonProps.label} #${idx + 1}`
              : undefined,
          }) as InterventionZoneDTO;
        })
        .filter((z): z is InterventionZoneDTO => z !== null);
    }

    return [];
  }

  static fromFeatureCollection(fc: unknown): InterventionZoneDTO[] {
    if (!isRaw(fc)) return [];
    // Tolérance : Feature isolé, geometry brute, ou FeatureCollection.
    if (fc.type === 'FeatureCollection' && Array.isArray(fc.features)) {
      return (fc.features as unknown[]).flatMap((f) => GeoJsonZoneCodec.fromFeature(f));
    }
    if (fc.type === 'Feature') {
      return GeoJsonZoneCodec.fromFeature(fc);
    }
    // Geometry brute
    if (typeof fc.type === 'string' && 'coordinates' in fc) {
      return GeoJsonZoneCodec.fromFeature({ type: 'Feature', properties: {}, geometry: fc });
    }
    return [];
  }
}
