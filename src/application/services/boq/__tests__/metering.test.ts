import { describe, it, expect } from 'vitest';
import { extractDimensions } from '../parsers/dimensionExtraction';
import { MeterService } from '../MeterService';

describe('métré centralisé', () => {
  it('distingue L (longueur) de l (largeur)', () => {
    const d = extractDimensions('Génie civil : massifs béton, dalle support et fondations poste (L: 8,0 m x l: 5,0 m x H: 3,5 m)');
    expect(d.length).toBe(8);
    expect(d.width).toBe(5);
    expect(d.height).toBe(3.5);
  });

  it('calcule la quantité volumique 8 × 5 × 3,5 = 140', () => {
    const r = MeterService.quantityFor({
      designation: 'Génie civil : massifs béton (L: 8,0 m x l: 5,0 m x H: 3,5 m)',
      elementType: 'concrete_slab', length: 8, width: 5, height: 3.5,
    });
    expect(r.quantity).toBeCloseTo(140);
    expect(r.unit).toBe('m³');
  });

  it('linéaire : quantité = longueur', () => {
    const r = MeterService.quantityFor({ elementType: 'cable', length: 120, width: 5, height: 2 });
    expect(r.quantity).toBe(120);
    expect(r.unit).toBe('m');
  });

  it('signale une incohérence de montant', () => {
    const a = MeterService.detectAnomalies({ quantity: 10, unitPrice: 100, totalHt: 5000 });
    expect(a.some((x) => x.code === 'line_total_mismatch')).toBe(true);
  });
});
