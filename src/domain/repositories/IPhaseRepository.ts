/**
 * Phase Repository Interface
 * Defines contract for phase data access
 */

import { Phase, PhaseStep, PhaseTask } from '../entities/Phase';

export interface PhaseMetrics {
  materialCost: number;
  totalMaterials: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalInspections: number;
  passedInspections: number;
  inspectionPassRate: number;
  totalEmployees: number;
  totalPayments: number;
  totalPaymentAmount: number;
  totalDocuments: number;
  milestoneProgress: number;
  stepsCount: number;
  completedSteps: number;
}

export interface IPhaseRepository {
  // ============= CRUD Operations =============

  /**
   * Insert a phase_employees row (workforce plan entry).
   */
  insertPhaseEmployee(row: Record<string, unknown>): Promise<void>;

  /**
   * Find phase by ID
   */
  findById(id: string): Promise<Phase | null>;

  /**
   * Find all phases for a project (alias for getPhasesByProjectId)
   */
  findByProjectId(projectId: string): Promise<Phase[]>;

  /**
   * Find all phases for a project
   */
  getPhasesByProjectId(projectId: string): Promise<Phase[]>;

  /**
   * Create new phase
   */
  create(phase: Partial<Phase>): Promise<Phase>;

  /**
   * Update existing phase
   */
  update(id: string, updates: Partial<Phase>): Promise<Phase>;

  /**
   * Delete phase
   */
  delete(id: string): Promise<void>;

  // ============= Specialized Queries =============

  /**
   * Find phase for breadcrumb (minimal data)
   */
  findForBreadcrumb(id: string): Promise<{ id: string; name: string } | null>;

  /**
   * Get phase with all steps and tasks
   */
  findWithSteps(id: string): Promise<Phase | null>;

  /**
   * Get phase metrics
   */
  getMetrics(id: string): Promise<PhaseMetrics>;

  // ============= Step Operations =============

  /**
   * Add step to phase
   */
  addStep(phaseId: string, step: Omit<PhaseStep, 'id'>): Promise<PhaseStep>;

  /**
   * Update step
   */
  updateStep(phaseId: string, stepId: string, updates: Partial<PhaseStep>): Promise<PhaseStep>;

  /**
   * Delete step
   */
  deleteStep(phaseId: string, stepId: string): Promise<void>;

  // ============= Task Operations =============

  /**
   * Add task to step
   */
  addTask(phaseId: string, stepId: string, task: Omit<PhaseTask, 'id'>): Promise<PhaseTask>;

  /**
   * Update task
   */
  updateTask(phaseId: string, stepId: string, taskId: string, updates: Partial<PhaseTask>): Promise<PhaseTask>;

  /**
   * Delete task
   */
  deleteTask(phaseId: string, stepId: string, taskId: string): Promise<void>;

  /**
   * Update task status
   */
  updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<Phase>;

  // ============= Progress Management =============

  /**
   * Update phase progress
   */
  updateProgress(id: string, progress: number): Promise<void>;

  /**
   * Recalculate phase progress from steps/tasks
   */
  recalculateProgress(id: string): Promise<number>;

    /**
   * Find a phase by project ID and phase code
   */
  findByProjectIdAndCode(projectId: string, phaseCode: string): Promise<Phase | null>;
}
