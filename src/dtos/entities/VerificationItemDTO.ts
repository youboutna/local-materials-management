/**
 * VerificationItemDTO
 * 
 * Item de vérification individuel pour les checkpoints
 */

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
export type CheckpointCategory = 'inspection' | 'resource' | 'document' | 'service_fait' | 'approval' | 'material' | 'payment' | 'pv';

/**
 * Item de vérification individuel
 */

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

exeporting_frequency: 'weekly'
};