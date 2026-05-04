import { ProjectData, EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';

// Define ActionLabels locally to avoid circular import
export interface ActionLabels {
  budget: string;
  timeline: string;
  quality: string;
  resource: string;
  risk: string;
  compliance: string;
  [key: string]: string;
}

export interface ProjectAlert {
  id: string;
  type: 'budget' | 'timeline' | 'quality' | 'resource' | 'risk' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  actions: string[];
}

export interface ProjectManagerState {
  alerts: ProjectAlert[];
  lastCheck: string;
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  pendingActions: string[];
  progress: number;
  evmData?: EVMData;
  ganttData?: GanttData;
  pertData?: PERTData;
}

interface EVMData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

interface GanttData {
  tasks: Array<{
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string[];
  }>;
}

interface PERTData {
  activities: Array<{
    id: string;
    name: string;
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
    expected: number;
    standardDeviation: number;
    dependencies: string[];
  }>;
}

interface ProjectWithCost {
  id: string;
  budget: number;
  progress: number;
  actual_cost?: number;
  actualCost?: number;
  endDate?: string;
  budgetVariance?: number;
  phases?: Array<{
    id: string;
    name: string;
    progress: number;
    start_date?: string;
    end_date?: string;
    optimisticEstimate?: number;
    mostLikelyEstimate?: number;
    pessimisticEstimate?: number;
  }>;
}

export class ProjectManager {
  private project: ProjectWithCost;
  private roles: EscalationRoles;
  private actionLabels: ActionLabels;
  private alerts: ProjectAlert[] = [];
  private state: ProjectManagerState;

  constructor(project: ProjectWithCost, roles: EscalationRoles, actionLabels: ActionLabels) {
    this.project = project;
    this.roles = roles;
    this.actionLabels = actionLabels;
    this.state = {
      alerts: [],
      lastCheck: new Date().toISOString(),
      totalAlerts: 0,
      criticalAlerts: 0,
      resolvedAlerts: 0,
      pendingActions: [],
      progress: 0,
      evmData: undefined,
      ganttData: undefined,
      pertData: undefined
    };
  }

  /**
   * Run all checks for the project
   */
  runAllChecks(): ProjectManagerState {
    this.checkBudgetAlerts();
    this.checkTimelineAlerts();
    this.checkQualityAlerts();
    this.checkResourceAlerts();
    this.checkRiskAlerts();
    this.checkComplianceAlerts();
    
    this.state.lastCheck = new Date().toISOString();
    this.state.totalAlerts = this.alerts.length;
    this.state.criticalAlerts = this.alerts.filter(alert => alert.severity === 'critical').length;
    this.state.resolvedAlerts = this.alerts.filter(alert => alert.status === 'resolved').length;
    this.state.pendingActions = this.getPendingActions();
    
    // Add additional properties that the provider expects
    this.state.progress = this.project.progress || 0;
    this.state.evmData = this.calculateEVMData();
    this.state.ganttData = this.calculateGanttData();
    this.state.pertData = this.calculatePertData();
    
    return this.state;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string, actionTaken?: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      
      if (actionTaken) {
        alert.actions.push(actionTaken);
      }
    }
  }

  /**
   * Get pending actions
   */
  private getPendingActions(): string[] {
    const actions: string[] = [];
    
    this.alerts.forEach(alert => {
      if (alert.status === 'open' || alert.status === 'acknowledged') {
        actions.push(`${this.actionLabels[alert.type] || 'Action'}: ${alert.title}`);
      }
    });
    
    return actions;
  }

  /**
   * Check budget alerts
   */
  private checkBudgetAlerts(): void {
    const project = this.project;
    const actualCost = project.actual_cost || project.actualCost || (project.budget * (project.progress / 100));
    
    if (project.budget && actualCost) {
      const budgetUtilization = (actualCost / project.budget) * 100;
      
      if (budgetUtilization > 90) {
        this.addAlert({
          type: 'budget',
          severity: budgetUtilization > 95 ? 'critical' : 'high',
          title: 'Budget Overrun Alert',
          description: `Project has used ${budgetUtilization.toFixed(1)}% of its budget`,
          projectId: project.id,
          createdBy: 'system',
          status: 'open',
          actions: []
        });
      } else if (budgetUtilization > 75) {
        this.addAlert({
          type: 'budget',
          severity: 'medium',
          title: 'Budget Warning',
          description: `Project has used ${budgetUtilization.toFixed(1)}% of its budget`,
          projectId: project.id,
          createdBy: 'system',
          status: 'open',
          actions: []
        });
      }
    }
  }

  /**
   * Check timeline alerts
   */
  private checkTimelineAlerts(): void {
    const endDate = this.project.endDate ? new Date(this.project.endDate) : null;
    const currentDate = new Date();
    
    if (endDate && currentDate > endDate) {
      this.addAlert({
        type: 'timeline',
        severity: 'critical',
        title: 'Project Overdue',
        description: `Project is ${Math.ceil((currentDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue`,
        projectId: this.project.id,
        createdBy: 'system',
        status: 'open',
        actions: []
      });
    } else if (endDate && currentDate < endDate) {
      const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 7) {
        this.addAlert({
          type: 'timeline',
          severity: 'high',
          title: 'Deadline Approaching',
          description: `Project deadline is in ${daysRemaining} days`,
          projectId: this.project.id,
          createdBy: 'system',
          status: 'open',
          actions: []
        });
      } else if (daysRemaining < 14) {
        this.addAlert({
          type: 'timeline',
          severity: 'medium',
          title: 'Timeline Warning',
          description: `Project deadline is in ${daysRemaining} days`,
          projectId: this.project.id,
          createdBy: 'system',
          status: 'open',
          actions: []
        });
      }
    }
  }

  /**
   * Check quality alerts
   */
  private checkQualityAlerts(): void {
    // Placeholder for quality checks
  }

  /**
   * Check resource alerts
   */
  private checkResourceAlerts(): void {
    // Placeholder for resource checks
  }

  /**
   * Check risk alerts
   */
  private checkRiskAlerts(): void {
    // Placeholder for risk checks
  }

  /**
   * Check compliance alerts
   */
  private checkComplianceAlerts(): void {
    // Placeholder for compliance checks
  }

  /**
   * Add an alert
   */
  private addAlert(alert: Omit<ProjectAlert, 'id' | 'createdAt'>): void {
    const newAlert: ProjectAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    this.alerts.push(newAlert);
  }

  /**
   * Get current state
   */
  getState(): ProjectManagerState {
    return this.state;
  }

  /**
   * Get all alerts
   */
  getAlerts(): ProjectAlert[] {
    return this.alerts;
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: ProjectAlert['type']): ProjectAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: ProjectAlert['severity']): ProjectAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId: string, resolution?: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date().toISOString();
      
      if (resolution) {
        alert.actions.push(`Resolved: ${resolution}`);
      }
    }
  }

  /**
   * Close an alert
   */
  closeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'closed';
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date().toISOString();
      alert.actions.push('Alert closed');
    }
  }

  /**
   * Get escalation path for alert
   */
  getEscalationPath(alert: ProjectAlert): string[] {
    const path: string[] = [];
    
    switch (alert.severity) {
      case 'critical':
        path.push(this.roles.level3, this.roles.level2, this.roles.level1);
        break;
      case 'high':
        path.push(this.roles.level2, this.roles.level1);
        break;
      case 'medium':
        path.push(this.roles.level1);
        break;
      default:
        path.push(this.roles.level1);
    }
    
    return path;
  }

  /**
   * Get action label for alert type
   */
  getActionLabel(alertType: ProjectAlert['type']): string {
    return this.actionLabels[alertType] || 'Review';
  }

  /**
   * Check if escalation is needed
   */
  needsEscalation(alert: ProjectAlert): boolean {
    return alert.severity === 'critical' || 
           (alert.severity === 'high' && alert.status === 'open' && 
            this.getTimeSince(alert.createdAt) > 24);
  }

  /**
   * Get time since timestamp in hours
   */
  private getTimeSince(timestamp: string): number {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    return (now - then) / (1000 * 60 * 60);
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
    openAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
    pendingActions: number;
  } {
    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      highAlerts: this.alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: this.alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: this.alerts.filter(a => a.severity === 'low').length,
      openAlerts: this.alerts.filter(a => a.status === 'open').length,
      acknowledgedAlerts: this.alerts.filter(a => a.status === 'acknowledged').length,
      resolvedAlerts: this.alerts.filter(a => a.status === 'resolved').length,
      pendingActions: this.getPendingActions().length
    };
  }

  /**
   * Calculate Earned Value Management (EVM) data
   */
  private calculateEVMData(): EVMData {
    return {
      plannedValue: this.project.budget * (this.project.progress / 100) || 0,
      earnedValue: this.project.budget * (this.project.progress / 100) || 0,
      actualCost: this.project.actualCost || 0,
      schedulePerformanceIndex: 1.0,
      costPerformanceIndex: 1.0,
      budgetAtCompletion: this.project.budget || 0,
      estimateAtCompletion: (this.project.actualCost || 0) + ((this.project.budget || 0) - (this.project.actualCost || 0)),
      estimateToComplete: (this.project.budget || 0) - (this.project.actualCost || 0),
      varianceAtCompletion: this.project.budgetVariance || 0
    };
  }

  /**
   * Calculate Gantt chart data
   */
  private calculateGanttData(): GanttData {
    return {
      tasks: this.project.phases?.map(phase => ({
        id: phase.id,
        name: phase.name,
        start: phase.start_date ? new Date(phase.start_date) : new Date(),
        end: phase.end_date ? new Date(phase.end_date) : new Date(),
        progress: phase.progress || 0,
        dependencies: []
      })) || []
    };
  }

  /**
   * Calculate PERT chart data
   */
  private calculatePertData(): PERTData {
    return {
      activities: this.project.phases?.map(phase => ({
        id: phase.id,
        name: phase.name,
        optimistic: phase.optimisticEstimate || 0,
        mostLikely: phase.mostLikelyEstimate || 0,
        pessimistic: phase.pessimisticEstimate || 0,
        expected: 0,
        standardDeviation: 0,
        dependencies: []
      })) || []
    };
  }
}
