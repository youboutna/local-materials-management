/**
 * CheckpointVerificationResultDTO
 * 
 * Résultat de vérification d'un checkpoint
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

// Interface locale pour éviter les imports cycliques
interface VerificationItemLocal {
  id: string;
  category: string;
  title: string;
  description?: string;
  status: VerificationStatus;
  required: boolean;
  weight: number;
  reference_id?: string;
  reference_type?: 'inspection' | 'document' | 'material' | 'payment' | 'pv';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  evidence_urls?: string[];
}

import { VerificationItemDTO } from './VerificationItemDTO';

/**
 * Résultat de vérification d'un checkpoint
 */
export interface CheckpointVerificationResultDTO {
  checkpoint_id: string;
  milestone_id: string;
  overall_status: VerificationStatus;
  verification_score: number; // 0-100%
  verification_items: VerificationItemDTO[];
  required_items_count: number;
  verified_items_count: number;
  failed_items_count: number;
  blocking_issues: string[];
  warnings: string[];
  can_proceed: boolean;
  verified_at?: string;
  verified_by?: string;
}
