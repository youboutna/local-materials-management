import { EscalationRoles, ActionLabels, ProjectData } from '@/types/project';

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
}

export class ProjectManager {
  private project: ProjectData;
  private roles: EscalationRoles;
  private actionLabels: ActionLabels;
  private alerts: ProjectAlert[] = [];
  private state: ProjectManagerState;

  constructor(project: ProjectData, roles: EscalationRoles, actionLabels: ActionLabels) {
    this.project = project;
    this.roles = roles;
    this.actionLabels = actionLabels;
    this.state = {
      alerts: [],
      lastCheck: new Date().toISOString(),
      totalAlerts: 0,
      criticalAlerts: 0,
      resolvedAlerts: 0,
      pendingActions: []
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
        actions.push(`${this.actionLabels[alert.type]}: ${alert.title}`);
      }
    });
    
    return actions;
  }

  /**
   * Check budget alerts
   */
  private checkBudgetAlerts(): void {
    if (this.project.budget && this.project.actualCost) {
      const budgetUtilization = (this.project.actualCost / this.project.budget) * 100;
      
      if (budgetUtilization > 90) {
        this.addAlert({
          type: 'budget',
          severity: budgetUtilization > 95 ? 'critical' : 'high',
          title: 'Budget Overrun Alert',
          description: `Project has used ${budgetUtilization.toFixed(1)}% of its budget`,
          projectId: this.project.id,
          createdBy: 'system'
        });
      } else if (budgetUtilization > 75) {
        this.addAlert({
          type: 'budget',
          severity: 'medium',
          title: 'Budget Warning',
          description: `Project has used ${budgetUtilization.toFixed(1)}% of its budget`,
          projectId: this.project.id,
          createdBy: 'system'
        });
      }
    }
  }

  /**
   * Check timeline alerts
   */
  private checkTimelineAlerts(): void {
    if (this.project.endDate) {
      const now = new Date();
      const endDate = new Date(this.project.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        this.addAlert({
          type: 'timeline',
          severity: 'critical',
          title: 'Project Overdue',
          description: `Project is ${Math.abs(daysRemaining)} days overdue`,
          projectId: this.project.id,
          createdBy: 'system'
        });
      } else if (daysRemaining < 7) {
        this.addAlert({
          type: 'timeline',
          severity: 'high',
          title: 'Deadline Approaching',
          description: `Project deadline is in ${daysRemaining} days`,
          projectId: this.project.id,
          createdBy: 'system'
        });
      } else if (daysRemaining < 14) {
        this.addAlert({
          type: 'timeline',
          severity: 'medium',
          title: 'Timeline Warning',
          description: `Project deadline is in ${daysRemaining} days`,
          projectId: this.project.id,
          createdBy: 'system'
        });
      }
    }
  }

  /**
   * Check quality alerts
   */
  private checkQualityAlerts(): void {
    // Placeholder for quality checks
    // This would integrate with quality metrics from inspections, tests, etc.
  }

  /**
   * Check resource alerts
   */
  private checkResourceAlerts(): void {
    // Placeholder for resource checks
    // This would integrate with resource utilization metrics
  }

  /**
   * Check risk alerts
   */
  private checkRiskAlerts(): void {
    // Placeholder for risk checks
    // This would integrate with risk management system
  }

  /**
   * Check compliance alerts
   */
  private checkComplianceAlerts(): void {
    // Placeholder for compliance checks
    // This would integrate with compliance requirements
  }

  /**
   * Add an alert
   */
  private addAlert(alert: Omit<ProjectAlert, 'id' | 'createdAt'>): void {
    const newAlert: ProjectAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'open',
      actions: []
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
        path.push(this.roles.level2, this.roles.level1, this.roles.level0);
        break;
      case 'high':
        path.push(this.roles.level1, this.roles.level0);
        break;
      case 'medium':
        path.push(this.roles.level0);
        break;
      default:
        path.push(this.roles.level0);
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
            this.getTimeSince(alert.createdAt) > 24 * 60 * 60 * 1000); // 24 hours
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
    const stats = {
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

    return stats;
  }
}
