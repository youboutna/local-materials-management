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

export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';

/**
 * Décompte calculé automatiquement
 */
export interface AutomaticDecompteDTO {
  id: string;
  project_id: string;
  phase_id?: string;
  decompte_number: number; // Numéro séquentiel du décompte
  decompte_type: PaymentType;
  
  // Montants
  contract_amount: number;
  previous_cumulative: number;
  current_period_amount: number;
  cumulative_amount: number;
  
  // Retenues Mauritanie
  retention_rate: number; // 10% par défaut
  retention_amount: number;
  previous_retention_released: number;
  retention_to_release: number;
  
  // Montant net
  net_payable: number;
  
  // Calcul basé sur jalons
  verified_milestones: {
    milestone_id: string;
    title: string;
    weight: number;
    amount: number;
    verified_at: string;
  }[];
  
  // Lignes détaillées
  lines: DecompteLineDTO[];
  
  // Justification
  progress_at_decompte: number;
  inspection_reference?: string;
  pv_reference?: string;
  
  // État
  status: DecompteStatus;
  calculated_at: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  
  // Historique
  calculation_log: {
    timestamp: string;
    action: string;
    details: Record<string, unknown>;
  }[];
}

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
