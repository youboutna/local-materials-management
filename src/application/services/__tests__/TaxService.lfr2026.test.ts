import { describe, it, expect } from 'vitest';
import { TaxService } from '@/application/services/TaxService';
import { SupplierNifValidationService } from '@/application/services/SupplierNifValidationService';

describe('TaxService — LFR 2026', () => {
  it('détecte les services numériques et leur TVA 16 %', () => {
    const tax = TaxService.resolve({ designation: 'Abonnement SaaS hébergement cloud', quantity: 1, unitPrice: 1000 });
    expect(tax.regimeCode).toBe('SERVICES_NUMERIQUES');
    expect(tax.vatRate).toBe(0.16);
    expect(tax.isDigitalService).toBe(true);
  });

  it('applique la localisation du consommateur pour la TVA numérique', () => {
    const line = { designation: 'Licence logiciel', quantity: 1, unitPrice: 100 };
    expect(TaxService.isDigitalServiceTaxableInMr(line)).toBe(false);
    expect(TaxService.isDigitalServiceTaxableInMr({ ...line, digitalLocalizationCriteria: ['IP'] })).toBe(true);
  });

  it('retient 10 % sur les commissions d’agents', () => {
    expect(TaxService.agentCommissionWithholding(5000)).toBe(500);
    const tax = TaxService.resolve({ designation: 'Commission agent mobile money', quantity: 1, unitPrice: 1000 });
    expect(tax.regimeCode).toBe('PLATEFORME_NUMERIQUE');
    expect(tax.rasRate).toBe(0.10);
  });

  it('plafonne la taxe sur les transactions électroniques à 200 MRU', () => {
    expect(TaxService.electronicTransactionTax(100000, 'mobile_money')).toBe(100);
    expect(TaxService.electronicTransactionTax(5000000, 'virement')).toBe(200);
    expect(TaxService.electronicTransactionTax(100000, 'especes')).toBe(0);
  });

  it('bloque la déductibilité sans NIF valide ou avec espèces au-delà du plafond', () => {
    expect(SupplierNifValidationService.validate('MR12345678').valid).toBe(true);
    expect(SupplierNifValidationService.validate('123').issue).toBe('INVALID_NIF');
    expect(SupplierNifValidationService.validate('MR12345678', 'inactive').issue).toBe('INACTIVE_NIF');

    const res = TaxService.checkDeductibility({
      supplierNif: 'MR12345678',
      supplierNifStatus: 'active',
      amount: 600000,
      paymentMethod: 'especes',
      hasNormalizedInvoice: false,
    });
    expect(res.deductible).toBe(false);
    expect(res.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(['CASH_ABOVE_CEILING', 'MISSING_NORMALIZED_INVOICE']),
    );
  });
});
