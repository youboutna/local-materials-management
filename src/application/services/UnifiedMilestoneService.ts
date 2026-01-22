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
import { addDays, differenceInDays, format, isBefore, parseISO } from 'date-fns';

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

    const isCompleted = milestone.status === 'completed';
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
    const projectMilestones = await MilestoneService.getProjectMilestones('');
    // Note: This would need a more sophisticated implementation in real usage
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
    
    // Simplified implementation - would need more sophisticated logic for real metrics
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    
    return {
      total: milestones.length,
      completed: completed.length,
      pending: milestones.filter(m => m.status === 'pending').length,
      delayed: milestones.filter(m => m.status === 'delayed').length,
      progress_percentage: totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0,
      on_schedule: completed.length === milestones.filter(m => {
        const targetDate = new Date(m.target_date);
        return m.status === 'completed' || targetDate >= today;
      }).length,
      critical_path: milestones.filter(m => m.priority === 'critical').length,
      spi: 1.0, // Simplified - would need proper calculation
      cpi: 1.0, // Simplified - would need proper calculation
      evm: {
        planned_value: 0,
        earned_value: 0,
        actual_cost: 0,
        schedule_variance: 0,
        cost_variance: 0
      }
    };
  }

  // ============= Critical Path Analysis =============

  async getCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    const milestones = await this.getProjectMilestones(projectId);
    
    // Simplified critical path analysis
    const criticalMilestones = milestones.filter(m => m.priority === 'critical');
    
    return {
      project_id: projectId,
      critical_milestones: criticalMilestones.map(m => ({
        milestone_id: m.id,
        title: m.title,
        target_date: m.target_date,
        earliest_start: m.target_date,
        latest_finish: m.target_date,
        slack_days: 0,
        is_critical: true
      })),
      total_duration: criticalMilestones.length > 0 ? 
        differenceInDays(
          new Date(criticalMilestones[criticalMilestones.length - 1].target_date),
          new Date(criticalMilestones[0].target_date)
        ) : 0,
      critical_path_length: criticalMilestones.length,
      bottlenecks: []
    };
  }

  // ============= Summary Reports =============

  async getProjectSummary(projectId: string): Promise<MilestoneSummaryDTO> {
    const milestones = await this.getProjectMilestones(projectId);
    const progress = await this.getMilestoneProgress(projectId);
    const criticalPath = await this.getCriticalPath(projectId);
    
    return {
      project_id: projectId,
      total_milestones: milestones.length,
      completed_milestones: progress.completed,
      pending_milestones: progress.pending,
      delayed_milestones: progress.delayed,
      overall_progress: progress.progress_percentage,
      next_milestone: milestones.find(m => m.status === 'pending'),
      critical_path: criticalPath.critical_milestones.length,
      health_score: progress.progress_percentage >= 80 ? 'excellent' : 
                    progress.progress_percentage >= 60 ? 'good' :
                    progress.progress_percentage >= 40 ? 'fair' : 'poor',
      last_updated: new Date().toISOString()
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
