/**
 * Conformité Phase 1 (demandes 1 → 5 de la revue du 23/08/2026) :
 * statuts, TypeCodes Factur-X, auto-correction P.U., actions de la barre,
 * jeu de données « Boucle 33 kV ».
 */
import { describe, expect, it } from 'vitest';
import { InvoiceWorkflowService } from '../InvoiceWorkflowService';
import { FacturXTransformer } from '../FacturXTransformer';
import { reconcileLinePrice } from '@/application/services/boq/parsers/priceCoherence';
import {
  INVOICE_DOCUMENT_TYPES,
  getInvoiceTypeByDqeType,
  invoiceTypesForActor,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import {
  SAMPLE_DQE_BOUCLE_33KV,
  sampleDqeBoqLines,
} from '@/config/referentials/invoices/sample-dqe-boucle33kv.referential';

describe('1. Cohérence des statuts du cycle documentaire', () => {
  it('chaîne linéairement DQE → Devis → Contrat → Décompte → Facture', () => {
    const chain: InvoiceDocumentType[] = ['dqe'];
    let cur = InvoiceWorkflowService.nextType('dqe');
    while (cur) {
      chain.push(cur);
      cur = InvoiceWorkflowService.nextType(cur);
    }
    expect(chain).toEqual(['dqe', 'devis', 'contrat', 'decompte', 'facture']);
  });

  it('initialise chaque document sur un statut déclaré dans son référentiel', () => {
    for (const def of INVOICE_DOCUMENT_TYPES) {
      expect(def.statuses).toContain(def.initialStatus);
      expect(InvoiceWorkflowService.transitionStatus(def.code, def.statuses[def.statuses.length - 1])).toBe(
        def.statuses[def.statuses.length - 1],
      );
    }
  });

  it('refuse un statut hors référentiel et retombe sur le statut initial', () => {
    expect(InvoiceWorkflowService.transitionStatus('devis', 'payee')).toBe('brouillon');
    expect(InvoiceWorkflowService.transitionStatus('facture', 'payee')).toBe('payee');
  });

  it('réserve le DQE au gestionnaire et ouvre les étapes commerciales au fournisseur', () => {
    expect(InvoiceWorkflowService.canActorProduce('dqe', 'supplier')).toBe(false);
    expect(InvoiceWorkflowService.canActorProduce('dqe', 'manager')).toBe(true);
    expect(invoiceTypesForActor('supplier').map((d) => d.code)).toEqual([
      'devis',
      'contrat',
      'decompte',
      'facture',
    ]);
  });

  it('résout l’étape depuis le dqe_type persisté sur les lignes BOQ', () => {
    expect(getInvoiceTypeByDqeType('previsionnel').code).toBe('dqe');
    expect(getInvoiceTypeByDqeType('decompte').code).toBe('decompte');
    expect(getInvoiceTypeByDqeType('inconnu').code).toBe('dqe');
  });
});

describe('2. TypeCodes XML Factur-X', () => {
  const lines = sampleDqeBoqLines('ctx-33kv');

  it('émet 310 pour DQE / Devis / Contrat / Décompte et 380 pour la facture', () => {
    const expected: Record<InvoiceDocumentType, '310' | '380'> = {
      dqe: '310',
      devis: '310',
      contrat: '310',
      decompte: '310',
      facture: '380',
    };
    for (const [code, typeCode] of Object.entries(expected) as [InvoiceDocumentType, string][]) {
      expect(InvoiceWorkflowService.definition(code).facturxTypeCode).toBe(typeCode);
      const xml = FacturXTransformer.toCiiXml(lines, {
        documentType: code,
        reference: `${code.toUpperCase()}-2026-0001`,
        seller: { name: 'Entreprise A' },
        buyer: { name: 'SOMELEC' },
      });
      expect(xml).toContain(`<ram:TypeCode>${typeCode}</ram:TypeCode>`);
      expect(xml).toContain('urn:cen.eu:en16931:2017');
    }
  });

  it('trace l’avancement facturé dans les notes du décompte', () => {
    const xml = FacturXTransformer.toCiiXml(lines, {
      documentType: 'decompte',
      reference: 'DEC-2026-0001',
      percentage: 30,
      seller: { name: 'Entreprise A' },
      buyer: { name: 'SOMELEC' },
    });
    expect(xml).toContain('Avancement facturé : 30 %');
  });
});

describe('3. Auto-correction arithmétique des P.U.', () => {
  it('corrige les deux lignes incohérentes du jeu Boucle 33 kV', () => {
    const results = SAMPLE_DQE_BOUCLE_33KV.map((l) => ({
      code: l.code,
      expectIncoherent: Boolean(l.incoherent),
      r: reconcileLinePrice({ quantity: l.quantity, unitPrice: l.unitPrice, totalHt: l.totalHt }),
    }));
    for (const { code, expectIncoherent, r } of results) {
      expect(r.corrected, `ligne ${code}`).toBe(expectIncoherent);
      if (expectIncoherent) {
        expect(r.reason).toBeTruthy();
        expect(r.originalUnitPrice).toBeTypeOf('number');
      }
    }
    const cable = results.find((x) => x.code === '4.1')!.r;
    expect(cable.unitPrice).toBeCloseTo(3_300, 4);
    const essais = results.find((x) => x.code === '6.1')!.r;
    expect(essais.unitPrice).toBeCloseTo(4_620_000, 2);
  });

  it('dérive les valeurs manquantes sans signaler de correction', () => {
    expect(reconcileLinePrice({ quantity: 5, unitPrice: 100, totalHt: null })).toMatchObject({
      totalHt: 500,
      corrected: false,
    });
    expect(reconcileLinePrice({ quantity: 5, unitPrice: null, totalHt: 500 })).toMatchObject({
      unitPrice: 100,
      corrected: false,
    });
    expect(reconcileLinePrice({ quantity: 0, unitPrice: 100, totalHt: 500 }).corrected).toBe(false);
  });
});

describe('4 & 5. Transformations et jeu de données Boucle 33 kV', () => {
  const lines = sampleDqeBoqLines('ctx-33kv');

  it('fournit 14 lignes avec TVA 16 % et prix renseignés', () => {
    expect(lines).toHaveLength(14);
    expect(lines.every((l) => (l.unitPrice ?? 0) > 0 && l.vatRate === 0.16)).toBe(true);
  });

  it('produit un décompte à 30 % puis une facture finale cohérents', () => {
    const decompte = InvoiceWorkflowService.build(
      { fromType: 'contrat', sourceContextId: 'ctx-33kv', percentage: 30 },
      lines,
    );
    expect(decompte.def.code).toBe('decompte');
    const baseHt = FacturXTransformer.computeTotals(lines).totalHt;
    const decompteHt = FacturXTransformer.computeTotals(decompte.lines).totalHt;
    expect(decompteHt / baseHt).toBeCloseTo(0.3, 3);
    expect(decompte.lines.every((l) => l.dqeType === 'decompte' && l.id === undefined)).toBe(true);

    const facture = InvoiceWorkflowService.build(
      { fromType: 'decompte', sourceContextId: 'ctx-33kv' },
      decompte.lines,
    );
    expect(facture.def.code).toBe('facture');
    expect(facture.def.facturxTypeCode).toBe('380');
    expect(FacturXTransformer.computeTotals(facture.lines).totalHt).toBeCloseTo(decompteHt, 2);
    expect(facture.documentId).not.toBe(decompte.documentId);
  });

  it('conserve la filiation documentaire dans metadata', () => {
    const { lines: devis } = InvoiceWorkflowService.build(
      { fromType: 'dqe', sourceContextId: 'ctx-33kv', actor: 'manager' },
      lines,
    );
    const meta = (devis[0].metadata as Record<string, any>).invoiceWorkflow;
    expect(meta).toMatchObject({ documentType: 'devis', fromType: 'dqe', actor: 'manager' });
  });

  it('bloque toute étape après la facture', () => {
    expect(() =>
      InvoiceWorkflowService.build({ fromType: 'facture', sourceContextId: 'ctx-33kv' }, lines),
    ).toThrow(/Aucune étape suivante/);
  });

  it('calcule TVA et net à payer sur le jeu complet', () => {
    const t = FacturXTransformer.computeTotals(lines);
    expect(t.totalHt).toBeGreaterThan(0);
    expect(t.totalTtc).toBeGreaterThan(t.totalHt);
    expect(t.netToPay).toBeLessThanOrEqual(t.totalTtc);
  });
});
