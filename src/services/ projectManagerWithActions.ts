// projectManagerWithActions.ts

import { ActionLabels, Alert, CheckScheduleLastRun, EscalationRoles, EVMData, GanttChartData, GanttDependency, GanttTask, InsurancePolicy, PERTAnalysis, ProjectData, Task } from "@/types/project";
import { CHECK_SCHEDULE_INTERVALS } from "@/hooks/projects/constants";



/**
 * ---------------------------
 * Fonctions utilitaires
 * ---------------------------
 */
const uid = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const daysBetween = (d1: Date, d2: Date) =>
  Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isDateInPast = (date: string) => new Date(date) < new Date();

/**
 * ---------------------------
 * Classe de gestion du projet avec actions injectables
 * ---------------------------
 */
// Export types for use in other modules
export type { Alert, EVMData, GanttChartData, PERTAnalysis } from "@/types/project";

export class ProjectManager {
  private lastChecks: {
    insurance: Date;
    delay: Date;
    inspection: Date;
  } = {
    insurance: new Date(0),
    delay: new Date(0),
    inspection: new Date(0)
  };

  constructor(
    private project: ProjectData,
    private roles: EscalationRoles,
    private actions:  ActionLabels
  ) {}

  private shouldRunCheck(checkType: keyof typeof this.lastChecks): boolean {
    const now = new Date();
    const lastCheck = this.lastChecks[checkType];
    const daysSinceLastCheck = daysBetween(lastCheck, now);
    
    const requiredInterval = CHECK_SCHEDULE_INTERVALS[`${checkType}Check` as keyof typeof CHECK_SCHEDULE_INTERVALS] || 1;
    return daysSinceLastCheck >= requiredInterval;
  }

  private updateLastCheck(checkType: keyof typeof this.lastChecks) {
    this.lastChecks[checkType] = new Date();
  }

  private assignActions(alert: Alert): Alert {
    const actions: string[] = [];

    // Actions de base selon le type
    switch (alert.type) {
      case 'insurance_expiry':
        actions.push(
          this.actions.email,
          this.actions.sms,
          this.actions.hierarchy_notification
        );
        if (alert.severity === 'critical') {
          actions.push(this.actions.legal_consultation);
        }
        break;

      case 'project_delay':
        actions.push(
          this.actions.task_assignment,
          this.actions.hierarchy_notification,
          this.actions.call
        );
        if (alert.escalationLevel && alert.escalationLevel >= 3) {
          actions.push(this.actions.financial_review);
        }
        break;

      case 'inspection_issue':
        actions.push(
          this.actions.call,
          this.actions.email,
          this.actions.hierarchy_notification
        );
        break;

      case 'financial_risk':
        actions.push(
          this.actions.financial_review,
          this.actions.legal_consultation,
          this.actions.hierarchy_notification
        );
        break;
    }

    // Actions supplémentaires selon le niveau de sévérité
    if (alert.severity === 'high' || alert.severity === 'critical') {
      actions.push(this.actions.meeting_schedule);
    }

    if (alert.escalationLevel && alert.escalationLevel >= 2) {
      actions.push(this.actions.document_upload);
    }

    alert.availableActions = [...new Set(actions)]; // Éviter les doublons
    return alert;
  }

