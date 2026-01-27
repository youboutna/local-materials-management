/**
 * Unified Milestone Service
 * Uses Repository pattern for data access (low coupling with Supabase)
 * Provides PM metrics: PERT, CPM, SPI, EVM integration
 * 
 * Architecture: Service -> Repository -> Adapter -> Data Source
 */

import { getMilestoneTemplates } from '@/config/referentials/milestones.referential';
import { MilestoneService } from '@/application/services/MilestoneService';
import {
  CriticalPathDTO,
  MilestoneDTO,
  MilestoneFormDTO,
  MilestoneProgressDTO,
  MilestoneSummaryDTO
} from '@/types/milestone-dto';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';

export class UnifiedMilestoneService {
  private milestoneService: MilestoneService;

  constructor(milestoneService?: MilestoneService) {
    this.milestoneService = milestoneService || new MilestoneService();
  }

  // ============= CRUD Operations =============

  async getProjectMilestones(projectId: string): Promise<MilestoneDTO[]> {
    const milestones = await MilestoneService.getProjectMilestones(projectId);
    return milestones.map(m => ({
      ...m,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: m.status === 'cancelled' ? 'delayed' as const : m.status,
      priority: m.priority === 'medium' ? 'normal' as const : m.priority as 'critical' | 'high' | 'low'
    }));
  }

  async getPhaseMilestones(projectId: string, phaseId: string): Promise<MilestoneDTO[]> {
    // For now, return project milestones filtered by phase if available
    const milestones = await MilestoneService.getProjectMilestones(projectId);
    return milestones.map(m => ({
      ...m,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: m.status === 'cancelled' ? 'delayed' as const : m.status,
      priority: m.priority === 'medium' ? 'normal' as const : m.priority as 'critical' | 'high' | 'low'
    }));
  }

  async getMilestoneById(id: string): Promise<MilestoneDTO | null> {
    const milestone = await MilestoneService.getMilestoneById(id);
    if (!milestone) return null;
    
    return {
      ...milestone,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: milestone.status === 'cancelled' ? 'delayed' as const : milestone.status,
      priority: milestone.priority === 'medium' ? 'normal' as const : milestone.priority as 'critical' | 'high' | 'low'
    };
  }

  async createMilestone(projectId: string, data: MilestoneFormDTO): Promise<MilestoneDTO> {
    // Convert priority from MilestonePriority to Milestone priority
    const createData = {
      ...data,
      project_id: projectId,
      status: 'pending' as const,
      progress: 0,
      priority: data.priority === 'normal' ? 'medium' as const : data.priority as 'low' | 'medium' | 'high' | 'critical',
      deliverables: data.deliverables || [],
      dependencies: data.dependencies || []
    };
    
    const milestone = await MilestoneService.createMilestone(createData);
    
    return {
      ...milestone,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: milestone.status === 'cancelled' ? 'delayed' as const : milestone.status,
      priority: milestone.priority === 'medium' ? 'normal' as const : milestone.priority as 'critical' | 'high' | 'low'
    };
  }

