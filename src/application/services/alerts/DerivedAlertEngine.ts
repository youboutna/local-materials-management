/**
 * Derived Alert Engine — logique pure (aucune dépendance React / Supabase).
 * Transforme des signaux métier bruts en alertes opérationnelles typées,
 * en s'appuyant exclusivement sur le référentiel `derived-alerts.referential`.
 */

import type { AlertData } from '@/dtos/entities/AlertDTO';
import type { DerivedAlertSignal } from '@/domain/repositories/IDerivedAlertRepository';
import {
  derivedAlertTitle,
  derivedSeverity,
  getDerivedAlertRule,
  renderDerivedAlertMessage,
  type DerivedAlertLang,
} from '@/config/referentials/notifications/derived-alerts.referential';

const DAY_MS = 86_400_000;

export const DERIVED_ALERT_ID_PREFIX = 'derived';

export function derivedAlertId(signal: DerivedAlertSignal): string {
  return `${DERIVED_ALERT_ID_PREFIX}:${signal.kind}:${signal.entityId}`;
}

export function isDerivedAlertId(id: string): boolean {
  return typeof id === 'string' && id.startsWith(`${DERIVED_ALERT_ID_PREFIX}:`);
}

/** Jours de retard (mode overdue) ou jours restants (mode expiry). */
function daysFor(mode: 'overdue' | 'expiry' | 'static', referenceDate: string, now: number): number {
  const ref = new Date(referenceDate).getTime();
  if (Number.isNaN(ref)) return 0;
  const delta = mode === 'expiry' ? ref - now : now - ref;
  return Math.max(0, Math.floor(delta / DAY_MS));
}

export function toDerivedAlert(
  signal: DerivedAlertSignal,
  lang: DerivedAlertLang = 'fr',
  now: number = Date.now(),
): AlertData | null {
  const rule = getDerivedAlertRule(signal.kind);
  if (!rule) return null;

  const days = daysFor(rule.mode, signal.referenceDate, now);
  const severity = derivedSeverity(rule, days);
  const timestamp = new Date(now).toISOString();

  return {
    id: derivedAlertId(signal),
    type: rule.alertType as AlertData['type'],
    severity,
    title: derivedAlertTitle(rule, lang),
    message: renderDerivedAlertMessage(rule, lang, { label: signal.label, days }),
    projectId: signal.projectId,
    phaseId: signal.phaseId,
    relatedEntityId: signal.entityId,
    source: rule.source as AlertData['source'],
    delayDays: rule.mode === 'overdue' ? days : undefined,
    deadline: rule.mode === 'expiry' ? signal.referenceDate : undefined,
    daysUntilDeadline: rule.mode === 'expiry' ? days : undefined,
    isOverdue: rule.mode === 'overdue' && days > 0,
    timestamp: signal.referenceDate || timestamp,
    triggerDate: signal.referenceDate || timestamp,
    acknowledged: false,
    actionRequired: rule.actionRequired,
    status: 'open',
    escalationLevel: severity === 'critical' ? 2 : severity === 'high' ? 1 : 0,
    availableActions: [],
    actionProof: [],
    createdAt: signal.referenceDate || timestamp,
    updatedAt: timestamp,
    metadata: {
      derived: true,
      kind: signal.kind,
      category: rule.category,
      ...(signal.extra ?? {}),
    },
  };
}

export function toDerivedAlerts(
  signals: DerivedAlertSignal[],
  lang: DerivedAlertLang = 'fr',
  now: number = Date.now(),
): AlertData[] {
  return signals
    .map((signal) => toDerivedAlert(signal, lang, now))
    .filter((alert): alert is AlertData => alert !== null);
}
