/**
 * T13 — Tests unitaires : verrou budgétaire (T11) et écarts documentaires (T12).
 */
import { describe, expect, it } from 'vitest';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { InvoiceBudgetGuardService } from '../InvoiceBudgetGuardService';
import { InvoiceDeviationService } from '../InvoiceDeviationService';

const line = (totalHt: number): BoqLineDTO =>
  ({
    source: 'dqe',
    designation: 'Ligne test',
    quantity: 1,
    unitPrice: totalHt,
    totalHt,
  } as unknown as BoqLineDTO);

describe('InvoiceBudgetGuardService', () => {
  it('additionne les montants HT stockés', () => {
    expect(InvoiceBudgetGuardService.totalHt([line(100), line(250)])).toBe(350);
  });

  it('laisse passer un devis même au-dessus du plafond (étape non engageante)', () => {
    const v = InvoiceBudgetGuardService.evaluate({
      targetType: 'devis',
      lines: [line(10_000)],
      projectBudget: 1_000,
    });
    expect(v.allowed).toBe(true);
    expect(v.severity).toBe('none');
  });

  it('laisse passer une facture sous le plafond', () => {
    const v = InvoiceBudgetGuardService.evaluate({
      targetType: 'facture',
      lines: [line(1_000)],
      projectBudget: 10_000,
    });
    expect(v.allowed).toBe(true);
    expect(v.cumulative).toBe(1_000);
  });

  it('alerte en zone haute (≥ 90 % du plafond) sans bloquer', () => {
    const v = InvoiceBudgetGuardService.evaluate({
      targetType: 'decompte',
      lines: [line(9_500)],
      projectBudget: 10_000,
    });
    expect(v.allowed).toBe(true);
    expect(v.severity).not.toBe('none');
  });

  it('bloque un décompte qui dépasse le plafond au-delà de la tolérance', () => {
    const v = InvoiceBudgetGuardService.evaluate({
      targetType: 'decompte',
      lines: [line(6_000)],
      alreadyInvoiced: 8_000,
      projectBudget: 10_000,
    });
    expect(v.allowed).toBe(false);
    expect(v.overrun).toBeGreaterThan(0);
    expect(v.message).toContain('bloqu');
  });

  it('privilégie le montant contractuel comme plafond', () => {
    const v = InvoiceBudgetGuardService.evaluate({
      targetType: 'facture',
      lines: [line(4_000)],
      projectBudget: 100_000,
      contractAmount: 5_000,
    });
    expect(v.ceiling).toBe(5_000);
  });

  it('assert() lève lorsque l’émission est refusée', () => {
    expect(() =>
      InvoiceBudgetGuardService.assert({
        targetType: 'facture',
        lines: [line(50_000)],
        projectBudget: 1_000,
      }),
    ).toThrow();
  });

  it('ne bloque pas si aucun plafond n’est connu', () => {
    const v = InvoiceBudgetGuardService.evaluate({ targetType: 'facture', lines: [line(50_000)] });
    expect(v.allowed).toBe(true);
  });
});

describe('InvoiceDeviationService', () => {
  it('calcule l’avancement financier facturé', () => {
    const report = InvoiceDeviationService.analyze({
      plannedBudget: 10_000,
      invoicedLines: [line(3_000)],
      actualProgress: 30,
    });
    expect(report.billedProgress).toBeCloseTo(30, 2);
    expect(report.invoicedTotal).toBe(3_000);
    expect(report.variance).toBe(-7_000);
  });

  it('intègre le cumul antérieur dans le réalisé', () => {
    const report = InvoiceDeviationService.analyze({
      plannedBudget: 10_000,
      invoicedLines: [line(2_000)],
      alreadyInvoiced: 5_000,
    });
    expect(report.invoicedTotal).toBe(7_000);
    expect(report.billedProgress).toBeCloseTo(70, 2);
  });

  it('déduit le budget planifié des lignes de référence', () => {
    const built = InvoiceDeviationService.build({
      plannedLines: [line(4_000), line(1_000)],
      invoicedLines: [line(1_000)],
    });
    expect(built.plannedBudget).toBe(5_000);
  });

  it('produit des écarts classés par le moteur générique', () => {
    const report = InvoiceDeviationService.analyze({
      plannedBudget: 10_000,
      invoicedLines: [line(15_000)],
      actualProgress: 20,
    });
    expect(report.deviations.length).toBeGreaterThan(0);
    expect(['info', 'low', 'medium', 'high']).toContain(report.maxSeverity);
  });

  it('reste stable sans budget planifié', () => {
    const report = InvoiceDeviationService.analyze({ invoicedLines: [line(1_000)] });
    expect(report.plannedBudget).toBe(0);
    expect(report.billedProgress).toBe(0);
  });
});
