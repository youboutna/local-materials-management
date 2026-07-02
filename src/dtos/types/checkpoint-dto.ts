/**
 * Checkpoint & Verification DTOs
 * Architecture hiérarchique: Projet[jalons] → Phase[jalons→étapes] → Vérifications
 * 
 * Système de vérification: Inspections + Ressources + Documents → Validation Jalon
 */

// ============= STATUTS & TYPES =============

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
export type CheckpointCategory = 'inspection' | 'resource' | 'document' | 'service_fait' | 'approval';
export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';

// ============= VERIFICATION ITEMS =============

/**
 * Item de vérification individuel
 */
export interface VerificationItemDTO {
  id: string;
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

// ============= CHECKPOINT AGGREGATE =============

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

// ============= DÉCOMPTE AUTOMATIQUE =============

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

// ============= HIÉRARCHIE PROJET =============

/**
 * Agrégat Jalon Projet - Vue d'ensemble des jalons au niveau projet
 */
export interface ProjectMilestoneAggregateDTO {
  project_id: string;
  project_title: string;
  project_budget: number;
  project_progress: number;
  
  // Résumé jalons
  total_milestones: number;
  completed_milestones: number;
  verified_milestones: number;
  pending_verification: number;
  
  // Résumé financier
  total_decompte_amount: number;
  total_paid: number;
  total_retention_held: number;
  
  // Jalons par phase
  phases: {
    phase_id: string;
    phase_name: string;
    phase_progress: number;
    phase_budget: number;
    milestones: PhaseMilestoneDTO[];
  }[];
  
  // Prochaines actions
  next_checkpoints: CheckpointDTO[];
  overdue_checkpoints: CheckpointDTO[];
  
  // Chemin critique
  critical_path_milestones: string[];
  estimated_completion_date: string;
}

/**
 * Jalon au niveau phase avec lien aux étapes
 */
export interface PhaseMilestoneDTO {
  id: string;
  title: string;
  description?: string;
  type: 'gate' | 'deliverable' | 'checkpoint' | 'event';
  priority: 'critical' | 'high' | 'normal' | 'low';
  
  // Lien hiérarchique
  phase_id: string;
  step_id?: string;
  step_name?: string;
  
  // Progression
  target_date: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number;
  
  // Vérification
  requires_verification: boolean;
  verification_status?: VerificationStatus;
  checkpoint?: CheckpointDTO;
  
  // Financier
  financial_impact: number; // Montant lié à ce jalon
  triggers_decompte: boolean;
  decompte_id?: string;
  
  // Dépendances
  dependencies: string[];
  dependents: string[];
  is_on_critical_path: boolean;
  float_days?: number;
}

// ============= RÈGLES MAURITANIE =============

/**
 * Configuration des règles métier Mauritanie
 */
export interface MauritaniaBusinessRulesDTO {
  // Paiements échelonnés
  payment_thresholds: number[]; // [25, 50, 75, 100]
  
  // Retenue de garantie
  guarantee_retention_rate: number; // 0.10 (10%)
  retention_release_at_provisional: number; // % libéré à réception provisoire
  retention_release_at_final: number; // % libéré à réception définitive
  
  // Délais
  provisional_reception_delay_days: number; // Délai après fin travaux
  final_reception_delay_days: number; // Délai après réception provisoire
  
  // Inspections obligatoires
  mandatory_inspection_thresholds: number[]; // [25, 50, 75, 100]
  
  // Matériaux locaux
  local_material_priority_threshold: number; // 0.70 (70%)
  
  // Approbations
  requires_donor_approval: boolean;
  donor_approval_threshold: number; // Montant au-dessus duquel approbation bailleur requise
}

// ============= FORMULAIRES =============

/**
 * Formulaire de création checkpoint
 */
export interface CheckpointFormDTO {
  milestone_id: string;
  title: string;
  description?: string;
  checkpoint_type: 'gate' | 'review' | 'approval' | 'delivery';
  trigger_progress: number;
  financial_weight: number;
  required_inspections?: string[];
  required_documents?: string[];
  required_approvals?: string[];
  triggers_payment: boolean;
  target_date?: string;
}

/**
 * Formulaire de vérification
 */
export interface VerificationFormDTO {
  checkpoint_id: string;
  verification_items: {
    item_id: string;
    status: VerificationStatus;
    notes?: string;
    evidence_urls?: string[];
  }[];
  overall_notes?: string;
  verified_by: string;
}

// ============= CONSTANTES =============

export const DEFAULT_MAURITANIA_RULES: MauritaniaBusinessRulesDTO = {
  payment_thresholds: [25, 50, 75, 100],
  guarantee_retention_rate: 0.10,
  retention_release_at_provisional: 0.50,
  retention_release_at_final: 0.50,
  provisional_reception_delay_days: 30,
  final_reception_delay_days: 365,
  mandatory_inspection_thresholds: [25, 50, 75, 100],
  local_material_priority_threshold: 0.70,
  requires_donor_approval: false,
  donor_approval_threshold: 50000000, // 50M MRU
};

export const CHECKPOINT_TYPE_LABELS: Record<CheckpointDTO['checkpoint_type'], string> = {
  gate: 'Porte de validation',
  review: 'Revue technique',
  approval: 'Approbation',
  delivery: 'Livrable',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  verified: 'Vérifié',
  failed: 'Échoué',
  skipped: 'Ignoré',
};

export const DECOMPTE_STATUS_LABELS: Record<DecompteStatus, string> = {
  draft: 'Brouillon',
  calculated: 'Calculé',
  submitted: 'Soumis',
  approved: 'Approuvé',
  paid: 'Payé',
  rejected: 'Rejeté',
};
