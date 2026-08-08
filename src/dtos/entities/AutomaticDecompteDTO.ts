/**
 * AutomaticDecompteDTO
 * 
 * Décompte calculé automatiquement basé sur les jalons vérifiés
 * Règles Mauritanie: retenues, paiements échelonnés, inspections obligatoires
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';

/**
 * Décompte calculé automatiquement
 */


/**
 * Ligne de décompte détaillée
 */
export interface DecompteLineDTO {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  category: 'works' | 'materials' | 'services' | 'other';
  milestone_id?: string;
  checkpoint_id?: string;
  verification_status: VerificationStatus;
}