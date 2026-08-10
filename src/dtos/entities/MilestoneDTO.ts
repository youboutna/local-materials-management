/**
 * MilestoneDTO - Centralized DTO Structure
 * Following PROMPTS.md naming conventions and hexagonal architecture
 * 
 * Jalon de projet avec méthodologie PM (Waterfall, PERT, CPM)
 */

import { UserRoleDTO } from "./UserDTO";

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

/**
 * Milestone type according to PM standards
 * - gate: Decision point requiring approval (phase gate review)
 * - deliverable: Tangible output completion
 * - checkpoint: Progress verification point
 * - event: Key project event (kickoff, handover, etc.)
 */
export type MilestoneType = 'gate' | 'deliverable' | 'checkpoint' | 'event';

/**
 * Milestone priority for scheduling (PERT/CPM)
 * - critical: On critical path, any delay impacts project end date
 * - high: Important but with some slack time
 * - normal: Standard milestone with float
 * - low: Optional milestone
 */
export type MilestonePriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Milestone template in a referential (used for auto-generation)
 * Aligned with Waterfall phase-gate methodology
 */
export interface MilestoneTemplateDTO {
  id: string;
  name: string;
  description?: string;
  /** Relative offset in days from phase start */
  relative_offset_days: number;
  /** Weight for progress calculation (0.1 - 1.0) */
  weight: number;
  /** If true, this milestone is critical for phase completion (CPM) */
  is_critical: boolean;
  /** Type of milestone according to PM standards */
  type: MilestoneType;
  /** Priority level for scheduling */
  priority: MilestonePriority;
  /** Tags/categories for filtering */
  tags?: string[];
  /** Predecessor milestone IDs (for PERT/CPM dependency tracking) */
  predecessor_ids?: string[];
  /** Deliverables expected at this milestone */
  deliverables?: string[];
  /** Approval requirements for gate milestones */
  approval_requirements?: string[];
  requiresInspection?: true;
}

/**
 * Milestone instance attached to a phase
 * Supports full PERT/CPM scheduling with dependencies
 * Database DTO format (snake_case)
 */
export interface MilestoneDTO {
  assignedTo: UserRoleDTO;
  createdBy: UserRoleDTO;
  completedate: string | number | Date;

  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  /** Earliest start date (PERT forward pass) */
  earlyStartDate?: string;
  /** Latest finish date without delay (PERT backward pass) */
  lateFinishDate?: string;
  completionDate?: string;
  status: MilestoneStatus;
  /** Milestone type */
  type: MilestoneType;
  /** Priority level */
  priority: MilestonePriority;
  /** Stage category for workflow grouping */
  stageType?: string;
  weight: number;
  notes?: string;
  /** Whether from referential template or custom */
  isFromTemplate: boolean;
  templateId?: string;
  /** Predecessor milestone IDs (FS - Finish-to-Start dependencies) */
  dependencies?: string[];
  /** Float/slack time in days (0 = critical path) */
  floatDays?: number;
  /** Is on critical path */
  isOnCriticalPath?: boolean;
  /** Deliverables list */
  deliverables?: string[];
  /** Approval status for gate milestones */
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_applicable';
  /** Approved by user ID */
  approvedBy?: string;
  /** Approval date */
  approvalDate?: string;
  createdAt: string;
  updatedAt: string;
  materialUsage?: MaterialUsageDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
}

export interface MaterialUsageDTO {
  materialId: string;
  plannedQuantity: number;
  usedQuantity: number;
  unitCost?: number;
}

/**
 * Summary for timeline views (Gantt chart compatible)
 */
export interface MilestoneSummaryDTO {
  id: string;
  title: string;
  targetDate: string;
  completionDate?: string;
  status: MilestoneStatus;
  type: MilestoneType;
  priority: MilestonePriority;
  phaseDame?: string;
  phaseId?: string;
  weight: number;
  isCritical?: boolean;
  /** Float days for scheduling visualization */
  floatDays?: number;
  /** Percent complete (0-100) for in-progress milestones */
  percentComplete?: number;
}

