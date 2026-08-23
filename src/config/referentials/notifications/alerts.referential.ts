/**
 * Référentiel système des alertes (sévérité + types).
 * Doctrine : `code` technique persisté en base, libellés fr/ar/en résolus ici.
 * Toute criticité / catégorie de filtre du tableau de bord doit venir d'ici,
 * jamais d'un switch en dur dans un composant React.
 */

export interface AlertLabelledItem {
  code: string;
  fr: string;
  ar: string;
  en: string;
}

export interface AlertSeverityItem extends AlertLabelledItem {
  /** Poids pour le tri / l'escalade (4 = critique). */
  weight: number;
  /** Token de design (jamais de couleur en dur dans l'UI). */
  colorClass: string;
}

export const ALERT_SEVERITY: AlertSeverityItem[] = [
  { code: 'critical', fr: 'Critique', ar: 'حرج', en: 'Critical', weight: 4, colorClass: 'bg-destructive text-destructive-foreground' },
  { code: 'high', fr: 'Élevée', ar: 'مرتفع', en: 'High', weight: 3, colorClass: 'bg-warning text-warning-foreground' },
  { code: 'medium', fr: 'Moyenne', ar: 'متوسط', en: 'Medium', weight: 2, colorClass: 'bg-secondary text-secondary-foreground' },
  { code: 'low', fr: 'Faible', ar: 'منخفض', en: 'Low', weight: 1, colorClass: 'bg-muted text-muted-foreground' },
];

/** Catégories de filtre du tableau de bord (onglets). */
export type AlertCategory = 'delay' | 'payment' | 'inspection' | 'guarantee' | 'compliance' | 'other';

export interface AlertTypeItem extends AlertLabelledItem {
  category: AlertCategory;
  /** Alias techniques rencontrés en base (données historiques). */
  aliases: string[];
}

export const ALERT_TYPE: AlertTypeItem[] = [
  { code: 'project_delay', fr: 'Retard de projet', ar: 'تأخير المشروع', en: 'Project delay', category: 'delay', aliases: ['delay', 'deadline', 'retard', 'delay_warning'] },
  { code: 'payment_blocked', fr: 'Paiement bloqué', ar: 'دفعة موقوفة', en: 'Payment blocked', category: 'payment', aliases: ['payment', 'paiement', 'payment_due', 'payment_failed', 'payment_warning', 'payment_pending', 'supplier_payment_request'] },
  { code: 'financial_risk', fr: 'Risque financier', ar: 'مخاطر مالية', en: 'Financial risk', category: 'payment', aliases: ['financial'] },
  { code: 'inspection_issue', fr: 'Anomalie d’inspection', ar: 'ملاحظة تفتيش', en: 'Inspection issue', category: 'inspection', aliases: ['inspection', 'inspection_required'] },
  { code: 'inspection_overdue', fr: 'Inspection en retard', ar: 'تفتيش متأخر', en: 'Inspection overdue', category: 'inspection', aliases: [] },
  { code: 'bank_guarantee', fr: 'Garantie bancaire', ar: 'ضمان بنكي', en: 'Bank guarantee', category: 'guarantee', aliases: ['guarantee', 'bank_guarantee_trigger'] },
  { code: 'insurance_expiry', fr: 'Expiration d’assurance', ar: 'انتهاء التأمين', en: 'Insurance expiry', category: 'guarantee', aliases: ['insurance'] },
  { code: 'compliance_violation', fr: 'Non-conformité', ar: 'عدم مطابقة', en: 'Compliance violation', category: 'compliance', aliases: ['compliance', 'compliance_alert'] },
  { code: 'quality', fr: 'Qualité', ar: 'الجودة', en: 'Quality', category: 'compliance', aliases: [] },
  { code: 'delivery', fr: 'Livraison', ar: 'التسليم', en: 'Delivery', category: 'other', aliases: [] },
  { code: 'deadline', fr: 'Échéance', ar: 'الموعد النهائي', en: 'Deadline', category: 'delay', aliases: [] },
  { code: 'escalation_required', fr: 'Escalade requise', ar: 'تصعيد مطلوب', en: 'Escalation required', category: 'other', aliases: ['escalation'] },
];


