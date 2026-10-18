import { describe, it, expect } from 'vitest';
import { ProjectWorkbenchTransformer as T } from '@/dtos/transforms/ProjectWorkbenchTransformer';

describe('Infra GeoJSON rules', () => {
  it('takes the asset type from feature properties, else the default type', () => {
    const items = T.geojsonToImport(JSON.stringify({ type: 'FeatureCollection', features: [
      { type: 'Feature', properties: { name: 'L1', asset_type_code: 'line_mt' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } },
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
    ] }), 'valve');
    expect(items.map(i => i.asset_type_code)).toEqual(['line_mt', 'valve']);
    expect(items[0].name).toBe('L1');
  });
  it('rejects a geometry that does not match the asset type kind', () => {
    expect(() => T.formToAsset({ projectId: 'p', name: 'Poste', assetTypeCode: 'substation_mt', status: 'planned', geometry: '{"type":"LineString","coordinates":[[0,0],[1,1]]}' }, 'Point')).toThrow('does not match');
  });
  it('rejects an empty GeoJSON collection', () => {
    expect(() => T.geojsonToImport('{"type":"FeatureCollection","features":[]}', 'valve')).toThrow('no feature');
  });
});

import { readFileSync } from 'node:fs';
describe('Boucle 33 kV Kaédi–Sélibabi import', () => {
  const text = readFileSync('src/test/fixtures/boucle-33kv-kaedi-selibabi.geojson', 'utf-8');
  const items = T.geojsonToImport(text, '');
  it('reads 1 MV line and 4 substations with their own type codes', () => {
    expect(items).toHaveLength(5);
    expect(items.filter(i => i.asset_type_code === 'line_mt').map(i => i.geometry.type)).toEqual(['LineString']);
    expect(items.filter(i => i.asset_type_code.startsWith('substation_')).length).toBe(4);
  });
  it('keeps the attribute table and the source PV reference', () => {
    expect(items[0].properties.voltage_level).toBe('33 kV');
    expect(items[0].properties.source_id).toBe('BOUCLE-33KV-KAED-SELIBABI-KAEDI');
    expect((items[0].properties._import as { metadata: { source: string } }).metadata.source).toBe('PV N°15-CMI du 31-05-2022');
  });
  it('rejects a projected CRS', () => {
    expect(() => T.geojsonToImport(JSON.stringify({ type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'EPSG:32628' } }, features: [] }), 'valve')).toThrow('Unsupported CRS');
  });
  it('round-trips attribute values, keeping numbers and lists', () => {
    const props = T.attributesToProperties([{ key: 'regions', value: '["Gorgol","Guidimakha"]' }, { key: 'lots', value: '2' }, { key: 'voltage_level', value: '33 kV' }]);
    expect(props).toEqual({ regions: ['Gorgol', 'Guidimakha'], lots: 2, voltage_level: '33 kV' });
  });
});
