/**
 * Gantt/PERT Data Service
 * Provides unified data for Gantt and PERT diagrams
 * Integrates phases, tasks, and milestones
 * 
 * Architecture: Follows clean architecture with DTO pattern
 */

import { ProjectDetailDTO } from '@/types/dto';
import { getMilestoneService, UnifiedMilestoneService } from '@/application/services/UnifiedMilestoneService';
import { GanttChartData, PERTAnalysis, PERTActivity } from '@/types/project';

export interface GanttPhaseData {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface GanttMilestoneData {
  id: string;
  name: string;
  date: Date;
  status: 'completed' | 'current' | 'upcoming';
  isKey: boolean;
  phaseId?: string;
  type: string;
  priority: string;
}

export interface UnifiedGanttData {
  projectTitle: string;
  projectPeriod: { start: Date; end: Date };
  phases: GanttPhaseData[];
  milestones: GanttMilestoneData[];
  tasks: any[];
  criticalPath: string[];
  spi: number;
}

export interface UnifiedPERTData extends PERTAnalysis {
  milestoneActivities: PERTActivity[];
  projectDurationDays: number;
  standardDeviation: number;
  confidenceLevel95Days: number;
}

export class GanttPertDataService {
  private milestoneService: UnifiedMilestoneService;

  constructor() {
    this.milestoneService = getMilestoneService();
  }

  /**
   * Get unified Gantt data combining phases, milestones, and tasks
   */
  async getUnifiedGanttData(projectId: string, projectDetail: ProjectDetailDTO): Promise<UnifiedGanttData> {
    // Get milestones from service
    const ganttMilestones = await this.milestoneService.getGanttMilestones(projectId);
    const milestoneProgress = await this.milestoneService.getMilestoneProgress(projectId);
    const criticalPath = await this.milestoneService.calculateCriticalPath(projectId);

    // Map phases to Gantt format
    const phases: GanttPhaseData[] = (projectDetail.plannedPhases || []).map(phase => ({
      id: phase.id || '',
      name: phase.name || phase.phase_name || 'Phase',
      startDate: new Date(phase.startDate || phase.start_date || new Date()),
      endDate: new Date(phase.endDate || phase.end_date || new Date()),
      progress: phase.progress || 0,
      status: this.mapPhaseStatus(phase.status)
    }));

    // Map milestones
    const milestones: GanttMilestoneData[] = ganttMilestones.map(m => ({
      ...m,
      type: 'checkpoint',
      priority: m.isKey ? 'critical' : 'normal'
    }));

    // Determine project period
    const allDates = [
      ...phases.flatMap(p => [p.startDate, p.endDate]),
      ...milestones.map(m => m.date)
    ].filter(d => d && !isNaN(d.getTime()));

    const projectStart = allDates.length > 0 
      ? new Date(Math.min(...allDates.map(d => d.getTime())))
      : new Date();
    const projectEnd = allDates.length > 0 
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : new Date();

    return {
      projectTitle: projectDetail.title || '',
      projectPeriod: { start: projectStart, end: projectEnd },
      phases,
      milestones,
      tasks: projectDetail.tasks || [],
      criticalPath: criticalPath.critical_path_milestones,
      spi: milestoneProgress.schedule_performance_index ?? 1
    };
  }

  /**
   * Get unified PERT data with milestone activities
   */
  async getUnifiedPERTData(projectId: string, projectDetail: ProjectDetailDTO): Promise<UnifiedPERTData> {
    const tasks = projectDetail.tasks || [];
    const milestones = await this.milestoneService.getProjectMilestones(projectId);

    // Calculate PERT for tasks
    const taskActivities: PERTActivity[] = tasks.map(task => {
      const optimistic = task.estimatedDuration * 0.8;
      const mostLikely = task.estimatedDuration;
      const pessimistic = task.estimatedDuration * 1.5;
      const pertEstimate = (optimistic + 4 * mostLikely + pessimistic) / 6;
      const standardDeviation = (pessimistic - optimistic) / 6;

      return {
        name: task.name,
        optimistic,
        mostLikely,
        pessimistic,
        pertEstimate,
        standardDeviation
      };
    });

    // Calculate PERT for milestones (based on weight/duration estimation)
    const milestoneActivities: PERTActivity[] = milestones.map(m => {
      const baseDuration = (m.weight || 0.1) * 30; // Estimate days based on weight
      const optimistic = baseDuration * 0.8;
      const mostLikely = baseDuration;
      const pessimistic = baseDuration * 1.5;
      const pertEstimate = (optimistic + 4 * mostLikely + pessimistic) / 6;
      const standardDeviation = (pessimistic - optimistic) / 6;

      return {
        name: m.title,
        optimistic,
        mostLikely,
        pessimistic,
        pertEstimate,
        standardDeviation
      };
    });

    const allActivities = [...taskActivities, ...milestoneActivities];
    const totalExpectedDuration = allActivities.reduce((sum, a) => sum + a.pertEstimate, 0);
    
    // Calculate total standard deviation (sqrt of sum of variances)
    const totalVariance = allActivities.reduce((sum, a) => sum + Math.pow(a.standardDeviation, 2), 0);
    const totalStdDev = Math.sqrt(totalVariance);

    // 95% confidence level = mean + 1.645 * std dev
    const confidenceLevel95Days = totalExpectedDuration + 1.645 * totalStdDev;

    // Build expected durations and variances maps
    const expectedDurations: { [key: string]: number } = {};
    const variances: { [key: string]: number } = {};

    tasks.forEach((task, i) => {
      expectedDurations[task.id] = taskActivities[i].pertEstimate;
      variances[task.id] = Math.pow(taskActivities[i].standardDeviation, 2);
    });

    milestones.forEach((m, i) => {
      expectedDurations[m.id] = milestoneActivities[i]?.pertEstimate || 0;
      variances[m.id] = Math.pow(milestoneActivities[i]?.standardDeviation || 0, 2);
    });

    // Critical path (simplified - tasks with no float)
    const criticalPath = tasks
      .filter(t => t.criticalPath || t.status === 'delayed')
      .map(t => t.id);

    return {
      activities: allActivities,
      milestoneActivities,
      expectedDurations,
      variances,
      criticalPath,
      totalExpectedDuration,
      projectDurationDays: Math.round(totalExpectedDuration),
      standardDeviation: Math.round(totalStdDev * 10) / 10,
      confidenceLevel95Days: Math.round(confidenceLevel95Days)
    };
  }

  private mapPhaseStatus(status: string | undefined): 'planned' | 'in_progress' | 'completed' {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in_progress';
      default:
        return 'planned';
    }
  }
}

// Singleton
let serviceInstance: GanttPertDataService | null = null;

export function getGanttPertService(): GanttPertDataService {
  if (!serviceInstance) {
    serviceInstance = new GanttPertDataService();
  }
  return serviceInstance;
}