  checkPolicies(): Alert[] {
    if (!this.shouldRunCheck('insurance')) return [];
    
    const alerts: Alert[] = [];
    const today = new Date();

    for (const policy of this.project.insurancePolicies ?? []) {
      // Ne pas alerter pour les polices expirées déjà traitées
      if (policy.status === 'expired' && policy.alertSent) continue;

      const endDate = new Date(policy.endDate);
      const daysToExpire = daysBetween(today, endDate);
      
      let status: InsurancePolicy['status'] = policy.status;
      let severity: Alert['severity'] = 'low';
      
      if (daysToExpire <= 0) {
        status = 'expired';
        severity = 'critical';
      } else if (daysToExpire <= 7) {
        status = 'expiring_soon';
        severity = 'high';
      } else if (daysToExpire <= 15) {
        status = 'expiring_soon';
        severity = 'medium';
      } else if (daysToExpire <= 30) {
        status = 'expiring_soon';
        severity = 'low';
      }

      // Mettre à jour le statut de la police
      policy.status = status;

      if (daysToExpire <= 30) {
        const alert: Alert = {
          id: uid('alert'),
          type: 'insurance_expiry',
          severity,
          title: `Expiration ${policy.type === 'assurance' ? 'd\'assurance' : 'de garantie bancaire'}`,
          message: `La ${policy.type === 'assurance' ? 'police d\'assurance' : 'garantie bancaire'} ${policy.reference} (${
            policy.issuer
          }) ${daysToExpire <= 0 ? 'a expiré' : `expire dans ${daysToExpire} jours`}`,
          projectId: this.project.id,
          relatedEntityId: policy.id,
          triggerDate: today.toISOString(),
          timestamp: today.toISOString(),
          acknowledged: false,
          actionRequired: true,
          escalationLevel: daysToExpire <= 0 ? 2 : 1,
          deadline: daysToExpire > 0 ? new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };

        alerts.push(this.assignActions(alert));
        policy.alertSent = true;
      }
    }

    this.updateLastCheck('insurance');
    return alerts;
  }

  checkDelays(): Alert[] {
    if (!this.shouldRunCheck('delay')) return [];
    
    const alerts: Alert[] = [];
    const tasks = this.project.tasks ?? [];
    const today = new Date();

    if (tasks.length === 0) return alerts;

    // Calcul du retard pondéré uniquement sur les tâches en cours
    const activeTasks = tasks.filter(task => 
      task.status === 'in_progress' || task.status === 'delayed'
    );

    if (activeTasks.length === 0) return alerts;

    let totalWeightedDelay = 0;
    let totalWeight = 0;

    for (const task of activeTasks) {
      const plannedEnd = new Date(task.endDate);
      const plannedDuration = daysBetween(new Date(task.startDate), plannedEnd);
      
      if (today > plannedEnd) {
        // Tâche en retard
        const actualDuration = daysBetween(new Date(task.startDate), today);
        const delayPercentage = ((actualDuration - plannedDuration) / plannedDuration) * 100;
        
        totalWeightedDelay += delayPercentage * task.weight;
        totalWeight += task.weight;
      }
    }

    if (totalWeight === 0) return alerts;

    const averageDelay = totalWeightedDelay / totalWeight;

    let level: number | null = null;
    const thresholds = this.project.escalationThresholds ?? {
      alert: 10,
      notification: 20,
      guarantee: 30,
      legal: 40
    };

    if (averageDelay >= thresholds.legal) level = 4;
    else if (averageDelay >= thresholds.guarantee) level = 3;
    else if (averageDelay >= thresholds.notification) level = 2;
    else if (averageDelay >= thresholds.alert) level = 1;

    if (level !== null) {
      const alert: Alert = {
        id: uid('alert'),
        type: 'project_delay',
        severity: level >= 4 ? 'critical' : level >= 3 ? 'high' : level >= 2 ? 'medium' : 'low',
        title: `Retard de projet - Niveau ${level}`,
        message: `Retard pondéré détecté : ${averageDelay.toFixed(1)}%. Le projet accuse un retard significatif.`,
        projectId: this.project.id,
        triggerDate: today.toISOString(),
        timestamp: today.toISOString(),
        acknowledged: false,
        actionRequired: true,
        escalationLevel: level,
      };

      alerts.push(this.assignActions(alert));
    }

    this.updateLastCheck('delay');
    return alerts;
  }

