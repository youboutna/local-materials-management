/**
 * Report Calculations - Utilitaires pour les rapports et analyses
 * 
 * Architecture Hexagonale :
 * - Utilise les DTOs pour les types
 * - Pas d'interfaces UI
 * - Méthodes statiques pour les calculs
 * 
 * Respecte PROMPT.md :
 * - ✅ Utilisation de TaskAssignmentDTO
 * - ✅ Types provenant des DTOs
 * - ✅ Pas de redéfinition de types dans UI
 */

import { EVMMetrics, PERTAnalysis, ProjectData } from '@/dtos/entities/ProjectAggregateDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';

/**
 * Interface pour les activités PERT
 * Utilisée en interne pour les calculs
 */
interface PERTActivity {
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  pertEstimate?: number;
  standardDeviation?: number;
}

/**
 * Interface pour les paiements financiers
 */
interface FinancialPayment {
  amount: number;
  date?: string;
  category?: string;
}

/**
 * Interface pour les dépenses financières
 */
interface FinancialExpense {
  amount: number;
  date?: string;
  category?: string;
}

/**
 * Interface pour la timeline des phases
 */
interface PhaseTimeline {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed';
}

/**
 * Classe utilitaire pour les calculs de rapports
 * Toutes les méthodes sont statiques
 */
export class ReportCalculations {
  
