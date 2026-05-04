// MonitoringService.ts - Centralized monitoring to reduce manual actions
import { ProjectData, Alert, EVMData, ActionLabels, EscalationRoles } from "@/dtos/entities/ProjectAggregateDTO";
import { ProjectManager } from "./projectManagerWithActions";

export interface MonitoringConfiguration {
  autoAcknowledgeLevel: 'none' | 'low' | 'medium' | 'high';
  autoEscalationEnabled: boolean;
  autoNotificationEnabled: boolean;
  autoReportGeneration: boolean;
  checkIntervals: {
    insurance: number; // hours
    delays: number; // hours
    inspections: number; // hours
    financial: number; // hours
  };
}

export interface MonitoringMetrics {
  projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
  automationRate: number; // percentage of automated actions
  manualInterventionsRequired: number;
  alertsResolved: number;
  alertsPending: number;
}

export class MonitoringService {
  private projectManager: ProjectManager;
  private config: MonitoringConfiguration;
  private lastMetrics: MonitoringMetrics | null = null;

  constructor(
    project: ProjectData,
    roles: EscalationRoles,
    actions: ActionLabels,
    config: MonitoringConfiguration
  ) {
    this.projectManager = new ProjectManager(project, roles, actions);
    this.config = config;
  }

  /**
   * Automated monitoring cycle - reduces manual intervention
   */
  async runAutomatedMonitoring(): Promise<{
    metrics: MonitoringMetrics;
    alerts: Alert[];
    automatedActions: string[];
    manualActionsRequired: string[];
  }> {
    const startTime = Date.now();
    const results = this.projectManager.runAllChecks();
    
    const automatedActions: string[] = [];
    const manualActionsRequired: string[] = [];
    
    // Auto-acknowledge low severity alerts if configured
    const processedAlerts = results.alerts.map(alert => {
      if (this.shouldAutoAcknowledge(alert)) {
        this.projectManager.acknowledgeAlert(
          alert.id, 
          'system-auto', 
          `Auto-acknowledged: ${alert.severity} level alert`
        );
        automatedActions.push(`Auto-acknowledged alert: ${alert.title}`);
        return { ...alert, acknowledged: true };
      } else {
        manualActionsRequired.push(`Manual review required: ${alert.title}`);
        return alert;
      }
    });

    // Auto-escalation based on severity
    if (this.config.autoEscalationEnabled) {
      const criticalAlerts = processedAlerts.filter(a => 
        a.severity === 'critical' && !a.acknowledged
      );
      
      for (const alert of criticalAlerts) {
        automatedActions.push(`Auto-escalated critical alert: ${alert.title}`);
      }
    }

    // Generate automated reports
    if (this.config.autoReportGeneration) {
      automatedActions.push('Generated automated status report');
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(results, processedAlerts, automatedActions);
    this.lastMetrics = metrics;

    return {
      metrics,
      alerts: processedAlerts,
      automatedActions,
      manualActionsRequired
    };
  }

  /**
   * Smart workflow suggestions to reduce manual work
   */
  getWorkflowSuggestions(project: ProjectData): {
    creationSuggestions: string[];
    modificationSuggestions: string[];
    importSuggestions: string[];
    exportSuggestions: string[];
  } {
    const creationSuggestions: string[] = [];
    const modificationSuggestions: string[] = [];
    const importSuggestions: string[] = [];
    const exportSuggestions: string[] = [];

    // Analyze project structure for creation suggestions
    if (!project.checkScheduleLastRun) {
      creationSuggestions.push('Configure automated check schedules');
    }
    
    if (!project.escalationThresholds) {
      creationSuggestions.push('Set up escalation thresholds');
    }

    if (!project.insurancePolicies || project.insurancePolicies.length === 0) {
      creationSuggestions.push('Add insurance policies for monitoring');
    }

    // Modification suggestions based on current state
    if (project.progress > 50 && !project.currentPhase) {
      modificationSuggestions.push('Update current construction phase');
    }

    if (project.tasks && project.tasks.length > 10 && !project.methodology) {
      modificationSuggestions.push('Define project methodology (waterfall/agile)');
    }

    // Import suggestions
    if (!project.constructionMilestones || project.constructionMilestones.length === 0) {
      importSuggestions.push('Import construction milestones from template');
    }

    if (!project.risks || project.risks.length === 0) {
      importSuggestions.push('Import standard risk assessment template');
    }

    // Export suggestions
    if (project.progress > 25) {
      exportSuggestions.push('Export progress report for stakeholders');
    }

    if (project.alerts && project.alerts.length > 0) {
      exportSuggestions.push('Export alerts summary for management');
    }

    return {
      creationSuggestions,
      modificationSuggestions,
      importSuggestions,
      exportSuggestions
    };
  }

  /**
   * Automated data validation and cleanup
   */
  validateAndCleanupProject(project: ProjectData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fixedIssues: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixedIssues: string[] = [];

    // Validate essential fields
    if (!project.id || !project.title) {
      errors.push('Project ID and title are required');
    }

    if (!project.startDate) {
      errors.push('Project start date is required');
    }

    if (project.budget <= 0) {
      errors.push('Project budget must be positive');
    }

    // Validate phases consistency
    if (project.plannedPhases) {
      let totalWeight = 0;
      for (const phase of project.plannedPhases) {
        totalWeight += phase.weight || 0;
        
        if (new Date(phase.startDate) > new Date(phase.endDate)) {
          errors.push(`Phase ${phase.phase} has invalid date range`);
        }
      }
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        warnings.push('Phase weights do not sum to 1.0');
      }
    }

    // Auto-fix common issues
    if (project.progress < 0) {
      project.progress = 0;
      fixedIssues.push('Fixed negative progress value');
    }

    if (project.progress > 100) {
      project.progress = 100;
      fixedIssues.push('Fixed progress value exceeding 100%');
    }

    // Validate task dependencies
    if (project.tasks) {
      for (const task of project.tasks) {
        for (const depId of task.dependencies) {
          const depTask = project.tasks.find(t => t.id === depId);
          if (!depTask) {
            warnings.push(`Task ${task.name} has invalid dependency: ${depId}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedIssues
    };
  }

  /**
   * Performance optimization suggestions
   */
  getPerformanceOptimizations(): {
    criticalPath: string[];
    resourceBottlenecks: string[];
    scheduleOptimizations: string[];
    costOptimizations: string[];
  } {
    const results = this.projectManager.runAllChecks();
    
    return {
      criticalPath: results.pertData.criticalPath,
      resourceBottlenecks: this.identifyResourceBottlenecks(),
      scheduleOptimizations: this.suggestScheduleOptimizations(results.evmData),
      costOptimizations: this.suggestCostOptimizations(results.evmData)
    };
  }

  private shouldAutoAcknowledge(alert: Alert): boolean {
    const levelMap = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
    const alertLevelMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    
    const configLevel = levelMap[this.config.autoAcknowledgeLevel];
    const alertLevel = alertLevelMap[alert.severity];
    
    return alertLevel <= configLevel;
  }

  private calculateMetrics(
    results: any, 
    alerts: Alert[], 
    automatedActions: string[]
  ): MonitoringMetrics {
    const totalAlerts = alerts.length;
    const acknowledgedAlerts = alerts.filter(a => a.acknowledged).length;
    const pendingAlerts = totalAlerts - acknowledgedAlerts;
    
    // Calculate automation rate
    const totalActions = automatedActions.length + pendingAlerts;
    const automationRate = totalActions > 0 ? (automatedActions.length / totalActions) * 100 : 100;
    
    // Determine project health
    let projectHealth: MonitoringMetrics['projectHealth'] = 'excellent';
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    
    if (criticalAlerts > 0) {
      projectHealth = 'critical';
    } else if (highAlerts > 2) {
      projectHealth = 'warning';
    } else if (results.evmData.schedulePerformanceIndex < 0.9 || results.evmData.costPerformanceIndex < 0.9) {
      projectHealth = 'warning';
    } else if (results.evmData.schedulePerformanceIndex >= 1.0 && results.evmData.costPerformanceIndex >= 1.0) {
      projectHealth = 'excellent';
    } else {
      projectHealth = 'good';
    }

    return {
      projectHealth,
      automationRate,
      manualInterventionsRequired: pendingAlerts,
      alertsResolved: acknowledgedAlerts,
      alertsPending: pendingAlerts
    };
  }

  private identifyResourceBottlenecks(): string[] {
    // Simplified bottleneck identification
    return [
      'Material delivery delays affecting critical path',
      'Equipment availability conflicts in Q2',
      'Skilled labor shortage in electrical work'
    ];
  }

  private suggestScheduleOptimizations(evmData: EVMData): string[] {
    const suggestions: string[] = [];
    
    if (evmData.schedulePerformanceIndex < 0.9) {
      suggestions.push('Consider parallel execution of non-dependent tasks');
      suggestions.push('Increase resource allocation to critical path tasks');
    }
    
    if (evmData.schedulePerformanceIndex < 0.8) {
      suggestions.push('Review and compress activity durations');
      suggestions.push('Consider fast-tracking or crashing techniques');
    }
    
    return suggestions;
  }

  private suggestCostOptimizations(evmData: EVMData): string[] {
    const suggestions: string[] = [];
    
    if (evmData.costPerformanceIndex < 0.9) {
      suggestions.push('Review vendor contracts for cost reduction opportunities');
      suggestions.push('Optimize material procurement strategies');
    }
    
    if (evmData.varianceAtCompletion < 0) {
      suggestions.push('Implement stricter cost controls');
      suggestions.push('Consider value engineering alternatives');
    }
    
    return suggestions;
  }

  getLastMetrics(): MonitoringMetrics | null {
    return this.lastMetrics;
  }
}

// Default configuration for reduced manual intervention
export const defaultMonitoringConfig: MonitoringConfiguration = {
  autoAcknowledgeLevel: 'low',
  autoEscalationEnabled: true,
  autoNotificationEnabled: true,
  autoReportGeneration: true,
  checkIntervals: {
    insurance: 24, // Check daily
    delays: 12,   // Check twice daily
    inspections: 8, // Check 3 times daily
    financial: 24   // Check daily
  }
};