/**
 * Progress Calculation Hexagonal Service - Architecture Hexagonale
 * Service centralisé pour les calculs de progression de projet
 * 
 * ✅ Utilise TaskAssignmentDTO (source unique)
 * ✅ Utilise PhaseDTO et InspectionDTO des DTOs
 * ✅ Plus de dépendance à l'ancien TaskDTO
 * ✅ Respecte les règles de l'architecture hexagonale
 */

import type { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { PhaseDTO, PhaseStatus } from '@/dtos/entities/PhaseDTO';
import { TaskAssignmentDTO, TaskStatus } from '@/dtos/entities/TaskAssignmentDTO';

// Types internes pour les calculs (pas des DTOs)
interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  completionRate: number;
}

interface ProgressByCategory {
  phases: number;
  tasks: number;
  inspections: number;
}

interface ProgressByStatus {
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
}

/**
 * Service hexagonal pour les calculs de progression
 * Pure logique métier, sans dépendances externes
 */
export class ProgressCalculationHexService {
  /**
   * Calcule la progression globale d'un projet
   * Formule : (Phases * 0.5) + (Tâches * 0.3) + (Inspections * 0.2)
   */
  calculateProjectProgress(
    phases: PhaseDTO[] = [], 
    tasks: TaskAssignmentDTO[] = [], 
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
    
    const completedPhases = phases.filter(p => p.status === PhaseStatus.COMPLETED).length;
    const inProgressPhases = phases.filter(p => p.status === PhaseStatus.IN_PROGRESS).length;
    
    // Calcul pondéré : terminé = 100%, en cours = 50%, en attente = 0%
    const progressScore = (completedPhases * 100 + inProgressPhases * 50) / totalPhases;
    return Math.min(100, Math.round(progressScore));
  }

  /**
   * Calcule la progression des tâches
   * Utilise TaskAssignmentDTO
   */
  calculateTaskProgress(tasks: TaskAssignmentDTO[]): number {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    
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
    
    const completedInspections = inspections.filter(i => ['completed', 'passed', 'approved'].includes(String(i.status))).length;
    const inProgressInspections = inspections.filter(i => String(i.status) === 'in_progress').length;
    
    // Calcul pondéré
    const progressScore = (completedInspections * 100 + inProgressInspections * 50) / totalInspections;
    return Math.min(100, Math.round(progressScore));
  }

  /**
   * Calcule la progression par phase spécifique
   */
  calculatePhaseSpecificProgress(
    phaseId: string,
    tasks: TaskAssignmentDTO[],
    inspections: InspectionDTO[]
  ): number {
    // Filtrer les tâches et inspections pour cette phase
    const phaseTasks = tasks.filter(t => t.phaseId === phaseId);
    const phaseInspections = inspections.filter(i => i.phaseId === phaseId);
    
    const taskProgress = this.calculateTaskProgress(phaseTasks);
    const inspectionProgress = this.calculateInspectionProgress(phaseInspections);
    
    // Moyenne pondérée : tâches 70%, inspections 30%
    const phaseProgress = (taskProgress * 0.7) + (inspectionProgress * 0.3);
    return Math.min(100, Math.round(phaseProgress));
  }

