/**
 * Gantt/PERT Data Service
 * Provides unified data for Gantt and PERT diagrams
 * 
 * Architecture: Follows clean architecture with DTO pattern
 * - Utilise TaskAssignmentDTO pour les tâches (source unique)
 * - Les types proviennent des DTOs, pas d'interfaces UI
 * - Respecte les règles de l'architecture hexagonale
 */

import { GanttChartData } from '@/domain/entities/index';
import { PERTAnalysis } from '@/dtos/entities/PERTAnalysisDTO';;
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { PERTActivity } from '@/dtos/entities/ProjectAggregateDTO';

import { GanttPhaseData } from '@/dtos/entities/PhaseDTO';
/**
 * Interface pour les données Gantt des phases
 * Utilisée en interne, provient des DTOs PhaseDTO
 */

/**
 * Interface pour les données Gantt des jalons
 * Utilisée en interne, provient des DTOs MilestoneDTO
 */
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

/**
 * Interface unifiée pour les données Gantt
 * Utilisée en interne, agrège les DTOs
 */
export interface UnifiedGanttData {
  projectTitle: string;
  projectPeriod: { start: Date; end: Date };
  phases: GanttPhaseData[];
  milestones: GanttMilestoneData[];
  tasks: Array<{ 
    id: string; 
    name: string; 
    duration: number; 
    dependencies: string[]; 
    start_date: string; 
    end_date?: string; 
    progress: number 
  }>;
  criticalPath: string[];
  spi: number;
}

/**
 * Interface unifiée pour les données PERT
 * Utilise PERTAnalysis des DTOs
 */
export interface UnifiedPERTData extends PERTAnalysis {
  activities: PERTActivity[];
  milestoneActivities: PERTActivity[];
  projectDurationDays: number;
  standardDeviation: number;
  confidenceLevel95Days: number;
  totalExpectedDuration: number; // Alias for expectedDuration
  criticalPath: string[];
}

/**
 * Service pour les données Gantt et PERT
 * Utilise TaskAssignmentDTO pour les tâches
 */
export class GanttPertDataService {
  private milestoneService: MilestoneService;

  constructor() {
    this.milestoneService = getMilestoneService();
  }

