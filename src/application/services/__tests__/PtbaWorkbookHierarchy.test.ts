import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PlanningWorkbookReader } from '@/infrastructure/parsers/PlanningWorkbookReader';
import { ProjectImportTemplateService } from '../ProjectImportTemplateService';
import { DEFAULT_WORKBOOK_MAPPING } from '@/config/referentials/projects/planning-import.referential';

const service = new ProjectImportTemplateService();
const buffer = readFileSync(resolve(__dirname, 'fixtures/ptba-sample.xlsx'));
const source = PlanningWorkbookReader.fromBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'ptba-sample.xlsx');
const defaults = service.suggestWorkbookDefaults(source);
const preview = service.previewWorkbook({ source, title: defaults.title ?? '', reference: 'PTBA-2024', startDate: '2024-01-01', currency: 'MRU', budget: defaults.budget ?? 0, referentialCode: 'CUSTOM_STANDARD', mapping: { ...DEFAULT_WORKBOOK_MAPPING, amountMultiplier: defaults.amountMultiplier ?? 1 } });
const phase = (sheet: string) => preview.project.phases!.find(item => item.code === sheet)!;

describe('PTBA workbook hierarchy (Composante → Sous-composante → Activité)', () => {
  it('suggests title, thousands scale and budget from the recap sheet', () => {
    expect(defaults.title).toBe('PRAPS-II MAURITANIE IDA D0796 MR / IDA 7180');
    expect(defaults.amountMultiplier).toBe(1000);
  });
  it('maps each component sheet to one phase and skips the recap sheet', () => {
    expect(preview.project.phases!.map(item => item.code)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(phase('C1').name).toMatch(/^Composante 1/);
  });
  it('maps sub-components to milestones and activities to tasks in C1', () => {
    expect(phase('C1').milestones!.map(item => item.metadata?.planningSource)).toEqual([{ sheet: 'C1', code: '1.1' }, { sheet: 'C1', code: '1.2' }, { sheet: 'C1', code: '1.3' }]);
    expect(phase('C1').tasks!.length).toBeGreaterThanOrEqual(20);
    const task = phase('C1').tasks!.find(item => item.metadata?.planningSource && (item.metadata.planningSource as { code: string }).code === '1.1.1.1')!;
    expect(task.metadata!.planningSource).toMatchObject({ quantity: 1, sourceAmount: 1000, plannedAmount: 1_000_000, subComponent: { code: '1.1' }, financingSources: [{ source: 'IDA', amount: 1_000_000 }] });
  });
  it('rebuilds broken hierarchy from the code, not row order', () => {
    const task = phase('C4').tasks!.find(item => (item.metadata?.planningSource as { code: string }).code === '4.2.1.3')!;
    expect((task.metadata!.planningSource as { subComponent: { code: string } }).subComponent.code).toBe('4.2');
  });
  it('excludes sub-total rows and keeps per-source financing', () => {
    expect(preview.project.phases!.flatMap(item => item.tasks ?? []).some(task => /^total/i.test(task.title ?? ''))).toBe(false);
    const c2 = preview.summary.find(item => item.sheet === 'C2')!;
    expect(Object.keys(c2.financing)).toEqual(expect.arrayContaining(['IDA']));
    expect(c2.amount).toBeGreaterThan(0);
  });
});
