/**
 * Couverture des couches « multi-format & multilingue » de rowAssembly :
 * sections (I., A), 1.1), wraps sur toutes les colonnes, fusion lexicale,
 * détection structurelle des récapitulatifs (FR/EN/AR) et normalisation de grille.
 */
import { describe, expect, it } from 'vitest';
import {
  assembleLogicalRows,
  isSectionTitleRow,
  isStructuralSummaryRow,
  normalizeGrid,
  shouldGlue,
} from '../parsers/rowAssembly';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';

const ctx = (over: Partial<Parameters<typeof assembleLogicalRows>[1]> = {}) => ({
  headerIdx: 0,
  designationIdx: 1,
  numericIdx: [3, 4, 5],
  consumed: new Set<number>(),
  isBoundary: () => false,
  ...over,
});

describe('rowAssembly — titres de sections toutes conventions', () => {
  it('reconnaît I., A), 1.1 et « Lot 3 » comme titres', () => {
    expect(isSectionTitleRow(['I.', 'Génie civil'])).toBe(true);
    expect(isSectionTitleRow(['A)', 'Équipements'])).toBe(true);
    expect(isSectionTitleRow(['1.1', 'Fondations'])).toBe(true);
    expect(isSectionTitleRow(['Lot 3 – Réseau BT'])).toBe(true);
  });

  it('ne confond pas une ligne valorisée avec un titre', () => {
    expect(isSectionTitleRow(['1', 'Étude de sol', 'Ens.', '1,00', '1 500 000,00'])).toBe(false);
  });

  it('un titre de section réinitialise l’ancre sans être absorbé', () => {
    const rows = [
      ['#', 'Désignation', 'Unité', 'Qté', 'PU', 'Total'],
      ['1', 'Étude de sol', 'Ens.', '1', '1000', '1000'],
      ['II.', 'Équipements'],
      ['Cellules HTA'],
    ];
    assembleLogicalRows(rows, ctx());
    expect(rows[2]).toEqual(['II.', 'Équipements']);
    // Sans ancre, la ligne isolée est conservée (R5) et non collée à la ligne 1.
    expect(rows[1][1]).toBe('Étude de sol');
    expect(rows[3][0]).toBe('Cellules HTA');
  });
});

describe('rowAssembly — wraps sur toutes les colonnes', () => {
  it('fusionne un wrap de la colonne Unité ou Régime fiscal', () => {
    const rows = [
      ['#', 'Désignation', 'Régime fiscal', 'Unité', 'Qté', 'PU'],
      ['1', 'Transformateur 100 KVA', 'Fourniture de', 'unité', '5', '450000'],
      ['', '', 'matériel', '', '', ''],
    ];
    const absorbed = assembleLogicalRows(rows, ctx({ numericIdx: [4, 5] }));
    expect(absorbed).toBe(1);
    expect(rows[1][2]).toBe('Fourniture de matériel');
  });

  it('fusionne un wrap de désignation sans coller deux mots complets', () => {
    const rows = [
      ['#', 'Désignation', 'Unité', 'Qté', 'PU', 'Total'],
      ['1', 'Génie civil : dalle', 'Ens.', '1', '1000', '1000'],
      ['', 'support et fondations'],
    ];
    assembleLogicalRows(rows, ctx());
    expect(rows[1][1]).toBe('Génie civil : dalle support et fondations');
  });
});

describe('rowAssembly — fusion lexicale (mots coupés OCR)', () => {
  it('recolle un mot coupé mais sépare deux mots complets', () => {
    expect(shouldGlue('géotechniq', 'ue')).toBe(true);
    expect(shouldGlue('dalle', 'support')).toBe(false);
    expect(shouldGlue('U-1000', 'RO2V')).toBe(false);
    expect(shouldGlue('Fourniture de', 'matériel')).toBe(false);
  });
});

describe('rowAssembly — détection structurelle des récapitulatifs', () => {
  it('reconnaît un total sans dépendre de la langue', () => {
    expect(isStructuralSummaryRow(['Total HT', '', '29 985 000,00', '1 499 250,00'], false)).toBe(true);
    expect(isStructuralSummaryRow(['المجموع', '', '29 985 000,00', '1 499 250,00'], false)).toBe(true);
  });

  it('ne classe jamais une ligne DQE complète comme récapitulatif', () => {
    const line = ['Câble U-1000 RO2V 4x150 mm²', 'm', '2 000,00', '3 200,00', '6 400 000,00'];
    expect(isStructuralSummaryRow(line, false)).toBe(false);
  });
});

describe('normalizeGrid — pré-processeur multi-format', () => {
  it('complète les lignes courtes et qualifie la source', () => {
    const { rows, kind } = normalizeGrid([
      ['Désignation', 'Unité', 'Qté'],
      ['Câble  BT', 'm'],
      ['Support', 'u', '12'],
    ]);
    expect(rows[1]).toEqual(['Câble BT', 'm', '']);
    expect(rows.every((r) => r.length === 3)).toBe(true);
    expect(kind).toBe('fragments');
  });
});

describe('Parseur texte — DQE anglais et arabe', () => {
  const R = (...c: string[]) => c.join('\t');

  it('extrait les lignes d’un DQE anglais sans absorber le pied de page', async () => {
    const content = [
      'Bill of Quantities',
      'Project: Rural electrification – Batch 2',
      R('#', 'Description', 'Unit', 'Qty', 'Unit price', 'Amount'),
      R('1', 'MV/LV transformer 100 KVA', 'unit', '5.00', '450,000.00', '2,250,000.00'),
      R('2', 'Cable U-1000 RO2V 4x150 mm²', 'm', '2,000.00', '3,200.00', '6,400,000.00'),
      'GRAND TOTAL',
      'Total excl. VAT: 8,650,000.00 MRU',
      'Terms and conditions',
    ].join('\n');
    const parsed = await new TextTableBoqParser().parse(new File([content], 'boq.txt', { type: 'text/plain' }));
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, BoqImportOrchestrator.autoMap(parsed.columns), {
      source: 'dqe',
      contextId: 'en-boq',
      detectedFiscal: parsed.detectedFiscal ?? null,
      parties: parsed.parties ?? null,
    });
    expect(dtos).toHaveLength(2);
    expect(dtos.some((d) => /GRAND TOTAL|Terms|Project/i.test(d.designation))).toBe(false);
    expect(dtos[1].designation).toBe('Cable U-1000 RO2V 4x150 mm²');
  });

  it('extrait les lignes d’un DQE arabe', async () => {
    const content = [
      'جدول الكميات',
      'المشروع : كهربة قروية',
      R('#', 'البيان', 'الوحدة', 'الكمية', 'سعر الوحدة', 'المجموع'),
      R('1', 'محول كهربائي 100 ك.ف.أ', 'وحدة', '5,00', '450 000,00', '2 250 000,00'),
      R('2', 'كابل U-1000 RO2V 4x150 mm²', 'م', '2 000,00', '3 200,00', '6 400 000,00'),
      'المجموع : 8 650 000,00 أوقية',
    ].join('\n');
    const parsed = await new TextTableBoqParser().parse(new File([content], 'boq-ar.txt', { type: 'text/plain' }));
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, BoqImportOrchestrator.autoMap(parsed.columns), {
      source: 'dqe',
      contextId: 'ar-boq',
      detectedFiscal: parsed.detectedFiscal ?? null,
      parties: parsed.parties ?? null,
    });
    expect(dtos).toHaveLength(2);
    expect(dtos.some((d) => /المجموع|المشروع/.test(d.designation))).toBe(false);
  });
});
