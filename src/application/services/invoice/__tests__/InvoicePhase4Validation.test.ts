/**
 * Phase 4 — Suite de validation automatisée T‑V‑01 → T‑V‑18.
 *
 * Groupes A/B (gestionnaire, chaîne documentaire), C (Factur-X / PDF),
 * D (dispatch + barre d'actions), E (scénario fournisseur),
 * F (appels d'offres, verrous, alertes).
 *
 * Le dépôt BOQ est simulé : la chaîne testée est celle des moteurs métier
 * (référentiels + services purs), sans dépendance réseau.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

// --- Dépôt BOQ simulé (persistance en mémoire) -----------------------------
const store: BoqLineDTO[] = [];
vi.mock('@/infrastructure/adapters/supabase/SupabaseBoqRepository', () => ({
  boqRepository: {
    list: vi.fn(async () => [...store]),
    bulkCreate: vi.fn(async (dtos: BoqLineDTO[]) => {
      const saved = dtos.map((d, i) => ({ ...d, id: `line-${store.length + i + 1}` }));
      store.push(...saved);
      return saved;
    }),
    update: vi.fn(async (id: string, dto: Partial<BoqLineDTO>) => ({ ...(dto as BoqLineDTO), id })),
    updateStatus: vi.fn(async () => undefined),
  },
}));

import { InvoiceWorkflowService } from '../InvoiceWorkflowService';
import { InvoiceBudgetGuardService } from '../InvoiceBudgetGuardService';
import { InvoiceDeviationService } from '../InvoiceDeviationService';
import { FacturXTransformer } from '../FacturXTransformer';
import { BoqValidatorService } from '@/application/services/boq/BoqValidatorService';
import { reconcileLinePrice } from '@/application/services/boq/parsers/priceCoherence';
import {
  getInvoiceDocumentType,
  getInvoiceTypeByDqeType,
  invoiceTypesForActor,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import {
  SAMPLE_DQE_BOUCLE_33KV,
  SAMPLE_DQE_VAT_RATE,
  sampleDqeBoqLines,
} from '@/config/referentials/invoices/sample-dqe-boucle33kv.referential';

const CTX = 'ctx-boucle-33kv';
const seller = { name: 'HadraTech SARL', country: 'MR', taxId: '00012345' };
const buyer = { name: 'SOMELEC', country: 'MR' };

beforeEach(() => {
  store.length = 0;
  vi.clearAllMocks();
});

/** Chaîne complète DQE → … → type demandé, en repartant du jeu « Boucle 33 kV ». */
async function chainTo(target: 'devis' | 'contrat' | 'decompte' | 'facture', percentage = 30) {
  // Le document source doit porter son statut de validation métier :
  // un devis ne naît que d'un DQE validé, un contrat que d'un devis accepté.
  const validated = (rows: typeof lines, type: 'dqe' | 'devis' | 'contrat' | 'decompte') =>
    rows.map((l) => ({
      ...l,
      businessStatus: InvoiceWorkflowService.definition(type).validationStatus,
    }));
  let lines = sampleDqeBoqLines(CTX);
  let from: 'dqe' | 'devis' | 'contrat' | 'decompte' = 'dqe';
  const steps: Array<Awaited<ReturnType<typeof InvoiceWorkflowService.transform>>> = [];
  const order = ['devis', 'contrat', 'decompte', 'facture'] as const;

  for (const step of order) {
    const res = await InvoiceWorkflowService.transform({
      fromType: from,
      lines: validated(lines, from),
      sourceContextId: CTX,
      targetSource: 'dqe',
      percentage: step === 'decompte' ? percentage : undefined,
      actor: 'manager',
    });
    steps.push(res);
    lines = res.lines;
    if (step === target) break;
    from = step as typeof from;
  }
  return { steps, last: steps[steps.length - 1], lines };
}

