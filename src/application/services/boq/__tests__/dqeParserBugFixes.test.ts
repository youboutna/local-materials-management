/**
 * Non-régression des 3 bugs de parsing signalés :
 *  1. Espaces (y compris insécables) comme séparateurs de milliers — « 3 500,00 ».
 *  2. Métadonnées d'en-tête (« ASSABA LOT 1 ») jamais aspirées dans une ligne.
 *  3. Pied de page (récapitulatif / conditions / validation) jamais absorbé.
 *
 * Les libellés techniques (« Câble U-1000 RO2V 4x150 mm² ») restent intacts :
 * le parseur garde son rôle structurel (unités, métrés, régime fiscal).
 */
import { describe, expect, it } from 'vitest';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';

const R = (...c: (string | number)[]) => c.join('\t');
const NBSP = '\u00A0';

const CONTENT = [
  'Détail Quantitatif et Estimatif (DQE)',
  'Projet : Électrification rurale ASSABA LOT 1',
  'ASSABA LOT 1',
  'Référence : DQE-20260908-POSTE',
  R('#', 'Désignation', 'Régime fiscal', 'Unité', 'Qté', 'PU (MRU)', 'TVA', 'Total HT (MRU)'),
  'I\tGénie Civil & Fondations',
  R('1', 'Étude géotechnique et sol', 'Travaux BTP', 'Ens.', '1,00', '1 500 000,00', '5,00%', '1 500 000,00'),
  R('2', 'Terrassement, fouilles et nivellement', 'Travaux BTP', 'm³', `3${NBSP}500,00`, '2 500,00', '5,00%', '8 750 000,00'),
  R('3', 'Génie civil : massifs béton et fondations', 'Travaux BTP', 'Ens.', '1,00', '4 500 000,00', '5,00%', '4 500 000,00'),
  'II\tÉquipements & Matériels',
  R('4', 'Transformateur 100 KVA (H61)', 'Fourniture de matériel', 'unité', '5,00', '450 000,00', '5,00%', '2 250 000,00'),
  R('5', 'Cellules HTA et protection', 'Fourniture de matériel', 'Ens.', '1,00', '3 800 000,00', '5,00%', '3 800 000,00'),
  R('6', 'Câble U-1000 RO2V 4x150 mm²', 'Fourniture de matériel', 'm', '2 000,00', '3 200,00', '5,00%', '6 400 000,00'),
  R('7', 'Conducteur ACSR 148 mm²', 'Fourniture de matériel', 'm', '500,00', '1 250,00', '5,00%', '625 000,00'),
  R('8', 'Supports béton 12m/200 daN', 'Fourniture de matériel', 'unité', '12,00', '45 000,00', '5,00%', '540 000,00'),
  'III\tRessources Humaines',
  R('9', "Main d'œuvre : Chef d'équipe", 'Travaux BTP', 'mois', '2,00', '240 000,00', '5,00%', '480 000,00'),
  R('10', 'Main d\'œuvre : Technicien Supérieur', 'Travaux BTP', 'mois', '1,00', '290 000,00', '5,00%', '290 000,00'),
  'IV\tEngins & Logistique',
  R('11', 'Location grue mobile 30T et engins de levage', 'Fourniture de matériel', 'forfait', '1,00', '850 000,00', '5,00%', '850 000,00'),
  'RÉCAPITULATIF FINANCIER',
  'Total HT : 29 985 000,00 MRU',
  'TVA (5,00 %) : 1 499 250,00 MRU',
  'Total TTC : 31 484 250,00 MRU',
  'CONDITIONS GÉNÉRALES',
  'Format : Document structuré selon la norme Factur-X / EN 16931 (TypeCode 310).',
  'VALIDATION ET SIGNATURE',
  'Arrêté le présent DQE à la somme de 31 484 250,00 MRU.',
].join('\n');

const file = () => new File([CONTENT], 'dqe-assaba.txt', { type: 'text/plain' });

async function importDtos() {
  const parsed = await new TextTableBoqParser().parse(file());
  const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
  return BoqImportOrchestrator.toDtos(parsed.rows, mapping, {
    source: 'dqe',
    contextId: 'assaba-lot-1',
    detectedFiscal: parsed.detectedFiscal ?? null,
    parties: parsed.parties ?? null,
  });
}

describe('Parseur DQE — correctifs bugs 1/2/3', () => {
  it('bug 1 — lit « 3 500,00 » (espace insécable) comme 3500', async () => {
    const dtos = await importDtos();
    const terrassement = dtos.find((d) => /Terrassement/i.test(d.designation))!;
    expect(terrassement.quantity).toBe(3500);
    expect(terrassement.unitPrice).toBe(2500);
    expect(terrassement.totalHt).toBe(8_750_000);
  });

  it('bug 2 — « ASSABA LOT 1 » reste du contexte, hors lignes DQE', async () => {
    const dtos = await importDtos();
    expect(dtos.some((d) => /ASSABA\s+LOT/i.test(d.designation))).toBe(false);
  });

  it('bug 3 — le pied de page n’est pas absorbé dans la ligne 11', async () => {
    const dtos = await importDtos();
    const grue = dtos.find((d) => /grue mobile/i.test(d.designation))!;
    expect(grue.designation).toBe('Location grue mobile 30T et engins de levage');
    expect(dtos.some((d) => /R[ÉE]CAPITULATIF|CONDITIONS|VALIDATION|Factur-?X|Arr[êe]t[ée]/i.test(d.designation))).toBe(false);
  });

  it('produit 11 lignes et un total HT conforme au récapitulatif', async () => {
    const dtos = await importDtos();
    expect(dtos).toHaveLength(11);
    const total = dtos.reduce((s, d) => s + (d.totalHt ?? (d.quantity ?? 0) * (d.unitPrice ?? 0)), 0);
    expect(Math.round(total)).toBe(29_985_000);
  });

  it('préserve les libellés techniques et leur unité', async () => {
    const dtos = await importDtos();
    const cable = dtos.find((d) => d.designation.startsWith('Câble'))!;
    expect(cable.designation).toBe('Câble U-1000 RO2V 4x150 mm²');
    expect(cable.unit).toBe('m');
  });
});
