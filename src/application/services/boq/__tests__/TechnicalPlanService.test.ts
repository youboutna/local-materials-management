import { describe, expect, it } from 'vitest';
import { TechnicalPlanService } from '../TechnicalPlanService';

const page = { page: 1, source: 'ocr' as const, confidence: 95, text: 'Planche 04\nPhase DE\nDate Juin 2026\nEchelle 1/100\nP1 20x60 cm\nP2 20x30 cm\nP3 20x50 cm\nP4 20x40 cm' };

describe('Controlled technical plan bridge', () => {
  it('recognizes longrines and keeps repeated labels distinct from counts', () => {
    const plan = TechnicalPlanService.extract([{ ...page, text: 'P1 20x40\nP1 20x40\nLng1 20x60 cm' }], 'STR.pdf', 'hash');
    expect(plan.elements).toHaveLength(2);
    expect(plan.elements[0].elementType).toBe('concrete_column');
    expect(plan.elements[0].count).toBe(1);
    expect(plan.elements[1].elementType).toBe('concrete_beam');
    expect(plan.elements[1].height).toBe(0.6);
    expect(plan.warnings.filter((warning) => warning.code === 'ambiguous_unit')).toHaveLength(1);
  });
  it('extracts P1-P4 sections in metres but never confirms them automatically', () => {
    const plan = TechnicalPlanService.extract([page], 'STR.pdf', 'hash');
    expect(plan.elements).toHaveLength(4);
    expect(plan.elements[0].width).toBe(0.2);
    expect(plan.elements[0].height).toBe(0.6);
    expect(plan.elements.every((element) => !element.confirmed)).toBe(true);
    expect(TechnicalPlanService.toMeterInputs(plan, plan.elements, { source: 'dqe', contextId: 'p' })).toEqual([]);
  });
  it('requires a missing beam length before creating BOQ drafts', () => {
    const plan = TechnicalPlanService.extract([page], 'STR.pdf', 'hash');
    expect(() => TechnicalPlanService.toMeterInputs(plan, plan.elements.map((element) => ({ ...element, elementType: 'concrete_beam', confirmed: true })), { source: 'dqe', contextId: 'p' })).toThrow('Missing length');
  });
  it('uses the canonical meter with count and document provenance', () => {
    const plan = TechnicalPlanService.extract([page], 'STR.pdf', 'hash');
    const lines = TechnicalPlanService.toMeterInputs(plan, [{ ...plan.elements[0], elementType: 'concrete_beam', length: 5, count: 2, confirmed: true }], { source: 'dqe', contextId: 'p', phaseId: 'phase' }, 'doc');
    expect(lines[0].quantity).toBeCloseTo(1.2);
    expect(lines[0].phaseId).toBe('phase');
    expect(lines[0].provenance?.documentId).toBe('doc');
    expect(lines[0].provenance?.fileSha256).toBe('hash');
  });
  it('never interprets a section without an explicit unit', () => {
    const plan = TechnicalPlanService.extract([{ ...page, text: 'P1 20x60' }], 'STR.pdf', 'hash');
    expect(plan.warnings.some((warning) => warning.code === 'ambiguous_unit')).toBe(true);
    expect(plan.elements[0].width).toBeUndefined();
  });
  it('flags low confidence and missing scale', () => {
    const plan = TechnicalPlanService.extract([{ ...page, text: 'P1 20x60 cm', confidence: 79 }], 'STR.pdf', 'hash');
    expect(plan.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(['missing_scale', 'ocr_low_confidence']));
  });
  it('does not duplicate repeated page evidence', () => {
    const plan = TechnicalPlanService.extract([page, { ...page, page: 2 }], 'STR.pdf', 'hash');
    expect(plan.elements).toHaveLength(4);
    expect(plan.warnings.some((warning) => warning.code === 'duplicate_page')).toBe(true);
  });
});