/**
 * Test bout-en-bout sur le PDF réel « Expression de Besoins – Projet Boucle 33 kV (v4) » :
 * en-tête administratif (fournisseur / organisation), phases L1→L5, quantités,
 * prix unitaires, montants et fiscalité.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { PdfBoqParser } from '../parsers/PdfBoqParser';
import { resolveDqeLot } from '@/config/referentials/dqe/dqe-dispatch.referential';

const PDF_PATH = join(__dirname, 'fixtures/edb_boucle33kv_v4.pdf');

function loadFile(): File {
  const buf = readFileSync(PDF_PATH);
  return new File([new Uint8Array(buf)], 'Expression_Besoin_Boucle_33kV_v4.pdf', { type: 'application/pdf' });
}

describe('PDF réel EDB Boucle 33 kV v4', () => {
  it('extrait en-tête, lignes et fiscalité', async () => {
    const parsed = await new PdfBoqParser().parse(loadFile());

    // En-tête : expéditeur = fournisseur, destinataire = organisation.
    expect(parsed.parties?.supplier?.name).toMatch(/CEGELEC/i);
    expect(parsed.parties?.organization?.name).toMatch(/DGEER|Électricité/i);
    expect(parsed.parties?.organization?.email).toBe('DGEER.director.01@gmail.com');
    expect(parsed.parties?.organization?.phone).toMatch(/45 25 67 83/);
    expect(parsed.parties?.organization?.address).toMatch(/Nouakchott/i);

    // Fiscalité totalisée en pied de document.
    expect(parsed.detectedFiscal?.totalHt).toBe(2079505);

    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, { source: 'dqe', contextId: 'p1' });

    // 14 lignes valorisées, toutes rattachées à un lot L1→L5.
    expect(dtos.length).toBe(14);
    expect(dtos.every((d) => (d.totalHt ?? 0) > 0)).toBe(true);
    const lots = new Set(dtos.map((d) => resolveDqeLot([
      (d.metadata as { lot?: string } | null)?.lot, d.category, d.designation,
    ])));
    expect(lots).toEqual(new Set(['L1', 'L2', 'L3', 'L4', 'L5']));

    const cloture = dtos.find((d) => /Cl[oô]tures/i.test(d.designation));
    expect(cloture?.quantity).toBe(600);
    expect(cloture?.unitPrice).toBe(200);
    expect(cloture?.totalHt).toBe(120000);

    // Somme des montants = Total HT du document.
    const sum = dtos.reduce((s, d) => s + (d.totalHt ?? 0), 0);
    expect(sum).toBe(2079505);
  });
});
