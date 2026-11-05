import type { FeatureCollection } from 'geojson';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

/** Convertit un GeoJSON importé en zones d'intervention (polygones et points) ; les autres géométries sont ignorées. */
export class MapZoneTransformer {
  static zonesFromGeoJson(fc: FeatureCollection): InterventionZoneDTO[] {
    const out: InterventionZoneDTO[] = [];
    for (const f of fc.features) {
      const label = typeof f.properties?.name === 'string' ? f.properties.name : typeof f.properties?.label === 'string' ? f.properties.label : undefined;
      const g = f.geometry;
      if (!g) continue;
      const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.type === 'MultiPolygon' ? g.coordinates.map(p => p[0]) : [];
      for (const ring of rings) {
        const pts = ring.slice(0, ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? -1 : undefined);
        if (pts.length >= 3) out.push({ type: 'polygon', coordinates: pts.map(([lng, lat]) => ({ lat, lng })), label });
      }
      if (g.type === 'Point') out.push({ type: 'point', coordinates: [{ lat: g.coordinates[1], lng: g.coordinates[0] }], label });
    }
    return out;
  }
}
