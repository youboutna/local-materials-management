import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from './BoqImportOrchestrator';
import type { ParsedBoqRow } from './parsers/IDocumentParser';

const columns = ['Désignation', 'Unité', 'Quantité', 'PU', 'Longueur'];

const rows: ParsedBoqRow[] = [
  { raw: { 'Désignation': 'Béton dalle', 'Unité': 'm3', 'Quantité': '10', 'PU': '1 000,00', 'Longueur': '' } },
  { raw: { 'Désignation': 'Câble BT', 'Unité': 'ml', 'Quantité': '', 'PU': '250', 'Longueur': '100' } },
  { raw: { 'Désignation': '', 'Unité': '', 'Quantité': '', 'PU': '', 'Longueur': '' } },
];

describe('BoqImportOrchestrator (Lot 1)', () => {
  it('auto-maps French headers to canonical fields', () => {
    const m = BoqImportOrchestrator.autoMap(columns);
    expect(m.designation).toBe('Désignation');
    expect(m.unit).toBe('Unité');
    expect(m.quantity).toBe('Quantité');
    expect(m.unitPrice).toBe('PU');
    expect(m.length).toBe('Longueur');
  });

  it('parses FR numbers (spaces + comma) and computes derived quantities', () => {
    const m = BoqImportOrchestrator.autoMap(columns);
    const dtos = BoqImportOrchestrator.toDtos(rows, m, { source: 'dqe', contextId: 'P1' });
    // empty row skipped
    expect(dtos).toHaveLength(2);
    expect(dtos[0].unitPrice).toBe(1000);
    expect(dtos[0].totalHt).toBe(10_000);
    // second line derives quantity from length (ml)
    expect(dtos[1].quantity).toBeGreaterThan(0);
  });
});