  /**
   * Calculate Earned Value Management (EVM) metrics with real project data
   */
  static calculateEVMMetrics(project: ProjectData, actualCost: number, phases: PhaseDTO[] = []): EVMMetrics {
    const budget = project.budget || 0;
    const progress = project.progress || 0;
    
    // Calculate planned value based on project timeline
    const projectStart = new Date(project.startDate);
    const projectEnd = project.endDate ? new Date(project.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const totalDuration = projectEnd.getTime() - projectStart.getTime();
    const elapsedTime = Math.max(0, today.getTime() - projectStart.getTime());
    const timeProgress = totalDuration > 0 ? Math.min(1, elapsedTime / totalDuration) : 1;
    
    // Calculate planned value based on schedule
    const plannedValue = budget * timeProgress;
    
    // Calculate earned value based on actual progress
    const earnedValue = budget * (progress / 100);
    
    const budgetAtCompletion = budget;
    
    // Calculate variances
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    
    // Calculate performance indices (avoid division by zero)
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 1;
    
    // Calculate forecasts
    const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;
    const estimateToComplete = Math.max(0, estimateAtCompletion - actualCost);
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;

    return {
      plannedValue,
      earnedValue,
      actualCost,
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex,
      budgetAtCompletion,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion
    };
  }

  /**
   * Calculate PERT analysis for project phases with realistic estimates
   * Utilise TaskAssignmentDTO pour les tâches
   */
  static calculatePERTAnalysis(phases?: PhaseDTO[], tasks?: TaskAssignmentDTO[]): PERTAnalysis {
    let activities: PERTActivity[] = [];

    // Use tasks if available, otherwise use phases
    if (tasks && tasks.length > 0) {
      activities = tasks.map((task: TaskAssignmentDTO) => ({
        name: task.title || task.name || 'Tâche inconnue',
        optimistic: Math.max(1, (task.estimatedDuration || 7) * 0.7),
        mostLikely: task.estimatedDuration || 7,
        pessimistic: (task.estimatedDuration || 7) * 1.5
      }));
    } else if (phases && phases.length > 0) {
      activities = phases.map(phase => {
        const duration = ReportCalculations.calculateDurationFromDates(
          phase.startDate, 
          phase.endDate
        );
        return {
          name: phase.name || phase.name || 'Phase inconnue',
          optimistic: Math.max(1, duration * 0.7),
          mostLikely: duration || 14,
          pessimistic: duration * 1.4 || 21
        };
      });
    } else {
      // Realistic default activities based on typical construction projects
      activities = [
        { name: 'Études et conception', optimistic: 14, mostLikely: 21, pessimistic: 35 },
        { name: 'Préparation du site', optimistic: 5, mostLikely: 10, pessimistic: 18 },
        { name: 'Fondations et terrassement', optimistic: 20, mostLikely: 30, pessimistic: 45 },
        { name: 'Structure et gros œuvre', optimistic: 60, mostLikely: 90, pessimistic: 120 },
        { name: 'Second œuvre', optimistic: 45, mostLikely: 60, pessimistic: 90 },
        { name: 'Finitions', optimistic: 30, mostLikely: 45, pessimistic: 65 },
        { name: 'Réception et livraison', optimistic: 7, mostLikely: 14, pessimistic: 21 }
      ];
    }

    const processedActivities = activities.map(activity => {
      const pertEstimate = ReportCalculations.calculatePERTEstimate(
        activity.optimistic, 
        activity.mostLikely, 
        activity.pessimistic
      );
      const variance = ReportCalculations.calculatePERTVariance(
        activity.optimistic, 
        activity.pessimistic
      );
      const standardDeviation = Math.sqrt(variance);

      return {
        ...activity,
        pertEstimate,
        standardDeviation
      };
    });

    const taskDurations: { [taskId: string]: number } = {};
    const taskVariances: { [taskId: string]: number } = {};
    
    processedActivities.forEach(activity => {
      taskDurations[activity.name] = activity.pertEstimate || 0;
      taskVariances[activity.name] = Math.pow(activity.standardDeviation || 0, 2);
    });

    const totalDuration = processedActivities.reduce(
      (sum, activity) => sum + (activity.pertEstimate || 0), 
      0
    );

    return {
      activities: processedActivities,
      expectedDurations: taskDurations,
      criticalPath: [],
      totalExpectedDuration: totalDuration,
      variances: taskVariances
    };
  }

  /**
   * Calculate duration between two dates in days
   */
  private static calculateDurationFromDates(startDate?: string | Date, endDate?: string | Date): number {
    if (!startDate || !endDate) return 14; // Default 2 weeks
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 14;
    
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  /**
   * Calculate PERT estimate: (O + 4M + P) / 6
   */
  private static calculatePERTEstimate(optimistic: number, mostLikely: number, pessimistic: number): number {
    return (optimistic + 4 * mostLikely + pessimistic) / 6;
  }

  /**
   * Calculate PERT variance: ((P - O) / 6)²
   */
  private static calculatePERTVariance(optimistic: number, pessimistic: number): number {
    return Math.pow((pessimistic - optimistic) / 6, 2);
  }

  /**
   * Calculate comprehensive financial metrics from actual project data
   */
  static async calculateFinancialMetrics(
    project: ProjectData, 
    payments: FinancialPayment[], 
    expenses: FinancialExpense[]
  ): Promise<{
    totalBudget: number;
    spentAmount: number;
    remainingBudget: number;
    costOverrun: number;
    projectedCost: number;
    costEfficiency: number;
    burnRate: number;
  }> {
    const totalBudget = project.budget || 0;
    
    // Calculate spent amount from payments and expenses
    const paymentTotal = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const spentAmount = paymentTotal + expenseTotal;
    
    const remainingBudget = totalBudget - spentAmount;
    const costOverrun = spentAmount - totalBudget;
    
    // Calculate projected cost based on progress
    const progress = project.progress || 0;
    const projectedCost = progress > 0 ? (spentAmount / (progress / 100)) : totalBudget;
    
    // Calculate cost efficiency
    const costEfficiency = totalBudget > 0 ? (totalBudget / Math.max(spentAmount, 1)) * 100 : 100;
    
    // Calculate burn rate (spending per day)
    const projectStart = new Date(project.startDate);
    const daysSinceStart = Math.max(1, Math.ceil((Date.now() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
    const burnRate = spentAmount / daysSinceStart;
    
    return {
      totalBudget,
      spentAmount,
      remainingBudget,
      costOverrun,
      projectedCost,
      costEfficiency,
      burnRate
    };
  }

  /**
   * Calculate milestone progress based on project progress
   */
  static calculateMilestoneStatus(progress: number): Array<{
    id: string;
    name: string;
    targetProgress: number;
    status: 'completed' | 'current' | 'upcoming';
    date: Date;
    color: string;
    isKey?: boolean;
  }> {
    const today = new Date();
    const milestones = [
      { 
        id: '1',
        name: 'Démarrage du Projet', 
        targetProgress: 0,
        daysOffset: 0,
        isKey: true
      },
      { 
        id: '2',
        name: 'Validation des Plans', 
        targetProgress: 15,
        daysOffset: 30,
        isKey: false
      },
      { 
        id: '3',
        name: '25% d\'Avancement', 
        targetProgress: 25,
        daysOffset: 60,
        isKey: true
      },
      { 
        id: '4',
        name: 'Inspection Intermédiaire', 
        targetProgress: 40,
        daysOffset: 120,
        isKey: false
      },
      { 
        id: '5',
        name: '50% d\'Avancement', 
        targetProgress: 50,
        daysOffset: 150,
        isKey: true
      },
      { 
        id: '6',
        name: 'Tests et Validation', 
        targetProgress: 75,
        daysOffset: 210,
        isKey: false
      },
      { 
        id: '7',
        name: '75% d\'Avancement', 
        targetProgress: 75,
        daysOffset: 240,
        isKey: true
      },
      { 
        id: '8',
        name: 'Finalisation', 
        targetProgress: 100,
        daysOffset: 300,
        isKey: true
      }
    ];

    return milestones.map(milestone => {
      const milestoneDate = new Date(today);
      milestoneDate.setDate(today.getDate() + milestone.daysOffset);
      
      let status: 'completed' | 'current' | 'upcoming';
      if (progress >= milestone.targetProgress) {
        status = 'completed';
      } else if (progress >= milestone.targetProgress - 15) {
        status = 'current';
      } else {
        status = 'upcoming';
      }

      return {
        id: milestone.id,
        name: milestone.name,
        targetProgress: milestone.targetProgress,
        status,
        date: milestoneDate,
        color: status === 'completed' ? '#10b981' : 
               status === 'current' ? '#f59e0b' : '#6b7280',
        isKey: milestone.isKey
      };
    });
  }

  /**
   * Calculate risk assessment based on project data
   */
  static calculateRiskAssessment(project: ProjectData, evmMetrics: EVMMetrics) {
    const risks: Array<{
      type: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      color: string;
      severity: string;
    }> = [];

    // Schedule risk
    if (evmMetrics.schedulePerformanceIndex < 0.9) {
      risks.push({
        type: 'high' as const,
        title: 'Risque de Retard Critique',
        description: 'Le projet présente des retards significatifs qui nécessitent une action immédiate pour respecter les délais.',
        color: '#ef4444',
        severity: 'CRITIQUE'
      });
    }

    // Cost risk
    if (evmMetrics.costPerformanceIndex < 0.9) {
      risks.push({
        type: 'high' as const,
        title: 'Dépassement de Budget',
        description: 'Les coûts actuels dépassent les prévisions budgétaires, impactant la rentabilité du projet.',
        color: '#ef4444',
        severity: 'CRITIQUE'
      });
    }

    // Weather/external risk
    risks.push({
      type: 'medium' as const,
      title: 'Conditions Météorologiques',
      description: 'Conditions météorologiques défavorables pouvant ralentir les travaux extérieurs.',
      color: '#f59e0b',
      severity: 'MOYEN'
    });

    // Material cost risk
    risks.push({
      type: 'low' as const,
      title: 'Variations des Coûts',
      description: 'Légères variations dans les coûts des matériaux non critiques.',
      color: '#10b981',
      severity: 'FAIBLE'
    });

    return risks;
  }

  /**
   * Generate phase timeline data for Gantt chart
   */
  static generatePhaseTimeline(project: ProjectData, phases?: PhaseDTO[]): PhaseTimeline[] {
    const today = new Date();
    const projectStart = project.startDate ? new Date(project.startDate) : today;
    
    if (phases && phases.length > 0) {
      return phases.map((phase, index) => {
        const phaseStart = phase.startDate 
          ? new Date(phase.startDate) 
          : new Date(projectStart.getTime() + (index * 60 * 24 * 60 * 60 * 1000));
        
        const phaseEnd = phase.endDate 
          ? new Date(phase.endDate) 
          : new Date(phaseStart.getTime() + (60 * 24 * 60 * 60 * 1000));
        
        const phaseProgress = phase.progress || Math.min(100, Math.max(0, (project.progress || 0) - (index * 25)));
        
        return {
          id: phase.id || `phase-${index + 1}`,
          name: phase.name || phase.name || `Phase ${index + 1}`,
          startDate: phaseStart,
          endDate: phaseEnd,
          progress: Math.min(100, Math.max(0, phaseProgress)),
          status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'planned'
        };
      });
    }

    // Default phases
    const names = [
      'Préparation et études',
      'Fouilles et fondations',
      'Structure et gros œuvre',
      'Second œuvre',
      'Finitions et livraison'
    ];

    return names.map((name, index) => {
      const phaseStart = new Date(projectStart);
      phaseStart.setDate(projectStart.getDate() + (index * 60));
      const phaseEnd = new Date(phaseStart);
      phaseEnd.setDate(phaseStart.getDate() + 60);
      
      let phaseProgress: number;
      if (index === 0) {
        phaseProgress = 100; // First phase completed
      } else if (index === 1) {
        phaseProgress = 100; // Second phase completed
      } else if (index === 2) {
        phaseProgress = Math.max(0, (project.progress || 0) - 50); // Current phase
      } else {
        phaseProgress = 0; // Future phases
      }

      return {
        id: `phase-${index + 1}`,
        name,
        startDate: phaseStart,
        endDate: phaseEnd,
        progress: Math.min(100, Math.max(0, phaseProgress)),
        status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'planned'
      };
    });
  }

  /**
   * Calcule le taux de complétion des tâches
   */
  static calculateTaskCompletionRate(tasks: TaskAssignmentDTO[]): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    cancelled: number;
    completionRate: number;
  } {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const cancelled = tasks.filter(t => t.status === 'CANCELLED').length;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  /**
   * Calcule les statistiques des tâches par priorité
   */
  static calculateTaskStatsByPriority(tasks: TaskAssignmentDTO[]): {
    [priority: string]: {
      total: number;
      completed: number;
      completionRate: number;
    };
  } {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const result: { [key: string]: { total: number; completed: number; completionRate: number } } = {};
    
    priorities.forEach(priority => {
      const filtered = tasks.filter(t => t.priority === priority);
      const total = filtered.length;
      const completed = filtered.filter(t => t.status === 'COMPLETED').length;
      result[priority] = {
        total,
        completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    });
    
    return result;
  }

  /**
   * Calcule les statistiques des tâches par statut
   */
  static calculateTaskStatsByStatus(tasks: TaskAssignmentDTO[]): {
    [status: string]: number;
  } {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'];
    const result: { [key: string]: number } = {};
    
    statuses.forEach(status => {
      result[status] = tasks.filter(t => t.status === status).length;
    });
    
    return result;
  }

  /**
   * Calcule le temps moyen de complétion des tâches
   */
  static calculateAverageCompletionTime(tasks: TaskAssignmentDTO[]): number {
    const completedTasks = tasks.filter(t => 
      t.status === 'COMPLETED' && 
      t.startDate && 
      t.completedAt
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const start = new Date(task.startDate!);
      const end = new Date(task.completedAt!);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    
    return totalDays / completedTasks.length;
  }
}