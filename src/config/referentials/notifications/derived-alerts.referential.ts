/**
 * Référentiel système des alertes dérivées (calculées depuis l'état réel du projet).
 *
 * Doctrine : aucune règle de criticité ni libellé en dur dans un service ou un
 * composant React. Chaque « signal » métier (phase en retard, jalon dépassé,
 * inspection en attente, garantie qui expire...) est décrit ici avec :
 *  - son type d'alerte canonique (`alerts.referential`),
 *  - sa source,
 *  - ses seuils de sévérité (en jours),
 *  - ses libellés fr/ar/en (titre + message paramétré).
 */

import type { AlertCategory } from './alerts.referential';

export type DerivedAlertKind =
  | 'phase_overdue'
  | 'milestone_overdue'
  | 'task_overdue'
  | 'inspection_pending'
  | 'payment_blocked'
  | 'guarantee_expiring'
  | 'insurance_expiring'
  | 'risk_open';

export type DerivedAlertLang = 'fr' | 'ar' | 'en';

/** Seuils de sévérité exprimés en jours (retard écoulé ou délai restant). */
export interface DerivedSeverityThresholds {
  critical: number;
  high: number;
  medium: number;
}

export interface DerivedAlertRule {
  kind: DerivedAlertKind;
  /** Code canonique du référentiel `ALERT_TYPE`. */
  alertType: string;
  source: string;
  category: AlertCategory;
  /** `overdue` : jours de retard écoulés ; `expiry` : jours restants avant échéance. */
  mode: 'overdue' | 'expiry' | 'static';
  thresholds: DerivedSeverityThresholds;
  /** Sévérité utilisée quand `mode === 'static'`. */
  staticSeverity?: 'critical' | 'high' | 'medium' | 'low';
  actionRequired: boolean;
  title: Record<DerivedAlertLang, string>;
  /** Message avec jetons {label}, {days}. */
  message: Record<DerivedAlertLang, string>;
}

