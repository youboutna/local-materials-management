/**
 * Référentiel des types de notification
 * Source unique de vérité pour les valeurs autorisées par la contrainte
 * CHECK `notifications_type_check` sur `public.notifications`.
 *
 * Toute nouvelle valeur métier DOIT être ajoutée ici ET dans la migration
 * qui étend la contrainte, sinon l'insertion échoue (code 23514).
 */

/** Sévérités génériques utilisées par l'UI (toasts, centre de notifications). */
export const NOTIFICATION_SEVERITIES = ['info', 'success', 'warning', 'error'] as const;

/** Types métier persistés. */
export const NOTIFICATION_BUSINESS_TYPES = [
  'task_assigned',
  'task_updated',
  'task_completed',
  'task_assignment',
  'task_overdue',
  'delay_warning',
  'bank_guarantee_trigger',
  'inspection_overdue',
  'inspection_required',
  'contractor_penalty',
  'compliance_alert',
  'escalation_required',
  'project_update',
  'project_created',
  'project_completed',
  'project_milestone',
  'insurance_expiry',
  'insurance_update',
  'payment_due',
  'payment_completed',
  'payment_failed',
  'payment_pending',
  'payment_blocked',
  'payment_warning',
  'document_review',
  'document_shared',
  'document_approved',
  'document_rejected',
  'document_uploaded',
  'supplier_payment_request',
  'system',
] as const;

export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];
export type NotificationBusinessType = (typeof NOTIFICATION_BUSINESS_TYPES)[number];
export type AllowedNotificationType = NotificationSeverity | NotificationBusinessType;

const ALLOWED = new Set<string>([...NOTIFICATION_SEVERITIES, ...NOTIFICATION_BUSINESS_TYPES]);

/** Alias historiques / variantes rencontrées dans le code legacy. */
const ALIASES: Record<string, AllowedNotificationType> = {
  escalation: 'escalation_required',
  hierarchy_alert: 'escalation_required',
  alert: 'warning',
  danger: 'error',
  critical: 'error',
  ok: 'success',
  inspection: 'inspection_required',
  payment: 'payment_pending',
  document: 'document_review',
  task: 'task_assignment',
  project: 'project_update',
  guarantee: 'bank_guarantee_trigger',
  insurance: 'insurance_update',
};

export function isAllowedNotificationType(value: string | undefined | null): boolean {
  return !!value && ALLOWED.has(value);
}

/**
 * Normalise un type de notification vers une valeur autorisée en base.
 * Fallback contrôlé sur `info` afin de ne jamais violer la contrainte CHECK.
 */
export function normalizeNotificationType(value: string | undefined | null): AllowedNotificationType {
  if (!value) return 'info';
  const key = value.trim().toLowerCase();
  if (ALLOWED.has(key)) return key as AllowedNotificationType;
  return ALIASES[key] ?? 'info';
}
