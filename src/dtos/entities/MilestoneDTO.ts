/**
 * MilestoneDTO - Centralized DTO Structure
 * Following PROMPTS.md naming conventions and hexagonal architecture
 * 
 * Jalon de projet avec méthodologie PM (Waterfall, PERT, CPM)
 */

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
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  target_date: string;
  /** Earliest start date (PERT forward pass) */
  early_start_date?: string;
  /** Latest finish date without delay (PERT backward pass) */
  late_finish_date?: string;
  completed_date?: string;
  status: MilestoneStatus;
  /** Milestone type */
  type: MilestoneType;
  /** Priority level */
  priority: MilestonePriority;
  weight: number;
  notes?: string;
  /** Whether from referential template or custom */
  is_from_template: boolean;
  template_id?: string;
  /** Predecessor milestone IDs (FS - Finish-to-Start dependencies) */
  dependencies?: string[];
  /** Float/slack time in days (0 = critical path) */
  float_days?: number;
  /** Is on critical path */
  is_on_critical_path?: boolean;
  /** Deliverables list */
  deliverables?: string[];
  /** Approval status for gate milestones */
  approval_status?: 'pending' | 'approved' | 'rejected' | 'not_applicable';
  /** Approved by user ID */
  approved_by?: string;
  /** Approval date */
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Summary for timeline views (Gantt chart compatible)
 */
export interface MilestoneSummaryDTO {
  id: string;
  title: string;
  target_date: string;
  completed_date?: string;
  status: MilestoneStatus;
  type: MilestoneType;
  priority: MilestonePriority;
  phase_name?: string;
  phase_id?: string;
  weight: number;
  is_critical?: boolean;
  /** Float days for scheduling visualization */
  float_days?: number;
  /** Percent complete (0-100) for in-progress milestones */
  percent_complete?: number;
}

/**
 * Form data for creating/updating milestones
 */
export interface MilestoneFormDTO {
  title: string;
  description?: string;
  target_date: string;
  type: MilestoneType;
  priority: MilestonePriority;
  weight: number;
  notes?: string;
  phase_id?: string;
  deliverables?: string[];
  dependencies?: string[];
}

/**
 * Progress summary for a phase based on milestones
 * Aligned with Earned Value Management (EVM) concepts
 */
export interface MilestoneProgressDTO {
  total_milestones: number;
  completed_milestones: number;
  delayed_milestones: number;
  /** Weighted progress (0-100) */
  weighted_progress: number;
  /** Schedule Performance Index (SPI) = Earned Value / Planned Value */
  schedule_performance_index?: number;
  /** Critical path status */
  critical_path_status: 'on_track' | 'at_risk' | 'delayed';
  /** Days of float remaining on critical path */
  critical_path_float_days?: number;
  next_milestone?: MilestoneSummaryDTO;
  overdue_milestones: MilestoneSummaryDTO[];
  /** Upcoming milestones in next 14 days */
  upcoming_milestones: MilestoneSummaryDTO[];
}

/**
 * PERT estimation for milestone duration
 */
export interface PERTEstimateDTO {
  milestone_id: string;
  /** Optimistic duration (days) */
  optimistic: number;
  /** Most likely duration (days) */
  most_likely: number;
  /** Pessimistic duration (days) */
  pessimistic: number;
  /** Expected duration = (O + 4M + P) / 6 */
  expected_duration: number;
  /** Standard deviation = (P - O) / 6 */
  standard_deviation: number;
}

/**
 * Critical path analysis result
 */
export interface CriticalPathDTO {
  project_id: string;
  /** List of milestone IDs on critical path */
  critical_path_milestones: string[];
  /** Total project duration based on critical path */
  total_duration_days: number;
  /** Project end date based on critical path */
  estimated_end_date: string;
  /** Near-critical paths (float < 5 days) */
  near_critical_paths: Array<{
    milestones: string[];
    float_days: number;
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
