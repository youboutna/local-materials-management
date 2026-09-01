import { describe, expect, it } from 'vitest';
import { getGeoLocationLabelService } from '../GeoLocationLabelService';

const geo = getGeoLocationLabelService();

describe('GeoLocationLabelService', () => {
  it('résout une wilaya depuis un code ville', () => {
    expect(geo.resolveRegionCodeFromCode('ALG')).toBe('BRK');
  });

  it('résout une wilaya depuis un texte libre fr ou ar', () => {
    expect(geo.resolveRegionCode({ location: 'Aleg, Mauritanie' })).toBe('BRK');
    expect(geo.resolveRegionCode({ region: 'نواكشوط' })).toBe('NKC');
  });

  it('résout une wilaya depuis une zone d’intervention géocodée', () => {
    expect(geo.resolveRegionCode({ localisation: [{ cityCode: 'ALG' }] })).toBe('BRK');
  });

  it('traduit un code selon la langue', () => {
    expect(geo.translate('NKC', 'fr')).toBe('Nouakchott');
    expect(geo.translate('NKC', 'ar')).toBe('نواكشوط');
    expect(geo.translate('MR', 'en')).toBe('Mauritania');
  });

  it('filtre par code technique et non par libellé', () => {
    expect(geo.matchesRegion({ originLocation: 'Aleg' }, 'BRK')).toBe(true);
    expect(geo.matchesRegion({ originLocation: 'Aleg' }, 'NKC')).toBe(false);
    expect(geo.matchesRegion({ originLocation: 'Aleg' }, 'all')).toBe(true);
  });

  it('formate un libellé Ville, Wilaya, Pays', () => {
    expect(geo.formatLocationLabel({ cityCode: 'ALG' }, 'fr')).toBe('Aleg, Brakna, Mauritanie');
  });
});
