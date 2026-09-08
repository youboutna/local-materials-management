/**
 * Fusion des libellés coupés : « 4x150 mm² » sous « Câble U-1000 RO2V » ne doit
 * jamais devenir une ligne, même si des dimensions sont lisibles dans ce
 * fragment (le métré déduit du libellé ne vaut pas une valeur source).
 */
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';

const columns = ['N°', 'Désignation', 'Unité', 'Quantité', 'PU', 'Montant'];

const rows = [
  { raw: { 'N°': '1', 'Désignation': 'Câble U-1000 RO2V', 'Unité': 'm', 'Quantité': '2 000,00', 'PU': '3 200,00', 'Montant': '6 400 000,00' } },
  { raw: { 'N°': '', 'Désignation': '4x150 mm²', 'Unité': '', 'Quantité': '', 'PU': '', 'Montant': '' } },
  { raw: { 'N°': '2', 'Désignation': 'Poteau béton', 'Unité': 'u', 'Quantité': '10', 'PU': '50 000', 'Montant': '500 000' } },
  { raw: { 'N°': '', 'Désignation': '12m/200 daN', 'Unité': '', 'Quantité': '', 'PU': '', 'Montant': '' } },
];

describe('fusion des désignations coupées', () => {
  it('rattache les suites techniques à la ligne précédente', () => {
    const mapping = BoqImportOrchestrator.autoMap(columns);
    const dtos = BoqImportOrchestrator.toDtos(rows, mapping, { source: 'dqe', contextId: 'p1' });

    expect(dtos).toHaveLength(2);
    expect(dtos[0].designation).toBe('Câble U-1000 RO2V 4x150 mm²');
    expect(dtos[0].quantity).toBe(2000);
    expect(dtos[0].totalHt).toBe(6_400_000);
    expect(dtos[1].designation).toBe('Poteau béton 12m/200 daN');
    expect(dtos[1].quantity).toBe(10);
  });
});