  checkInspections(): Alert[] {
    if (!this.shouldRunCheck('inspection')) return [];
    
    const alerts: Alert[] = [];
    const inspections = this.project.inspections ?? [];
    const today = new Date();

    for (const inspection of inspections) {
      // Vérifier les inspections avec problèmes
      if (inspection.issues && inspection.issues.length > 0) {
        const criticalIssues = inspection.issues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'critical'
        );

        if (criticalIssues.length > 0) {
          const alert: Alert = {
            id: uid('alert'),
            type: 'inspection_issue',
            severity: 'high',
            title: 'Problèmes critiques lors de l\'inspection',
            message: `${criticalIssues.length} problème(s) critique(s) détecté(s) lors de l'inspection ${inspection.id}`,
            projectId: this.project.id,
            relatedEntityId: inspection.id,
            triggerDate: today.toISOString(),
            timestamp: today.toISOString(),
            acknowledged: false,
            actionRequired: true,
            escalationLevel: 2,
          };

          alerts.push(this.assignActions(alert));
        }
      }

      // Vérifier la progression lors de l'inspection
      if (inspection.progress_at_inspection < 50 && inspection.status !== 'completed') {
        const alert: Alert = {
          id: uid('alert'),
          type: 'inspection_issue',
          severity: 'medium',
          title: 'Progression insuffisante lors de l\'inspection',
          message: `Inspection ${inspection.id} : progression à ${inspection.progress_at_inspection}% seulement`,
          projectId: this.project.id,
          relatedEntityId: inspection.id,
          triggerDate: today.toISOString(),
          timestamp: today.toISOString(),
          acknowledged: false,
          actionRequired: true,
          escalationLevel: 1,
        };

        alerts.push(this.assignActions(alert));
      }
    }

