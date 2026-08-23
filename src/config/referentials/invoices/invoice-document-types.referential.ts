/**
 * invoice-document-types.referential — cycle de vie documentaire unifié
 * DQE → Devis → Contrat → Décompte → Facture (EN 16931 / Factur-X).
 *
 * Aucune logique métier ici : uniquement les paramètres (statuts, TypeCode,
 * enchaînement, acteurs). Les moteurs (`InvoiceWorkflowService`,
 * `FacturXTransformer`) consomment ce référentiel.
 */

export type InvoiceDocumentType = 'dqe' | 'devis' | 'contrat' | 'decompte' | 'facture';
export type InvoiceActor = 'manager' | 'supplier';

export interface InvoiceDocumentTypeDef {
  code: InvoiceDocumentType;
  label: string;
  /** Libellés multilingues — le code technique n'est jamais affiché. */
  labelAr?: string;
  labelEn?: string;
  /** TypeCode UNTDID 1001 : 310 = devis/commande, 380 = facture commerciale. */
  facturxTypeCode: '310' | '380';
  /** Valeur persistée dans `btp.boq_lines.dqe_type`. */
  dqeType: string;
  statuses: string[];
  initialStatus: string;
  /** Statut terminal ouvrant l'étape suivante (DQE : validé ; devis : accepté…). */
  validationStatus: string;
  /** Statut requis sur le document source pour produire cette étape. */
  requiredSourceStatus?: string;
  /** `source` de `btp.boq_lines` portant cette étape (résolution UI / PDF). */
  boqSources: string[];
  /** Étape suivante du workflow (null = terminal). */
  next: InvoiceDocumentType | null;
  /** Acteurs autorisés à produire ce document. */
  actors: InvoiceActor[];
  /** Le document est-il proratisé par un pourcentage d'avancement ? */
  requiresPercentage: boolean;
  /** Libellé de l'action de transformation vers l'étape suivante. */
  nextActionLabel?: string;
}

export const INVOICE_DOCUMENT_TYPES: InvoiceDocumentTypeDef[] = [
  {
    code: 'dqe',
    label: 'Expression de besoin (DQE)',
    labelAr: 'التعبير عن الحاجة (الكشف الكمي التقديري)',
    labelEn: 'Statement of needs (BoQ)',
    facturxTypeCode: '310',
    dqeType: 'previsionnel',
    // Workflow maîtrise d'ouvrage : exprimer puis valider le besoin.
    statuses: ['brouillon', 'soumis', 'valide'],
    initialStatus: 'brouillon',
    validationStatus: 'valide',
    boqSources: ['dqe', 'quantity_takeoff', 'tender_estimate'],
    next: 'devis',
    actors: ['manager'],
    requiresPercentage: false,
    nextActionLabel: 'Lancer la consultation (devis)',
  },
  {
    code: 'devis',
    label: 'Devis',
    labelAr: 'عرض سعر',
    labelEn: 'Quotation',
    facturxTypeCode: '310',
    dqeType: 'devis',
    // Workflow prestataire : l'offre est reçue, analysée puis acceptée/rejetée.
    statuses: ['recu', 'en_analyse', 'accepte', 'rejete'],
    initialStatus: 'recu',
    validationStatus: 'accepte',
    // Un devis ne peut être émis qu'après validation du DQE.
    requiredSourceStatus: 'valide',
    boqSources: ['supplier_bid'],
    next: 'contrat',
    actors: ['manager', 'supplier'],
    requiresPercentage: false,
    nextActionLabel: 'Transformer en contrat',
  },

  {
    code: 'contrat',
    label: 'Contrat',
    labelAr: 'عقد',
    labelEn: 'Contract',
    facturxTypeCode: '310',
    dqeType: 'contrat',
    statuses: ['recu', 'signe', 'en_cours', 'termine'],
    initialStatus: 'signe',
    next: 'decompte',
    actors: ['manager', 'supplier'],
    requiresPercentage: false,
    nextActionLabel: 'Émettre un décompte',
  },
  {
    code: 'decompte',
    label: 'Décompte',
    labelAr: 'كشف مرحلي',
    labelEn: 'Progress statement',
    facturxTypeCode: '310',
    dqeType: 'decompte',
    statuses: ['demande', 'programme', 'valide', 'rejete', 'paye'],
    initialStatus: 'demande',
    next: 'facture',
    actors: ['manager', 'supplier'],
    requiresPercentage: true,
    nextActionLabel: 'Émettre la facture finale',
  },
  {
    code: 'facture',
    label: 'Facture finale',
    labelAr: 'الفاتورة النهائية',
    labelEn: 'Final invoice',
    facturxTypeCode: '380',
    dqeType: 'facture',
    statuses: ['emise', 'approuvee', 'payee'],
    initialStatus: 'emise',
    next: null,
    actors: ['manager', 'supplier'],
    requiresPercentage: false,
  },
];

export const INVOICE_DOCUMENT_TYPE_BY_CODE: Record<InvoiceDocumentType, InvoiceDocumentTypeDef> =
  INVOICE_DOCUMENT_TYPES.reduce((acc, def) => {
    acc[def.code] = def;
    return acc;
  }, {} as Record<InvoiceDocumentType, InvoiceDocumentTypeDef>);

export function getInvoiceDocumentType(code?: string | null): InvoiceDocumentTypeDef {
  if (!code) return INVOICE_DOCUMENT_TYPE_BY_CODE.dqe;
  return INVOICE_DOCUMENT_TYPE_BY_CODE[code as InvoiceDocumentType] ?? INVOICE_DOCUMENT_TYPE_BY_CODE.dqe;
}

/** Étapes accessibles à un acteur donné (portail fournisseur vs gestionnaire). */
export function invoiceTypesForActor(actor: InvoiceActor): InvoiceDocumentTypeDef[] {
  return INVOICE_DOCUMENT_TYPES.filter((d) => d.actors.includes(actor));
}

/** Résout l'étape documentaire depuis le `dqe_type` stocké sur les lignes BOQ. */
export function getInvoiceTypeByDqeType(dqeType?: string | null): InvoiceDocumentTypeDef {
  if (!dqeType) return INVOICE_DOCUMENT_TYPE_BY_CODE.dqe;
  return (
    INVOICE_DOCUMENT_TYPES.find((d) => d.dqeType === dqeType) ??
    INVOICE_DOCUMENT_TYPE_BY_CODE.dqe
  );
}

/** Libellé d'une étape documentaire dans la langue active. */
export function getInvoiceDocumentTypeLabel(
  code?: string | null,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  const def = getInvoiceDocumentType(code);
  if (lang === 'ar') return def.labelAr ?? def.label;
  if (lang === 'en') return def.labelEn ?? def.label;
  return def.label;
}
