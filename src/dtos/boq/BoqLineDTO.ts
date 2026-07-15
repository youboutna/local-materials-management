/**
 * BoqLineDTO — camelCase DTO shared by services and UI.
 */
import type { BoqResourceType, BoqSource, BoqStatus } from '@/domain/boq/BoqLine';

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
  /** Workflow unique v3.2 : brouillon DB puis finalisation métier. */
  status?: BoqStatus;
  /** Identifiant du document conteneur (regroupe N lignes en un DQE/Devis/Facture). */
  documentId?: string | null;
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
  status: 'draft' | 'submitted' | 'signed' | 'sent' | 'mixed';
  totalHt: number;
  lineCount: number;
  createdAt: string;
}
