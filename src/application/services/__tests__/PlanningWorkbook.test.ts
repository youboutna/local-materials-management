import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { PlanningWorkbookReader } from '@/infrastructure/parsers/PlanningWorkbookReader';
import { ProjectImportTemplateService } from '../ProjectImportTemplateService';
import { DEFAULT_WORKBOOK_MAPPING, DEFAULT_PLANNING_MAPPING } from '@/config/referentials/projects/planning-import.referential';
import type { PlanningWorkbookInputDTO } from '@/dtos/entities/PlanningWorkbookDTO';

const service = new ProjectImportTemplateService();
function input(): PlanningWorkbookInputDTO {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    [null, 'Libellé', 'Responsable', 'Associés', 'Unité', 'Qté', 'PU', 'PT-MRU milliers'],
    ['3.1.1', 'Infrastructure'],
    ['3.1.1.3.2', 'Honoraire', 'UCP', 'DDFA/OP/OIS', 'mois', 30, 84.5666666666667, 837.2100000000005],
    ['3.1.1.3.3', 'Honoraire', null, null, 'mois', 30, 60, 360],
    [null, 'Mission sans code', null, null, 'mission', 1, 1500, 1500],
    [null, 'Total composante', null, null, null, null, null, 2697.21],
    ['3.1.1.4', 'Quantité forfait', null, null, 'unité', 'FF', 960, 960],
  ]);
  sheet.H3.f = 'F6*G3*0.33';
  sheet['!merges'] = [XLSX.utils.decode_range('B2:D2')];
  XLSX.utils.book_append_sheet(workbook, sheet, 'C3');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[null, 'Activités'], ['4-1-1-1-', 'Identification', 'UCP/INAP', 'Consultants', 'étude', 1, 1200, 1200]]), 'C4');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['COMPOSANTES', 'Total'], ['C3', 2697.21]]), ' RECAPCOMPOSANTE');
  return { source: { ...PlanningWorkbookReader.fromBuffer(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), 'example.xlsx'), narrative: 'Coût estimatif : 10 800 000 MRU' }, title: 'Programme', reference: 'PTBA-EXAMPLE', startDate: '2024-01-01', currency: 'MRU', referentialCode: 'CUSTOM_STANDARD', mapping: { ...DEFAULT_WORKBOOK_MAPPING, amountMultiplier: 1000 } };
}
describe('Controlled PTBA import, evidence preserved', () => {
  it('retains every sheet, raw formula, merged range and full narrative', () => {
    const source = input(); const preview = service.previewWorkbook(source);
    const saved = JSON.parse(JSON.stringify(preview.project.phases?.[0].metadata)).planningWorkbook;
    expect(saved).toEqual(source.source);
    expect(saved.sheets.map((sheet: { name: string }) => sheet.name)).toEqual(['C3', 'C4', ' RECAPCOMPOSANTE']);
    expect(saved.sheets[0].rows[2][7].formula).toBe('F6*G3*0.33');
    expect(saved.sheets[0].merges).toEqual(['B2:D2']);
    expect(saved.narrative).toBe('Coût estimatif : 10 800 000 MRU');
    expect(preview.project.description).toBe(source.source.narrative);
  });
  it('keeps documentary amount and scale without substituting quantity times price', () => {
    const preview = service.previewWorkbook(input());
    expect(preview.rows.find(row => row.code === '3.1.1.3.2')).toMatchObject({ sourceAmount: 837.2100000000005, amount: 837210.0000000005, quantity: 30 });
    expect(preview.warnings).toContainEqual({ code: 'arithmetic_difference', sheet: 'C3', row: 3 });
  });
  it('preserves duplicate labels as distinct stable source identities', () => {
    const a = service.previewWorkbook(input()); const b = service.previewWorkbook(input());
    const tasks = a.project.phases?.[0].tasks ?? [];
    expect(tasks.filter(task => task.title === 'Honoraire').map(task => task.id)).toEqual(['PTBA-EXAMPLE:C3:row:3', 'PTBA-EXAMPLE:C3:row:4']);
    expect(a.project.phases).toEqual(b.project.phases);
  });
  it('retains missing codes and totals as evidence, not extra tasks', () => {
    const preview = service.previewWorkbook(input());
    expect(preview.rows.find(row => row.title === 'Mission sans code')?.kind).toBe('unmapped');
    expect(preview.rows.find(row => row.title === 'Total composante')?.kind).toBe('unmapped');
    expect(preview.project.phases?.flatMap(phase => phase.tasks ?? []).some(task => task.title === 'Total composante')).toBe(false);
    expect(preview.warnings).toContainEqual({ code: 'missing_code', sheet: 'C3', row: 5 });
  });
  it('preserves text quantities, unresolved responsible labels and blank dates', () => {
    const preview = service.previewWorkbook(input());
    expect(preview.source.sheets[0].rows[6][5].value).toBe('FF');
    expect(preview.project.phases?.[0].tasks?.[0]).toMatchObject({ assigneeName: 'UCP', metadata: { planningSource: { associates: 'DDFA/OP/OIS', path: ['3', '1', '1', '3', '2'] } } });
    expect(preview.project.phases?.every(phase => phase.startDate === undefined && phase.endDate === undefined)).toBe(true);
    expect(preview.project.budget).toBeUndefined();
  });
  it('rejects an invalid monetary scale', () => {
    const source = input(); source.mapping.amountMultiplier = 0;
    expect(() => service.previewWorkbook(source)).toThrow('Invalid monetary scale');
  });
  it('extends project bounds to post-delivery work', () => {
    const preview = service.previewPlanning({ title: 'A', reference: 'A', startDate: '2026-01-01', currency: 'MRU', referentialCode: 'CUSTOM_STANDARD', mapping: DEFAULT_PLANNING_MAPPING, text: 'Travaux\tMission\tSemaine 1\tLivraison\nSuivi\tContrôle\tJ+1 à J+30\t' });
    expect(preview.project.phases?.[1].endDate).toBe('2026-02-06');
    expect(preview.project.endDate).toBe('2026-02-06');
  });
});