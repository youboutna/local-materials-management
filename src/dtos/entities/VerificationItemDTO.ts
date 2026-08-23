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
  paymentThresholds: number[];
  guaranteeRetentionRate: number;
  retentionReleaseAtProvisional: number;
  retentionReleaseAtFinal: number;
  inspectionFrequencyDays: number;
  documentRetentionDays: number;
  approvalHierarchyLevels: number;
  qualityAcceptanceThreshold: number;
  safetyInspectionRequired: boolean;
  environmentalComplianceRequired: boolean;
  localContentPercentage: number;
  technicalSupervisionRequired: boolean;
  progressReportingFrequency: string;
}

export const DEFAULT_MAURITANIA_RULES: MauritaniaBusinessRulesDTO = {
  paymentThresholds: [25, 50, 75, 100],
  guaranteeRetentionRate: 0.10,
  retentionReleaseAtProvisional: 0.50,
  retentionReleaseAtFinal: 1.00,
  inspectionFrequencyDays: 7,
  documentRetentionDays: 365,
  approvalHierarchyLevels: 3,
  qualityAcceptanceThreshold: 95,
  safetyInspectionRequired: true,
  environmentalComplianceRequired: true,
  localContentPercentage: 30,
  technicalSupervisionRequired: true,
  progressReportingFrequency: 'weekly'
};
