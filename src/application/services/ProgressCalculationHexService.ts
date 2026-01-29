/**
 * Progress Calculation Hexagonal Service - Architecture Hexagonale
 * Service centralisé pour les calculs de progression de projet
 */

export interface PhaseDTO {
  id: string;
  name: string;
  phase_name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  order?: number;
  custom_phase_data?: Record<string, unknown>;
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  phase_id: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours?: number;
  actual_hours?: number;
}

export interface InspectionDTO {
  id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  phase_id: string;
  inspector?: string;
  inspection_date?: string;
  type: 'regular' | 'final' | 'special';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ProgressCalculationHexService {
  /**
   * Calcule la progression globale d'un projet
   * Formule : (Phases terminées * 100 + Phases en cours * 50 + Tâches terminées * 30 + Inspections terminées * 20) / Total
   */
  calculateProjectProgress(
    phases: PhaseDTO[], 
    tasks: TaskDTO[] = [], 
    inspections: InspectionDTO[] = []
  ): number {
    try {
      // Calcul de progression des phases (poids 50%)
      const phaseProgress = this.calculatePhaseProgress(phases);
      
      // Calcul de progression des tâches (poids 30%)
      const taskProgress = this.calculateTaskProgress(tasks);
      
      // Calcul de progression des inspections (poids 20%)
      const inspectionProgress = this.calculateInspectionProgress(inspections);
      
      // Progression globale pondérée
      const globalProgress = (phaseProgress * 0.5) + (taskProgress * 0.3) + (inspectionProgress * 0.2);
      
      return Math.min(100, Math.round(globalProgress));
    } catch (error) {
      console.error('Error calculating project progress:', error);
      return 0;
    }
  }

  /**
   * Calcule la progression des phases uniquement
   */
  calculatePhaseProgress(phases: PhaseDTO[]): number {
    const totalPhases = phases.length;
    if (totalPhases === 0) return 0;
    
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
    
    // Calcul pondéré : terminé = 100%, en cours = 50%, en attente = 0%
    const progressScore = (completedPhases * 100 + inProgressPhases * 50) / totalPhases;
    return Math.min(100, Math.round(progressScore));
  }

  /**
   * Calcule la progression des tâches
   */
  calculateTaskProgress(tasks: TaskDTO[]): number {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    // Calcul pondéré
    const progressScore = (completedTasks * 100 + inProgressTasks * 50) / totalTasks;
    return Math.min(100, Math.round(progressScore));
  }

  /**
   * Calcule la progression des inspections
   */
  calculateInspectionProgress(inspections: InspectionDTO[]): number {
    const totalInspections = inspections.length;
    if (totalInspections === 0) return 0;
    
    const completedInspections = inspections.filter(i => i.status === 'completed').length;
    const inProgressInspections = inspections.filter(i => i.status === 'in_progress').length;
    
    // Calcul pondéré
    const progressScore = (completedInspections * 100 + inProgressInspections * 50) / totalInspections;
    return Math.min(100, Math.round(progressScore));
  }

  /**
   * Calcule la progression par phase spécifique
   */
  calculatePhaseSpecificProgress(
    phaseId: string,
    tasks: TaskDTO[],
    inspections: InspectionDTO[]
  ): number {
    // Filtrer les tâches et inspections pour cette phase
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    const phaseInspections = inspections.filter(i => i.phase_id === phaseId);
    
    const taskProgress = this.calculateTaskProgress(phaseTasks);
    const inspectionProgress = this.calculateInspectionProgress(phaseInspections);
    
    // Moyenne pondérée : tâches 70%, inspections 30%
    const phaseProgress = (taskProgress * 0.7) + (inspectionProgress * 0.3);
    return Math.min(100, Math.round(phaseProgress));
  }

  /**
   * Prédit la progression future basée sur les données historiques
   */
  predictFutureProgress(
    phases: PhaseDTO[],
    tasks: TaskDTO[],
    inspections: InspectionDTO[],
    daysAhead: number = 30
  ): { predictedProgress: number; confidence: number } {
    const currentProgress = this.calculateProjectProgress(phases, tasks, inspections);
    
    // Calcul de la vélocité moyenne de progression
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const avgCompletionTime = this.calculateAverageCompletionTime(completedTasks);
    
    if (avgCompletionTime === 0) {
      return { predictedProgress: currentProgress, confidence: 0 };
    }
    
    // Prédiction simple basée sur la vélocité actuelle
    const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
    const totalTasks = tasks.length || 1; // Prevent division by zero
    const expectedCompletions = Math.min(tasksInProgress, daysAhead / avgCompletionTime);
    const predictedIncrease = (expectedCompletions / totalTasks) * 100 * 0.3; // 30% poids pour les tâches
    
    const predictedProgress = Math.min(100, currentProgress + predictedIncrease);
    const confidence = Math.max(0, Math.min(100, 100 - (daysAhead / 365) * 50)); // Confidence diminue avec le temps
    
    return {
      predictedProgress: Math.round(predictedProgress),
      confidence: Math.round(confidence)
    };
  }

  /**
   * Génère un rapport de progression détaillé
   */
  generateProgressReport(
    phases: PhaseDTO[],
    tasks: TaskDTO[],
    inspections: InspectionDTO[]
  ): {
    overall: number;
    byCategory: { phases: number; tasks: number; inspections: number };
    byStatus: { completed: number; inProgress: number; pending: number; cancelled: number };
    recommendations: string[];
  } {
    const overall = this.calculateProjectProgress(phases, tasks, inspections);
    
    const byCategory = {
      phases: this.calculatePhaseProgress(phases),
      tasks: this.calculateTaskProgress(tasks),
      inspections: this.calculateInspectionProgress(inspections)
    };
    
    const byStatus = {
      completed: phases.filter(p => p.status === 'completed').length + 
               tasks.filter(t => t.status === 'completed').length + 
               inspections.filter(i => i.status === 'completed').length,
      inProgress: phases.filter(p => p.status === 'in_progress').length + 
                 tasks.filter(t => t.status === 'in_progress').length + 
                 inspections.filter(i => i.status === 'in_progress').length,
      pending: phases.filter(p => p.status === 'pending').length + 
              tasks.filter(t => t.status === 'pending').length + 
              inspections.filter(i => i.status === 'scheduled').length,
      cancelled: phases.filter(p => p.status === 'cancelled').length + 
                 tasks.filter(t => t.status === 'cancelled').length + 
                 inspections.filter(i => i.status === 'cancelled').length
    };
    
    const recommendations = this.generateRecommendations(byCategory, byStatus);
    
    return {
      overall,
      byCategory,
      byStatus,
      recommendations
    };
  }

  private calculateAverageCompletionTime(completedTasks: TaskDTO[]): number {
    if (completedTasks.length === 0) return 0;
    
    const completionTimes = completedTasks
      .filter(t => t.start_date && t.end_date)
      .map(t => {
        const start = new Date(t.start_date!).getTime();
        const end = new Date(t.end_date!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
      })
      .filter(time => time > 0 && time < 365); // Filter reasonable times
    
    if (completionTimes.length === 0) return 0;
    
    const average = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    return Math.round(average);
  }

  private generateRecommendations(
    byCategory: { phases: number; tasks: number; inspections: number },
    byStatus: { completed: number; inProgress: number; pending: number; cancelled: number }
  ): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur les catégories
    if (byCategory.phases < 50) {
      recommendations.push('Accélérer la progression des phases en terminant les phases en cours');
    }
    
    if (byCategory.tasks < 60) {
      recommendations.push('Assigner plus de ressources aux tâches en cours');
    }
    
    if (byCategory.inspections < 70) {
      recommendations.push('Planifier les inspections restantes rapidement');
    }
    
    // Recommandations basées sur les statuts
    if (byStatus.pending > byStatus.inProgress) {
      recommendations.push('Démarrer les tâches en attente pour améliorer la progression');
    }
    
    if (byStatus.cancelled > 0) {
      recommendations.push('Analyser les causes des annulations et ajuster la planification');
    }
    
    if (byStatus.inProgress > byStatus.completed * 2) {
      recommendations.push('Mettre en place des points de contrôle réguliers pour terminer les tâches en cours');
    }
    
    return recommendations;
  }
}