export const ALERT_CATEGORIES: Array<AlertLabelledItem & { code: AlertCategory | 'all' }> = [
  { code: 'all', fr: 'Toutes', ar: 'الكل', en: 'All' },
  { code: 'delay', fr: 'Retards', ar: 'التأخيرات', en: 'Delays' },
  { code: 'payment', fr: 'Paiements', ar: 'المدفوعات', en: 'Payments' },
  { code: 'inspection', fr: 'Inspections', ar: 'التفتيش', en: 'Inspections' },
  { code: 'guarantee', fr: 'Garanties', ar: 'الضمانات', en: 'Guarantees' },
  { code: 'compliance', fr: 'Conformité', ar: 'المطابقة', en: 'Compliance' },
];

type Lang = 'fr' | 'ar' | 'en';

const normalize = (value: string): string => (value || '').trim().toLowerCase();

export function resolveAlertType(raw: string | null | undefined): AlertTypeItem | undefined {
  const code = normalize(raw ?? '');
  if (!code) return undefined;
  return (
    ALERT_TYPE.find((t) => t.code === code) ??
    ALERT_TYPE.find((t) => t.aliases.some((a) => a === code))
  );
}

/** Code canonique persisté (fallback = code reçu, jamais de faux "project_delay"). */
export function canonicalAlertType(raw: string | null | undefined): string {
  return resolveAlertType(raw)?.code ?? (normalize(raw ?? '') || 'other');
}

export function alertCategoryOf(raw: string | null | undefined): AlertCategory {
  return resolveAlertType(raw)?.category ?? 'other';
}

export function alertTypeLabel(raw: string | null | undefined, lang: Lang = 'fr'): string {
  const item = resolveAlertType(raw);
  return item ? item[lang] : (raw ?? '');
}

export function resolveAlertSeverity(raw: string | null | undefined): AlertSeverityItem {
  const code = normalize(raw ?? '');
  return (
    ALERT_SEVERITY.find((s) => s.code === code) ??
    ALERT_SEVERITY.find((s) => s.code === 'medium')!
  );
}

export function alertSeverityLabel(raw: string | null | undefined, lang: Lang = 'fr'): string {
  return resolveAlertSeverity(raw)[lang];
}

export function alertSeverityColor(raw: string | null | undefined): string {
  return resolveAlertSeverity(raw).colorClass;
}

/**
 * Types de notification métier qui constituent une alerte opérationnelle.
 * Doctrine : la cohérence « notifications ↔ alertes » se décide ici, jamais
 * dans un composant React ni dans un adapter.
 */
const NOTIFICATION_ALERT_TYPES = new Set<string>([
  'inspection_overdue',
  'inspection_required',
  'delay_warning',
  'payment_blocked',
  'payment_due',
  'payment_failed',
  'payment_warning',
  'bank_guarantee_trigger',
  'insurance_expiry',
  'compliance_alert',
  'contractor_penalty',
  'escalation_required',
]);

export function isAlertWorthyNotificationType(raw: string | null | undefined): boolean {
  return NOTIFICATION_ALERT_TYPES.has(normalize(raw ?? ''));
}

/** Sévérité par défaut d'un type de notification promue en alerte. */
const NOTIFICATION_DEFAULT_SEVERITY: Record<string, string> = {
  inspection_overdue: 'high',
  inspection_required: 'medium',
  delay_warning: 'high',
  payment_blocked: 'high',
  payment_failed: 'high',
  payment_due: 'medium',
  payment_warning: 'medium',
  bank_guarantee_trigger: 'critical',
  insurance_expiry: 'high',
  compliance_alert: 'critical',
  contractor_penalty: 'high',
  escalation_required: 'critical',
};

/** Sévérité d'alerte déduite d'une notification (priorité explicite prioritaire). */
export function alertSeverityFromNotification(
  type: string | null | undefined,
  priority?: string | null
): string {
  const p = normalize(priority ?? '');
  if (p === 'urgent' || p === 'critical') return 'critical';
  if (p === 'high') return 'high';
  if (p === 'low') return 'low';
  return NOTIFICATION_DEFAULT_SEVERITY[normalize(type ?? '')] ?? 'medium';
}
