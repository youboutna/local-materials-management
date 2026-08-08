/**
 * CheckpointVerificationResultDTO
 * 
 * Résultat de vérification d'un checkpoint
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

// Interface locale pour éviter les imports cycliques


import { VerificationItemDTO } from '@/dtos/entities/MilestoneDTO';;

/**
 * Résultat de vérification d'un checkpoint
 */
export interface CheckpointVerificationResultDTO {
  checkpointId: string;
  milestoneId: string;
  overallStatus: VerificationStatus;
  verificationScore: number; // 0-100%
  verificationItems: VerificationItemDTO[];
  requiredItemsCount: number;
  verifiedItemsCount: number;
  failedItemsCount: number;
  blockingIssues: string[];
  warnings: string[];
  canProceed: boolean;