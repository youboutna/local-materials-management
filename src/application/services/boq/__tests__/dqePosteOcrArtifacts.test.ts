/**
 * Scénario réel — PDF « DÉTAIL QUANTITATIF ET ESTIMATIF (DQE) » (PPGASDL ASSABA
 * LOT 1) dont l'extraction abîme les cellules étroites :
 *   - titre de section collé au numéro (`1Génie Civil & Fondations`, `I`, `IV`) ;
 *   - mots coupés (`Fournit ure de matière I`, `forfa it`, `Unit é PDF`) ;
 *   - en-tête documentaire (Émetteur, Destinataire, Devise, Norme) et pied
 *     (récapitulatif, conditions) qui ne doivent jamais devenir des lignes DQE.
 */
import { describe, expect, it } from 'vitest';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';
import { repairOcrCell } from '../parsers/ocrNormalization';
import { detectSection } from '../parsers/sectionDetection';

const R = (...c: (string | number)[]) => c.join('\t');

const CONTENT = [
  'DÉTAIL QUANTITATIF ET ESTIMATIF (DQE)',
  'Référence : DQE-20260908-POSTE',
  'Date : 08 septembre 2026',
  "Projet : PPGASDL ASSABA LOT 1 — Construction d'un poste de transformation électrique (HTA/BT)",
  "Émetteur : La Direction Générale de l'Électricité et des Énergies Renouvelables",
  'Destinataire : Ministère de l’Énergie et du Pétrole',
  'Devise : MRU | Validité de l’offre : 30 jours (jusqu’au 08/10/2026)',
  'Norme : Factur-X / EN 16931 (TypeCode 310)',
  R('#', 'Désignation', 'Régime fiscal PDF', 'Unit é PDF', 'Qté', 'PU (MRU)', 'TVA', 'TVA (MRU)', 'Total HT (MRU)'),
  '1Génie Civil & Fondations',
  R('1', 'Étude géotechnique et sol', 'Travaux BTP', 'Ens.', '1,00', '1 500 000,00', '5,00%', '75 000,00', '1 500 000,00'),
  R('2', 'Terrassement, fouilles et nivellement (L: 14,0 m × l: 10,0 m × H: 2,5 m)', 'Travaux BTP', 'm³', '3 500,00', '2 500,00', '5,00%', '437 500,00', '8 750 000,00'),
  R('3', 'Génie civil : massifs béton, dalle support et fondations poste (Bâtiment L: 8,0 m × l: 5,0 m × H: 3,5 m)', 'Travaux BTP', 'Ens.', '1,00', '4 500 000,00', '5,00%', '225 000,00', '4 500 000,00'),
  'II\tÉquipements & Matériels',
  R('4', 'Transformateur 100 KVA (H61)', 'Fournit ure de matière l', 'unit é', '5,00', '450 000,00', '5,00%', '112 500,00', '2 250 000,00'),
  R('5', 'Cellules HTA, appareillage de coupure et protection', 'Fournit ure de matière l', 'Ens.', '1,00', '3 800 000,00', '5,00%', '190 000,00', '3 800 000,00'),
  R('6', 'Câble U-1000 RO2V 4x150 mm²', 'Fournit ure de matière l', 'm', '2 000,00', '3 200,00', '5,00%', '320 000,00', '6 400 000,00'),
  R('7', 'Conducteur ACSR 148 mm²', 'Fournit ure de matière l', 'm', '500,00', '1 250,00', '5,00%', '31 250,00', '625 000,00'),
  R('8', 'Supports béton 12m/200 daN & armements', 'Fournit ure de matière l', 'unit é', '150,00', '45 000,00', '5,00%', '337 500,00', '6 750 000,00'),
  'III\tRessources Humaines & Prestations',
  R('9', "Main d'œuvre : Chef d'équipe", 'Travaux BTP', 'mois', '4,00', '240 000,00', '5,00%', '48 000,00', '960 000,00'),
  R('10', "Main d'œuvre : Technicien Supérieur (Électricité)", 'Travaux BTP', 'mois', '4,00', '281 250,00', '5,00%', '56 250,00', '1 125 000,00'),
  'IV\tEngins & Logistique',
  R('11', 'Location grue mobile 30T et engins de levage', 'Fournit ure de matière l', 'forfa it', '1,00', '850 000,00', '5,00%', '42 500,00', '850 000,00'),
  'RÉCAPITULATIF FINANCIER',
  'Total HT : 37 860 000,00 MRU',
  'TVA (5,00 %) : 1 893 000,00 MRU',
  'Total TTC : 39 753 000,00 MRU',
  'CONDITIONS GÉNÉRALES',
  'Format : Document structuré selon la norme Factur-X / EN 16931 (TypeCode 310).',
  'VALIDATION ET SIGNATURE',
  '(En attente de signature électronique)',
].join('\n');

const file = () => new File([CONTENT], 'dqe-poste-ocr.txt', { type: 'text/plain' });

describe('DQE poste HTA/BT — artefacts OCR', () => {
  it('répare les mots coupés par les colonnes étroites', () => {
    expect(repairOcrCell('Fournit ure de matière l')).toBe('Fourniture de matériel');
    expect(repairOcrCell('forfa it')).toBe('forfait');
    expect(repairOcrCell('Unit é PDF').toLowerCase()).toBe('unité');
    expect(repairOcrCell('Régime fiscal PDF')).toBe('Régime fiscal');
    expect(repairOcrCell('1 500 000,00')).toBe('1 500 000,00');
  });

  it('traite les titres de section numérotés comme sections, pas comme lignes', () => {
    expect(detectSection(['1Génie Civil & Fondations'])?.label).toBe('Génie Civil & Fondations');
    expect(detectSection(['II', 'Équipements & Matériels'])?.label).toBe('Équipements & Matériels');
    expect(detectSection(['III', 'Ressources Humaines & Prestations'])?.kind).toBe('labour');
    // Une ligne valorisée n'est jamais une section.
    expect(detectSection(['1', 'Étude géotechnique et sol', 'Travaux BTP', 'Ens.', '1,00'])).toBeNull();
  });

  it('extrait 11 lignes propres, sans en-tête, section ni pied de page', async () => {
    const parsed = await new TextTableBoqParser().parse(file());
    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, {
      source: 'dqe',
      contextId: 'poste-hta-ocr',
      detectedFiscal: parsed.detectedFiscal ?? null,
      parties: parsed.parties ?? null,
    });

    expect(dtos).toHaveLength(11);
    expect(
      dtos.some((d) => /Émetteur|Destinataire|Norme|Devise|RÉCAPITULATIF|CONDITIONS|signature|Génie Civil &/i.test(d.designation)),
    ).toBe(false);

    const cable = dtos.find((d) => d.designation.startsWith('Câble'))!;
    expect(cable.designation).toBe('Câble U-1000 RO2V 4x150 mm²');
    expect(cable.unit).toBe('m');
    expect(cable.quantity).toBe(2000);
    expect(cable.unitPrice).toBe(3200);
    expect(cable.totalHt).toBe(6_400_000);

    const grue = dtos.find((d) => d.designation.startsWith('Location grue'))!;
    expect(grue.unit).toBe('forfait');
    expect(grue.quantity).toBe(1);
    expect(grue.totalHt).toBe(850_000);
  });
});
