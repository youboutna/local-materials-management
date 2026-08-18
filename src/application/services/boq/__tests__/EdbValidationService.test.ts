import { describe, expect, it } from 'vitest';
import edb from './fixtures/edb_boucle33kv_lot2.json';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { EdbValidationService } from '../EdbValidationService';
import { JsonBoqParser, type EdbPayload } from '../parsers/JsonBoqParser';

const payload = edb as unknown as EdbPayload;
const parsed = JsonBoqParser.fromPayload(payload);
const lines = BoqImportOrchestrator.toDtos(parsed.rows, BoqImportOrchestrator.autoMap(parsed.columns), {
  source: 'dqe',
  contextId: '45bcdfdc-118e-4abc-9d2a-463c41977bf9',
});

describe('EdbValidationService', () => {
  it('détecte la ligne L2 « Accessoires de finition » comme erreur bloquante', () => {
    const errors = EdbValidationService.collectLineErrors(payload);
    expect(errors).toHaveLength(1);
    expect(errors[0].designation).toContain('Accessoires');
    expect(errors[0].suggestedFix).toEqual({ unit: 'forfait', quantity: 1, unitPrice: 90_000 });
  });

  it('produit un rapport bloqué + écart budgétaire chiffré', () => {
    const report = EdbValidationService.buildReport(payload, lines, 1_790_480);
    expect(report.status).toBe('BLOCKED_BY_ERRORS');
    expect(report.budgetDiscrepancy).toMatchObject({
      projectBudget: 1_790_480,
      dqeTotal: 2_079_505,
      difference: 289_025,
    });
    expect(report.budgetDiscrepancy?.percentage).toBeCloseTo(16.14, 1);
  });

  it('corrige les lignes fautives puis passe en attente de décision', () => {
    const fixed = EdbValidationService.applyLineFixes(lines, EdbValidationService.collectLineErrors(payload));
    const target = fixed.find((l) => l.designation.includes('Accessoires'));
    expect(target?.unit).toBe('forfait');
    expect(target?.quantity).toBe(1);
    expect(target?.totalHt).toBe(90_000);
  });

  it('option A réévalue le budget, option B réduit le DQE, option C trace l’écart', () => {
    const report = EdbValidationService.buildReport(payload, lines, 1_790_480);
    const a = EdbValidationService.applyDecision(lines, report, 'ADJUST_PROJECT_BUDGET');
    expect(a.newProjectBudget).toBe(2_079_505);

    const b = EdbValidationService.applyDecision(lines, report, 'ADJUST_DQE');
    const sumB = b.lines.reduce((s, l) => s + (l.totalHt ?? 0), 0);
    expect(sumB).toBeCloseTo(1_790_480, 0);

    const c = EdbValidationService.applyDecision(lines, report, 'KEEP_DISCREPANCY');
    expect(c.keepDiscrepancyAlert).toBe(true);
    expect(c.lines).toEqual(lines);
  });
});
