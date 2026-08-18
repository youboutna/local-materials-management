import { describe, expect, it } from 'vitest';
import { extractDimensions, mergeDimensions } from '../parsers/dimensionExtraction';

describe('dimensionExtraction', () => {
  it('extrait une largeur inscrite dans la désignation', () => {
    expect(extractDimensions('Revêtement et finitions (Larg. 1.0m)').width).toBe(1);
  });

  it('gère la virgule décimale et les cm', () => {
    expect(extractDimensions('Dalle béton ép. 20 cm').height).toBeCloseTo(0.2);
    expect(extractDimensions('Tranchée largeur 0,80 m').width).toBeCloseTo(0.8);
  });

  it('gère le motif L x l x h', () => {
    const d = extractDimensions('Massif 5 x 2,5 x 0,15 m');
    expect(d.length).toBe(5);
    expect(d.width).toBeCloseTo(2.5);
    expect(d.height).toBeCloseTo(0.15);
  });

  it('ne remplace pas une dimension explicite', () => {
    const d = mergeDimensions({ width: 2 }, 'Mur (Larg. 1.0m)');
    expect(d.width).toBe(2);
  });
});