/**
 * Form data for creating/updating milestones
 */
export interface MilestoneFormDTO {
  title: string;
  description?: string;
  targetDate: string;
  type: MilestoneType;
  priority: MilestonePriority;
  weight: number;
  notes?: string;
  phaseId?: string;
  deliverables?: string[];
  dependencies?: string[];
}

/**
 * Progress summary for a phase based on milestones
 * Aligned with Earned Value Management (EVM) concepts
 */
export interface MilestoneProgressDTO {
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  /** Weighted progress (0-100) */
  weightedProgress: number;
  /** Schedule Performance Index (SPI) = Earned Value / Planned Value */
  schedulePerformance_index?: number;
  /** Critical path status */
  criticalPath_status: 'on_track' | 'at_risk' | 'delayed';
  /** Days of float remaining on critical path */
  criticalPathFloat_days?: number;
  next_milestone?: MilestoneSummaryDTO;
  overdueMilestones: MilestoneSummaryDTO[];
  /** Upcoming milestones in next 14 days */
  upcomingMilestones: MilestoneSummaryDTO[];
}

/**
 * PERT estimation for milestone duration
 */
export interface PERTEstimateDTO {
  milestoneId: string;
  /** Optimistic duration (days) */
  optimistic: number;
  /** Most likely duration (days) */
  mostLikely: number;
  /** Pessimistic duration (days) */
  pessimistic: number;
  /** Expected duration = (O + 4M + P) / 6 */
  expectedDuration: number;
  /** Standard deviation = (P - O) / 6 */
  standardDeviation: number;
}

/**
 * Critical path analysis result
 */
export interface CriticalPathDTO {
  projectId: string;
  /** List of milestone IDs on critical path */
  criticalPathMilestones: string[];
  /** Total project duration based on critical path */
  totalDurationDays: number;
  /** Project end date based on critical path */
  estimatedEndDate: string;
  /** Near-critical paths (float < 5 days) */
  nearCriticalPaths: Array<{
    milestones: string[];
    floatDays: number;
  }>;
}

/**
 * Milestone role in phase gate methodology
 */
export const MILESTONE_TYPES: Record<MilestoneType, { label: string; description: string; icon: string }> = {
  gate: {
    label: 'Point de décision',
    description: 'Revue de phase nécessitant une approbation formelle pour continuer',
    icon: 'ShieldCheck'
  },
  deliverable: {
    label: 'Livrable',
    description: 'Achèvement d\'un livrable tangible du projet',
    icon: 'Package'
  },
  checkpoint: {
    label: 'Point de contrôle',
    description: 'Vérification de l\'avancement sans approbation formelle',
    icon: 'CheckSquare'
  },
  event: {
    label: 'Événement clé',
    description: 'Événement important du projet (lancement, transfert, etc.)',
    icon: 'Flag'
  }
};

/**
 * Priority labels and colors
 */
export const MILESTONE_PRIORITIES: Record<MilestonePriority, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'destructive' },
  high: { label: 'Haute', color: 'warning' },
  normal: { label: 'Normale', color: 'default' },
  low: { label: 'Basse', color: 'secondary' }
};

/**
 * Generated Milestone DTO
 * Used for milestone generation from templates
 */
export interface GeneratedMilestoneDTO {
  title: string;
  description?: string;
  targetDate: string;
  type: 'gate' | 'deliverable' | 'checkpoint' | 'event';
  priority: 'critical' | 'high' | 'normal' | 'low';
  weight: number;
  deliverables?: string[];
  dependencies?: string[];
  phaseId: string;
  requiresInspection?: boolean;
  inspectionType?: string;
  templateId?: string;
  phaseCode?: string;
}

