/**
 * @deprecated Ré-export de compatibilité (chemin legacy `@/dtos/types/checkpoint-dto`).
 *
 * Les types Checkpoint / Vérification sont canoniques dans
 * `@/dtos/entities/MilestoneDTO` (un checkpoint est une action de vérification
 * d'un jalon de projet ou de phase). Les DTO de décompte restent dans
 * `@/dtos/entities/DecompteDTO`.
 */

export type {
  CheckpointCategory,
  CheckpointDTO,
  CheckpointType,
  CheckpointVerificationResultDTO,
  MilestoneStatus,
  VerificationItemDTO,
  VerificationStatus,
} from '@/dtos/entities/MilestoneDTO';

export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';

export type { MauritaniaBusinessRulesDTO } from '@/dtos/entities/VerificationItemDTO';

import type {
  CheckpointDTO,
  CheckpointType,
  VerificationStatus,
} from '@/dtos/entities/MilestoneDTO';

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
  decompte_number: number;
  decompte_type: PaymentType;

  contract_amount: number;
  previous_cumulative: number;
  current_period_amount: number;
  cumulative_amount: number;

  retention_rate: number;
  retention_amount: number;
  previous_retention_released: number;
  retention_to_release: number;

  net_payable: number;

  verified_milestones: {
    milestone_id: string;
    title: string;
    weight: number;
    amount: number;
    verified_at: string;
  }[];

  lines: DecompteLineDTO[];

  progress_at_decompte: number;
  inspection_reference?: string;
  pv_reference?: string;

  status: DecompteStatus;
  calculated_at: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;

  calculation_log: {
    timestamp: string;
    action: string;
    details: Record<string, unknown>;
  }[];
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

  phase_id: string;
  step_id?: string;
  step_name?: string;

  target_date: string;
  completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number;

  requires_verification: boolean;
  verification_status?: VerificationStatus;
  checkpoint?: CheckpointDTO;

  financial_impact: number;
  triggers_decompte: boolean;
  decompte_id?: string;

  dependencies: string[];
  dependents: string[];
  is_on_critical_path: boolean;
  float_days?: number;
}

/**
 * Agrégat Jalon Projet - Vue d'ensemble des jalons au niveau projet
 */
export interface ProjectMilestoneAggregateDTO {
  project_id: string;
  project_title: string;
  project_budget: number;
  project_progress: number;

  total_milestones: number;
  completed_milestones: number;
  verified_milestones: number;
  pending_verification: number;

  total_decompte_amount: number;
  total_paid: number;
  total_retention_held: number;

  phases: {
    phase_id: string;
    phase_name: string;
    phase_progress: number;
    phase_budget: number;
    milestones: PhaseMilestoneDTO[];
  }[];

  next_checkpoints: CheckpointDTO[];
  overdue_checkpoints: CheckpointDTO[];

  critical_path_milestones: string[];
  estimated_completion_date: string;
}

/**
 * Formulaire de création checkpoint
 */
export interface CheckpointFormDTO {
  milestone_id: string;
  title: string;
  description?: string;
  checkpoint_type: CheckpointType;
  trigger_progress: number;
  financial_weight: number;
  required_inspections?: string[];
  required_documents?: string[];
  required_approvals?: string[];
  triggers_payment: boolean;
  target_date?: string;
}
