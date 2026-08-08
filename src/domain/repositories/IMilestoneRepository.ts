/**
 * Milestone Repository Interface
 * Defines the contract for milestone operations
 * Following hexagonal architecture principles
 */

import { MaterialUsageDTO } from '@/dtos/entities/MaterialDTO';;

export interface CreateMilestoneData {
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  completionDate?: string;
  status?: string;
  priority?: MilestonePriority;
  type?: MilestoneType;
  stageType?: string;
  weight?: number;
  dependencies?: string[];
  notes?: string;
  materialUsage?: MaterialUsageDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
}

export interface UpdateMilestoneData {
  title?: string;
  description?: string;
  targetDate?: string;
  completionDate?: string;
  status?: string;
  priority?: MilestonePriority;
  type?: MilestoneType;
  stageType?: string;
  weight?: number;
  dependencies?: string[];
  notes?: string;
  materialUsage?: MaterialUsageDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
}

export interface IMilestoneRepository {
  /**
   * Find milestone by ID
   */
  findById(id: string): Promise<MilestoneDTO | null>;

  /**
   * Find all milestones for a project
   */
  findByProjectId(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Find all milestones for a phase
   */
  findByPhaseId(phaseId: string): Promise<MilestoneDTO[]>;

  /**
   * Find completed milestones for a project
   */
  findCompletedByProjectId(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Find pending milestones for a project
   */
  findPendingByProjectId(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Create a new milestone
   */
  create(data: CreateMilestoneData): Promise<MilestoneDTO>;

  /**
   * Update a milestone
   */
  update(id: string, data: UpdateMilestoneData): Promise<MilestoneDTO | null>;

  /**
   * Delete a milestone
   */
  delete(id: string): Promise<boolean>;

  /**
   * Mark milestone as completed
   */
  markAsCompleted(id: string, completionDate?: string): Promise<MilestoneDTO | null>;

  /**
   * Get milestones by status
   */
  findByStatus(projectId: string, status: string): Promise<MilestoneDTO[]>;

  /**
   * Get milestone statistics for a project
   */
  getStats(projectId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;
}
