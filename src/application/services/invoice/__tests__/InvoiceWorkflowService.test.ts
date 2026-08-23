import { describe, expect, it } from 'vitest';
import { InvoiceWorkflowService } from '../InvoiceWorkflowService';
import { FacturXTransformer } from '../FacturXTransformer';
import { reconcileLinePrice } from '@/application/services/boq/parsers/priceCoherence';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

const line = (over: Partial<BoqLineDTO> = {}): BoqLineDTO =>
  ({
    designation: 'Béton dosé à 350kg',
    unit: 'm3',
    quantity: 10,
    unitPrice: 1000,
    totalHt: 10000,
    source: 'dqe',
    contextId: 'ctx-1',
    status: 'draft',
    ...over,
  }) as BoqLineDTO;

describe('InvoiceWorkflowService', () => {
  it('enchaîne le cycle DQE → Devis → Contrat → Décompte → Facture', () => {
    expect(InvoiceWorkflowService.nextType('dqe')).toBe('devis');
    expect(InvoiceWorkflowService.nextType('devis')).toBe('contrat');
    expect(InvoiceWorkflowService.nextType('contrat')).toBe('decompte');
    expect(InvoiceWorkflowService.nextType('decompte')).toBe('facture');
    expect(InvoiceWorkflowService.nextType('facture')).toBeNull();
  });

  it('proratise les quantités pour un décompte', () => {
    const { lines, def } = InvoiceWorkflowService.build(
      { fromType: 'contrat', sourceContextId: 'ctx-1', percentage: 30 },
      [line()],
    );
    expect(def.code).toBe('decompte');
    expect(lines[0].quantity).toBe(3);
    expect(lines[0].totalHt).toBe(3000);
    expect(lines[0].id).toBeUndefined();
  });

  it('conserve les quantités quand le pourcentage est inutile', () => {
    const { lines } = InvoiceWorkflowService.build({ fromType: 'dqe', sourceContextId: 'ctx-1' }, [line()]);
    expect(lines[0].quantity).toBe(10);
  });

  it('expose le TypeCode Factur-X du référentiel', () => {
    expect(InvoiceWorkflowService.definition('dqe').facturxTypeCode).toBe('310');
    expect(InvoiceWorkflowService.definition('facture').facturxTypeCode).toBe('380');
  });
});

describe('FacturXTransformer', () => {
  it('génère un XML CII avec totaux HT/TVA/TTC', () => {
    const xml = FacturXTransformer.toCiiXml([line()], {
      documentType: 'facture',
      reference: 'FACT-2026-0001',
      seller: { name: 'Entreprise A' },
      buyer: { name: 'SOMELEC' },
    });
    expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
    expect(xml).toContain('FACT-2026-0001');
    expect(xml).toContain('urn:cen.eu:en16931:2017');
    const totals = FacturXTransformer.computeTotals([line()]);
    expect(totals.totalHt).toBeCloseTo(10000, 2);
    expect(totals.totalTtc).toBeGreaterThan(totals.totalHt);
    expect(totals.netToPay).toBeLessThan(totals.totalTtc);
  });
});

describe('reconcileLinePrice', () => {
  it('corrige le P.U. incohérent depuis le montant', () => {
    const r = reconcileLinePrice({ quantity: 10, unitPrice: 999, totalHt: 10000 });
    expect(r.corrected).toBe(true);
    expect(r.unitPrice).toBe(1000);
  });

  it('laisse les lignes cohérentes intactes', () => {
    expect(reconcileLinePrice({ quantity: 10, unitPrice: 1000, totalHt: 10000 }).corrected).toBe(false);
  });
});