    this.updateLastCheck('inspection');
    return alerts;
  }

  checkFinancialRisks(): Alert[] {
    const alerts: Alert[] = [];
    const tasks = this.project.tasks ?? [];

    // Détection des dépassements de budget (exemple simplifié)
    const budgetOverrunTasks = tasks.filter(task => {
      // Ici vous pourriez avoir une logique de calcul de coût réel vs prévu
      return task.status === 'in_progress' && Math.random() > 0.8; // Exemple aléatoire
    });

    if (budgetOverrunTasks.length > 3) {
      const alert: Alert = {
        id: uid('alert'),
        type: 'financial_risk',
        severity: 'high',
        title: 'Risque financier détecté',
        message: `${budgetOverrunTasks.length} tâches présentent des dépassements de budget`,
        projectId: this.project.id,
        triggerDate: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        acknowledged: false,
        actionRequired: true,
        escalationLevel: 3,
      };

      alerts.push(this.assignActions(alert));
    }

    return alerts;
  }

  escalate(alerts: Alert[]): Alert[] {
    return alerts.map(alert => {
      if (alert.acknowledged) return alert;

      switch (alert.escalationLevel) {
        case 1:
          alert.actionTaken = `Assigné à ${this.roles.level1}`;
          break;
        case 2:
          alert.actionTaken = `Escaladé à ${this.roles.level2}`;
          break;
        case 3:
          alert.actionTaken = `Escaladé à ${this.roles.level3}`;
          break;
        case 4:
          alert.actionTaken = `Action légale déclenchée par ${this.roles.level3}`;
          break;
        default:
          alert.actionTaken = `Traité par le système`;
      }
      return alert;
    });
  }

  /**
   * Met à jour les données EVM (Earned Value Management)
   */
  updateEVMData(): EVMData {
    if (!this.project.tasks || this.project.tasks.length === 0) {
      return {
        plannedValue: 0,
        earnedValue: 0,
        actualCost: 0,
        schedulePerformanceIndex: 0,
        costPerformanceIndex: 0,
        estimateAtCompletion: 0,
        estimateToComplete: 0,
        varianceAtCompletion: 0
      };
    }

    const today = new Date();
    const startDate = new Date(this.project.startDate);
    const totalDuration = daysBetween(startDate, new Date(this.project.endDate || today));
    const elapsedDuration = daysBetween(startDate, today);
    
    let plannedValue = 0;
    let earnedValue = 0;
    let actualCost = 0;

    for (const task of this.project.tasks) {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);
      const taskDuration = daysBetween(taskStartDate, taskEndDate);
      const taskElapsed = daysBetween(taskStartDate, today);
      
      // PV: Budgeted Cost of Work Scheduled
      const taskPV = task.costEstimate * Math.min(1, Math.max(0, taskElapsed / taskDuration));
      plannedValue += taskPV;
      
      // EV: Budgeted Cost of Work Performed
      const taskEV = task.costEstimate * (task.progress / 100);
      earnedValue += taskEV;
      
      // AC: Actual Cost of Work Performed
      actualCost += task.actualCost || 0;
    }

    // Calcul des indicateurs EVM
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
    const estimateAtCompletion = costPerformanceIndex > 0 ? this.project.budget / costPerformanceIndex : this.project.budget;
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = this.project.budget - estimateAtCompletion;

    const evmData: EVMData = {
      plannedValue,
      earnedValue,
      actualCost,
      schedulePerformanceIndex,
      costPerformanceIndex,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion
    };

    this.project.earnedValueManagement = evmData;
    return evmData;
  }

  /**
   * Génère un diagramme de Gantt
   */
  generateGanttChart(): GanttChartData {
    if (!this.project.tasks) {
      return { tasks: [], dependencies: [] };
    }

    const ganttTasks: GanttTask[] = [];
    const ganttDependencies: GanttDependency[] = [];

    // Créer les tâches pour le diagramme de Gantt
    for (const task of this.project.tasks) {
      ganttTasks.push({
        id: task.id,
        text: task.name,
        start_date: task.startDate,
        duration: task.estimatedDuration,
        progress: task.progress / 100,
        color: this.getTaskColor(task)
      });

      // Créer les dépendances pour le diagramme de Gantt
      for (const depId of task.dependencies) {
        ganttDependencies.push({
          id: `dep-${task.id}-${depId}`,
          source: depId,
          target: task.id,
          type: '0' // Fin à Début
        });
      }
    }

    const ganttData: GanttChartData = {
      tasks: ganttTasks,
      dependencies: ganttDependencies
    };

    this.project.ganttChart = ganttData;
    return ganttData;
  }

  /**
   * Retourne la couleur d'une tâche pour le diagramme de Gantt
   */
  private getTaskColor(task: Task): string {
    switch (task.status) {
      case 'completed':
        return '#4CAF50'; // Vert
      case 'in_progress':
        return '#2196F3'; // Bleu
      case 'delayed':
        return '#F44336'; // Rouge
      default:
        return '#9E9E9E'; // Gris
    }
  }

  /**
   * Effectue une analyse PERT
   */
  performPertAnalysis(): PERTAnalysis {
    if (!this.project.tasks) {
      return {
        expectedDurations: {},
        criticalPath: [],
        totalExpectedDuration: 0,
        variances: {}
      };
    }

    const expectedDurations: { [taskId: string]: number } = {};
    const variances: { [taskId: string]: number } = {};
    
    // Calcul des durées attendues et variances pour chaque tâche
    for (const task of this.project.tasks) {
      const optimistic = task.optimisticEstimate || task.estimatedDuration * 0.8;
      const pessimistic = task.pessimisticEstimate || task.estimatedDuration * 1.5;
      const expected = (optimistic + 4 * task.estimatedDuration + pessimistic) / 6;
      const variance = Math.pow((pessimistic - optimistic) / 6, 2);
      
      expectedDurations[task.id] = expected;
      variances[task.id] = variance;
    }
    
    // Calcul du chemin critique
    const criticalPath = this.calculateCriticalPath(this.project.tasks, expectedDurations);
    
    // Calcul de la durée totale attendue
    const totalExpectedDuration = criticalPath.reduce((total, taskId) => {
      const task = this.project.tasks?.find(t => t.id === taskId);
      return total + (task ? expectedDurations[task.id] : 0);
    }, 0);
    
    const pertAnalysis: PERTAnalysis = {
      expectedDurations,
      criticalPath,
      totalExpectedDuration,
      variances
    };

    this.project.pertAnalysis = pertAnalysis;
    return pertAnalysis;
  }

  /**
   * Calcule le chemin critique (version améliorée)
   */
  private calculateCriticalPath(tasks: Task[], expectedDurations: { [taskId: string]: number }): string[] {
    // Implémentation simplifiée - dans une application réelle, utiliser un algorithme de graphe complet
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Calcul des dates au plus tôt
    const earlyStart: { [taskId: string]: number } = {};
    const earlyFinish: { [taskId: string]: number } = {};
    
    // Trier les tâches dans l'ordre topologique
    const sortedTasks = this.topologicalSort(tasks);
    
    // Calcul des dates au plus tôt
    for (const task of sortedTasks) {
      if (task.dependencies.length === 0) {
        earlyStart[task.id] = 0;
      } else {
        earlyStart[task.id] = Math.max(...task.dependencies.map(
          depId => earlyFinish[depId] || 0
        ));
      }
      earlyFinish[task.id] = earlyStart[task.id] + expectedDurations[task.id];
    }
    
    // Calcul des dates au plus tard
    const lateFinish: { [taskId: string]: number } = {};
    const lateStart: { [taskId: string]: number } = {};
    const projectDuration = Math.max(...Object.values(earlyFinish));
    
    for (const task of sortedTasks.reverse()) {
      const successors = tasks.filter(t => t.dependencies.includes(task.id));
      
      if (successors.length === 0) {
        lateFinish[task.id] = projectDuration;
      } else {
        lateFinish[task.id] = Math.min(...successors.map(
          succ => lateStart[succ.id] || projectDuration
        ));
      }
      
      lateStart[task.id] = lateFinish[task.id] - expectedDurations[task.id];
    }
    
    // Identification du chemin critique
    const criticalPath: string[] = [];
    for (const task of tasks) {
      const slack = lateStart[task.id] - earlyStart[task.id];
      if (slack === 0) {
        criticalPath.push(task.id);
        task.criticalPath = true;
      } else {
        task.criticalPath = false;
      }
    }
    
    return criticalPath;
  }

  /**
   * Tri topologique des tâches
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const visited = new Set<string>();
    const sorted: Task[] = [];
    
    const visit = (task: Task) => {
      if (visited.has(task.id)) return;
      
      visited.add(task.id);
      
      for (const depId of task.dependencies) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) visit(depTask);
      }
      
      sorted.push(task);
    };
    
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }
    
    return sorted;
  }

  /**
   * Met à jour la progression du projet basée sur les tâches
   */
  updateProjectProgress(): number {
    if (!this.project.tasks || this.project.tasks.length === 0) {
      return this.project.progress || 0;
    }

    let totalWeight = 0;
    let weightedProgress = 0;

    for (const task of this.project.tasks) {
      weightedProgress += task.progress * task.weight;
      totalWeight += task.weight;
    }

    const overallProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
    this.project.progress = overallProgress;
    
    // Met à jour également le statut des phases
    this.updatePhasesProgress();
    
    return overallProgress;
  }

  /**
   * Met à jour la progression des phases basée sur les tâches
   */
  private updatePhasesProgress(): void {
    if (!this.project.plannedPhases || !this.project.tasks) return;

    for (const phase of this.project.plannedPhases) {
      const phaseTasks = this.project.tasks.filter(task => {
        const phaseId = this.project.plannedPhases?.findIndex(p => p.phase === phase.phase) || 0;
        return task.phaseId === phaseId.toString();
      });

      if (phaseTasks.length > 0) {
        let totalWeight = 0;
        let weightedProgress = 0;

        for (const task of phaseTasks) {
          weightedProgress += task.progress * task.weight;
          totalWeight += task.weight;
        }

        const phaseProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
        
        // Met à jour le statut de la phase
        if (phaseProgress === 100) {
          phase.status = 'completed';
        } else if (phaseProgress > 0) {
          phase.status = 'in_progress';
          
          // Vérifie si la phase est en retard
          const today = new Date();
          const phaseEndDate = new Date(phase.endDate);
          if (today > phaseEndDate) {
            phase.status = 'delayed';
          }
        } else {
          phase.status = 'not_started';
        }
      }
    }
  }

  /**
   * Exécute toutes les vérifications et mises à jour
   */
  runAllChecks(): {
    alerts: Alert[];
    progress: number;
    evmData: EVMData;
    ganttData: GanttChartData;
    pertData: PERTAnalysis;
  } {
    const alerts = this.escalate([
      ...this.checkPolicies(),
      ...this.checkDelays(),
      ...this.checkInspections(),
      ...this.checkFinancialRisks(),
    ]);
    
    const progress = this.updateProjectProgress();
    const evmData = this.updateEVMData();
    const ganttData = this.generateGanttChart();
    const pertData = this.performPertAnalysis();
    
    return {
      alerts,
      progress,
      evmData,
      ganttData,
      pertData
    };
  }

  // Méthode pour marquer une alerte comme traitée
  acknowledgeAlert(alertId: string, userId: string, actionTaken?: string): void {
    const alert = this.findAlert(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      if (actionTaken) {
        alert.actionTaken = actionTaken;
        alert.actionTakenBy = userId;
        alert.actionTakenAt = new Date().toISOString();
      }
    }
  }

  private findAlert(alertId: string): Alert | undefined {
    if (!this.project.alerts) return undefined;
    return this.project.alerts.find(alert => alert.id === alertId);
  }
}