export const DERIVED_ALERT_RULES: DerivedAlertRule[] = [
  {
    kind: 'phase_overdue',
    alertType: 'project_delay',
    source: 'phase',
    category: 'delay',
    mode: 'overdue',
    thresholds: { critical: 30, high: 14, medium: 3 },
    actionRequired: true,
    title: { fr: 'Phase en retard', ar: 'مرحلة متأخرة', en: 'Phase overdue' },
    message: {
      fr: 'La phase « {label} » a dépassé sa date de fin de {days} jour(s).',
      ar: 'تجاوزت المرحلة « {label} » تاريخ انتهائها بـ {days} يوم/أيام.',
      en: 'Phase "{label}" is {days} day(s) past its end date.',
    },
  },
  {
    kind: 'milestone_overdue',
    alertType: 'deadline',
    source: 'milestone',
    category: 'delay',
    mode: 'overdue',
    thresholds: { critical: 21, high: 7, medium: 1 },
    actionRequired: true,
    title: { fr: 'Jalon dépassé', ar: 'معلم متجاوز', en: 'Milestone overdue' },
    message: {
      fr: 'Le jalon « {label} » est en retard de {days} jour(s).',
      ar: 'المعلم « {label} » متأخر بـ {days} يوم/أيام.',
      en: 'Milestone "{label}" is {days} day(s) late.',
    },
  },
  {
    kind: 'task_overdue',
    alertType: 'deadline',
    source: 'project',
    category: 'delay',
    mode: 'overdue',
    thresholds: { critical: 21, high: 7, medium: 1 },
    actionRequired: true,
    title: { fr: 'Tâche en retard', ar: 'مهمة متأخرة', en: 'Task overdue' },
    message: {
      fr: 'La tâche « {label} » est en retard de {days} jour(s).',
      ar: 'المهمة « {label} » متأخرة بـ {days} يوم/أيام.',
      en: 'Task "{label}" is {days} day(s) late.',
    },
  },
  {
    kind: 'inspection_pending',
    alertType: 'inspection_overdue',
    source: 'inspection',
    category: 'inspection',
    mode: 'overdue',
    thresholds: { critical: 30, high: 14, medium: 0 },
    actionRequired: true,
    title: { fr: 'Inspection à clôturer', ar: 'تفتيش قيد الإنجاز', en: 'Inspection to close' },
    message: {
      fr: 'L’inspection du {label} reste ouverte depuis {days} jour(s).',
      ar: 'التفتيش بتاريخ {label} ما زال مفتوحاً منذ {days} يوم/أيام.',
      en: 'Inspection dated {label} has been open for {days} day(s).',
    },
  },
  {
    kind: 'payment_blocked',
    alertType: 'payment_blocked',
    source: 'payment',
    category: 'payment',
    mode: 'overdue',
    thresholds: { critical: 15, high: 7, medium: 0 },
    actionRequired: true,
    title: { fr: 'Paiement bloqué', ar: 'دفعة موقوفة', en: 'Payment blocked' },
    message: {
      fr: 'Paiement bloqué depuis {days} jour(s) — {label}.',
      ar: 'دفعة موقوفة منذ {days} يوم/أيام — {label}.',
      en: 'Payment blocked for {days} day(s) — {label}.',
    },
  },
  {
    kind: 'guarantee_expiring',
    alertType: 'bank_guarantee',
    source: 'guarantee',
    category: 'guarantee',
    mode: 'expiry',
    thresholds: { critical: 7, high: 30, medium: 60 },
    actionRequired: true,
    title: { fr: 'Garantie bancaire à renouveler', ar: 'ضمان بنكي للتجديد', en: 'Bank guarantee to renew' },
    message: {
      fr: 'La garantie « {label} » expire dans {days} jour(s).',
      ar: 'الضمان « {label} » ينتهي بعد {days} يوم/أيام.',
      en: 'Guarantee "{label}" expires in {days} day(s).',
    },
  },
  {
    kind: 'insurance_expiring',
    alertType: 'insurance_expiry',
    source: 'insurance',
    category: 'guarantee',
    mode: 'expiry',
    thresholds: { critical: 7, high: 30, medium: 60 },
    actionRequired: true,
    title: { fr: 'Assurance à renouveler', ar: 'تأمين للتجديد', en: 'Insurance to renew' },
    message: {
      fr: 'L’attestation « {label} » expire dans {days} jour(s).',
      ar: 'الشهادة « {label} » تنتهي بعد {days} يوم/أيام.',
      en: 'Certificate "{label}" expires in {days} day(s).',
    },
  },
  {
    kind: 'risk_open',
    alertType: 'compliance_violation',
    source: 'risk',
    category: 'compliance',
    mode: 'static',
    thresholds: { critical: 0, high: 0, medium: 0 },
    staticSeverity: 'high',
    actionRequired: true,
    title: { fr: 'Risque non traité', ar: 'خطر غير معالج', en: 'Untreated risk' },
    message: {
      fr: 'Le risque « {label} » est ouvert sans plan de mitigation validé.',
      ar: 'الخطر « {label} » مفتوح بدون خطة تخفيف معتمدة.',
      en: 'Risk "{label}" is open without an approved mitigation plan.',
    },
  },
];

export function getDerivedAlertRule(kind: DerivedAlertKind): DerivedAlertRule | undefined {
  return DERIVED_ALERT_RULES.find((r) => r.kind === kind);
}

/** Sévérité issue des seuils du référentiel (jamais d'un switch en dur). */
export function derivedSeverity(
  rule: DerivedAlertRule,
  days: number,
): 'critical' | 'high' | 'medium' | 'low' {
  if (rule.mode === 'static') return rule.staticSeverity ?? 'medium';
  const { critical, high, medium } = rule.thresholds;
  if (rule.mode === 'overdue') {
    if (days >= critical) return 'critical';
    if (days >= high) return 'high';
    if (days >= medium) return 'medium';
    return 'low';
  }
  // expiry : plus le délai restant est court, plus c'est critique
  if (days <= critical) return 'critical';
  if (days <= high) return 'high';
  if (days <= medium) return 'medium';
  return 'low';
}

export function renderDerivedAlertMessage(
  rule: DerivedAlertRule,
  lang: DerivedAlertLang,
  params: { label: string; days: number },
): string {
  return rule.message[lang]
    .replace('{label}', params.label)
    .replace('{days}', String(Math.max(0, Math.round(params.days))));
}

export function derivedAlertTitle(rule: DerivedAlertRule, lang: DerivedAlertLang): string {
  return rule.title[lang];
}
