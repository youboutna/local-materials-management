/**
 * document-lifecycle.referential — extension du cycle de vie documentaire.
 *
 * Le cycle canonique reste celui de `invoice-document-types.referential`
 * (DQE → Devis → Contrat → Décompte → Facture finale). Ce référentiel l'ÉTEND
 * avec les deux jalons de gouvernance affichés dans le stepper :
 *   • PUBLICATION de l'appel d'offres (après validation du DQE)
 *   • VALIDATION TECHNIQUE consultant (décomptes / factures)
 * et décrit les transitions INVERSES (retour en arrière) autorisées.
 *
 * Codes techniques : anglais MAJUSCULES, jamais affichés. Libellés via i18n
 * (clé `labelKey`), avec repli fr/en/ar pour les contextes hors React.
 * Pure TS — aucune dépendance React / Supabase.
 */
import type { InvoiceDocumentType } from '@/config/referentials/invoices/invoice-document-types.referential';

export type LifecycleStageCode =
  | 'NEED'
  | 'TENDER_PUBLICATION'
  | 'QUOTE'
  | 'CONTRACT'
  | 'PROGRESS_STATEMENT'
  | 'TECHNICAL_VALIDATION'
  | 'FINAL_INVOICE';

export type LifecycleStageKind = 'document' | 'gate';

export interface LifecycleStageDef {
  code: LifecycleStageCode;
  kind: LifecycleStageKind;
  /** Étape documentaire portée (null pour un jalon de gouvernance). */
  documentType: InvoiceDocumentType | null;
  labelKey: string;
  labels: { fr: string; ar: string; en: string };
  /** Statut du document requis pour considérer ce jalon franchi. */
  reachedWhenStatusIn?: string[];
}

export const LIFECYCLE_STAGES: LifecycleStageDef[] = [
  {
    code: 'NEED',
    kind: 'document',
    documentType: 'dqe',
    labelKey: 'dqe.stage.need',
    labels: { fr: 'Expression de besoin (DQE)', ar: 'التعبير عن الحاجة', en: 'Statement of needs (BoQ)' },
  },
  {
    code: 'TENDER_PUBLICATION',
    kind: 'gate',
    documentType: null,
    labelKey: 'dqe.stage.tender_publication',
    labels: { fr: "Publication appel d'offres", ar: 'نشر طلب العروض', en: 'Tender publication' },
    reachedWhenStatusIn: ['valide'],
  },
  {
    code: 'QUOTE',
    kind: 'document',
    documentType: 'devis',
    labelKey: 'dqe.stage.quote',
    labels: { fr: 'Devis', ar: 'عرض سعر', en: 'Quotation' },
  },
  {
    code: 'CONTRACT',
    kind: 'document',
    documentType: 'contrat',
    labelKey: 'dqe.stage.contract',
    labels: { fr: 'Contrat', ar: 'عقد', en: 'Contract' },
  },
  {
    code: 'PROGRESS_STATEMENT',
    kind: 'document',
    documentType: 'decompte',
    labelKey: 'dqe.stage.progress_statement',
    labels: { fr: 'Décompte', ar: 'كشف مرحلي', en: 'Progress statement' },
  },
  {
    code: 'TECHNICAL_VALIDATION',
    kind: 'gate',
    documentType: null,
    labelKey: 'dqe.stage.technical_validation',
    labels: { fr: 'Validation technique (consultant)', ar: 'المصادقة الفنية', en: 'Technical validation (consultant)' },
    reachedWhenStatusIn: ['valide', 'paye', 'approuvee', 'payee'],
  },
  {
    code: 'FINAL_INVOICE',
    kind: 'document',
    documentType: 'facture',
    labelKey: 'dqe.stage.final_invoice',
    labels: { fr: 'Facture finale', ar: 'الفاتورة النهائية', en: 'Final invoice' },
  },
];

