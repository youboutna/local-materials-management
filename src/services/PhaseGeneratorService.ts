/**
 * Phase Generator Service
 * Orchestrates phase and milestone generation from referentials
 * 
 * Architecture: UI → Service → Repository (interface) → Adapter
 * Handles complete project structure generation
 */

import { 
  getReferential, 
  getPhasesForReferential, 
  ReferentialType 
} from '@/config/referentials';
import { getMilestoneGeneratorService, GeneratedMilestoneDTO } from './MilestoneGeneratorService';
import { addDays, format, parseISO } from 'date-fns';

/**
 * Phase data structure for project creation/modification
 */
export interface GeneratedPhaseData {
  id: string;
  phaseCode: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  progress: number;
  order: number;
  steps: GeneratedStepData[];
  milestones: GeneratedMilestoneDTO[];
}

export interface GeneratedStepData {
  id: string;
  stepCode: string;
  name: string;
  order: number;
  tasks: GeneratedTaskData[];
}

export interface GeneratedTaskData {
  id: string;
  taskCode: string;
  name: string;
  description?: string;
  estimatedDurationDays: number;
  requiresInspection: boolean;
  requiresEngineerApproval: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
}

/**
 * Project generation configuration
 */
export interface ProjectGenerationConfig {
  referentialType: ReferentialType;
  projectStartDate: string;
  projectBudget: number;
  projectId?: string;
  generateMilestones: boolean;
}

/**
 * Phase Generator Service
 */
export class PhaseGeneratorService {
  private milestoneGenerator = getMilestoneGeneratorService();

  /**
   * Generate complete project structure from referential
   */
  generateProjectStructure(config: ProjectGenerationConfig): GeneratedPhaseData[] {
    const referential = getReferential(config.referentialType);
    if (!referential) {
      console.error(`Referential not found: ${config.referentialType}`);
      return [];
    }

    const phases = getPhasesForReferential(config.referentialType, 'fr');
    if (phases.length === 0) {
      console.log(`No phases found for referential: ${config.referentialType}`);
      return [];
    }

    const generatedPhases: GeneratedPhaseData[] = [];
    let cumulativeStartDays = 0;
    const projectStart = parseISO(config.projectStartDate);
    const budgetPerPhase = config.projectBudget / phases.length;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseId = `phase-${Date.now()}-${i}`;
      
      // Calculate phase duration from steps and tasks
      const { steps, totalDuration } = this.generateSteps(phase.steps, phaseId);
      
      // Calculate dates
      const phaseStartDate = addDays(projectStart, cumulativeStartDays);
      const phaseEndDate = addDays(phaseStartDate, totalDuration);

      // Generate milestones if enabled
      let milestones: GeneratedMilestoneDTO[] = [];
      if (config.generateMilestones && config.projectId) {
        milestones = this.milestoneGenerator.generateMilestonesForPhase({
          referentialType: config.referentialType,
          phaseCode: phase.code,
          phaseStartDate: format(phaseStartDate, 'yyyy-MM-dd'),
          projectId: config.projectId,
          phaseId,
          phaseBudget: budgetPerPhase
        });
      }

      generatedPhases.push({
        id: phaseId,
        phaseCode: phase.code,
        title: phase.label,
        description: phase.description || `Phase: ${phase.label}`,
        startDate: format(phaseStartDate, 'yyyy-MM-dd'),
        endDate: format(phaseEndDate, 'yyyy-MM-dd'),
        estimatedDuration: totalDuration,
        status: 'not_started',
        budget: Math.round(budgetPerPhase),
        progress: 0,
        order: phase.order || i + 1,
        steps,
        milestones
      });

      cumulativeStartDays += totalDuration;
    }

