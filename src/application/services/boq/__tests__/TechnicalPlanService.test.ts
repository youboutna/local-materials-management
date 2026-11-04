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
describe('Joinery, site and roof drawings (review-first)', () => {
  const sheet = (text: string) => [{ page: 1, source: 'text' as const, confidence: 100, text: `Echelle : 1/100\n${text}` }];

  it('proposes one unconfirmed element per distinct joinery marker without summing repeats', () => {
    const plan = TechnicalPlanService.extract(sheet('Fen-101 Fen-101 Fen-101 Por-7 Xyz-9'), 'joinery.pdf', 'h');
    expect(plan.elements.map((e) => [e.ref, e.elementType, e.count, e.occurrences])).toEqual([
      ['Fen-101', 'window', 1, 3],
      ['Por-7', 'wooden_door', 1, 1],
    ]);
    expect(plan.elements.every((e) => !e.confirmed && e.length === undefined)).toBe(true);
    expect(plan.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['repeated_marker', 'marker_without_dimensions']));
  });

  it('keeps annotated floor areas as observations only', () => {
    const plan = TechnicalPlanService.extract(sheet('Surf. au sol :12,5 m2'), 'joinery.pdf', 'h');
    expect(plan.surfaces).toEqual([{ page: 1, rawLabel: 'Surf. au sol :12,5 m2', area: 12.5 }]);
    expect(plan.elements).toEqual([]);
  });

  it('reports unresolved dimensions for a title-block-only site or roof sheet', () => {
    const plan = TechnicalPlanService.extract(sheet('Planche : 01\nPhase: DE\nPlan masse'), 'site.pdf', 'h');
    expect(plan.elements).toEqual([]);
    expect(plan.cartouches[0]).toMatchObject({ scale: 100, planche: '01', phase: 'DE' });
    expect(plan.warnings.map((w) => w.code)).toContain('missing_dimensions');
  });

  it('confirmed plan elements yield the same BOQ quantities as manual entry', async () => {
    const { UnifiedBoqParser } = await import('../UnifiedBoqParser');
    const plan = TechnicalPlanService.extract(sheet('Fen-101'), 'joinery.pdf', 'h');
    const reviewed = [{ ...plan.elements[0], length: 1.2, confirmed: true }];
    const [fromPlan] = TechnicalPlanService.toMeterInputs(plan, reviewed, { source: 'dqe', contextId: 'p' });
    const [manual] = UnifiedBoqParser.fromManual([{ source: 'dqe', contextId: 'p', designation: 'Fen-101', elementType: 'window', unit: fromPlan.unit, length: 1.2, quantity: 0 }]);
    expect(fromPlan.quantity).toBe(manual.quantity);
    expect(fromPlan.unit).toBe(manual.unit);
    expect(fromPlan.provenance).toMatchObject({ format: 'plan', page: 1, fileSha256: 'h' });
  });
});
