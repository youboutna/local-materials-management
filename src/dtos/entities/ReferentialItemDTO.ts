/**
 * ReferentialItemDTO — référentiels configurables persistés en base
 * (`btp.referential_items`) : code technique + libellés fr/ar/en.
 *
 * Doctrine hybride :
 * - référentiels configurables (phases, workflows, catégories, matériaux,
 *   modèles de pondération) → code + labels en base ;
 * - référentiels système (statuts, rôles) → code en base + labels en code.
 */

export type ReferentialDomain =
  | 'phase'
  | 'workflow_step'
  | 'document_category'
  | 'material_category'
  | 'weighting_model'
  | string;

export interface ReferentialItemDTO {
  id: string;
  domain: ReferentialDomain;
  code: string;
  labelFr: string;
  labelAr: string | null;
  labelEn: string | null;
  parentCode: string | null;
  orderIndex: number;
  isCustom: boolean;
  isActive: boolean;
  projectId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpsertReferentialItemDTO {
  id?: string;
  domain: ReferentialDomain;
  code: string;
  labelFr: string;
  labelAr?: string | null;
  labelEn?: string | null;
  parentCode?: string | null;
  orderIndex?: number;
  isCustom?: boolean;
  isActive?: boolean;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
}
