import { describe, expect, it } from 'vitest';
import { getDQELineType, getDQETypeLabel, normalizeDQEType } from '../dqeTypeMapper';
import { mapDqeStatus } from '../dqeStatusMapper';

describe('normalizeDQEType', () => {
  it('normalise les libellés FR/EN accentués', () => {
    expect(normalizeDQEType('Prévisionnel')).toBe('previsionnel');
    expect(normalizeDQEType('Décompte')).toBe('decompte');
    expect(normalizeDQEType('Facture')).toBe('facture');
    expect(normalizeDQEType('invoice')).toBe('facture');
    expect(normalizeDQEType('devis')).toBe('devis');
    expect(normalizeDQEType('dqe')).toBe('estimate');
    expect(normalizeDQEType(undefined)).toBe('previsionnel');
    expect(normalizeDQEType('inconnu')).toBe('previsionnel');
  });

  it('déduit le line_type du cycle de vie', () => {
    expect(getDQELineType('facture')).toBe('invoice');
    expect(getDQELineType('décompte')).toBe('progress_invoice');
    expect(getDQELineType('prévisionnel')).toBe('estimate');
  });

  it('produit des libellés multilingues', () => {
    expect(getDQETypeLabel('decompte', 'fr')).toBe('Décompte');
    expect(getDQETypeLabel('facture', 'en')).toBe('Invoice');
  });
});

describe('mapDqeStatus', () => {
  it('mappe les statuts métier vers BoqStatus', () => {
    expect(mapDqeStatus('terminé')).toBe('validated');
    expect(mapDqeStatus('en cours')).toBe('submitted');
    expect(mapDqeStatus('planifié')).toBe('draft');
    expect(mapDqeStatus('annulé')).toBe('rejected');
    expect(mapDqeStatus('payé')).toBe('paid');
    expect(mapDqeStatus(undefined)).toBe('draft');
  });
});
