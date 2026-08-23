/**
 * sample-dqe-boucle33kv.referential — jeu de données de test (T‑V‑01 → T‑V‑09)
 * pour le projet « Boucle 33 kV » : 14 lignes DQE avec P.U. et TVA.
 *
 * Deux lignes comportent volontairement un écart arithmétique (montant ≠ Qté × P.U.)
 * afin de valider l'auto-correction du P.U. à l'import (`reconcileLinePrice`).
 * Aucune logique métier ici : uniquement des paramètres.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface SampleDqeLine {
  code: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  /** Montant tel que reçu du client (peut être incohérent volontairement). */
  totalHt: number;
  vatRate: number;
  /** Écart arithmétique intentionnel pour tester l'auto-correction. */
  incoherent?: boolean;
}

/** TVA standard Mauritanie (MR_STANDARD). */
export const SAMPLE_DQE_VAT_RATE = 0.16;

export const SAMPLE_DQE_BOUCLE_33KV: SampleDqeLine[] = [
  { code: '1.1', designation: 'Installation de chantier et repli', unit: 'ens', quantity: 1, unitPrice: 2_500_000, totalHt: 2_500_000, vatRate: 0.16 },
  { code: '1.2', designation: 'Études d’exécution et plans de récolement', unit: 'ens', quantity: 1, unitPrice: 1_800_000, totalHt: 1_800_000, vatRate: 0.16 },
  { code: '2.1', designation: 'Fouille pour massif de support béton', unit: 'm3', quantity: 180, unitPrice: 4_500, totalHt: 810_000, vatRate: 0.16 },
  { code: '2.2', designation: 'Béton dosé à 350 kg/m3 pour massifs', unit: 'm3', quantity: 96, unitPrice: 78_000, totalHt: 7_488_000, vatRate: 0.16 },
  { code: '2.3', designation: 'Remblai compacté par couches de 20 cm', unit: 'm3', quantity: 120, unitPrice: 3_200, totalHt: 384_000, vatRate: 0.16 },
  { code: '3.1', designation: 'Fourniture et pose de support béton 12 m', unit: 'u', quantity: 48, unitPrice: 265_000, totalHt: 12_720_000, vatRate: 0.16 },
  { code: '3.2', designation: 'Fourniture et pose de support métallique 14 m', unit: 'u', quantity: 12, unitPrice: 640_000, totalHt: 7_680_000, vatRate: 0.16 },
  // Écart intentionnel : 6 300 × 3 200 = 20 160 000 ≠ 20 790 000 → P.U. corrigé à 3 300
  { code: '4.1', designation: 'Câble aérien alu-acier 3×54,6 mm² (33 kV)', unit: 'ml', quantity: 6_300, unitPrice: 3_200, totalHt: 20_790_000, vatRate: 0.16, incoherent: true },
  { code: '4.2', designation: 'Isolateurs composites 33 kV', unit: 'u', quantity: 320, unitPrice: 18_500, totalHt: 5_920_000, vatRate: 0.16 },
  { code: '4.3', designation: 'Accessoires de raccordement et manchons', unit: 'ens', quantity: 60, unitPrice: 42_000, totalHt: 2_520_000, vatRate: 0.16 },
  { code: '5.1', designation: 'Poste H61 sur poteau 100 kVA équipé', unit: 'u', quantity: 4, unitPrice: 3_450_000, totalHt: 13_800_000, vatRate: 0.16 },
  { code: '5.2', designation: 'Mise à la terre (piquets + conducteur cuivre)', unit: 'ens', quantity: 24, unitPrice: 95_000, totalHt: 2_280_000, vatRate: 0.16 },
  // Écart intentionnel : 1 × 4 200 000 ≠ 4 620 000 → P.U. corrigé à 4 620 000
  { code: '6.1', designation: 'Essais, mise sous tension et réception', unit: 'ens', quantity: 1, unitPrice: 4_200_000, totalHt: 4_620_000, vatRate: 0.16, incoherent: true },
  { code: '6.2', designation: 'Main d’œuvre qualifiée (électricien réseau)', unit: 'hj', quantity: 420, unitPrice: 12_000, totalHt: 5_040_000, vatRate: 0.16 },
];

/** Convertit le jeu de test en lignes BOQ prêtes à l'import / à la transformation. */
export function sampleDqeBoqLines(contextId: string, documentId?: string): BoqLineDTO[] {
  return SAMPLE_DQE_BOUCLE_33KV.map(
    (l) =>
      ({
        code: l.code,
        designation: l.designation,
        unit: l.unit,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        totalHt: l.totalHt,
        vatRate: l.vatRate,
        source: 'dqe',
        contextId,
        documentId,
        status: 'draft',
        dqeType: 'previsionnel',
      }) as BoqLineDTO,
  );
}
