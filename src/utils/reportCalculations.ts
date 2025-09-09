import { EVMMetrics, PERTAnalysis, ProjectData } from '@/types/project';



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
      totalExpectedDuration: totalDuration,
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
  static generatePhaseTimeline(project: ProjectData, phases?: any[]): Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    progress: number;
    status: 'planned' | 'in_progress' | 'completed';
  }> {
    const today = new Date();
    const projectStart = project.startDate ? new Date(project.startDate) : today;
    
    if (phases && phases.length > 0) {
      return phases.map((phase, index) => {
        const phaseStart = new Date(projectStart);
        phaseStart.setDate(projectStart.getDate() + (index * 60)); // 2 months per phase
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseStart.getDate() + 60);
        
        const phaseProgress = phase.progress || Math.min(100, Math.max(0, project.progress - (index * 25)));
        
        return {
          id: phase.id || `phase-${index + 1}`,
          name: phase.name || phase.title || `Phase ${index + 1}`,
          startDate: phaseStart,
          endDate: phaseEnd,
          progress: phaseProgress,
          status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'planned'
        };
      });
    }

    // Default phases
    const phases1: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      progress: number;
      status: 'planned' | 'in_progress' | 'completed';
    }> = [];

    const phaseNames = [
      'Préparation et études',
      'Fouilles et fondations',
      'Structure et gros œuvre',
      'Second œuvre',
      'Finitions et livraison'
    ];

    phaseNames.forEach((name, index) => {
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
        phaseProgress = Math.max(0, project.progress - 50); // Current phase
      } else {
        phaseProgress = 0; // Future phases
      }

      phases1.push({
        id: `phase-${index + 1}`,
        name,
        startDate: phaseStart,
        endDate: phaseEnd,
        progress: Math.min(100, phaseProgress),
        status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'planned'
      });
    });

    return phases1;
  }
}