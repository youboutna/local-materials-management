import { describe, it, expect } from 'vitest';
import { MapZoneTransformer } from '@/dtos/transforms/MapZoneTransformer';

describe('MapZoneTransformer', () => {
  it('polygone fermé → zone sans point de fermeture dupliqué', () => {
    const z = MapZoneTransformer.zonesFromGeoJson({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: 'A' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }] });
    expect(z).toEqual([{ type: 'polygon', label: 'A', coordinates: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }] }]);
  });
  it('ligne ignorée', () => {
    expect(MapZoneTransformer.zonesFromGeoJson({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }] })).toEqual([]);
  });
});
