/**
 * Vérifie que le pipeline DQE (lignes extraites du PDF « Expression de Besoins
 * Boucle 33 kV ») produit des lignes complètes : désignation, montant, lot,
 * puis un lot résolvable par le référentiel de dispatch.
 */
import { describe, expect, it } from 'vitest';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import {
  detectSection,
  isRepeatedHeaderRow,
  SECTION_LABEL_COLUMN,
  SECTION_LOT_COLUMN,
} from '../parsers/sectionDetection';
import { resolveDqeLot } from '@/config/referentials/dqe/dqe-dispatch.referential';

/** Extrait réel du PDF de test (clustering pdfjs). */
const PDF_ROWS: string[][] = [
  ['Expression de Besoins (Projet Boucle 33 kV)'],
  ['LOT L1: GÉNIE CIVIL – FINITIONS'],
  ['Description', 'Total (MRU)'],
  ['Clôtures et accès postes', '120,000'],
  ['Revêtement et finitions', '120,000'],
  ['LOT L2: POSE CONDUCTEURS HT'],
  ['Description', 'Total (MRU)'],
  ['Conducteur AAC 150 mm²', '270,000'],
  ['Pose et tension', '180,000'],
  ['Accessoires de finition', '90,000'],
  ['LOT L5: RACCORDEMENTS BT ET BRANCHEMENTS'],
  ['Description', 'Total (MRU)'],
  ['Câble BT', '125,000'],
  ['Total HT', '2,079,505.00 MRU'],
  ['TVA (5%)', '103,975.25 MRU'],
];

const baseColumns = ['Description', 'Total (MRU)'];
const columns = [...baseColumns, SECTION_LOT_COLUMN, SECTION_LABEL_COLUMN];

function buildRows() {
  const out: { raw: Record<string, string | number | null> }[] = [];
  let lot: string | null = null;
  let label: string | null = null;
  for (const cells of PDF_ROWS) {
    const section = detectSection(cells);
    if (section) { lot = section.lot; label = section.label; continue; }
    if (isRepeatedHeaderRow(cells, baseColumns)) continue;
    if (/^(total ht|tva)/i.test(cells[0])) continue;
    const raw: Record<string, string | number | null> = {};
    cells.forEach((c, i) => { raw[baseColumns[i] ?? `col_${i + 1}`] = c; });
    raw[SECTION_LOT_COLUMN] = lot;
    raw[SECTION_LABEL_COLUMN] = label;
    out.push({ raw });
  }
  return out;
}

describe('EDB PDF → BOQ pipeline', () => {
  it('détecte les lots depuis les lignes de section', () => {
    expect(detectSection(['LOT L1: GÉNIE CIVIL – FINITIONS'])?.lot).toBe('L1');
    expect(detectSection(['Chapitre 3 - Réseau MT'])?.lot).toBe('L3');
    expect(detectSection(['Câble BT', '125,000'])).toBeNull();
  });

  it('auto-mappe Description → désignation et Total → montant', () => {
    const mapping = BoqImportOrchestrator.autoMap(columns);
    expect(mapping.designation).toBe('Description');
    expect(mapping.total).toBe('Total (MRU)');
    expect(mapping.lot).toBe(SECTION_LOT_COLUMN);
  });

  it('produit des lignes valorisées avec lot et montant', () => {
    const rows = buildRows();
    const mapping = BoqImportOrchestrator.autoMap(columns);
    const dtos = BoqImportOrchestrator.toDtos(rows, mapping, {
      source: 'dqe',
      contextId: 'project-1',
    });

    expect(dtos).toHaveLength(6);
    const first = dtos[0];
    expect(first.designation).toBe('Clôtures et accès postes');
    expect(first.quantity).toBe(1);
    expect(first.totalHt).toBe(120000);
    expect(first.unitPrice).toBe(120000);
    expect(first.category).toBe('L1');
    expect(first.metadata).toMatchObject({ lot: 'L1', fiscalBlock: 'material' });

    // Aucune ligne ne perd son montant.
    expect(dtos.every((d) => (d.totalHt ?? 0) > 0)).toBe(true);

    // Le référentiel de dispatch retrouve les lots (pas de repli HANDOVER).
    const lots = dtos.map((d) => resolveDqeLot([
      (d.metadata as { lot?: string } | null)?.lot,
      d.code,
      d.category,
      d.designation,
    ]));
    expect(new Set(lots)).toEqual(new Set(['L1', 'L2', 'L5']));
  });
});
