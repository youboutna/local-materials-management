/**
 * Test bout-en-bout sur le PDF réel « Expression de Besoins – Boucle 33 kV (v5) ».
 * v5 ajoute un bloc « Ressources Humaines & Expertises » avec son propre en-tête
 * (Rôle / Nb Jours / Taux Journalier / Total Base) et une fiscalité distincte
 * (TVA matériel 5 % vs TVA RH 16 % + traitement sur salaire 20 %).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
import { resolveDqeLot } from '@/config/referentials/dqe/dqe-dispatch.referential';

class Stub {}
for (const key of ['DOMMatrix', 'Path2D', 'ImageData'] as const) {
  if (!(key in globalThis)) (globalThis as Record<string, unknown>)[key] = Stub;
}

const PDF_PATH = join(__dirname, 'fixtures/edb_boucle33kv_v5.pdf');

function loadFile(): File {
  const buf = readFileSync(PDF_PATH);
  return new File([new Uint8Array(buf)], 'Expression_Besoin_Boucle_33kV_v5.pdf', { type: 'application/pdf' });
}

describe('PDF réel EDB Boucle 33 kV v5', () => {
  it('extrait en-tête, lignes matériel, lignes RH et fiscalité double', async () => {
    const parsed = await new PdfBoqParser().parse(loadFile());

    expect(parsed.parties?.supplier?.name).toMatch(/CEGELEC/i);
    expect(parsed.parties?.organization?.email).toBe('DGEER.director.01@gmail.com');

    // Fiscalité : matériel (5 %) séparée du bloc RH (16 % + 20 % de charges).
    expect(parsed.detectedFiscal?.totalHt).toBe(2079505);
    expect(parsed.detectedFiscal?.vatRate).toBeCloseTo(0.05, 4);
    expect(parsed.detectedFiscal?.laborTotalHt).toBe(6000000);
    expect(parsed.detectedFiscal?.laborVatRate).toBeCloseTo(0.16, 4);
    expect(parsed.detectedFiscal?.laborPayrollTaxRate).toBeCloseTo(0.2, 4);
    expect(parsed.detectedFiscal?.totalTtc).toBe(10535480);

    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, { source: 'dqe', contextId: 'p1' });

    // 14 lignes matériel (L1→L5) + 3 lignes RH.
    const material = dtos.filter((d) => d.resourceType !== 'labor');
    const labour = dtos.filter((d) => d.resourceType === 'labor');
    expect(material).toHaveLength(14);
    expect(labour).toHaveLength(3);
    expect(dtos.every((d) => (d.totalHt ?? 0) > 0)).toBe(true);

    const lots = new Set(material.map((d) => resolveDqeLot([
      (d.metadata as { lot?: string } | null)?.lot, d.category, d.designation,
    ])));
    expect(lots).toEqual(new Set(['L1', 'L2', 'L3', 'L4', 'L5']));
    expect(material.reduce((s, d) => s + (d.totalHt ?? 0), 0)).toBe(2079505);

    // Bloc RH : jours = quantité, taux journalier = PU, total base = montant.
    const consultant = labour.find((d) => /Consultant/i.test(d.designation));
    expect(consultant?.quantity).toBe(20);
    expect(consultant?.unitPrice).toBe(150000);
    expect(consultant?.totalHt).toBe(3000000);
    expect(labour.reduce((s, d) => s + (d.totalHt ?? 0), 0)).toBe(6000000);
    // Les lignes RH ne sont pas rattachées de force au dernier lot matériel.
    expect(labour.every((d) => !d.category)).toBe(true);
  });
});
