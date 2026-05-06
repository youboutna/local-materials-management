/**
 * PhaseConstructionDTO
 * --------------------
 * DTO dédié à la création/affichage des phases de construction depuis l'UI
 * (`PhaseList`, `WaterfallProjectPhasesManager`).
 *
 * Conventions: camelCase strict côté UI/DTO. Le transformer
 * (`PhaseConstructionTransformer`) assure le mapping vers le contrat snake_case
 * du hook `usePhasesHex` / adapter Supabase.
 */
import type { BaseEntityDTO } from './BaseEntityDTO';

export type ConstructionPhase =
  | 'pre_construction'
  | 'site_preparation'
  | 'foundation'
  | 'framing'
  | 'structural_work'
  | 'finishing'
  | 'post_construction'
  | 'handover';

export type ConstructionStage =
  | 'planning_design'
  | 'permits_approvals'
  | 'site_clearing'
  | 'excavation'
  | 'foundation_work'
  | 'structural_framing'
  | 'roofing'
  | 'electrical_plumbing'
  | 'interior_finishing'
  | 'exterior_finishing'
  | 'final_inspection'
  | 'handover_complete';

export type PhaseStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'delayed';

export const CONSTRUCTION_PHASE_LABELS: Record<ConstructionPhase, string> = {
  pre_construction: 'Pré-construction',
  site_preparation: 'Préparation du site',
  foundation: 'Fondations',
  framing: 'Charpente',
  structural_work: 'Travaux structurels',
  finishing: 'Finitions',
  post_construction: 'Post-construction',
  handover: 'Livraison',
};

export const CONSTRUCTION_STAGE_LABELS: Record<ConstructionStage, string> = {
  planning_design: 'Planification et conception',
  permits_approvals: 'Permis et approbations',
  site_clearing: 'Déblaiement du site',
  excavation: 'Excavation',
  foundation_work: 'Travaux de fondation',
  structural_framing: 'Charpente structurelle',
  roofing: 'Toiture',
  electrical_plumbing: 'Électricité et plomberie',
  interior_finishing: 'Finitions intérieures',
  exterior_finishing: 'Finitions extérieures',
  final_inspection: 'Inspection finale',
  handover_complete: 'Livraison complète',
};

/** Payload UI → Service pour créer une phase (camelCase strict). */
export interface CreatePhaseDTO {
  phaseName: string;
  description: string;
  constructionPhase?: ConstructionPhase | string;
  constructionStage?: ConstructionStage | string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
  phaseMethodology?: string;
}

export interface PhaseStageSummaryDTO {
  name: string;
  status?: string;
  order?: number;
}

/** Vue résumée d'une phase consommée par les listes/tables. */
export interface PhaseSummaryDTO extends Partial<BaseEntityDTO> {
  id: string;
  phaseName: string;
  description?: string | null;
  status: PhaseStatus | string;
  progress: number;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  stages?: PhaseStageSummaryDTO[];
}
