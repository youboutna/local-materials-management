/**
 * CheckpointDTO
 * 
 * Checkpoint complet avec toutes les vérifications
 * Lie un jalon (milestone) à ses vérifications requises
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
import { CheckpointVerificationResultDTO } from './CheckpointVerificationResultDTO';

/**
 * Checkpoint complet avec toutes les vérifications
 * Lie un jalon (milestone) à ses vérifications requises
 */
export interface CheckpointDTO {
  id: string;
  project_id: string;
  phase_id?: string;
  step_id?: string;
  milestone_id: string;
  
  // Identification
  title: string;
  description?: string;
  checkpoint_type: 'gate' | 'review' | 'approval' | 'delivery';
  
  // Seuils
  trigger_progress: number; // % de progression qui déclenche ce checkpoint
  financial_weight: number; // % du budget phase lié à ce checkpoint
  
  // État
  status: VerificationStatus;
  progress: number; // 0-100
  
  // Vérifications requises
  required_inspections: string[];
  required_documents: string[];
  required_approvals: string[];
  
  // Résultat de vérification
  verification_result?: CheckpointVerificationResultDTO;
  
  // Actions déclenchées
  triggers_payment: boolean;
  payment_amount?: number;
  triggers_notification: boolean;
  notification_recipients?: string[];
  
  // Dates
  target_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}
