import { describe, expect, it } from 'vitest';
import { analyzeLineCoherence } from '../parsers/lineCoherence';

describe('lineCoherence — ligne 1 câble U-1000 RO2V', () => {
  const line = analyzeLineCoherence({
    designation: 'Câble U-1000 RO2V 4x150 mm²',
    unit: 'm',
    quantity: 2000,
    unitPrice: 3200,
    totalHt: 6_400_000,
    vatRate: 5,
  });

  it('décompose les caractéristiques techniques', () => {
    expect(line.familyCode).toBe('CABLE_BT');
    expect(line.conductors).toBe(4);
    expect(line.specs.map((s) => s.key)).toEqual(expect.arrayContaining(['section', 'norme', 'type']));
  });

  it('signale la section comme caractéristique sans invalider l’unité m', () => {
    const f = line.findings.find((x) => x.code === 'UNIT_TECHNICAL_SPEC');
    expect(f?.severity).toBe('warning');
    expect(f?.message).toContain('« m »');
  });

  it('signale le prix inférieur au marché et valide les calculs', () => {
    expect(line.findings.some((f) => f.code === 'PRICE_OUT_OF_RANGE')).toBe(true);
    expect(line.findings.some((f) => f.code === 'MATH_OK')).toBe(true);
    expect(line.computed.vatAmount).toBe(320_000);
    expect(line.computed.totalTtc).toBe(6_720_000);
    expect(line.decision).toBe('accept_with_comment');
  });
});