  /**
   * Calcule les statistiques de progression des tâches
   */
  calculateTaskStats(tasks: TaskAssignmentDTO[]): ProgressStats {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;

    return {
      total,
      completed,
      inProgress,
      pending: pending + blocked,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Prédit la progression future basée sur les données historiques
   */
  predictFutureProgress(
    phases: PhaseDTO[],
    tasks: TaskAssignmentDTO[],
    inspections: InspectionDTO[],
    daysAhead: number = 30
  ): { predictedProgress: number; confidence: number } {
    const currentProgress = this.calculateProjectProgress(phases, tasks, inspections);
    
    // Calcul de la vélocité moyenne de progression
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    const avgCompletionTime = this.calculateAverageCompletionTime(completedTasks);
    
    if (avgCompletionTime === 0) {
      return { predictedProgress: currentProgress, confidence: 0 };
    }
    
    // Prédiction simple basée sur la vélocité actuelle
    const tasksInProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const totalTasks = tasks.length || 1;
    const expectedCompletions = Math.min(tasksInProgress, daysAhead / avgCompletionTime);
    const predictedIncrease = (expectedCompletions / totalTasks) * 100 * 0.3;
    
    const predictedProgress = Math.min(100, currentProgress + predictedIncrease);
    const confidence = Math.max(0, Math.min(100, 100 - (daysAhead / 365) * 50));
    
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
    tasks: TaskAssignmentDTO[],
    inspections: InspectionDTO[]
  ): {
    overall: number;
    byCategory: ProgressByCategory;
    byStatus: ProgressByStatus;
    recommendations: string[];
  } {
    const overall = this.calculateProjectProgress(phases, tasks, inspections);
    
    const byCategory: ProgressByCategory = {
      phases: this.calculatePhaseProgress(phases),
      tasks: this.calculateTaskProgress(tasks),
      inspections: this.calculateInspectionProgress(inspections)
    };
    
    const byStatus: ProgressByStatus = {
      completed: phases.filter(p => p.status === PhaseStatus.COMPLETED).length + 
               tasks.filter(t => t.status === TaskStatus.COMPLETED).length + 
               inspections.filter(i => ['completed', 'passed', 'approved'].includes(String(i.status))).length,
      inProgress: phases.filter(p => p.status === PhaseStatus.IN_PROGRESS).length + 
                 tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length + 
                 inspections.filter(i => String(i.status) === 'in_progress').length,
      pending: phases.filter(p => p.status === PhaseStatus.PENDING || String(p.status) === 'not_started').length + 
              tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.BLOCKED).length + 
              inspections.filter(i => ['scheduled', 'pending', 'planned'].includes(String(i.status))).length,
      cancelled: phases.filter(p => p.status === PhaseStatus.CANCELLED).length + 
                 tasks.filter(t => t.status === TaskStatus.CANCELLED).length + 
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

  /**
   * Calcule le temps moyen de complétion des tâches
   */
  private calculateAverageCompletionTime(completedTasks: TaskAssignmentDTO[]): number {
    if (completedTasks.length === 0) return 0;
    
    const completionTimes = completedTasks
      .filter(t => t.startDate && t.completedAt)
      .map(t => {
        const start = new Date(t.startDate!).getTime();
        const end = new Date(t.completedAt!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Convertir en jours
      })
      .filter(time => time > 0 && time < 365);
    
    if (completionTimes.length === 0) return 0;
    
    const average = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    return Math.round(average);
  }

  /**
   * Génère des recommandations basées sur les métriques
   */
  private generateRecommendations(
    byCategory: ProgressByCategory,
    byStatus: ProgressByStatus
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
    if (byStatus.pending > byStatus.inProgress * 1.5) {
      recommendations.push('Démarrer les tâches en attente pour améliorer la progression');
    }
    
    if (byStatus.cancelled > 0) {
      recommendations.push('Analyser les causes des annulations et ajuster la planification');
    }
    
    if (byStatus.inProgress > byStatus.completed * 2) {
      recommendations.push('Mettre en place des points de contrôle réguliers pour terminer les tâches en cours');
    }
    
    if (byStatus.completed === 0 && byStatus.inProgress > 0) {
      recommendations.push('Prioriser la complétion des premières tâches pour générer de la dynamique');
    }
    
    return recommendations;
  }

  /**
   * Calcule le taux de complétion des tâches par priorité
   */
  calculateTaskCompletionByPriority(tasks: TaskAssignmentDTO[]): {
    [priority: string]: { total: number; completed: number; rate: number };
  } {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const result: { [key: string]: { total: number; completed: number; rate: number } } = {};
    
    priorities.forEach(priority => {
      const filtered = tasks.filter(t => t.priority === priority);
      const total = filtered.length;
      const completed = filtered.filter(t => t.status === TaskStatus.COMPLETED).length;
      result[priority] = {
        total,
        completed,
        rate: total > 0 ? (completed / total) * 100 : 0,
      };
    });
    
    return result;
  }

  /**
   * Calcule la distribution des statuts des tâches
   */
  calculateTaskStatusDistribution(tasks: TaskAssignmentDTO[]): {
    [status: string]: number;
  } {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'];
    const result: { [key: string]: number } = {};
    
    statuses.forEach(status => {
      result[status] = tasks.filter(t => t.status === status).length;
    });
    
    return result;
  }
}

export default ProgressCalculationHexService;