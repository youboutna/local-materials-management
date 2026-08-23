/**
 * priceCoherence — contrôle arithmétique des lignes DQE importées.
 * Règle : quantité × P.U. doit égaler le montant. En cas d'écart supérieur à la
 * tolérance, le P.U. est recalculé depuis le montant (source de vérité fiscale)
 * et la correction est tracée pour affichage/audit.
 *
 * Pure TS — aucune dépendance React / Supabase.
 */

export interface PriceReconcileInput {
  quantity: number;
  unitPrice?: number | null;
  totalHt?: number | null;
  /** Tolérance absolue en devise (défaut 1 unité). */
  tolerance?: number;
}

export interface PriceReconcileResult {
  unitPrice: number | null;
  totalHt: number | null;
  corrected: boolean;
  /** P.U. d'origine lorsqu'une correction a été appliquée. */
  originalUnitPrice?: number | null;
  reason?: string;
}

/** Recalcule P.U. / montant de façon cohérente et signale la correction. */
export function reconcileLinePrice(input: PriceReconcileInput): PriceReconcileResult {
  const tolerance = input.tolerance ?? 1;
  const quantity = Number.isFinite(input.quantity) ? input.quantity : 0;
  const pu = input.unitPrice ?? null;
  const total = input.totalHt ?? null;

  // Montant absent : dérivé du P.U.
  if (total == null) {
    return { unitPrice: pu, totalHt: pu != null ? quantity * pu : null, corrected: false };
  }
  // P.U. absent : dérivé du montant.
  if (pu == null) {
    return { unitPrice: quantity ? total / quantity : null, totalHt: total, corrected: false };
  }
  if (!quantity) {
    return { unitPrice: pu, totalHt: total, corrected: false };
  }
  const expected = quantity * pu;
  if (Math.abs(expected - total) <= tolerance) {
    return { unitPrice: pu, totalHt: total, corrected: false };
  }
  const fixed = total / quantity;
  return {
    unitPrice: fixed,
    totalHt: total,
    corrected: true,
    originalUnitPrice: pu,
    reason: `P.U. corrigé automatiquement : ${pu.toLocaleString('fr-FR')} → ${fixed.toLocaleString('fr-FR')} (montant ${total.toLocaleString('fr-FR')} / quantité ${quantity.toLocaleString('fr-FR')})`,
  };
}