// ===========================================================================
describe('Groupe A — chaîne gestionnaire (T‑V‑01 → T‑V‑03)', () => {
  it('T‑V‑01 — le jeu « Boucle 33 kV » est importable et validable (14 lignes, TVA 16 %)', () => {
    const lines = sampleDqeBoqLines(CTX);
    expect(SAMPLE_DQE_BOUCLE_33KV).toHaveLength(14);
    expect(lines).toHaveLength(14);
    expect(SAMPLE_DQE_VAT_RATE).toBe(0.16);

    for (const l of lines) {
      expect(l.contextId).toBe(CTX);
      expect(l.designation?.length).toBeGreaterThan(0);
      expect(String(l.unit ?? '').length).toBeGreaterThan(0);
      expect(Number(l.quantity ?? 0)).toBeGreaterThan(0);
    }

    // Le validateur BOQ n'accepte que les unités canoniques du référentiel.
    expect(BoqValidatorService.validate({ unit: 'm³', unitPrice: 1 }).errors.some((e) => e.field === 'unit')).toBe(false);
    expect(BoqValidatorService.validate({ unit: 'unite-inconnue', unitPrice: 1 }).errors.some((e) => e.field === 'unit')).toBe(true);
  });


  it('T‑V‑01b — l’auto-correction du P.U. rétablit Quantité × P.U. = Montant', () => {
    const fixed = reconcileLinePrice({ quantity: 4, unitPrice: 100, totalHt: 1000 });
    expect(fixed.corrected).toBe(true);
    expect(fixed.unitPrice).toBeCloseTo(250, 6);
    expect(fixed.totalHt).toBe(1000);
  });

  it('T‑V‑02 — DQE → Devis : lignes clonées, brouillon, TypeCode 310', async () => {
    const { last } = await chainTo('devis');
    expect(last.documentType).toBe('devis');
    expect(last.facturxTypeCode).toBe('310');
    expect(last.status).toBe(getInvoiceDocumentType('devis').initialStatus);
    expect(last.lines).toHaveLength(14);
    expect(last.totalHt).toBeGreaterThan(0);
    expect(last.lines.every((l) => l.documentId === last.documentId)).toBe(true);
  });

  it('T‑V‑03 — Devis → Contrat : statut « signe », montant conservé', async () => {
    const { steps } = await chainTo('contrat');
    const devis = steps[0];
    const contrat = steps[1];
    expect(contrat.documentType).toBe('contrat');
    expect(contrat.status).toBe('signe');
    expect(contrat.totalHt).toBeCloseTo(devis.totalHt, 2);
  });
});

// ===========================================================================
describe('Groupe B — décompte et facture (T‑V‑04 → T‑V‑05)', () => {
  it('T‑V‑04 — Contrat → Décompte 30 % : proratisation fidèle des montants', async () => {
    const { steps, last } = await chainTo('decompte', 30);
    const contrat = steps[1];
    expect(last.documentType).toBe('decompte');
    expect(last.status).toBe('demande');
    expect(last.totalHt).toBeCloseTo(contrat.totalHt * 0.3, 0);
    expect(last.lines.every((l) => l.billedPercentage === 30)).toBe(true);
    expect(last.lines.every((l) => l.documentType === 'decompte')).toBe(true);
  });

  it('T‑V‑04b — un pourcentage invalide retombe sur 100 % et reste borné', async () => {
    const a = await InvoiceWorkflowService.transform({
      fromType: 'contrat',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: CTX,
      percentage: 0,
      actor: 'manager',
    });
    const b = await InvoiceWorkflowService.transform({
      fromType: 'contrat',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: CTX,
      percentage: 250,
      actor: 'manager',
    });
    expect(a.lines[0].billedPercentage).toBe(100);
    expect(b.lines[0].billedPercentage).toBe(100);
  });

  it('T‑V‑05 — Décompte → Facture finale : TypeCode 380, étape terminale', async () => {
    const { last } = await chainTo('facture', 30);
    expect(last.documentType).toBe('facture');
    expect(last.facturxTypeCode).toBe('380');
    expect(last.status).toBe('emise');
    expect(InvoiceWorkflowService.nextType('facture')).toBeNull();
  });
});

