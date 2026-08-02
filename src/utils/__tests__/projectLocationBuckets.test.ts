import { describe, expect, it } from 'vitest';
import { getProjectCoordinates, getProjectLocationPoint } from '../projectLocationBuckets';

describe('getProjectCoordinates', () => {
  it('conserve les coordonnées explicites', () => {
    expect(getProjectCoordinates({ latitude: 18.1, longitude: -15.9 })).toEqual({
      latitude: 18.1,
      longitude: -15.9,
    });
  });

  it('résout une ville depuis la localisation quand les coordonnées manquent', () => {
    const coordinates = getProjectCoordinates({ location: 'Aleg, Mauritanie' });
    expect(coordinates?.latitude).toBeTypeOf('number');
    expect(coordinates?.longitude).toBeTypeOf('number');
  });

  it('ne fabrique pas de coordonnées pour une adresse inconnue', () => {
    expect(getProjectCoordinates({ location: 'Site à déterminer' })).toBeUndefined();
  });

  it('produit une zone point complète depuis Aleg pour édition et détail', () => {
    expect(getProjectLocationPoint({ location: 'Aleg, Mauritanie' })).toMatchObject({
      type: 'point',
      label: 'Aleg',
      address: 'Aleg, Mauritanie',
      cityCode: 'ALG',
      regionCode: 'BRK',
      geocodingMeta: { provider: 'mauritania-referential', confidence: 1 },
    });
    expect(getProjectLocationPoint({ location: 'Aleg, Mauritanie' })?.coordinates).toEqual([
      { lat: 17.0333, lng: -13.2833 },
    ]);
  });
});