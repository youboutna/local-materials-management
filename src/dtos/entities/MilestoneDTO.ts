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
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'notApplicable';
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
  prioritying[];
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
  schedulePerformanceIndex?: number;
  /** Critical path status */
  criticalPath_status: 'on_track' | 'at_risk' | 'delayed';
  /** Days of float remaining on critical path */
  criticalPathFloat_days?: number;
  nextMilestone?: MilestoneSummaryDTO;
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
export const MILESTONE_TYPES: Record<MilestoneTyp: 'Point de contrôle',
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
  critical: { labent';
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
// Moved from src/components/project/StepDashboard.tsx
export type MilestoneSummary = {
  id?: string;
  name?: string;
  dueDate?: string;
}

// Moved from src/components/project/hierarchy/PhaseWithDirectMilestonesView.tsx
export interface Milestone {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  type?: MilestoneType | string;
  status: string;
  dueDate?: string;
  completionDate?: string;
  documents?: unknown[];
}

// Moved from src/components/project/hierarchy/StepNode.tsx
export interface Milestone {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  status: string;
  dueDate?: string;
  completionDate?: string;
}

// Moved from src/hooks/hexagonal/useMilestonesHex.ts
export interface Milestone {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  completionDate?: string;
  status: 'pending' | 'inProgress' | 'completed' | 'delayed';
  weight: number;
  notes?: string;
}

// Moved from src/application/services/MilestoneService.ts
export interface CreateMilestoneRequestDto {
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  status?: 'pending' | 'inProgress' | 'completed' | 'delayed' | 'cancelled';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deliverables?: string[];
  dependencies?: string[];
  assignedTo?: string;
  budget?: number;
  actualCost?: number;
  type?: MilestoneType;
  weight?: number;
  notes?: string;
  stageType?: string;
  materialUsage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
  material_cost_estimate?: number;
  actual_material_cost?: number;
}

// Moved from src/application/services/MilestoneService.ts
export interface UpdateMilestoneRequestDto {
  title?: string;
  description?: string;
  targetDate?: string;
  actual_completion_date?: string;
  status?: 'pending' | 'inProgress' | 'completed' | 'delayed' | 'cancelled';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deliverables?: string[];
  dependencies?: string[];
  assignedTo?: string;
  budget?: number;
  actualCost?: number;
  type?: MilestoneType;
  weight?: number;
  notes?: string;
  stageType?: string;
  materialUsage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
  material_cost_estimate?: number;
  actual_material_cost?: number;
}

// Moved from src/application/services/MilestoneService.ts
export interface MilestoneStatsDto {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  delayed: number;
  cancelled: number;
  completionRate: number;
  on_time_completion_rate: number;
  averageProgress: number;
}

// Moved from src/hooks/useProjectCheckpoints.ts
export interface ProjectCheckpoint {
  id: string;
  phaseId: string;
  phaseName?: string;
  phaseName?: string;
  estimatedCost?: number;
  estimatedCost?: number;
  status: 'pending' | 'completed';
  progress: number;
  documents: {
    id: string;
    type: string;
    url: string;
  }[];
}

// Moved from src/hooks/useProjectCheckpoints.ts
export interface ProjectMilestone {
  id: string;
  phaseId: string | null;
  status: string;
  [key: string]: any;
}

// Moved from src/hooks/useCheckpointVerification.ts
export interface SimpleCheckpoint {
  id: string;
  title: string;
  status: string;
  triggerProgress: number;
  verificationScore: number;
  phaseId: string | null;
}

// Moved from src/application/services/ProjectImportExportService.ts
export interface ProjectImportMilestone {
  externalRef?: string;
  title?: string;
  name?: string;
  description?: string;
  targetDate?: string;
  targetDate?: string;
  status?: string;
  progress?: number;
  progressPercent?: number;
  completionDate?: string;
  completionDate?: string;
}

// Moved from src/application/services/WorkflowOrchestrator.ts
export interface CheckpointDTO {
  id: string;
  phaseId: string;
  milestoneId: string;
  status: 'pending' | 'inProgress' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  documents?: string[];
  projectId: string;
}