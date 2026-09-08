/**
 * Scénario réel — DQE « Construction d'un poste de transformation HTA/BT »
 * (DQE-20260908-POSTE) : en-tête documentaire, 4 sections (Génie Civil,
 * Équipements, RH, Engins), 11 lignes valorisées, récapitulatif financier.
 *
 * Vérifie que l'en-tête et le pied ne deviennent pas des lignes DQE et que la
 * fiscalité / le métré sont bien reconstruits.
 */
import { describe, expect, it } from 'vitest';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
import { BoqImportOrchestrator } from '../BoqImportOrchestrator';

const R = (...c: (string | number)[]) => c.join('\t');

const CONTENT = [
  'Détail Quantitatif et Estimatif (DQE)',
  "Projet : Construction d'un poste de transformation électrique (HTA/BT)",
  'Référence : DQE-20260908-POSTE',
  'Devise : MRU | Validité : 30 jours (jusqu\'au 2026-10-08)',
  R('#', 'Désignation', 'Régime fiscal', 'Unité', 'Qté', 'PU (MRU)', 'TVA', 'TVA (MRU)', 'Total HT (MRU)'),
  'I\tGénie Civil & Fondations',
  R('1', 'Étude géotechnique et sol', 'Travaux BTP', 'Ens.', '1,00', '1 500 000,00', '5,00%', '75 000,00', '1 500 000,00'),
  R('2', 'Terrassement, fouilles et nivellement (L: 14,0 m × l: 10,0 m × H: 2,5 m)', 'Travaux BTP', 'm³', '3 500,00', '2 500,00', '5,00%', '437 500,00', '8 750 000,00'),
  R('3', 'Génie civil : massifs béton, dalle support et fondations poste (Bâtiment L: 8,0 m × l: 5,0 m × H: 3,5 m)', 'Travaux BTP', 'Ens.', '1,00', '4 500 000,00', '5,00%', '225 000,00', '4 500 000,00'),
  'II\tÉquipements & Matériels',
  R('4', 'Transformateur 100 KVA (H61)', 'Fourniture de matériel', 'unité', '5,00', '450 000,00', '5,00%', '112 500,00', '2 250 000,00'),
  R('5', 'Cellules HTA, appareillage de coupure et protection', 'Fourniture de matériel', 'Ens.', '1,00', '3 800 000,00', '5,00%', '190 000,00', '3 800 000,00'),
  R('6', 'Câble U-1000 RO2V 4x150 mm²', 'Fourniture de matériel', 'm', '2 000,00', '3 200,00', '5,00%', '320 000,00', '6 400 000,00'),
  R('7', 'Conducteur ACSR 148 mm²', 'Fourniture de matériel', 'm', '500,00', '1 250,00', '5,00%', '31 250,00', '625 000,00'),
  R('8', 'Supports béton 12m/200 daN & armements', 'Fourniture de matériel', 'unité', '150,00', '45 000,00', '5,00%', '337 500,00', '6 750 000,00'),
  'III\tRessources Humaines & Prestations',
  R('9', "Main d'œuvre : Chef d'équipe", 'Travaux BTP', 'mois', '4,00', '240 000,00', '5,00%', '48 000,00', '960 000,00'),
  R('10', 'Main d\'œuvre : Technicien Supérieur (Électricité)', 'Travaux BTP', 'mois', '4,00', '281 250,00', '5,00%', '56 250,00', '1 125 000,00'),
  'IV\tEngins & Logistique',
  R('11', 'Location grue mobile 30T et engins de levage', 'Fourniture de matériel', 'forfait', '1,00', '850 000,00', '5,00%', '42 500,00', '850 000,00'),
  'Total HT : 37 860 000,00 MRU',
  'TVA (5,00 %) : 1 893 000,00 MRU',
  'Total TTC : 39 753 000,00 MRU',
  'Conditions générales',
  'Format : Document structuré selon la norme Factur-X / EN 16931 (TypeCode 310).',
  'Prix et taxes : Prix fermes et non révisables exprimés en MRU.',
].join('\n');

const file = () => new File([CONTENT], 'dqe-poste.txt', { type: 'text/plain' });

describe('DQE poste HTA/BT — import texte tabulé', () => {
  it('extrait 11 lignes valorisées sans polluer avec l’en-tête ni le pied', async () => {
    const parsed = await new TextTableBoqParser().parse(file());
    const mapping = BoqImportOrchestrator.autoMap(parsed.columns);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, {
      source: 'dqe',
      contextId: 'poste-hta',
      detectedFiscal: parsed.detectedFiscal ?? null,
      parties: parsed.parties ?? null,
    });

    expect(dtos).toHaveLength(11);
    expect(dtos.map((d) => d.designation)).toContain('Câble U-1000 RO2V 4x150 mm²');
    expect(dtos.some((d) => /Total HT|Conditions|Factur-X|Référence/i.test(d.designation))).toBe(false);

    const totalHt = dtos.reduce((s, d) => s + (d.totalHt ?? (d.quantity ?? 0) * (d.unitPrice ?? 0)), 0);
    // Somme réelle des 11 lignes (le pied du document annonce 37 860 000 : écart
    // documentaire assumé, le parseur ne réécrit jamais les montants sources).
    expect(Math.round(totalHt)).toBe(37_510_000);

    const cable = dtos.find((d) => d.designation.startsWith('Câble'))!;
    expect(cable.unit).toBe('m');
    expect(cable.quantity).toBe(2000);
    expect(cable.unitPrice).toBe(3200);
    expect(cable.totalHt).toBe(6_400_000);
  });

  it('rattache chaque ligne à sa section', async () => {
    const parsed = await new TextTableBoqParser().parse(file());
    const labels = parsed.rows.map((r) => String(r.raw['Lot libellé'] ?? ''));
    expect(labels.filter((l) => /Génie Civil/i.test(l)).length).toBeGreaterThanOrEqual(3);
    expect(labels.some((l) => /Ressources Humaines/i.test(l))).toBe(true);
  });
});