/** Actions de retour arrière (workflow inverse). Codes anglais MAJUSCULES. */
export type ReverseActionCode =
  | 'REOPEN'
  | 'UNPUBLISH'
  | 'REVIEW'
  | 'RETURN_TO_RECEIVED'
  | 'CANCEL';

export interface ReverseTransitionDef {
  action: ReverseActionCode;
  documentType: InvoiceDocumentType;
  /** Statuts depuis lesquels l'action est possible. */
  fromStatuses: string[];
  /** Statut cible (doit appartenir aux statuts de l'étape). */
  targetStatus: string;
  labelKey: string;
  labels: { fr: string; ar: string; en: string };
  /** Rôles autorisés (référentiel de rôles applicatifs). */
  roles: string[];
}

export const REVERSE_TRANSITIONS: ReverseTransitionDef[] = [
  {
    action: 'REOPEN',
    documentType: 'dqe',
    fromStatuses: ['soumis', 'valide'],
    targetStatus: 'brouillon',
    labelKey: 'dqe.reverse.reopen',
    labels: { fr: 'Réouvrir (brouillon)', ar: 'إعادة الفتح', en: 'Reopen (draft)' },
    roles: ['admin', 'director', 'manager'],
  },
  {
    action: 'UNPUBLISH',
    documentType: 'dqe',
    fromStatuses: ['valide'],
    targetStatus: 'soumis',
    labelKey: 'dqe.reverse.unpublish',
    labels: { fr: 'Annuler la publication', ar: 'إلغاء النشر', en: 'Cancel publication' },
    roles: ['admin', 'director', 'manager'],
  },
  {
    action: 'REVIEW',
    documentType: 'devis',
    fromStatuses: ['accepte', 'rejete'],
    targetStatus: 'en_analyse',
    labelKey: 'dqe.reverse.review',
    labels: { fr: 'Remettre en analyse', ar: 'إعادة الدراسة', en: 'Return to review' },
    roles: ['admin', 'director', 'manager'],
  },
  {
    action: 'RETURN_TO_RECEIVED',
    documentType: 'devis',
    fromStatuses: ['en_analyse'],
    targetStatus: 'recu',
    labelKey: 'dqe.reverse.return_received',
    labels: { fr: 'Revenir à « reçu »', ar: 'العودة إلى مستلم', en: 'Back to received' },
    roles: ['admin', 'director', 'manager'],
  },
  {
    action: 'REVIEW',
    documentType: 'contrat',
    fromStatuses: ['signe', 'en_cours'],
    targetStatus: 'recu',
    labelKey: 'dqe.reverse.contract_review',
    labels: { fr: 'Revenir au contrat reçu', ar: 'العودة إلى العقد المستلم', en: 'Back to received contract' },
    roles: ['admin', 'director'],
  },
  {
    action: 'REVIEW',
    documentType: 'decompte',
    fromStatuses: ['valide', 'rejete'],
    targetStatus: 'demande',
    labelKey: 'dqe.reverse.statement_review',
    labels: { fr: 'Remettre le décompte en demande', ar: 'إعادة الكشف إلى الطلب', en: 'Return statement to requested' },
    roles: ['admin', 'director', 'manager'],
  },
  {
    action: 'REVIEW',
    documentType: 'facture',
    fromStatuses: ['approuvee'],
    targetStatus: 'emise',
    labelKey: 'dqe.reverse.invoice_review',
    labels: { fr: 'Revenir à la facture émise', ar: 'العودة إلى الفاتورة الصادرة', en: 'Back to issued invoice' },
    roles: ['admin', 'director'],
  },
];

/** Statuts autorisant l'édition des lignes (déverrouillage). */
export const EDITABLE_STATUSES = ['brouillon', 'recu', 'demande', 'emise'];

/** Statuts figeant définitivement le document. */
export const FROZEN_STATUSES = ['paye', 'payee', 'termine'];

export function lifecycleStageLabel(
  stage: LifecycleStageDef,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  return stage.labels[lang] ?? stage.labels.fr;
}
