/**
 * CheckpointDTO
 * 
 * Checkpoint complet avec toutes les vérifications
 * Lie un jalon (milestone) à ses vérifications requises
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
import { CheckpointVerificationResultDTO } from '@/dtos/entities/MilestoneDTO';;

/**
 * Checkpoint complet avec toutes les vérifications
 * Lie un jalon (milestone) à ses vérifications requises
 */
export interface CheckpointDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  milestoneId: string;
  
  // Identification
  title: string;
  description?: string;
  checkpointType: 'gate' | 'review' | 'approval' | 'delivery';
  
  // Seuils
  triggerProgress: number; // % de progression qui déclenche ce checkpoint
  financialWeight: number; // % du budget phase lié à ce checkpoint
  
  // État
  status: VerificationStatus;
  progress: number; // 0-100
  
  // Vérifications requises
  requiredInspections: string[];
  requiredDocuments: string[];
  requiredApprovals: string[];
  
  // Résultat de vérification
  verificationResult?: CheckpointVerificationResultDTO;
  
  // Actions déclenchées
  triggersPayment: boolean;
  paymentAmount?: number;
  triggersNotification: boolean;
  notificationRecipients?: string[];
  
  // Dates
  targetDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}
