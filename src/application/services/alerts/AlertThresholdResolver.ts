/**
 * AlertThresholdResolver — logique pure (aucun React, aucun Supabase).
 *
 * Traduit les seuils d'escalade configurés dans `/settings` (table
 * `btp.escalation_thresholds`, fusionnés avec le référentiel par
 * `EscalationThresholdService`) en surcharges de sévérité pour le moteur
 * d'alertes dérivées.
 *
 * Doctrine : aucun seuil en dur dans les services de monitoring — les valeurs
 * saisies par l'administrateur pilotent directement les métriques du tableau
 * de bord.
 */

import type { EscalationThresholdRow } from '@/domain/repositories/IEscalationThresholdRepository';
import {
  DERIVED_ALERT_RULES,
  DERIVED_KIND_ESCALATION_TYPE,
  type DerivedAlertKind,
  type DerivedSeverityThresholds,
} from '@/config/referentials/notifications/derived-alerts.referential';

export type DerivedThresholdOverrides = Partial<Record<DerivedAlertKind, DerivedSeverityThresholds>>;

const SEVERITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/**
 * Pour un type d'escalade donné, extrait les seuils exprimés en jours et actifs,
 * puis les projette sur les trois paliers utilisés par le moteur d'alertes.
 */
function thresholdsForType(
  rows: EscalationThresholdRow[],
  mode: 'overdue' | 'expiry' | 'static',
  fallback: DerivedSeverityThresholds,
): DerivedSeverityThresholds | null {
  const days = rows
    .filter((r) => r.thresholdUnit === 'days' && r.isActive !== false)
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[b.severityLevel] ?? 0) - (SEVERITY_ORDER[a.severityLevel] ?? 0) ||
        b.thresholdValue - a.thresholdValue,
    );
  if (!days.length || mode === 'static') return null;

  const bySeverity = (sev: string) => days.find((r) => r.severityLevel === sev)?.thresholdValue;

  const critical = bySeverity('critical') ?? days[0].thresholdValue;
  const high = bySeverity('high') ?? bySeverity('medium') ?? fallback.high;
  const medium = bySeverity('medium') ?? bySeverity('low') ?? fallback.medium;

  // Cohérence des paliers : décroissant en mode `overdue`, croissant en `expiry`.
  const ordered =
    mode === 'overdue'
      ? { critical: Math.max(critical, high, medium), high: Math.max(Math.min(critical, high), medium), medium: Math.min(critical, high, medium) }
      : { critical: Math.min(critical, high, medium), high: Math.min(Math.max(critical, high), medium), medium: Math.max(critical, high, medium) };

  return ordered;
}

/** Surcharges par type de signal dérivé, calculées depuis les réglages. */
export function resolveDerivedThresholds(
  rows: EscalationThresholdRow[],
): DerivedThresholdOverrides {
  const byType = new Map<string, EscalationThresholdRow[]>();
  rows.forEach((r) => {
    const list = byType.get(r.thresholdType) ?? [];
    list.push(r);
    byType.set(r.thresholdType, list);
  });

  const overrides: DerivedThresholdOverrides = {};
  DERIVED_ALERT_RULES.forEach((rule) => {
    const type = DERIVED_KIND_ESCALATION_TYPE[rule.kind];
    if (!type) return;
    const resolved = thresholdsForType(byType.get(type) ?? [], rule.mode, rule.thresholds);
    if (resolved) overrides[rule.kind] = resolved;
  });
  return overrides;
}
