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
