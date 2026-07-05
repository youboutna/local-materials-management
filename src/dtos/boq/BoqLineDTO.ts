/**
 * BoqLineDTO — camelCase DTO shared by services and UI.
 */
import type { BoqResourceType, BoqSource } from '@/domain/boq/BoqLine';

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