/**
 * ---------------------------
 * Exemple d'utilisation
 * ---------------------------
 */
const exampleProject: ProjectData = {
  id: '9146da6c-29b9-4787-b901-3bead2a57068',
  title: 'Ligne HT Nouakchott-Zouerate',
  description: 'Construction de lignes haute tension reliant Nouakchott et Zouerate.',
  location: 'Nouakchott - Zouerate',
  status: 'en cours',
  progress: 15,
  budget: 120000000,
  startDate: '2021-03-23',
  endDate: '2026-12-31',
  thumbnail: '/assets/projects/powerline.jpg',
  teamSize: 15,
  coordinates: {
    latitude: 19.5,
    longitude: -13
  },
  financingSource: 'Banque Mondiale',
  marketType: 'International',
  selectionMode: 'Appel d\'offres',
  launchDate: '2021-01-15',
  attributionDate: '2021-02-28',
  allowsInitialPayment: true,
  initialPaymentPercentage: 15,
  currentPhase: 'structural_work',
  currentStage: 'structural_framing',
  plannedPhases: [
    {
      phase: 'pre_construction',
      startDate: '2021-03-23',
      endDate: '2021-09-30',
      estimatedDuration: 190,
      status: 'completed',
      weight: 0.15
    },
    {
      phase: 'site_preparation',
      startDate: '2021-10-01',
      endDate: '2022-12-31',
      estimatedDuration: 456,
      status: 'completed',
      weight: 0.25
    },
    {
      phase: 'structural_work',
      startDate: '2023-01-01',
      endDate: '2025-06-30',
      estimatedDuration: 911,
      status: 'in_progress',
      weight: 0.40
    },
    {
      phase: 'finishing',
      startDate: '2025-07-01',
      endDate: '2025-12-31',
      estimatedDuration: 184,
      status: 'not_started',
      weight: 0.10
    },
    {
      phase: 'handover',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      estimatedDuration: 365,
      status: 'not_started',
      weight: 0.10
    }
  ],
  constructionMilestones: [
    {
      id: '9546da6c-29c9-4787-b901-4bead2a57068',
      title: 'Approval des études techniques',
      phase: 'pre_construction',
      stage: 'planning_design',
      targetDate: '2021-06-30',
      completedDate: '2021-06-15',
      status: 'completed',
      weight: 0.3
    },
    {
      id: '9146da6c-23b9-4787-b901-4aead2a57068',
      title: 'Commande des matériaux principaux',
      phase: 'site_preparation',
      stage: 'permits_approvals',
      targetDate: '2022-03-31',
      completedDate: '2022-04-15',
      status: 'completed',
      notes: 'Délai d\'approvisionnement dû à des contraintes logistiques',
      weight: 0.4
    },
    {
      id: '9146da6c-29b9-1787-b901-4aead2a57068',
      title: 'Installation des 100 premiers pylônes',
      phase: 'structural_work',
      stage: 'structural_framing',
      targetDate: '2023-12-31',
      completedDate: undefined,
      status: 'pending',
      weight: 0.5
    }
  ],
  tasks: [
    {
      id: '9146da6c-29b9-4787-b201-4aead2a57068',
      name: 'Études géotechniques',
      description: 'Analyses des sols pour les foundations des pylônes',
      phaseId: 'phase-001',
      dependencies: [],
      assignedTo: ['1146da6c-29b9-4787-b901-7aaad2a57068', '2146da6c-29b9-4787-b901-7aaad2a57068'],
      estimatedDuration: 60,
      actualDuration: 55,
      startDate: '2021-03-23',
      endDate: '2021-05-22',
      status: 'completed',
      progress: 100,
      weight: 0.3,
      costEstimate: 500000,
      actualCost: 480000
    },
    {
      id: '8146da6c-29n9-4787-b901-4aead2a57068',
      name: 'Conception des foundations',
      description: 'Calcul et conception des foundations des pylônes',
      phaseId: 'phase-001',
      dependencies: ['9146da6c-29b9-4787-b201-4aead2a5706'],
      assignedTo: ['3146da6c-29b9-4787-b901-7aaad2a57068'],
      estimatedDuration: 90,
      actualDuration: 85,
      startDate: '2021-05-23',
      endDate: '2021-08-21',
      status: 'completed',
      progress: 100,
      weight: 0.4,
      costEstimate: 700000,
      actualCost: 720000
    },
    {
      id: '7146da6c-29b9-4767-b901-4aead2a57068',
      name: 'Commande des câbles',
      description: 'Négociation et commande des câbles haute tension',
      phaseId: 'phase-002',
      dependencies: [],
      assignedTo: ['4146da6c-29b9-4787-b901-7aaad2a57068'],
      estimatedDuration: 120,
      actualDuration: 150,
      startDate: '2021-10-01',
      endDate: '2022-01-29',
      status: 'completed',
      progress: 100,
      weight: 0.6,
      costEstimate: 30000000,
      actualCost: 32000000
    },
    {
      id: '6146da6c-29b9-4717-b901-4kead2a57068',
      name: 'Installation des premiers pylônes',
      description: 'Installation des 50 premiers pylônes sur le tronçon initial',
      phaseId: 'phase-003',
      dependencies: ['task-002', 'task-003'],
      assignedTo: ['1146da6c-29b9-4787-b901-7aaad2a57068', '1146da6c-29b9-4787-b901-7aaad2a57068', '2146da6c-29b9-4787-b901-7aaad2a57068'],
      estimatedDuration: 180,
      actualDuration: 210,
      startDate: '2023-01-01',
      endDate: '2023-06-30',
      status: 'in_progress',
      progress: 70,
      weight: 0.7,
      costEstimate: 5000000,
      actualCost: 4200000,
      optimisticEstimate: 150,
      pessimisticEstimate: 240
    }
  ],
  risks: [
    {
      id: '9146da6c-29b9-4787-b301-4zexd2a57068',
      title: 'Retard d\'approvisionnement',
      description: 'Retard possible dans la livraison des matériaux due à des problèmes logistiques',
      probability: 40,
      impact: 70,
      mitigationPlan: 'Prévoir des stocks tampons et identifier des fournisseurs alternatifs',
      status: 'monitored',
      relatedTasks: ['6146da6c-29b9-4717-b901-4kead2a57068','6146da6c-29b9-4717-b901-4kead2a57068']
    },
    {
      id: '9146da6c-29b9-4787-q901-4aewd2a57068',
      title: 'Conditions météorologiques défavorables',
      description: 'Tempêtes de sable pouvant ralentir les travaux',
      probability: 60,
      impact: 50,
      mitigationPlan: 'Planifier les travaux critiques en dehors de la période de tempêtes',
      status: 'identified',
      relatedTasks: ['8146da6c-29n9-4787-b901-4aead2a57068']
    }
  ],
  resources: [
    {
      id: '1146da6c-29b9-4787-b901-7aaad2a57068',
      name: 'Équipe géotechnique',
      type: 'human',
      skills: ['géotechnique', 'forage'],
      costPerHour: 120,
      availability: 100,
      assignedTasks: ['6146da6c-29b9-4717-b901-4kead2a57068']
    },
    {
      id: '2146da6c-29b9-4787-b901-7aaad2a57068',
      name: 'Foreuse',
      type: 'equipment',
      costPerHour: 200,
      availability: 100,
      assignedTasks: ['8146da6c-29b9-4787-b201-4aead2a57068']
    },
    {
      id: '3146da6c-29b9-4787-b901-7aaad2a57068',
      name: 'Ingénieur structures',
      type: 'human',
      skills: ['ingénierie structures'],
      costPerHour: 80,
      availability: 100,
      assignedTasks: ['146da6c-29b9-4787-b201-4aead2a57068']
    }
  ],
  insurancePolicies: [
    {
      id: '9146da6c-29b9-4787-b901-4dddd2a57068',
      type: 'assurance',
      reference: 'ASS-2023-001',
      projectId: '9146da6c-29b9-4787-b901-3bead2a57068',
      issuer: 'AXA',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      amount: 5000000,
      coverage: 'RC chantier',
      status: 'active',
    },
  ],
  inspections: [
    {
      id: '9196da6c-00b9-4787-c901-4aead2a57068',
      project_id: '9146da6c-29b9-4787-b901-3bead2a57068',
      inspector: 'Ingénieur QA',
      date: '2023-07-01',
      status: 'in_progress',
      progress_at_inspection: 40,
      created_at: '2023-07-01',
      updated_at: '2023-07-01',
      issues: [
        {
          id: '9146da6c-29b9-4787-b901-4zzzd2a57068',
          description: 'Pylône #45 non conforme aux spécifications',
          severity: 'high',
          status: 'open'
        }
      ]
    },
  ],
  escalationThresholds: {
    alert: 10,
    notification: 20,
    guarantee: 30,
    legal: 40,
  },
  methodology: 'waterfall',
  contacts: [
    {
      id: '7146da6c-29b9-4787-b901-7aaad2a57068',
      name: 'Ali Mohamed',
      role: 'Chef de projet',
      email: 'ali.mohamed01@somelec.com',
      phone: '+2224567890',
      isPrimary: true
    }
  ],
  checkScheduleLastRun: {}
};

const roles: EscalationRoles = {
  level1: 'Chef de projet',
  level2: 'Directeur Technique',
  level3: 'DG',
  level4: 'Comité juridique'
};

const actionLabels: ActionLabels = {
  task_assignment: 'Assigner une tâche',
  hierarchy_notification: 'Notifier la hiérarchie',
  sms: 'Envoyer SMS',
  call: 'Programmer appel',
  email: 'Envoyer email',
  mail: 'Courrier postal',
  export_receipt: 'Exporter reçu',
  blockchain_verification: 'Vérification blockchain',
  document_upload: 'Uploader document',
  meeting_schedule: 'Planifier réunion',
  financial_review: 'Revue financière',
  legal_consultation: 'Consultation juridique',
};

const manager = new ProjectManager(exampleProject, roles, actionLabels);

// Exécution des vérifications
const alerts = manager.runAllChecks();

console.log('=== Alertes générées avec actions ===');
console.log(JSON.stringify(alerts, null, 2));

// Simulation de traitement d'une alerte
if (alerts.alerts.length > 0) {
  manager.acknowledgeAlert(alerts.alerts[0].id, 'bb01aec4-397d-4830-ab5c-7d5e0b21b704', 'Email envoyé au fournisseur');
}