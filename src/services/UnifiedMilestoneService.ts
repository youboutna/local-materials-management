/**
 * Unified Milestone Service
 * Uses Repository pattern for data access (low coupling with Supabase)
 * Provides PM metrics: PERT, CPM, SPI, EVM integration
 * 
 * Architecture: Service -> Repository -> Adapter -> Data Source
 */

import { 
  MilestoneDTO, 
  MilestoneFormDTO, 
  MilestoneProgressDTO, 
  MilestoneSummaryDTO,
  CriticalPathDTO
} from '@/types/milestone-dto';
import { getMilestoneRepositorySingleton, IMilestoneRepository } from '@/repositories';
import { getMilestoneTemplates } from '@/data/referential-milestones';
import { addDays, format, parseISO, isBefore, differenceInDays } from 'date-fns';

export class UnifiedMilestoneService {
  private repository: IMilestoneRepository;

  constructor(repository?: IMilestoneRepository) {
    this.repository = repository || getMilestoneRepositorySingleton();
  }

  // ============= CRUD Operations =============

  async getProjectMilestones(projectId: string): Promise<MilestoneDTO[]> {
    return this.repository.findByProjectId(projectId);
  }

  async getPhaseMilestones(projectId: string, phaseId: string): Promise<MilestoneDTO[]> {
    return this.repository.findByPhaseId(projectId, phaseId);
  }

  async getMilestoneById(id: string): Promise<MilestoneDTO | null> {
    return this.repository.findById(id);
  }

  async createMilestone(projectId: string, data: MilestoneFormDTO): Promise<MilestoneDTO> {
    return this.repository.create({
      ...data,
      project_id: projectId
    } as any);
  }

