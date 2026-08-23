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
    validationStatus: 'signe',
    requiredSourceStatus: 'accepte',
    boqSources: ['supplier_bid'],
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
    validationStatus: 'valide',
    boqSources: ['invoice'],
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
    validationStatus: 'payee',
    boqSources: ['invoice'],
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

/** Étapes documentaires possibles pour une `source` de lignes BOQ. */
export function invoiceTypesForBoqSource(source?: string | null): InvoiceDocumentTypeDef[] {
  const s = String(source ?? '').trim().toLowerCase();
  return INVOICE_DOCUMENT_TYPES.filter((d) => d.boqSources.includes(s));
}

/**
 * Résolution canonique de l'étape documentaire : la `source` BOQ fait foi
 * (un DQE reste un DQE), le `documentType` / `dqeType` des lignes n'affine
 * que parmi les étapes autorisées pour cette source.
 * Évite la confusion DQE ↔ Devis observée en production.
 */
export function resolveInvoiceDocumentType(input: {
  source?: string | null;
  documentType?: string | null;
  dqeType?: string | null;
}): InvoiceDocumentTypeDef {
  const candidates = invoiceTypesForBoqSource(input.source);
  if (!candidates.length) {
    return input.documentType
      ? getInvoiceDocumentType(input.documentType)
      : getInvoiceTypeByDqeType(input.dqeType);
  }
  const byDocType = candidates.find((d) => d.code === input.documentType);
  if (byDocType) return byDocType;
  const byDqeType = candidates.find((d) => d.dqeType === input.dqeType);
  if (byDqeType) return byDqeType;
  return candidates[0];
}

/** Statut suivant dans la progression linéaire de l'étape (null = terminal). */
export function getNextBusinessStatus(
  code: InvoiceDocumentType,
  current?: string | null,
): string | null {
  const def = getInvoiceDocumentType(code);
  const index = def.statuses.indexOf(String(current ?? def.initialStatus));
  if (index < 0) return def.statuses[0] ?? null;
  return def.statuses[index + 1] ?? null;
}

/** Le document source porte-t-il le statut requis pour produire l'étape suivante ? */
export function isSourceStatusSatisfied(
  target: InvoiceDocumentType,
  sourceStatus?: string | null,
): boolean {
  const required = getInvoiceDocumentType(target).requiredSourceStatus;
  if (!required) return true;
  return String(sourceStatus ?? '') === required;
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
