/**
 * Test bout-en-bout sur le classeur réel « HADRATECH – DQE Ministère du Pétrole ».
 * Le fichier combine : en-tête administratif (client / prestataire), un taux de TVA
 * déclaré au-dessus du tableau, deux lots (LOT 1 = phases 1-2, LOT 2 = phase 3),
 * des lignes RH (Jour/Homme) et des lignes forfait/fournitures, puis un pied
 * fiscal (sous-total HT, TVA 16 %, frais généraux 4 %, total TTC).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { SpreadsheetBoqParser } from '../parsers/SpreadsheetBoqParser';

const XLSX_PATH = join(__dirname, 'fixtures/dqe_ministere_petrole.xlsx');

function loadFile(): File {
  const buf = readFileSync(XLSX_PATH);
  return new File([new Uint8Array(buf)], 'HADRATECH-DQE-ministere_petrole.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('XLSX réel DQE Ministère du Pétrole', () => {
  it('extrait en-tête, lots/phases, fiscalité et lignes valorisées', async () => {
    const parsed = await new SpreadsheetBoqParser().parse(loadFile());

    // En-tête administratif
    expect(parsed.parties?.organization?.name).toMatch(/Minist[eè]re de l.[ÉE]nergie/i);
    expect(parsed.parties?.supplier?.name).toMatch(/HADRAT/i);

    // Fiscalité : TVA 16 %, frais généraux 4 %, totaux du pied de devis.
    expect(parsed.detectedFiscal?.vatRate).toBeCloseTo(0.16, 4);
    expect(parsed.detectedFiscal?.totalHt).toBe(15000000);
    expect(parsed.detectedFiscal?.totalTtc).toBe(18000000);

    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, { source: 'dqe', contextId: 'p1' });

    // 24 postes valorisés (3 + 13 + 11 = 27 ? cf. fichier) — aucun montant perdu.
    expect(dtos.length).toBeGreaterThanOrEqual(24);
    expect(dtos.every((d) => (d.totalHt ?? 0) > 0)).toBe(true);
    expect(dtos.reduce((s, d) => s + (d.totalHt ?? 0), 0)).toBe(15000000);

    // Les lignes Jour/Homme sont de la main d'œuvre, les forfaits/unités non.
    const labour = dtos.filter((d) => d.resourceType === 'labor');
    expect(labour.length).toBeGreaterThanOrEqual(9);
    expect(labour.every((d) => /jour/i.test(d.unit ?? ''))).toBe(true);

    // Lots et phases issus des lignes de section.
    const lots = new Set(dtos.map((d) => (d.metadata as { lot?: string } | null)?.lot ?? null));
    expect(lots).toEqual(new Set(['L1', 'L2']));
    const phases = new Set(dtos.map((d) => d.phaseId).filter(Boolean));
    expect(phases.size).toBeGreaterThanOrEqual(3);

    // Un poste témoin conserve quantité / PU / montant.
    const architecte = dtos.find((d) => /Architecte Senior/i.test(d.designation));
    expect(architecte?.quantity).toBe(60);
    expect(architecte?.unitPrice).toBe(30000);
    expect(architecte?.totalHt).toBe(1800000);
  });
});