// ===========================================================================
describe('Groupe C — Factur-X et PDF (T‑V‑06 → T‑V‑07)', () => {
  it('T‑V‑06 — XML CII conforme : TypeCode, devise, parties, totaux', async () => {
    const { last } = await chainTo('facture', 30);
    const xml = FacturXTransformer.toCiiXml(last.lines, {
      documentType: 'facture',
      reference: 'FAC-2026-0001',
      seller,
      buyer,
    });
    expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
    expect(xml).toContain('FAC-2026-0001');
    expect(xml).toContain('SOMELEC');
    expect(xml).toContain('HadraTech SARL');
    expect(xml.startsWith('<?xml')).toBe(true);
  });

  it('T‑V‑06b — le décompte porte le TypeCode 310 et la mention d’avancement', async () => {
    const { last } = await chainTo('decompte', 30);
    const xml = FacturXTransformer.toCiiXml(last.lines, {
      documentType: 'decompte',
      reference: 'DEC-2026-0001',
      seller,
      buyer,
      percentage: 30,
    });
    expect(xml).toContain('<ram:TypeCode>310</ram:TypeCode>');
    expect(xml).toMatch(/30/);
  });

  it('T‑V‑07 — totaux HT / TVA / TTC cohérents avec le profil fiscal', async () => {
    const { last } = await chainTo('facture', 100);
    const totals = FacturXTransformer.computeTotals(last.lines);
    expect(totals.totalHt).toBeGreaterThan(0);
    expect(totals.totalTtc).toBeGreaterThanOrEqual(totals.totalHt);
    expect(totals.totalTva).toBeCloseTo(totals.totalTtc - totals.totalHt, 1);
    expect(totals.netToPay).toBeCloseTo(totals.totalTtc - totals.withholding, 1);
  });
});

// ===========================================================================
describe('Groupe D — dispatch et barre d’actions (T‑V‑08 → T‑V‑09)', () => {
  it('T‑V‑08 — les lignes émises portent les attributs nécessaires au dispatch', async () => {
    const { last } = await chainTo('decompte', 50);
    for (const l of last.lines) {
      expect(l.contextId).toBe(CTX);
      expect(l.unit).toBeTruthy();
      expect(Number(l.quantity ?? 0)).toBeGreaterThan(0);
      expect(l.documentId).toBe(last.documentId);
      expect((l.metadata as Record<string, unknown> | undefined)?.invoiceWorkflow).toBeTruthy();
    }
  });

  it('T‑V‑09 — la barre d’actions se déduit du référentiel (libellé + étape suivante)', () => {
    expect(getInvoiceDocumentType('dqe').nextActionLabel).toBe('Transformer en devis');
    expect(getInvoiceDocumentType('contrat').nextActionLabel).toBe('Émettre un décompte');
    expect(getInvoiceDocumentType('decompte').requiresPercentage).toBe(true);
    expect(getInvoiceDocumentType('facture').nextActionLabel).toBeUndefined();
    expect(getInvoiceTypeByDqeType('contrat').code).toBe('contrat');
  });
});

