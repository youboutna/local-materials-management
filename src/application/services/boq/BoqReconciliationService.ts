/**
 * BoqReconciliationService — dernier maillon du pipeline de parsing DQE :
 *
 *   rowAssembly → btpCalculations/normalisation → **réconciliation** → BoqLine
 *
 * Rôle : confronter les lignes logiques au récapitulatif du document
 * (Total HT / TVA / TTC détectés par `envelopeDetection` / `fiscalDetection`)
 * AVANT toute persistance, et signaler les anomalies de lecture numérique
 * (quantité `350` lue au lieu de `3 500`) pour correction manuelle.
 *
 * TypeScript pur : aucune dépendance React ni Supabase.
 */
import { BoqLine } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqLineMapper } from '@/dtos/boq/BoqLineMapper';
import type { DetectedFiscal } from './parsers/IDocumentParser';

export type BoqAnomalyKind =
  /** qté × P.U. ≠ montant lu : facteur de 10 → quantité mal lue. */
  | 'quantity-scale'
  /** qté × P.U. ≠ montant lu sans facteur explicable. */
  | 'line-arithmetic'
  /** Σ des lignes ≠ Total HT du récapitulatif. */
  | 'total-mismatch';

export interface BoqAnomaly {
  kind: BoqAnomalyKind;
  /** Index 0-based dans la liste de lignes (absent pour une anomalie globale). */
  lineIndex?: number;
  designation?: string;
  message: string;
  /** Valeur proposée à l'utilisateur (quantité corrigée). */
  suggestedQuantity?: number;
}

export interface BoqReconciliation {
  /** Σ des montants HT calculés par l'entité `BoqLine`. */
  computedHt: number;
  /** Total HT déclaré dans le récapitulatif du document (null si absent). */
  declaredHt: number | null;
  deltaHt: number | null;
  /** Écart relatif au récapitulatif (0.004 = 0,4 %). */
  deltaRatio: number | null;
  /** Vrai si l'écart est nul ou sous la tolérance (0,5 %). */
  balanced: boolean;
  anomalies: BoqAnomaly[];
}

const TOTAL_TOLERANCE_RATIO = 0.005;
const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/** Le facteur est-il une puissance de 10 (10, 100, 1000…) à 1 % près ? */
function powerOfTen(ratio: number): number | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const exp = Math.round(Math.log10(ratio));
  if (exp === 0) return null;
  const candidate = 10 ** exp;
  return Math.abs(ratio - candidate) / candidate <= 0.01 ? candidate : null;
}

export class BoqReconciliationService {
  /** Convertit un DTO en entité unifiée : source unique des totaux HT/TTC. */
  static toEntity(dto: BoqLineDTO): BoqLine {
    return BoqLineMapper.toEntity(dto);
  }

  /**
   * Réconcilie les lignes avec le récapitulatif détecté.
   * Ne modifie jamais les lignes : l'arbitrage reste à l'utilisateur.
   */
  static reconcile(lines: BoqLineDTO[], detected?: DetectedFiscal | null): BoqReconciliation {
    const anomalies: BoqAnomaly[] = [];
    let computedHt = 0;

    lines.forEach((dto, lineIndex) => {
      const entity = BoqReconciliationService.toEntity(dto);
      computedHt += entity.totalHt;

      // La correction arithmétique appliquée à l'import (P.U. recalculé depuis
      // le montant) est le symptôme d'une lecture numérique douteuse : si le
      // facteur est une puissance de 10, c'est la QUANTITÉ qui a été tronquée.
      const correction = (dto.metadata as { priceCorrection?: { originalUnitPrice?: number | null } } | null)
        ?.priceCorrection;
      const originalPu = correction?.originalUnitPrice ?? null;
      if (originalPu == null || !originalPu || !dto.quantity) return;

      const appliedPu = dto.unitPrice ?? 0;
      if (!appliedPu) return;
      const ratio = originalPu / appliedPu;
      const factor = powerOfTen(ratio);
      if (factor) {
        const suggestedQuantity = dto.quantity * factor;
        anomalies.push({
          kind: 'quantity-scale',
          lineIndex,
          designation: dto.designation,
          suggestedQuantity,
          message:
            `Quantité probablement tronquée : ${fmt(dto.quantity)} au lieu de ${fmt(suggestedQuantity)} ` +
            `(séparateur de milliers perdu). Corrigez la quantité puis vérifiez le montant.`,
        });
      } else {
        anomalies.push({
          kind: 'line-arithmetic',
          lineIndex,
          designation: dto.designation,
          message:
            `Incohérence qté × P.U. ≠ montant : P.U. lu ${fmt(originalPu)}, ` +
            `P.U. recalculé ${fmt(appliedPu)}. À vérifier manuellement.`,
        });
      }
    });

    const declaredHt = detected?.totalHt ?? null;
    const deltaHt = declaredHt != null ? computedHt - declaredHt : null;
    const deltaRatio = declaredHt ? (deltaHt ?? 0) / declaredHt : null;
    const balanced = deltaRatio == null || Math.abs(deltaRatio) <= TOTAL_TOLERANCE_RATIO;

    if (!balanced && declaredHt != null) {
      anomalies.push({
        kind: 'total-mismatch',
        message:
          `Σ des lignes ${fmt(computedHt)} ≠ Total HT du récapitulatif ${fmt(declaredHt)} ` +
          `(écart ${fmt(deltaHt ?? 0)}). Vérifiez les quantités et les lignes manquantes avant d'importer.`,
      });
    }

    return { computedHt, declaredHt, deltaHt, deltaRatio, balanced, anomalies };
  }
}
