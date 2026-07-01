import { describe, it, expect } from 'vitest';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

const polygon: InterventionZoneDTO = {
  type: 'polygon',
  label: 'Trarza — Lot 1',
  address: 'Rosso',
  regionCode: '13',
  cityCode: '1301',
  coordinates: [
    { lat: 16.5, lng: -15.8 },
    { lat: 16.6, lng: -15.7 },
    { lat: 16.4, lng: -15.6 },
  ],
};

const rectangle: InterventionZoneDTO = {
  type: 'rectangle',
  label: 'Zone R',
  coordinates: [
    { lat: 18.0, lng: -16.0 },
    { lat: 18.0, lng: -15.9 },
    { lat: 18.1, lng: -15.9 },
    { lat: 18.1, lng: -16.0 },
  ],
};

const circle: InterventionZoneDTO = {
  type: 'circle',
  label: 'Zone C',
  radiusMeters: 1200,
  coordinates: [{ lat: 20.5, lng: -13.0 }],
};

const point: InterventionZoneDTO = {
  type: 'point',
  label: 'Point A',
  coordinates: [{ lat: 18.07, lng: -15.96 }],
};

describe('GeoJsonZoneCodec round-trip', () => {
  it('preserves the 4 shapes through export → import', () => {
    const zones = [polygon, rectangle, circle, point];
    const fc = GeoJsonZoneCodec.toFeatureCollection(zones);
    const back = GeoJsonZoneCodec.fromFeatureCollection(fc);
    expect(back).toHaveLength(zones.length);
    for (let i = 0; i < zones.length; i++) {
      expect(back[i].type).toBe(zones[i].type);
      expect(back[i].coordinates).toEqual(zones[i].coordinates);
      expect(back[i].label).toBe(zones[i].label);
    }
    expect(back[2].radiusMeters).toBe(1200);
    expect(back[0].regionCode).toBe('13');
    expect(back[0].cityCode).toBe('1301');
    expect(back[0].address).toBe('Rosso');
  });

  it('accepts native MultiPolygon input and splits into polygon zones', () => {
    const multi = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { label: 'Lot' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[[-15.8, 16.5], [-15.7, 16.6], [-15.6, 16.4], [-15.8, 16.5]]],
              [[[-14.0, 17.0], [-13.9, 17.1], [-13.8, 16.9], [-14.0, 17.0]]],
            ],
          },
        },
      ],
    };
    const zones = GeoJsonZoneCodec.fromFeatureCollection(multi);
    expect(zones).toHaveLength(2);
    expect(zones[0].type).toBe('polygon');
    expect(zones[1].type).toBe('polygon');
    expect(zones[0].coordinates).toHaveLength(3);
  });

  it('accepts open or closed polygon rings', () => {
    const open = {
      type: 'Feature',
      properties: { shape: 'polygon' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-15.8, 16.5], [-15.7, 16.6], [-15.6, 16.4]]],
      },
    };
    const closed = {
      type: 'Feature',
      properties: { shape: 'polygon' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-15.8, 16.5], [-15.7, 16.6], [-15.6, 16.4], [-15.8, 16.5]]],
      },
    };
    const a = GeoJsonZoneCodec.fromFeature(open);
    const b = GeoJsonZoneCodec.fromFeature(closed);
    expect(a[0].coordinates).toEqual(b[0].coordinates);
  });
});
