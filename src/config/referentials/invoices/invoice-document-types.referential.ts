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
  /** TypeCode UNTDID 1001 : 310 = devis/commande, 380 = facture commerciale. */
  facturxTypeCode: '310' | '380';
  /** Valeur persistée dans `btp.boq_lines.dqe_type`. */
  dqeType: string;
  statuses: string[];
  initialStatus: string;
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
    label: 'DQE / Expression de besoin',
    facturxTypeCode: '310',
    dqeType: 'previsionnel',
    statuses: ['brouillon', 'pour_validation', 'valide'],
    initialStatus: 'brouillon',
    next: 'devis',
    actors: ['manager'],
    requiresPercentage: false,
    nextActionLabel: 'Transformer en devis',
  },
  {
    code: 'devis',
    label: 'Devis',
    facturxTypeCode: '310',
    dqeType: 'devis',
    statuses: ['brouillon', 'soumis', 'en_negociation', 'accepte', 'rejete'],
    initialStatus: 'brouillon',
    next: 'contrat',
    actors: ['manager', 'supplier'],
    requiresPercentage: false,
    nextActionLabel: 'Transformer en contrat',
  },
  {
    code: 'contrat',
    label: 'Contrat',
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
