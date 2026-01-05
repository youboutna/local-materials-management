/**
 * Milestone Repository Interface
 * Defines contract for milestone data access
 * Can be implemented by Supabase, Java API, Prisma, PostGIS adapters
 */

import { MilestoneDTO, MilestoneFormDTO } from '@/types/milestone-dto';
import { IRepository } from './IRepository';

export interface IMilestoneRepository extends IRepository<MilestoneDTO, MilestoneFormDTO> {
  /**
   * Find milestones by project ID
   */
  findByProjectId(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Find milestones by phase ID
   */
  findByPhaseId(projectId: string, phaseId: string): Promise<MilestoneDTO[]>;

  /**
   * Find milestones on critical path
   */
  findCriticalPath(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Find overdue milestones
   */
  findOverdue(projectId: string): Promise<MilestoneDTO[]>;

  /**
   * Find upcoming milestones (next N days)
   */
  findUpcoming(projectId: string, days: number): Promise<MilestoneDTO[]>;

  /**
   * Bulk create milestones (for template generation)
   */
  createBulk(projectId: string, milestones: MilestoneFormDTO[]): Promise<MilestoneDTO[]>;

  /**
   * Delete all template-generated milestones for a phase
   */
  deleteTemplateByPhaseId(phaseId: string): Promise<void>;

  /**
   * Update milestone status (complete/pending)
   */
  updateStatus(id: string, status: string, completedDate?: string): Promise<MilestoneDTO>;
}
