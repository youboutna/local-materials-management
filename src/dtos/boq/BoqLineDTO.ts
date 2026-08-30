/**
 * BoqLineDTO — camelCase DTO shared by services and UI.
 */
import type { BoqResourceType, BoqSource, BoqStatus } from '@/domain/entities/boq/BoqLine';

export type BoqSourceType = 'rapide' | 'avance' | 'import' | 'invoice';

export interface BoqLineDTO {
  id?: string;
  source: BoqSource;
  contextId: string;
  designation: string;
  elementType?: string | null;
  unit: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity: number;
  unitPrice?: number | null;
  vatRate?: number | null;
  rasRate?: number | null;
  /** Régime de prestation fiscal (référentiel TAX_REGIMES) résolu ou choisi. */
  taxRegimeCode?: string | null;
  /** Compte imputé du Plan Comptable Mauritanien (porte le régime de TVA). */
  accountCode?: string | null;
  fees?: number | null;
  totalHt?: number | null;
  materialId?: string | null;
  phaseId?: string | null;
  milestoneId?: string | null;
  taskId?: string | null;
  resourceType?: BoqResourceType;
  note?: string | null;
  bidRef?: string | null;
  submittedBy?: string | null;
  /** Origine de la ligne : saisie rapide, calcul avancé, import parseur, ou facture fournisseur. */
  sourceType?: BoqSourceType;
  /** Code métier BTP réutilisable (nomenclature BTP standardisée). */
  btpCode?: string | null;
  /** Code de ligne DQE tel que fourni par la source (colonne `code`). */
  code?: string | null;
  /** Catégorie DQE issue du référentiel `DQE_CATEGORIES` (colonne `category`). */
  category?: string | null;
  /** Étape du cycle de vie DQE : previsionnel | devis | decompte | facture. */
  dqeType?: string | null;
  /** Métadonnées libres (référentiel, valeurs d'origine, marge cible…). */
  metadata?: Record<string, unknown> | null;

  /** Workflow unique v3.2 : brouillon DB puis finalisation métier. */
  status?: BoqStatus;
  /** Identifiant du document conteneur (regroupe N lignes en un DQE/Devis/Facture). */
  documentId?: string | null;
  /** Étape du cycle documentaire (référentiel invoice-document-types). */
  documentType?: string | null;
  /** Statut métier de l'étape documentaire (ex. « demande », « signe », « payee »). */
  businessStatus?: string | null;
  /** Document d'origine (traçabilité DQE → Devis → Contrat…). */
  sourceDocumentId?: string | null;
  /** Étape du document d'origine (`dqe`, `devis`, `contrat`…). */
  sourceDocumentType?: string | null;
  /** TypeCode UNTDID 1001 (310 / 380) porté par le document. */
  facturxTypeCode?: string | null;
  /** Avancement facturé (décompte) en pourcentage. */
  billedPercentage?: number | null;
  /** Titre libre du document (stocké dans metadata.title). */
  title?: string | null;
  /** Horodatage création (lecture seule). */
  createdAt?: string | null;
}

export interface BoqLineFilter {
  source: BoqSource;
  contextId?: string;
  projectId?: string;
  tenderId?: string;
  estimateId?: string;
  phaseId?: string;
  resourceType?: BoqResourceType;
  documentId?: string;
}

/** Résumé d'un document (agrégat de lignes partageant le même document_id). */
export interface BoqDocumentSummary {
  documentId: string;
  reference: string;
  title: string;
  status: BoqStatus | 'mixed';
  totalHt: number;
  lineCount: number;
  createdAt: string;
  /** Vrai uniquement après signature ou transfert métier effectif. */
  readOnly: boolean;
}