/* =============================================================================
 * CHECKPOINT & VERIFICATION (canonical)
 * Un checkpoint n'est pas une entité autonome : c'est l'action de vérification
 * d'un jalon (milestone) d'un projet ou d'une phase. Les DTO associés sont donc
 * définis ici, aux côtés du MilestoneDTO. Les anciens fichiers
 * (CheckpointDTO.ts, CheckpointVerificationDTO.ts,
 * CheckpointVerificationResultDTO.ts, VerificationItemDTO.ts) ne sont plus que
 * des ré-exports de compatibilité.
 * ========================================================================== */

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

/** Catégories de vérification (union de tous les usages métier) */
export type CheckpointCategory =
  | 'inspection'
  | 'resource'
  | 'document'
  | 'service_fait'
  | 'approval'
  | 'material'
  | 'payment'
  | 'pv'
  | 'quality'
  | 'safety'
  | 'documentation'
  | 'delivery';

export type CheckpointType = 'gate' | 'review' | 'approval' | 'delivery';

/** Item de vérification individuel rattaché à un checkpoint de jalon */
export interface VerificationItemDTO {
  id: string;
  name?: string;
  category: CheckpointCategory;
  title: string;
  description?: string;
  status: VerificationStatus;
  required: boolean;
  /** Poids dans le calcul global (0-1) */
  weight: number;
  reference_id?: string;
  reference_type?: 'inspection' | 'document' | 'material' | 'payment' | 'pv';
  verified_by?: string;
  verified_at?: string;
  completedAt?: string;
  notes?: string;
  evidence_urls?: string[];
}

/** Résultat de vérification d'un checkpoint de jalon */
export interface CheckpointVerificationResultDTO {
  checkpoint_id: string;
  milestone_id: string;
  overall_status: VerificationStatus;
  /** Score 0-100 */
  verification_score: number;
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

/** Checkpoint : vérifications requises rattachées à un jalon */
export interface CheckpointDTO {
  id: string;
  project_id: string;
  phase_id?: string;
  step_id?: string;
  milestone_id: string;

  title: string;
  description?: string;
  checkpoint_type: CheckpointType;

  /** % de progression qui déclenche ce checkpoint */
  trigger_progress: number;
  /** % du budget phase lié à ce checkpoint */
  financial_weight: number;

  status: VerificationStatus;
  progress: number;

  required_inspections: string[];
  required_documents: string[];
  required_approvals: string[];

  verification_result?: CheckpointVerificationResultDTO;

  triggers_payment: boolean;
  payment_amount?: number;
  triggers_notification: boolean;
  notification_recipients?: string[];

  target_date?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

/* --- Requêtes / réponses de vérification --- */

export interface VerifyCheckpointRequestDto {
  checkpoint: CheckpointDTO;
  projectId?: string;
  phaseId?: string;
}

export interface CheckpointVerificationResult {
  id: string;
  checkpointId: string;
  projectId: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  documents?: string[];
  status: 'pending' | 'verified' | 'rejected';
}

export interface VerifyCheckpointResponseDto {
  result: CheckpointVerificationResult;
  errors?: string[];
}

export interface VerifyInspectionsRequestDto {
  requiredInspectionIds: string[];
  triggerProgress: number;
  projectId: string;
}

export interface VerifyDocumentsRequestDto {
  requiredDocumentIds: string[];
  projectId: string;
}

export interface VerifyApprovalsRequestDto {
  requiredApprovalIds: string[];
  projectId: string;
}

export interface VerifyResourcesRequestDto {
  stepId: string;
  projectId: string;
}

export interface VerifyServiceFaitRequestDto {
  checkpointId: string;
  projectId: string;
}

export interface CreateCheckpointVerificationDto {
  checkpointId: string;
  projectId: string;
  verifiedBy: string;
  notes?: string;
  documents?: string[];
}

export interface UpdateCheckpointVerificationDto {
  verified?: boolean;
  notes?: string;
  documents?: string[];
  status?: 'pending' | 'verified' | 'rejected';
}
