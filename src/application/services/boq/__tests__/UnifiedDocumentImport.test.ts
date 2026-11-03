import { describe, expect, it, vi } from 'vitest';
import { UnifiedBoqParser } from '../UnifiedBoqParser';
import { TechnicalPlanService } from '../TechnicalPlanService';
import { BoqManualLineTransformer } from '@/dtos/transforms/BoqManualLineTransformer';

describe('Single document import source routing', () => {
  it('routes a MIME-only PDF without table rows to the plan reader and requires review', async () => {
    const plans = new TechnicalPlanService({ read: vi.fn().mockResolvedValue([{ page: 1, text: 'Lng1 20x60 cm', source: 'text', confidence: 100 }]) });
    const archive = vi.spyOn(plans, 'archive').mockResolvedValue('document-1');
    const parser = new UnifiedBoqParser({ parseFile: vi.fn().mockResolvedValue({ rows: [], columns: [], warnings: [] }) }, plans);
    const file = new File(['drawing'], 'drawing', { type: 'application/pdf' });
    const parsed = await parser.parse(file);
    expect(parsed.format).toBe('plan');
    expect(parser.toMeterInputs(parsed, {}, { source: 'dqe', contextId: 'project' })).toEqual([]);
    const element = parsed.technicalPlan?.elements[0];
    if (!element) throw new Error('Expected detected section');
    await expect(parser.reviewPlan(parsed, [{ ...element, confirmed: true }], file, { source: 'dqe', contextId: 'project' })).rejects.toThrow('Missing length');
    expect(archive).not.toHaveBeenCalled();
    const lines = await parser.reviewPlan(parsed, [{ ...element, length: 5, confirmed: true }], file, { source: 'dqe', contextId: 'project' });
    expect(lines[0].quantity).toBeCloseTo(0.6);
    expect(lines[0].metadata?.provenance).toMatchObject({ fileName: 'drawing', documentId: 'document-1', format: 'plan' });
  });
  it('keeps tabular PDF and JSON on the same canonical quantity pipeline without OCR', async () => {
    const plans = new TechnicalPlanService({ read: vi.fn() });
    const parsePlan = vi.spyOn(plans, 'parse');
    const parser = new UnifiedBoqParser({ parseFile: vi.fn().mockResolvedValue({ columns: ['Designation', 'Qty', 'Unit', 'PU'], rows: [{ raw: { Designation: 'Mur', Qty: 82, Unit: 'm²', PU: 2000 } }], warnings: [] }) }, plans);
    for (const name of ['dqe.pdf', 'dqe.json', 'dqe.csv', 'dqe.xlsx', 'dqe.xls']) {
      const file = new File(['table'], name);
      const lines = await parser.parseAndMeter(file, { source: 'dqe', contextId: 'project' });
      expect(lines[0].quantity).toBe(82);
      expect(lines[0].metadata?.provenance).toMatchObject({ fileName: file.name });
    }
    expect(parsePlan).not.toHaveBeenCalled();
  });

  it('routes detected manual geometry through the shared calculator with one opening deduction', () => {
    const input = BoqManualLineTransformer.formToMeterInput({
      designation: 'Mur maçonnerie', length: 5, height: 4, unit: 'm²', quantity: 0,
      openings: [{ width: 0.9, height: 2.1 }], sourceType: 'avance',
    }, { source: 'dqe', contextId: 'project', documentId: 'dqe-1' });
    const lines = UnifiedBoqParser.fromManual([input]);
    expect(lines[0].quantity).toBeCloseTo(18.11);
    expect(lines[0].documentId).toBe('dqe-1');
    expect(lines[0].metadata?.metering).toMatchObject({ grossQuantity: 20, netQuantity: 18.11 });
    expect(lines[0].metadata?.provenance).toMatchObject({ format: 'calculator' });
  });

  it('preserves manually entered quantities instead of replacing them with geometry', () => {
    const [line] = UnifiedBoqParser.fromManual([{
      source: 'dqe', contextId: 'project', designation: 'Mur', elementType: 'masonry_wall',
      unit: 'm²', quantity: 82, length: 5, height: 4, sourceType: 'rapide',
    }]);
    expect(line.quantity).toBe(82);
    expect(line.metadata?.provenance).toMatchObject({ format: 'manual' });
  });
});