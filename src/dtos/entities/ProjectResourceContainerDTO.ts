/**
 * ProjectResourceContainerDTO — conteneur sémantique « Ressources » du projet.
 *
 * « Ressources » n'est pas une table : c'est un conteneur qui agrège deux familles
 * métier (humaines / matérielles) sur deux axes temporels :
 *
 *  - PLANIFICATION : issue des détails de phases (lignes DQE, matériaux et
 *    ressources humaines déclarés au niveau phase / WBS).
 *  - EXÉCUTION : consommations réelles du projet (matériaux livrés / consommés,
 *    ressources humaines affectées et facturées).
 *
 * Le conteneur est calculé (jamais persisté) par ProjectResourceAggregatorService.
 */

/** Famille métier d'une ressource. */
export type ResourceFamily = 'human' | 'material' | 'equipment';

/** Origine d'une ligne de ressource. */
export type ResourceOrigin = 'dqe' | 'phase' | 'execution';

/** Ligne unitaire de ressource, avec son couple planifié / réalisé. */
export interface ResourceLineDTO {
  id: string;
  name: string;
  family: ResourceFamily;
  unit?: string;
  origin: ResourceOrigin;
  phaseId?: string;
  phaseName?: string;
  materialId?: string;
  plannedQuantity: number;
  plannedCost: number;
  actualQuantity: number;
  actualCost: number;
  /** Écart coût (réalisé - planifié). */
  costVariance: number;
  /** Taux de consommation en % (réalisé / planifié). */
  consumptionRate: number;
}

/** Agrégat d'une famille de ressources. */
export interface ResourceFamilyBucketDTO {
  family: ResourceFamily;
  label: string;
  lines: ResourceLineDTO[];
  plannedCost: number;
  actualCost: number;
  costVariance: number;
  consumptionRate: number;
  lineCount: number;
}

/** Conteneur complet exposé à l'UI. */
export interface ProjectResourceContainerDTO {
  projectId: string;
  human: ResourceFamilyBucketDTO;
  materials: ResourceFamilyBucketDTO;
  equipment: ResourceFamilyBucketDTO;
  totals: {
    plannedCost: number;
    actualCost: number;
    costVariance: number;
    consumptionRate: number;
    lineCount: number;
  };
}

/** Entrée brute (DTO déjà camelCase) attendue par l'agrégateur. */
export interface ProjectResourceAggregationInput {
  projectId: string;
  /** Phases du projet (avec dqeLines / materials / humanResources éventuels). */
  phases?: Array<Record<string, unknown>>;
  /** Lignes DQE au niveau projet (source = project). */
  boqLines?: Array<Record<string, unknown>>;
  /** Ressources exécutées (btp.project_resources). */
  executedResources?: Array<Record<string, unknown>>;
  /** Matériaux consommés / livrés (btp.project_materials). */
  executedMaterials?: Array<Record<string, unknown>>;
}
