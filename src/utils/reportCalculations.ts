import { ProjectData } from '@/types/project';

export interface EVMMetrics {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

export interface PERTActivity {
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  pertEstimate: number;
  standardDeviation: number;
}

export interface PERTAnalysis {
  activities: PERTActivity[];
  totalDuration: number;
  totalStandardDeviation: number;
}

export class ReportCalculations {
  
  /**
   * Calculate Earned Value Management (EVM) metrics
   */
  static calculateEVMMetrics(project: ProjectData, actualCost: number): EVMMetrics {
    const budget = project.budget || 0;
    const progress = project.progress || 0;
    
    // Calculate basic EVM values
    const plannedValue = budget * 0.6; // Assume 60% should be completed by now
    const earnedValue = budget * (progress / 100);
    const budgetAtCompletion = budget;
    
    // Calculate variances
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    
    // Calculate performance indices
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
    
    // Calculate forecasts
    const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;
    const estimateToComplete = estimateAtCompletion - actualCost;
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
   * Calculate PERT analysis for project phases
   */
  static calculatePERTAnalysis(phases?: any[]): PERTAnalysis {
    // Default activities if no phases provided
    const defaultActivities = [
      { name: 'Préparation du site', optimistic: 5, mostLikely: 7, pessimistic: 10 },
      { name: 'Fondations', optimistic: 10, mostLikely: 15, pessimistic: 22 },
      { name: 'Structure', optimistic: 20, mostLikely: 25, pessimistic: 35 },
      { name: 'Finitions', optimistic: 15, mostLikely: 20, pessimistic: 28 },
    ];

    const activities = phases && phases.length > 0 
      ? phases.map(phase => ({
          name: phase.name || phase.title || 'Phase inconnue',
          optimistic: phase.optimistic_duration || 5,
          mostLikely: phase.most_likely_duration || 10,
          pessimistic: phase.pessimistic_duration || 15
        }))
      : defaultActivities;

    const processedActivities = activities.map(activity => {
      const pertEstimate = this.calculatePERTEstimate(activity.optimistic, activity.mostLikely, activity.pessimistic);
      const variance = this.calculatePERTVariance(activity.optimistic, activity.pessimistic);
      const standardDeviation = Math.sqrt(variance);

      return {
        ...activity,
        pertEstimate,
        standardDeviation
      };
    });

    const totalDuration = processedActivities.reduce((sum, activity) => sum + activity.pertEstimate, 0);
    const totalVariance = processedActivities.reduce((sum, activity) => sum + Math.pow(activity.standardDeviation, 2), 0);
    const totalStandardDeviation = Math.sqrt(totalVariance);

    return {
      activities: processedActivities,
      totalDuration,
      totalStandardDeviation
    };
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
   * Calculate milestone progress based on project progress
   */
  static calculateMilestoneStatus(progress: number): Array<{
    name: string;
    targetProgress: number;
    status: 'completed' | 'in-progress' | 'pending';
    color: string;
  }> {
    const milestones = [
      { name: 'Démarrage du Projet', targetProgress: 0 },
      { name: '25% d\'Avancement', targetProgress: 25 },
      { name: '50% d\'Avancement', targetProgress: 50 },
      { name: '75% d\'Avancement', targetProgress: 75 },
      { name: 'Finalisation', targetProgress: 100 }
    ];

    return milestones.map(milestone => ({
      ...milestone,
      status: progress >= milestone.targetProgress ? 'completed' : 
              progress >= milestone.targetProgress - 10 ? 'in-progress' : 'pending',
      color: progress >= milestone.targetProgress ? '#10b981' : 
             progress >= milestone.targetProgress - 10 ? '#f59e0b' : '#6b7280'
    }));
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
  static generatePhaseTimeline(project: ProjectData, phases?: any[]): Array<{
    name: string;
    progress: number;
    color: string;
    status: string;
  }> {
    if (phases && phases.length > 0) {
      return phases.map((phase, index) => ({
        name: phase.name || phase.title || `Phase ${index + 1}`,
        progress: phase.progress || Math.min(100, Math.max(0, project.progress - (index * 30))),
        color: phase.progress >= 100 ? '#10b981' : phase.progress > 0 ? '#3b82f6' : '#f59e0b',
        status: phase.progress >= 100 ? 'Terminé' : phase.progress > 0 ? 'En cours' : 'Planifié'
      }));
    }

    // Default phases
    return [
      {
        name: 'Phase 1',
        progress: 100,
        color: '#10b981',
        status: 'Terminé'
      },
      {
        name: 'Phase 2',
        progress: Math.min(project.progress, 100),
        color: project.progress > 50 ? '#3b82f6' : '#3b82f6',
        status: 'En cours'
      },
      {
        name: 'Phase 3',
        progress: Math.max(0, project.progress - 60),
        color: '#f59e0b',
        status: 'Planifié'
      }
    ];
  }
}