  /**
   * Get unified Gantt data combining phases, milestones, and tasks
   * Utilise TaskAssignmentDTO via ProjectDetailDTO
   */
  async getUnifiedGanttData(projectId: string, projectDetail: ProjectDetailDTO): Promise<UnifiedGanttData> {
    try {
      // Validate input parameters
      if (!projectId || !projectDetail) {
        throw new Error('Project ID and project detail are required');
      }

      // Get milestones from service
      const ganttMilestones = await this.milestoneService.getProjectMilestonesDTO(projectId);
      const milestoneProgress = await this.milestoneService.getMilestoneProgressWithMetrics(projectId);
      const criticalPath = await this.milestoneService.getCriticalPath(projectId);

      // Map phases to Gantt format avec validation
      const phases: GanttPhaseData[] = (projectDetail.plannedPhases || []).map(phase => {
        return {
          id: phase.id || '',
          name: phase.name || 'Phase',
          startDate: this.parseDate(phase.startDate),
          endDate: this.parseDate(phase.endDate),
          progress: this.validateProgress(phase.progress),
          status: this.mapPhaseStatus(phase.status)
        };
      });

      // Map milestones with validation
      const milestones: GanttMilestoneData[] = ganttMilestones.map(m => {
        const targetDate = this.parseDate(m.targetDate);
        return {
          id: m.id,
          name: m.title || 'Milestone',
          date: targetDate,
          status: this.mapMilestoneStatus(m.status),
          isKey: m.priority === 'critical',
          phaseId: m.phaseId,
          type: m.type || 'milestone',
          priority: m.priority || 'normal'
        };
      });

      // Transformer les tâches depuis TaskAssignmentDTO
      const tasks = (projectDetail.tasks || []).map((task: TaskAssignmentDTO) => ({
        id: task.id,
        name: task.title || task.name || 'Tâche sans titre',
        duration: this.estimateTaskDuration(task),
        dependencies: task.dependencies || [],
        start_date: task.startDate || '',
        end_date: task.endDate || '',
        progress: task.progress || 0
      }));

      // Déterminer la période du projet avec validation
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

      // Calculer SPI (Schedule Performance Index)
      const spi = this.calculateSPI(phases, projectStart);

      return {
        projectTitle: projectDetail.title || 'Project',
        projectPeriod: { start: projectStart, end: projectEnd },
        phases,
        milestones,
        tasks,
        criticalPath: Array.isArray(criticalPath) ? criticalPath.map((cp: any) => cp.id || cp) : [],
        spi
      };
    } catch (error) {
      console.error('Error getting unified Gantt data:', error);
      throw new Error(`Failed to get Gantt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get unified PERT analysis data
   * Utilise TaskAssignmentDTO pour les tâches
   */
  async getUnifiedPERTData(projectId: string, projectDetail: ProjectDetailDTO): Promise<UnifiedPERTData> {
    try {
      if (!projectId || !projectDetail) {
        throw new Error('Project ID and project detail are required');
      }

      // Get base PERT analysis from project detail
      const baseAnalysis = this.calculateBasePERTAnalysis(projectDetail);
      
      // Get milestone-specific activities
      const ganttMilestones = await this.milestoneService.getProjectMilestonesDTO(projectId);
      const milestoneActivities: PERTActivity[] = ganttMilestones.map(m => {
        const duration = this.calculateMilestoneDuration(m);
        return {
          name: m.title || 'Milestone',
          optimistic: duration * 0.8,
          mostLikely: duration,
          pessimistic: duration * 1.2,
          pertEstimate: duration,
          standardDeviation: (duration * 1.2 - duration * 0.8) / 6
        };
      });

      // Get critical path
      const criticalPathData = await this.milestoneService.getCriticalPath(projectId);

      return {
        ...baseAnalysis,
        activities: [...baseAnalysis.activities, ...milestoneActivities],
        milestoneActivities,
        projectDurationDays: this.calculateProjectDuration(projectDetail),
        standardDeviation: this.calculateStandardDeviation(baseAnalysis.activities),
        confidenceLevel95Days: baseAnalysis.totalExpectedDuration + (1.96 * this.calculateStandardDeviation(baseAnalysis.activities)),
        totalExpectedDuration: baseAnalysis.totalExpectedDuration,
        criticalPath: Array.isArray(criticalPathData) ? criticalPathData.map(cp => cp.id) : []
      };
    } catch (error) {
      console.error('Error getting unified PERT data:', error);
      throw new Error(`Failed to get PERT data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =================== PRIVATE HELPER METHODS ===================

  /**
   * Parse date with validation
   */
  private parseDate(dateInput: string | Date | undefined): Date {
    if (!dateInput) {
      return new Date();
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Validate progress value
   */
  private validateProgress(progress: number | undefined): number {
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return 0;
    }
    return Math.round(progress);
  }

  /**
   * Map phase status to Gantt format
   */
  private mapPhaseStatus(status: string | undefined): 'planned' | 'in_progress' | 'completed' {
    if (!status) return 'planned';
    
    const statusLower = status.toLowerCase();
    if (['completed', 'terminé', 'termine', 'COMPLETED'].includes(statusLower)) {
      return 'completed';
    }
    if (['in_progress', 'en cours', 'encours', 'IN_PROGRESS'].includes(statusLower)) {
      return 'in_progress';
    }
    
    return 'planned';
  }

  /**
   * Map milestone status to Gantt format
   */
  private mapMilestoneStatus(status: string | undefined): 'completed' | 'current' | 'upcoming' {
    if (!status) return 'upcoming';
    
    const statusLower = status.toLowerCase();
    if (['completed', 'terminé', 'termine'].includes(statusLower)) {
      return 'completed';
    }
    if (['current', 'actuel', 'en cours'].includes(statusLower)) {
      return 'current';
    }
    
    return 'upcoming';
  }

  /**
   * Calculate Schedule Performance Index (SPI)
   */
  private calculateSPI(phases: GanttPhaseData[], projectStart: Date): number {
    if (phases.length === 0) return 1.0;

    const currentDate = new Date();
    const totalPlannedDuration = phases.reduce((sum, phase) => {
      const duration = (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);

    const totalEarnedDuration = phases.reduce((sum, phase) => {
      const duration = (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const earnedDuration = (duration * phase.progress) / 100;
      return sum + earnedDuration;
    }, 0);

    const totalPlannedTime = (currentDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    const totalEarnedTime = (currentDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24) * (totalEarnedDuration / totalPlannedDuration);

    return totalPlannedTime > 0 ? totalEarnedTime / totalPlannedTime : 1.0;
  }

  /**
   * Calculate base PERT analysis
   * Utilise TaskAssignmentDTO pour les tâches
   */
  private calculateBasePERTAnalysis(projectDetail: ProjectDetailDTO): PERTAnalysis {
    const activities: PERTActivity[] = (projectDetail.tasks || []).map((task: TaskAssignmentDTO) => {
      const estimatedDuration = this.estimateTaskDuration(task);
      return {
        name: task.title || task.name || 'Tâche',
        optimistic: estimatedDuration * 0.8,
        mostLikely: estimatedDuration,
        pessimistic: estimatedDuration * 1.2,
        pertEstimate: estimatedDuration,
        standardDeviation: (estimatedDuration * 1.2 - estimatedDuration * 0.8) / 6
      };
    });

    return {
      activities,
      expectedDurations: {},
      criticalPath: [],
      totalExpectedDuration: this.calculateProjectDuration(projectDetail),
      variances: {}
    };
  }

  /**
   * Estimate task duration based on available data
   * Utilise les champs de TaskAssignmentDTO
   */
  private estimateTaskDuration(task: TaskAssignmentDTO): number {
    // Utiliser estimatedDuration si disponible
    if (task.estimatedDuration) {
      return Number(task.estimatedDuration);
    }
    
    // Calculer à partir des dates
    if (task.startDate && task.endDate) {
      const start = this.parseDate(task.startDate);
      const end = this.parseDate(task.endDate);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 0) {
        return duration;
      }
    }
    
    // Utiliser dueDate comme fallback
    if (task.dueDate) {
      const dueDate = this.parseDate(task.dueDate);
      const now = new Date();
      const duration = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 0) {
        return Math.max(duration, 0.5);
      }
    }
    
    return 1; // Default duration (1 day)
  }

  /**
   * Calculate milestone duration
   */
  private calculateMilestoneDuration(milestone: {
    id?: string;
    title?: string;
    date?: string;
    completed?: boolean;
  }): number {
    // Milestones are typically points in time, duration is minimal
    return 0.5; // Half day for milestone completion
  }

  /**
   * Calculate project duration in days
   */
  private calculateProjectDuration(projectDetail: ProjectDetailDTO): number {
    if (!projectDetail.plannedPhases || projectDetail.plannedPhases.length === 0) {
      return 0;
    }

    const startDate = new Date(Math.min(...projectDetail.plannedPhases
      .filter(p => p.startDate)
      .map(p => new Date(p.startDate!).getTime())));

    const endDate = new Date(Math.max(...projectDetail.plannedPhases
      .filter(p => p.endDate)
      .map(p => new Date(p.endDate!).getTime())));

    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Calculate standard deviation for PERT analysis
   */
  private calculateStandardDeviation(activities: PERTActivity[]): number {
    if (activities.length === 0) return 0;

    const variances = activities.map(activity => {
      const optimistic = activity.optimistic;
      const pessimistic = activity.pessimistic;
      
      return Math.pow((pessimistic - optimistic) / 6, 2);
    });

    const totalVariance = variances.reduce((sum, variance) => sum + variance, 0);
    return Math.sqrt(totalVariance / activities.length);
  }

  /**
   * Convertit TaskAssignmentDTO en format pour les tâches Gantt
   */
  private taskToGanttTask(task: TaskAssignmentDTO): {
    id: string;
    name: string;
    duration: number;
    dependencies: string[];
    start_date: string;
    end_date?: string;
    progress: number;
  } {
    return {
      id: task.id,
      name: task.title || task.name || 'Tâche sans titre',
      duration: this.estimateTaskDuration(task),
      dependencies: task.dependencies || [],
      start_date: task.startDate || '',
      end_date: task.endDate || task.dueDate || '',
      progress: task.progress || 0
    };
  }
}

// Factory function for service instance
let ganttPertServiceInstance: GanttPertDataService | null = null;

export function getGanttPertService(): GanttPertDataService {
  if (!ganttPertServiceInstance) {
    ganttPertServiceInstance = new GanttPertDataService();
  }
  return ganttPertServiceInstance;
}