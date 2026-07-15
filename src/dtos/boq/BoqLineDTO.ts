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
}

export interface BoqLineFilter {
  source: BoqSource;
  contextId?: string;
  projectId?: string;
  tenderId?: string;
  estimateId?: string;
  phaseId?: string;
  resourceType?: BoqResourceType;
}
