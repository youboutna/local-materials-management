/**
 * VerificationItemDTO
 * 
 * Item de vérification individuel pour les checkpoints
 */

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
export type CheckpointCategory = 'inspection' | 'resource' | 'document' | 'service_fait' | 'approval';

/**
 * Item de vérification individuel
 */
export interface VerificationItemDTO {
  id: string;
  name?: string; // Optional name field for flexibility
  category: CheckpointCategory;
  title: string;
  description?: string;
  status: VerificationStatus;
  required: boolean;
  weight: number; // Poids dans le calcul global (0-1)
  reference_id?: string; // ID de l'inspection, document, etc.
  reference_type?: 'inspection' | 'document' | 'material' | 'payment' | 'pv';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  evidence_urls?: string[];
}
