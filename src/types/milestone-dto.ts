// Milestone DTOs for project phases and referentials

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

/**
 * Milestone template in a referential (used for auto-generation)
 */
export interface MilestoneTemplateDTO {
  id: string;
  name: string;
  description?: string;
  /** Relative offset in days from phase start */
  relative_offset_days: number;
  /** Weight for progress calculation (0.1 - 1.0) */
  weight: number;
  /** If true, this milestone is critical for phase completion */
  is_critical: boolean;
  /** Tags/categories for filtering */
  tags?: string[];
}

/**
 * Milestone instance attached to a phase
 */
export interface MilestoneDTO {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  target_date: string;
  completed_date?: string;
  status: MilestoneStatus;
  weight: number;
  notes?: string;
  /** Whether from referential template or custom */
  is_from_template: boolean;
  template_id?: string;
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Summary for timeline views
 */
export interface MilestoneSummaryDTO {
  id: string;
  title: string;
  target_date: string;
  completed_date?: string;
  status: MilestoneStatus;
  phase_name?: string;
  phase_id?: string;
  weight: number;
  is_critical?: boolean;
}

/**
 * Form data for creating/updating milestones
 */
export interface MilestoneFormDTO {
  title: string;
  description?: string;
  target_date: string;
  weight: number;
  notes?: string;
  phase_id?: string;
}

/**
 * Progress summary for a phase based on milestones
 */
export interface MilestoneProgressDTO {
  total_milestones: number;
  completed_milestones: number;
  delayed_milestones: number;
  weighted_progress: number;
  next_milestone?: MilestoneSummaryDTO;
  overdue_milestones: MilestoneSummaryDTO[];
}
