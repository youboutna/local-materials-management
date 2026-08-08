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
  toce ProjectResourceAggregationInput {
  projectId: string;
  /** Phases du projet (avec dqeLines / materials / humanResources éventuels). */
  phases?: Array<Record<string, unknown>>;
  /** Lignes DQE au niveau projet (source = project). */
  boqLines?: Array<Record<string,