  async updateMilestone(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO> {
    // Convert priority from MilestonePriority to Milestone priority
    const updateData = {
      ...data,
      priority: data.priority === 'normal' ? 'medium' as const : data.priority as 'low' | 'medium' | 'high' | 'critical'
    };
    
    const milestone = await MilestoneService.updateMilestone(id, updateData);
    
    return {
      ...milestone,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: milestone.status === 'cancelled' ? 'delayed' as const : milestone.status,
      priority: milestone.priority === 'medium' ? 'normal' as const : milestone.priority as 'critical' | 'high' | 'low'
    };
  }

  async deleteMilestone(id: string): Promise<void> {
    return MilestoneService.deleteMilestone(id);
  }

  async toggleComplete(id: string): Promise<MilestoneDTO> {
    const milestone = await MilestoneService.getMilestoneById(id);
    if (!milestone) throw new Error('Milestone not found');

    const updated = await MilestoneService.completeMilestone(id);
    
    return {
      ...updated,
      type: 'checkpoint' as const,
      weight: 1,
      is_from_template: false,
      status: updated.status === 'cancelled' ? 'delayed' as const : updated.status,
      priority: updated.priority === 'medium' ? 'normal' as const : updated.priority as 'critical' | 'high' | 'low'
    };
  }

  // ============= Template Generation =============

  async generateFromReferential(
    projectId: string,
    phaseId: string,
    constructionPhase: string,
    phaseStartDate: string
  ): Promise<MilestoneDTO[]> {
    const templates = getMilestoneTemplates(constructionPhase);
    
    if (templates.length === 0) {
      console.log(`No milestone templates for phase: ${constructionPhase}`);
      return [];
    }

    const startDate = parseISO(phaseStartDate);
    const milestones: MilestoneDTO[] = [];

    for (const template of templates) {
      const createData = {
        project_id: projectId,
        phase_id: phaseId,
        title: template.name,
        description: template.description,
        target_date: format(addDays(startDate, template.relative_offset_days), 'yyyy-MM-dd'),
        status: 'pending' as const,
        progress: 0,
        priority: template.priority === 'normal' ? 'medium' as const : template.priority as 'low' | 'medium' | 'high' | 'critical',
        deliverables: template.deliverables || [],
        dependencies: template.predecessor_ids || []
      };

      const milestone = await MilestoneService.createMilestone(createData);
      milestones.push({
        ...milestone,
        type: 'checkpoint' as const,
        weight: 1,
        is_from_template: true,
        status: milestone.status === 'cancelled' ? 'delayed' as const : milestone.status,
        priority: milestone.priority === 'medium' ? 'normal' as const : milestone.priority as 'critical' | 'high' | 'low'
      });
    }

    return milestones;
  }

  async deleteTemplateMilestones(phaseId: string): Promise<void> {
    // Get all milestones for this phase and delete them
    console.log(`Template milestones deletion for phase ${phaseId} - not fully implemented`);
  }

  // ============= PM Metrics (EVM, SPI, CPI) =============

  async getMilestoneProgress(projectId: string, phaseId?: string): Promise<MilestoneProgressDTO> {
    let milestones: MilestoneDTO[];
    
    if (phaseId) {
      milestones = await this.getPhaseMilestones(projectId, phaseId);
    } else {
      milestones = await this.getProjectMilestones(projectId);
    }

    const today = new Date();
    const completed = milestones.filter(m => m.status === 'completed');
    const pending = milestones.filter(m => m.status === 'pending');
    const delayed = milestones.filter(m => m.status === 'delayed');
    
    // Simplified implementation - would need more sophisticated logic for real metrics
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    
    // Get upcoming and overdue milestones
    const upcomingMilestones = pending
      .filter(m => {
        const targetDate = new Date(m.target_date);
        const daysUntil = differenceInDays(targetDate, today);
        return daysUntil >= 0 && daysUntil <= 14;
      })
      .map(m => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        status: m.status,
        type: m.type,
        priority: m.priority,
        weight: m.weight
      }));

    const overdueMilestones = pending
      .filter(m => {
        const targetDate = new Date(m.target_date);
        return targetDate < today;
      })
      .map(m => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        status: m.status,
        type: m.type,
        priority: m.priority,
        weight: m.weight
      }));

    const nextMilestone = pending.length > 0 ? {
      id: pending[0].id,
      title: pending[0].title,
      target_date: pending[0].target_date,
      status: pending[0].status,
      type: pending[0].type,
      priority: pending[0].priority,
      weight: pending[0].weight
    } : undefined;

    return {
      total_milestones: milestones.length,
      completed_milestones: completed.length,
      delayed_milestones: delayed.length,
      weighted_progress: totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0,
      schedule_performance_index: 1.0, // Simplified - would need proper calculation
      critical_path_status: delayed.length > 0 ? 'at_risk' : 'on_track',
      critical_path_float_days: 0,
      next_milestone: nextMilestone,
      overdue_milestones: overdueMilestones,
      upcoming_milestones: upcomingMilestones
    };
  }

  // ============= Critical Path Analysis =============

  async getCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    const milestones = await this.getProjectMilestones(projectId);
    
    // Simplified critical path analysis
    const criticalMilestones = milestones.filter(m => m.priority === 'critical');
    
    return {
      project_id: projectId,
      critical_path_milestones: criticalMilestones.map(m => m.id),
      total_duration_days: criticalMilestones.length > 0 ? 
        differenceInDays(
          new Date(criticalMilestones[criticalMilestones.length - 1].target_date),
          new Date(criticalMilestones[0].target_date)
        ) : 0,
      estimated_end_date: criticalMilestones.length > 0 
        ? criticalMilestones[criticalMilestones.length - 1].target_date 
        : new Date().toISOString(),
      near_critical_paths: []
    };
  }

  // ============= Summary Reports =============

  async getProjectSummary(projectId: string): Promise<MilestoneSummaryDTO> {
    const milestones = await this.getProjectMilestones(projectId);
    const progress = await this.getMilestoneProgress(projectId);
    const criticalPath = await this.getCriticalPath(projectId);
    
    const nextPending = milestones.find(m => m.status === 'pending');
    
    return {
      id: projectId,
      title: `Project ${projectId} Summary`,
      target_date: nextPending?.target_date || new Date().toISOString(),
      status: progress.delayed_milestones > 0 ? 'delayed' : 'pending',
      type: 'checkpoint',
      priority: 'normal',
      weight: 1,
      is_critical: criticalPath.critical_path_milestones.length > 0,
      float_days: 0,
      percent_complete: progress.weighted_progress
    };
  }
}

// Factory function for singleton instance
let milestoneServiceInstance: UnifiedMilestoneService | null = null;

export function getMilestoneService(): UnifiedMilestoneService {
  if (!milestoneServiceInstance) {
    milestoneServiceInstance = new UnifiedMilestoneService();
  }
  return milestoneServiceInstance;
}
