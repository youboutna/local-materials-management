/**
 * @deprecated pour les types de vérification : ré-export de compatibilité.
 * `VerificationItemDTO`, `VerificationStatus` et `CheckpointCategory` sont
 * définis dans `./MilestoneDTO` (le checkpoint est une action de jalon).
 *
 * Ce fichier conserve uniquement les règles métier Mauritanie.
 */

export type {
  CheckpointCategory,
  VerificationItemDTO,
  VerificationStatus,
} from './MilestoneDTO';

// Mauritania Business Rules interface
export interface MauritaniaBusinessRulesDTO {
  payment_thresholds: number[];
  guarantee_retention_rate: number;
  retention_release_at_provisional: number;
  retention_release_at_final: number;
  inspection_frequency_days: number;
  document_retention_days: number;
  approval_hierarchy_levels: number;
  quality_acceptance_threshold: number;
  safety_inspection_required: boolean;
  environmental_compliance_required: boolean;
  local_content_percentage: number;
  technical_supervision_required: boolean;
  progress_reporting_frequency: string;
}

export const DEFAULT_MAURITANIA_RULES: MauritaniaBusinessRulesDTO = {
  payment_thresholds: [25, 50, 75, 100],
  guarantee_retention_rate: 0.10,
  retention_release_at_provisional: 0.50,
  retention_release_at_final: 1.00,
  inspection_frequency_days: 7,
  document_retention_days: 365,
  approval_hierarchy_levels: 3,
  quality_acceptance_threshold: 95,
  safety_inspection_required: true,
  environmental_compliance_required: true,
  local_content_percentage: 30,
  technical_supervision_required: true,
  progress_reporting_frequency: 'weekly'
};
