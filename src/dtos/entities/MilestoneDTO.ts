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
  completedDate?: string;
  status: MilestoneStatus;
  /** Milestone type */
  type: MilestoneType;
  /** Priority level */
  priority: MilestonePriority;
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
}

/**
 * Summary for timeline views (Gantt chart compatible)
 */
export interface MilestoneSummaryDTO {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
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
