/**
 * Import réel « DQE PPGASDL ASSABA LOT 1 » — classeur multi-feuilles
 * (Résumé & En-tête / Détail des Postes / Conditions & Validation).
 *
 * Vérifie la chaîne complète : parsing multi-feuilles → métadonnées documentaires
 * → auto-mapping (dont TVA et régime fiscal par ligne) → DTO → assistance
 * (rattachement catalogue / RH / projet + diagnostics).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BoqImportAssistService } from '../BoqImportAssistService';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { SpreadsheetBoqParser } from '../parsers/SpreadsheetBoqParser';

const XLSX_PATH = join(__dirname, 'fixtures/dqe_ppgasdl_assaba_lot1.xlsx');

function loadFile(): File {
  const buf = readFileSync(XLSX_PATH);
  return new File([new Uint8Array(buf)], 'DQE_PPGASDL_Assaba_Lot1.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('Import DQE PPGASDL Assaba Lot 1', () => {
  it('lit la feuille de postes et les métadonnées documentaires', async () => {
    const parsed = await new SpreadsheetBoqParser().parse(loadFile());

    expect(parsed.sheetName).toBe('Détail des Postes');
    expect(parsed.rows).toHaveLength(10);
    expect(parsed.documentMeta?.reference).toBe('DQE-2026-0826-PPGASDL1');
    expect(parsed.documentMeta?.typeCode).toBe('310');
    expect(parsed.documentMeta?.currency).toBe('MRU');
    expect(parsed.documentMeta?.projectTitle).toBe('PPGASDL ASSABA LOT 1');
    expect(parsed.documentMeta?.projectReference).toContain('CPMP');
    expect(parsed.documentMeta?.projectBudget).toBeCloseTo(75389515.95, 2);
    expect(parsed.parties?.supplier?.taxId).toBe('DGEER-MRU-987654');
    expect(parsed.parties?.organization?.taxId).toBe('MEF-MRU-456123');
    expect(parsed.detectedFiscal?.vatRate).toBeCloseTo(0.05, 4);
  });

  it('mappe TVA et régime fiscal par ligne et classe les ressources', async () => {
    const parsed = await new SpreadsheetBoqParser().parse(loadFile());
    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    expect(mapping.vatRate).toBe('TVA (%)');
    expect(mapping.regime).toBe('Régime fiscal');

    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, { source: 'dqe', contextId: 'p1' });
    expect(dtos).toHaveLength(10);
    expect(dtos.every((d) => d.vatRate === 0.05)).toBe(true);
    // Colonne « Total HT » vide (formules sans valeur en cache) → reconstruite Qté × PU.
    expect(dtos.reduce((s, d) => s + (d.totalHt ?? 0), 0)).toBeCloseTo(35810000, 2);


    const labour = dtos.filter((d) => d.resourceType === 'labor');
    expect(labour.map((d) => d.designation)).toEqual(
      expect.arrayContaining([expect.stringMatching(/Technicien Sup/i), expect.stringMatching(/Chef d'équipe/i)]),
    );
    // La grue en forfait est du matériel loué, jamais des RH.
    const grue = dtos.find((d) => /grue/i.test(d.designation));
    expect(grue?.resourceType).toBe('equipment');
  });

  it('assiste l’utilisateur : rattachements catalogue / RH / projet et diagnostics', async () => {
    const parsed = await new SpreadsheetBoqParser().parse(loadFile());
    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, { source: 'dqe', contextId: 'p1' });

    const result = BoqImportAssistService.assist(
      dtos,
      {
        materials: [
          { id: 'mat-1', name: 'Poteau béton 12m 200 daN', unit: 'unité', pricePerUnit: 44000 },
          { id: 'mat-2', name: 'Transformateur 100 kVA H61', unit: 'unité', pricePerUnit: 440000 },
        ],
        employees: [{ id: 'emp-1', full_name: 'Ahmed Salem', position: 'Technicien Supérieur Électricité' }],
        suppliers: [{ id: 'sup-1', name: 'DGEER' }],
        organizations: [{ id: 'org-1', name: "Ministère de l'Économie et des Finances" }],
        projects: [{ id: 'prj-1', title: 'PPGASDL ASSABA LOT 1', projectReference: '0504/T/009/CPMP/EP-MI/DGEER/20' }],
        phases: [],
      },
      { documentMeta: parsed.documentMeta, parties: parsed.parties },
    );

    expect(result.resolved.projectId).toBe('prj-1');
    expect(result.resolved.organizationId).toBe('org-1');
    expect(result.resolved.currency).toBe('MRU');
    expect(result.summary.matchedMaterials).toBeGreaterThanOrEqual(2);
    expect(result.lines.find((l) => /Poteau b[eé]ton/i.test(l.designation))?.materialId).toBe('mat-1');
    // Les lignes non catalogues remontent en information, pas en erreur bloquante.
    expect(result.summary.errors).toBe(0);
    expect(result.diagnostics.some((d) => d.code === 'MATERIAL_NOT_IN_CATALOG')).toBe(true);
    expect(result.diagnostics.some((d) => d.code === 'PROJECT_MATCHED')).toBe(true);
  });
});
