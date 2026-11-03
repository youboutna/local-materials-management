import { describe, it, expect } from 'vitest';
import { ProjectImportTemplateService } from '../ProjectImportTemplateService';
import { MeterService } from '../boq/MeterService';

describe('PTBA template + chunked metering', () => {
  it('PTBA template is readable back by the PTBA importer', async () => {
    const svc = new ProjectImportTemplateService();
    const { content } = await svc.buildWorkbookTemplate('WORLD_BANK_PTBA');
    const file = new File([new Uint8Array(content)], 'modele.xlsx');
    const parsed = await svc.parseWithProfile(file, 'WORLD_BANK_PTBA', 'excel');
    expect(parsed.kind).toBe('hierarchical_workbook');
    const ds = svc.workbookToDataset(parsed as never, 'WORLD_BANK_PTBA', '2026-11-03') as any;
    const tasks = ds.projects[0].phases.flatMap((p: any) => p.tasks ?? []);
    expect(tasks.length).toBe(1);
  });
  it('chunked enrich equals one-shot enrich', async () => {
    const lines = Array.from({ length: 450 }, (_, i) => ({ designation: `Béton ${i}`, unit: 'm3', quantity: i + 1, unitPrice: 10 })) as any[];
    expect(await MeterService.enrichInChunks(lines, undefined, 100)).toEqual(MeterService.enrich(lines));
  });
});
