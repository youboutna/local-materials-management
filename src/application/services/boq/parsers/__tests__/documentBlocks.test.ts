import { describe, expect, it } from 'vitest';
import { looksLikeTableRow, segmentDocumentBlocks } from '../documentBlocks';

describe('documentBlocks', () => {
  const matrix = [
    ["Direction Générale de l'Électricité", '', '', ''],
    ['des Énergies Renouvelables', '', '', ''],
    ['Carrefour SABAH Nouakchott, Mauritanie', '', '', ''],
    ['N° DQE-20260908-CV7Z', 'Date : 2026-09-08', '', ''],
    ['1', 'Câble U-1000 RO2V 4x150 mm²', 'm', '3 200,00'],
    ['2', 'Poteau béton 12m/200 daN', 'unité', '45 000,00'],
  ];

  it('rattache les lignes d’en-tête au bloc métadonnées quand l’en-tête de colonnes manque', () => {
    const { headerRows, tableStart } = segmentDocumentBlocks(matrix, { headerIdx: -1 });
    expect(tableStart).toBe(4);
    expect(headerRows).toEqual([0, 1, 2, 3]);
  });

  it('se cale sur l’en-tête de colonnes détecté', () => {
    const { tableStart, headerRows } = segmentDocumentBlocks(matrix, { headerIdx: 3 });
    expect(tableStart).toBe(4);
    expect(headerRows).toEqual([0, 1, 2]);
  });

  it('n’identifie pas une métadonnée datée comme ligne de tableau', () => {
    expect(looksLikeTableRow(['Date : 2026-09-08', '', ''])).toBe(false);
    expect(looksLikeTableRow(['1', 'Câble', 'm', '3 200,00'])).toBe(true);
  });
});