    return generatedPhases;
  }

  /**
   * Generate steps and tasks from referential
   */
  private generateSteps(
    stepsData: Array<{
      code: string;
      label: string;
      order: number;
      tasks: Array<{
        code: string;
        label: string;
        description?: string;
        requiresInspection?: boolean;
        requiresEngineerApproval?: boolean;
        estimatedDurationDays?: number;
      }>;
    }>,
    phaseId: string
  ): { steps: GeneratedStepData[]; totalDuration: number } {
    const steps: GeneratedStepData[] = [];
    let totalDuration = 0;

    for (let i = 0; i < stepsData.length; i++) {
      const step = stepsData[i];
      const stepId = `step-${phaseId}-${i}`;
      
      const tasks: GeneratedTaskData[] = [];
      let stepDuration = 0;

      for (let j = 0; j < step.tasks.length; j++) {
        const task = step.tasks[j];
        const taskDuration = task.estimatedDurationDays || 7;
        stepDuration += taskDuration;

        tasks.push({
          id: `task-${stepId}-${j}`,
          taskCode: task.code,
          name: task.label,
          description: task.description,
          estimatedDurationDays: taskDuration,
          requiresInspection: task.requiresInspection || false,
          requiresEngineerApproval: task.requiresEngineerApproval || false,
          status: 'not_started'
        });
      }

      // Minimum step duration
      if (stepDuration === 0) stepDuration = 14;
      totalDuration += stepDuration;

      steps.push({
        id: stepId,
        stepCode: step.code,
        name: step.label,
        order: step.order || i + 1,
        tasks
      });
    }

    // Minimum phase duration
    if (totalDuration === 0) totalDuration = 30;

    return { steps, totalDuration };
  }

  /**
   * Get summary of what would be generated for a referential
   */
  getGenerationSummary(referentialType: ReferentialType): {
    totalPhases: number;
    totalSteps: number;
    totalTasks: number;
    totalMilestones: number;
    estimatedDurationDays: number;
  } {
    const phases = getPhasesForReferential(referentialType, 'fr');
    let totalSteps = 0;
    let totalTasks = 0;
    let totalMilestones = 0;
    let estimatedDurationDays = 0;

    for (const phase of phases) {
      totalSteps += phase.steps.length;
      
      for (const step of phase.steps) {
        totalTasks += step.tasks.length;
        for (const task of step.tasks) {
          estimatedDurationDays += task.estimatedDurationDays || 7;
        }
      }

      totalMilestones += this.milestoneGenerator.countMilestonesForPhase(referentialType, phase.code);
    }

    return {
      totalPhases: phases.length,
      totalSteps,
      totalTasks,
      totalMilestones,
      estimatedDurationDays
    };
  }

  /**
   * Get milestones requiring inspection for all phases
   */
  getInspectionMilestonesForProject(referentialType: ReferentialType): Map<string, GeneratedMilestoneDTO[]> {
    const phases = getPhasesForReferential(referentialType, 'fr');
    const inspectionMilestones = new Map<string, GeneratedMilestoneDTO[]>();

    for (const phase of phases) {
      const templates = this.milestoneGenerator.getInspectionMilestones(referentialType, phase.code);
      
      if (templates.length > 0) {
        // Convert templates to milestone DTOs for reference
        const milestones: GeneratedMilestoneDTO[] = templates.map(t => ({
          title: t.name,
          description: t.description,
          target_date: '', // Will be calculated at generation time
          type: t.type,
          priority: t.priority,
          weight: t.weight,
          deliverables: t.deliverables,
          dependencies: t.predecessor_ids,
          requiresInspection: true,
          inspectionType: 'technical',
          templateId: t.id,
          phaseCode: phase.code
        }));
        
        inspectionMilestones.set(phase.code, milestones);
      }
    }

    return inspectionMilestones;
  }
}

// Singleton instance
let phaseGeneratorInstance: PhaseGeneratorService | null = null;

export function getPhaseGeneratorService(): PhaseGeneratorService {
  if (!phaseGeneratorInstance) {
    phaseGeneratorInstance = new PhaseGeneratorService();
  }
  return phaseGeneratorInstance;
}