  async updateMilestone(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO> {
    return this.repository.update(id, data);
  }

  async deleteMilestone(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async toggleComplete(id: string): Promise<MilestoneDTO> {
    const milestone = await this.repository.findById(id);
    if (!milestone) throw new Error('Milestone not found');

    const isCompleted = milestone.status === 'completed';
    return this.repository.updateStatus(
      id, 
      isCompleted ? 'pending' : 'completed',
      isCompleted ? undefined : format(new Date(), 'yyyy-MM-dd')
    );
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
    const milestones: MilestoneFormDTO[] = templates.map(template => ({
      project_id: projectId,
      phase_id: phaseId,
      title: template.name,
      description: template.description,
      target_date: format(addDays(startDate, template.relative_offset_days), 'yyyy-MM-dd'),
      weight: template.weight,
      type: template.type,
      priority: template.priority,
      deliverables: template.deliverables,
      dependencies: template.predecessor_ids
    }));

    return this.repository.createBulk(projectId, milestones);
  }

  async deleteTemplateMilestones(phaseId: string): Promise<void> {
    return this.repository.deleteTemplateByPhaseId(phaseId);
  }

  // ============= PM Metrics (EVM, SPI, CPI) =============

  async getMilestoneProgress(projectId: string, phaseId?: string): Promise<MilestoneProgressDTO> {
    let milestones: MilestoneDTO[];
    
    if (phaseId) {
      milestones = await this.repository.findByPhaseId(projectId, phaseId);
    } else {
      milestones = await this.repository.findByProjectId(projectId);
    }

    const today = new Date();
    const completed = milestones.filter(m => m.status === 'completed');
    const overdue = await this.repository.findOverdue(projectId);
    const upcoming = await this.repository.findUpcoming(projectId, 14);

    // Weighted progress calculation
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const weightedProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    // SPI Calculation (Schedule Performance Index)
    const plannedToDate = milestones.filter(m => 
      m.target_date && isBefore(parseISO(m.target_date), today)
    );
    const plannedWeight = plannedToDate.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const earnedWeight = plannedToDate.filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const spi = plannedWeight > 0 ? earnedWeight / plannedWeight : 1;

    // Critical path status
    const criticalMilestones = await this.repository.findCriticalPath(projectId);
    const criticalOverdue = criticalMilestones.filter(m => 
      m.status !== 'completed' && 
      m.target_date && 
      isBefore(parseISO(m.target_date), today)
    );

    let criticalPathStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
    if (criticalOverdue.length > 0) {
      criticalPathStatus = 'delayed';
    } else if (spi < 0.9) {
      criticalPathStatus = 'at_risk';
    }

    const pending = milestones.filter(m => m.status !== 'completed');
    const nextMilestone = pending.length > 0 ? this.toSummary(pending[0]) : undefined;

    return {
      total_milestones: milestones.length,
      completed_milestones: completed.length,
      delayed_milestones: overdue.length,
      weighted_progress: Math.round(weightedProgress),
      schedule_performance_index: Math.round(spi * 100) / 100,
      critical_path_status: criticalPathStatus,
      critical_path_float_days: criticalOverdue.length > 0 
        ? -differenceInDays(today, parseISO(criticalOverdue[0].target_date)) 
        : undefined,
      next_milestone: nextMilestone,
      overdue_milestones: overdue.map(m => this.toSummary(m)),
      upcoming_milestones: upcoming.map(m => this.toSummary(m))
    };
  }

  // ============= PERT/CPM Analysis =============

  async calculateCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    const milestones = await this.repository.findByProjectId(projectId);
    const criticalMilestones = await this.repository.findCriticalPath(projectId);
    
    const allSorted = milestones.sort((a, b) => 
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    );

    const lastMilestone = allSorted[allSorted.length - 1];
    const firstMilestone = allSorted[0];

    const totalDuration = lastMilestone && firstMilestone 
      ? differenceInDays(parseISO(lastMilestone.target_date), parseISO(firstMilestone.target_date))
      : 0;

    // Near-critical paths (float < 5 days)
    const nearCritical = milestones.filter(m => {
      const floatDays = m.float_days ?? 5;
      return floatDays > 0 && floatDays < 5 && !m.is_on_critical_path;
    });

    return {
      project_id: projectId,
      critical_path_milestones: criticalMilestones.map(m => m.id),
      total_duration_days: totalDuration,
      estimated_end_date: lastMilestone?.target_date || format(new Date(), 'yyyy-MM-dd'),
      near_critical_paths: nearCritical.length > 0 ? [{
        milestones: nearCritical.map(m => m.id),
        float_days: Math.min(...nearCritical.map(m => m.float_days ?? 5))
      }] : []
    };
  }

  // ============= Gantt/Timeline Data =============

  async getGanttMilestones(projectId: string): Promise<{
    id: string;
    name: string;
    date: Date;
    status: 'completed' | 'current' | 'upcoming';
    isKey: boolean;
    phaseId?: string;
  }[]> {
    const milestones = await this.repository.findByProjectId(projectId);
    const today = new Date();

    return milestones.map(m => {
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      const targetDate = parseISO(m.target_date);
      
      if (m.status === 'completed') {
        status = 'completed';
      } else if (isBefore(targetDate, today)) {
        status = 'current'; // Overdue, needs attention
      }

      return {
        id: m.id,
        name: m.title,
        date: targetDate,
        status,
        isKey: m.type === 'gate' || m.priority === 'critical',
        phaseId: m.phase_id
      };
    });
  }

  // ============= Helpers =============

  private toSummary(m: MilestoneDTO): MilestoneSummaryDTO {
    return {
      id: m.id,
      title: m.title,
      target_date: m.target_date,
      completed_date: m.completed_date,
      status: m.status as any,
      type: m.type,
      priority: m.priority,
      weight: m.weight,
      is_critical: m.is_on_critical_path || false,
      float_days: m.float_days
    };
  }
}

// Singleton instance
let serviceInstance: UnifiedMilestoneService | null = null;

export function getMilestoneService(): UnifiedMilestoneService {
  if (!serviceInstance) {
    serviceInstance = new UnifiedMilestoneService();
  }
  return serviceInstance;
}
