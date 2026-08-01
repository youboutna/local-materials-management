import { describe, expect, it } from 'vitest';
import { getProjectCoordinates } from '../projectLocationBuckets';

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
});