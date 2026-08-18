/**
 * T-DQE-01 → T-DQE-06 : import de l'Expression de Besoin (EDB) JSON
 * Projet Boucle 33 kV Kaédi-Sélibabi (Lot 2).
 */
import { describe, expect, it } from 'vitest';
import edb from './fixtures/edb_boucle33kv_lot2.json';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { JsonBoqParser, checkEdbCoherence, type EdbPayload } from '../parsers/JsonBoqParser';

const payload = edb as unknown as EdbPayload;

describe('EDB JSON import (Lot 2)', () => {
  it('T-DQE-01 — parse le fichier EDB sans erreur de format', () => {
    const res = JsonBoqParser.fromPayload(payload);
    expect(res.rows.length).toBe(14);
    expect(res.columns).toContain('Désignation');
    expect(res.edb?.metadata?.projectId).toBe('45bcdfdc-118e-4abc-9d2a-463c41977bf9');
  });

  it('mappe les colonnes EDB vers les champs canoniques et calcule les totaux HT', () => {
    const res = JsonBoqParser.fromPayload(payload);
    const mapping = BoqImportOrchestrator.autoMap(res.columns);
    expect(mapping.designation).toBe('Désignation');
    expect(mapping.unit).toBe('Unité');
    expect(mapping.quantity).toBe('Quantité');
    expect(mapping.unitPrice).toBe('PU');
    // « Lot » alimente désormais la catégorie/metadata (phaseId reste un UUID DB).
    expect(mapping.lot).toBe('Lot');

    const dtos = BoqImportOrchestrator.toDtos(res.rows, mapping, {
      source: 'dqe',
      contextId: String(payload.metadata?.projectId),
    });
    expect(dtos).toHaveLength(14);
    const first = dtos[0];
    expect(first.unitPrice).toBe(200);
    expect(first.totalHt).toBe(120_000);
    expect(first.category).toBe('L1');
    expect(first.metadata).toMatchObject({ lot: 'L1', fiscalBlock: 'material' });

    // 13 lignes sur 14 sont cohérentes (quantité × PU = montant).
    const items = (payload.lots ?? []).flatMap((l) => l.items ?? []);
    const coherent = items.filter((i) => Math.abs((i.quantity ?? 0) * (i.unitPriceMRU ?? 0) - (i.totalMRU ?? 0)) <= 1);
    expect(coherent).toHaveLength(13);
    // Le montant du document fait foi (fidélité à la source) : le total importé
    // égale le total EDB, l'incohérence étant remontée en avertissement.
    const sumSource = items.reduce((s, i) => s + (i.totalMRU ?? 0), 0);
    const sumDtos = dtos.reduce((s, d) => s + (d.totalHt ?? 0), 0);
    expect(sumDtos).toBe(sumSource);
    expect(sumDtos).toBe(2_079_505);

    // La ligne « Accessoires de finition » (unité %) est signalée par le contrôle de cohérence.
    expect(checkEdbCoherence(payload).some((w) => w.includes('Accessoires de finition'))).toBe(true);
  });

  it('T-DQE-02/03 — expose 6 phases (L1→L5 + HANDOVER) et les jalons J5→J11', () => {
    expect((payload.phases ?? []).map((p) => p.code)).toEqual([
      'EXECUTION_L1', 'EXECUTION_L2', 'EXECUTION_L3', 'EXECUTION_L4', 'EXECUTION_L5', 'HANDOVER',
    ]);
    expect((payload.milestones ?? []).length).toBeGreaterThanOrEqual(6);
    for (const m of payload.milestones ?? []) {
      expect((payload.phases ?? []).some((p) => p.code === m.phaseId || p.id === m.phaseId)).toBe(true);
    }
  });

  it('T-DQE-04 — détecte l’incohérence du reste à réaliser (lots vs métadonnées)', () => {
    const warnings = checkEdbCoherence(payload);
    const lotsRemaining = (payload.lots ?? []).reduce((s, l) => s + (l.remainingAmountMRU ?? 0), 0);
    expect(lotsRemaining).toBe(2_079_505);
    expect(payload.metadata?.remainingBudgetMRU).toBe(1_790_480);
    expect(warnings.some((w) => w.includes('Incohérence budget'))).toBe(true);
  });

  it('T-DQE-04b — les phases tiennent dans la fenêtre de planning restante', () => {
    const warnings = checkEdbCoherence(payload);
    expect(warnings.some((w) => w.includes('au-delà de la fin projet'))).toBe(false);
  });

  it('T-DQE-05 — deux appels d’offres en brouillon pour L4 et L5', () => {
    const tenders = payload.tenders ?? [];
    expect(tenders).toHaveLength(2);
    for (const t of tenders) {
      expect(t.status).toBe('draft');
      expect(Array.isArray(t.documents)).toBe(true);
    }
  });

  it('T-DQE-06 — indicateurs EVM cohérents (SPI/CPI/ETC)', () => {
    const ind = (payload.indicators ?? {}) as Record<string, number>;
    expect(ind.cpi).toBeCloseTo(ind.earnedValue / ind.actualCost, 2);
    expect(ind.etc).toBe(payload.metadata?.remainingBudgetMRU);
    expect(ind.spi).toBeGreaterThan(1);
  });
});