// ===========================================================================
describe('Groupe E — scénario fournisseur (T‑V‑10 → T‑V‑13)', () => {
  it('T‑V‑10 — le fournisseur ne peut pas produire de DQE', () => {
    expect(InvoiceWorkflowService.canActorProduce('dqe', 'supplier')).toBe(false);
    expect(invoiceTypesForActor('supplier').map((d) => d.code)).not.toContain('dqe');
  });

  it('T‑V‑11 — le fournisseur produit un devis tracé à son nom', async () => {
    const res = await InvoiceWorkflowService.transform({
      fromType: 'dqe',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: CTX,
      actor: 'supplier',
      reference: 'DEV-FOURN-01',
    });
    const wf = res.lines[0].metadata as { invoiceWorkflow?: Record<string, unknown> };
    expect(wf.invoiceWorkflow?.actor).toBe('supplier');
    expect(wf.invoiceWorkflow?.reference).toBe('DEV-FOURN-01');
    expect(res.documentType).toBe('devis');
  });

  it('T‑V‑12 — le fournisseur peut émettre décompte et facture', () => {
    expect(InvoiceWorkflowService.canActorProduce('decompte', 'supplier')).toBe(true);
    expect(InvoiceWorkflowService.canActorProduce('facture', 'supplier')).toBe(true);
  });

  it('T‑V‑13 — les statuts fournisseur restent bornés par le référentiel', () => {
    expect(InvoiceWorkflowService.transitionStatus('devis', 'accepte')).toBe('accepte');
    expect(InvoiceWorkflowService.transitionStatus('devis', 'payee')).toBe('brouillon');
    expect(InvoiceWorkflowService.transitionStatus('decompte', 'paye')).toBe('paye');
  });
});

// ===========================================================================
describe('Groupe F — appels d’offres, verrous et alertes (T‑V‑14 → T‑V‑18)', () => {
  it('T‑V‑14 — une estimation d’appel d’offres se transforme en devis sur son contexte', async () => {
    const res = await InvoiceWorkflowService.transform({
      fromType: 'dqe',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: 'tender-001',
      targetSource: 'tender_estimate',
      targetContextId: 'tender-001',
      tenderId: 'tender-001',
      actor: 'manager',
    });
    expect(res.lines.every((l) => l.source === 'tender_estimate')).toBe(true);
    expect(res.lines.every((l) => l.contextId === 'tender-001')).toBe(true);
  });

  it('T‑V‑15 — le devis reste possible même hors plafond (étape non engageante)', async () => {
    const res = await InvoiceWorkflowService.transform({
      fromType: 'dqe',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: CTX,
      projectBudget: 1,
      actor: 'manager',
    });
    expect(res.documentType).toBe('devis');
    expect(res.budget?.allowed).toBe(true);
  });

  it('T‑V‑16 — le verrou budgétaire bloque un décompte au-delà du plafond', async () => {
    await expect(
      InvoiceWorkflowService.transform({
        fromType: 'contrat',
        lines: sampleDqeBoqLines(CTX),
        sourceContextId: CTX,
        percentage: 100,
        projectBudget: 1_000,
        actor: 'manager',
      }),
    ).rejects.toThrow();
    expect(store).toHaveLength(0); // aucune ligne persistée quand l'émission est refusée
  });

  it('T‑V‑17 — un décompte dans l’enveloppe est accepté et renvoie un verdict', async () => {
    const total = InvoiceBudgetGuardService.totalHt(sampleDqeBoqLines(CTX));
    const res = await InvoiceWorkflowService.transform({
      fromType: 'contrat',
      lines: sampleDqeBoqLines(CTX),
      sourceContextId: CTX,
      percentage: 30,
      projectBudget: total * 2,
      actor: 'manager',
    });
    expect(res.budget?.allowed).toBe(true);
    expect(res.budget?.ceiling).toBeCloseTo(total * 2, 0);
    expect(store.length).toBe(14);
  });

  it('T‑V‑18 — les alertes d’écart remontent via le DeviationEngine', async () => {
    const total = InvoiceBudgetGuardService.totalHt(sampleDqeBoqLines(CTX));
    const { last } = await chainTo('decompte', 30);
    const report = InvoiceDeviationService.analyze({
      plannedBudget: total,
      invoicedLines: last.lines,
      actualProgress: 5,
    });
    expect(report.billedProgress).toBeGreaterThan(0);
    expect(report.deviations.length).toBeGreaterThan(0);
    expect(['info', 'low', 'medium', 'high']).toContain(report.maxSeverity);
    expect(typeof report.requiresEscalation).toBe('boolean');
  });
});
