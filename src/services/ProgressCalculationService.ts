/**
 * Service de calcul de progression réaliste d'un projet
 * Basé sur la méthodologie: Phases → Étapes → Tâches + Résultats d'inspections
 */

export interface ProgressWeights {
  phases: number;
  tasks: number;
  inspections: number;
}

export interface PhaseProgress {
  phaseId: string;
  phaseName: string;
  progress: number;
  weight: number;
  stepsProgress: StepProgress[];
}

export interface StepProgress {
  stepId: string;
  stepName: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
}

export class ProgressCalculationService {
  // Poids par défaut pour le calcul de progression
  private static DEFAULT_WEIGHTS: ProgressWeights = {
    phases: 0.4,      // 40% basé sur les phases complétées
    tasks: 0.4,       // 40% basé sur les tâches complétées
    inspections: 0.2  // 20% basé sur les inspections validées
  };

  /**
   * Calcule la progression globale du projet selon la méthodologie réaliste
   */
  static calculateProjectProgress(
    phases: any[],
    tasks: any[],
    inspections: any[],
    weights: ProgressWeights = this.DEFAULT_WEIGHTS
  ): number {
    const phaseProgress = this.calculatePhasesProgress(phases);
    const taskProgress = this.calculateTasksProgress(tasks);
    const inspectionProgress = this.calculateInspectionsProgress(inspections);

    const globalProgress = 
      (phaseProgress * weights.phases) +
      (taskProgress * weights.tasks) +
      (inspectionProgress * weights.inspections);

    return Math.round(globalProgress * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Calcule la progression basée sur les phases et leurs étapes
   */
  private static calculatePhasesProgress(phases: any[]): number {
    if (!phases || phases.length === 0) return 0;

    let totalWeight = 0;
    let weightedProgress = 0;

    phases.forEach(phase => {
      const phaseWeight = phase.weight || (1 / phases.length);
      totalWeight += phaseWeight;

      // Progression de la phase basée sur son statut et ses étapes
      let phaseProgress = 0;

      if (phase.status === 'completed') {
        phaseProgress = 100;
      } else if (phase.status === 'in_progress') {
        // Calculer basé sur les étapes
        const steps = phase.steps || phase.stages || [];
        if (steps.length > 0) {
          phaseProgress = this.calculateStepsProgress(steps);
        } else {
          phaseProgress = phase.progress || 0;
        }
      } else if (phase.status === 'planned') {
        phaseProgress = 0;
      }

      weightedProgress += (phaseProgress / 100) * phaseWeight;
    });

    return totalWeight > 0 ? (weightedProgress / totalWeight) : 0;
  }

  /**
   * Calcule la progression basée sur les étapes d'une phase
   */
  private static calculateStepsProgress(steps: any[]): number {
    if (!steps || steps.length === 0) return 0;

    let completedSteps = 0;
    let totalSteps = steps.length;

    steps.forEach(step => {
      if (step.status === 'completed') {
        completedSteps += 1;
      } else if (step.status === 'in_progress') {
        // Si l'étape a des tâches, calculer basé sur les tâches
        const tasks = step.tasks || [];
        if (tasks.length > 0) {
          const taskProgress = this.calculateTasksProgress(tasks) / 100;
          completedSteps += taskProgress;
        } else {
          // Sinon, considérer comme 50% complété
          completedSteps += 0.5;
        }
      }
    });

    return (completedSteps / totalSteps) * 100;
  }

  /**
   * Calcule la progression basée sur les tâches
   */
  private static calculateTasksProgress(tasks: any[]): number {
    if (!tasks || tasks.length === 0) return 0;

    let completedTasks = 0;
    let totalTasks = tasks.length;

    tasks.forEach(task => {
      if (task.status === 'completed' || task.status === 'terminé') {
        completedTasks += 1;
      } else if (task.status === 'in_progress' || task.status === 'en_cours') {
        // Tâche en cours = 50% complétée
        completedTasks += 0.5;
      }
    });

    return (completedTasks / totalTasks) * 100;
  }

  /**
   * Calcule la progression basée sur les inspections validées
   */
  private static calculateInspectionsProgress(inspections: any[]): number {
    if (!inspections || inspections.length === 0) return 0;

    let validatedInspections = 0;
    let totalInspections = inspections.length;
    let weightedScore = 0;

    inspections.forEach(inspection => {
      // Considérer les inspections "validées" et leur score
      if (inspection.status === 'approved' || inspection.status === 'validé') {
        validatedInspections += 1;
        
        // Si l'inspection a un score de progression
        if (inspection.progress_at_inspection !== undefined) {
          weightedScore += inspection.progress_at_inspection;
        } else {
          weightedScore += 100; // Inspection validée = 100%
        }
      } else if (inspection.status === 'in_progress' || inspection.status === 'pending') {
        validatedInspections += 0.5;
        weightedScore += 50;
      }
    });

    // Moyenne pondérée des inspections
    if (validatedInspections > 0) {
      return weightedScore / totalInspections;
    }

    return 0;
  }

  /**
   * Calcule la progression détaillée par phase
   */
  static calculateDetailedPhaseProgress(phases: any[]): PhaseProgress[] {
    if (!phases || phases.length === 0) return [];

    return phases.map(phase => {
      const steps = phase.steps || phase.stages || [];
      const stepsProgress = steps.map((step: any) => ({
        stepId: step.id,
        stepName: step.name || step.step_name || 'Étape',
        progress: this.calculateSingleStepProgress(step),
        tasksCompleted: this.countCompletedTasks(step.tasks || []),
        totalTasks: (step.tasks || []).length
      }));

      const phaseProgress = stepsProgress.length > 0
        ? stepsProgress.reduce((sum, s) => sum + s.progress, 0) / stepsProgress.length
        : (phase.status === 'completed' ? 100 : 0);

      return {
        phaseId: phase.id,
        phaseName: phase.phase_name || phase.name || 'Phase',
        progress: Math.round(phaseProgress),
        weight: phase.weight || (1 / phases.length),
        stepsProgress
      };
    });
  }

  /**
   * Calcule la progression d'une seule étape
   */
  private static calculateSingleStepProgress(step: any): number {
    if (step.status === 'completed') return 100;
    if (step.status === 'planned') return 0;

    const tasks = step.tasks || [];
    if (tasks.length > 0) {
      return this.calculateTasksProgress(tasks);
    }

    return step.status === 'in_progress' ? 50 : 0;
  }

  /**
   * Compte le nombre de tâches complétées
   */
  private static countCompletedTasks(tasks: any[]): number {
    return tasks.filter(t => 
      t.status === 'completed' || t.status === 'terminé'
    ).length;
  }

  /**
   * Calcule la progression globale avec poids personnalisés
   */
  static calculateCustomWeightedProgress(
    phases: any[],
    tasks: any[],
    inspections: any[],
    customWeights?: Partial<ProgressWeights>
  ): {
    globalProgress: number;
    breakdown: {
      phaseProgress: number;
      taskProgress: number;
      inspectionProgress: number;
    };
  } {
    const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };

    const phaseProgress = this.calculatePhasesProgress(phases);
    const taskProgress = this.calculateTasksProgress(tasks);
    const inspectionProgress = this.calculateInspectionsProgress(inspections);

    const globalProgress = this.calculateProjectProgress(phases, tasks, inspections, weights);

    return {
      globalProgress,
      breakdown: {
        phaseProgress,
        taskProgress,
        inspectionProgress
      }
    };
  }
}
