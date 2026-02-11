/**
 * Monitoring Service - Hexagonal Architecture
 * Business logic for comprehensive project monitoring with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { 
  ProjectData, 
  Alert, 
  EVMData, 
  ActionLabels, 
  EscalationRoles 
} from '@/types/project';

/**
 * Service for managing project monitoring with hexagonal architecture
 */
export class MonitoringService {
  private monitoringRepository: IMonitoringRepository;

  constructor() {
    this.monitoringRepository = RepositoryFactory.getMonitoringRepository();
  }

  /**
   * Get comprehensive project monitoring data
   */
  async getProjectMonitoringData(projectId: string): Promise<{
    alerts: Alert[];
    metrics: {
      projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
      automationRate: number;
      manualInterventionsRequired: number;
      alertsResolved: number;
      alertsPending: number;
    };
    }> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get alerts, EVM data, and project data
      const [alerts, evmData, projectData] = await Promise.all([
        this.monitoringRepository.getProjectAlerts(projectId),
        this.monitoringRepository.getEVMData(projectId),
        this.monitoringRepository.getProjectData(projectId)
      ]);

      // Calculate metrics
      const metrics = this.calculateMonitoringMetrics(alerts, evmData, projectData);

      return {
        alerts,
        metrics
      };
    } catch (error) {
      console.error('Error getting project monitoring data:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get project monitoring data',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get system-wide monitoring metrics
   */
  async getSystemMonitoringMetrics(): Promise<{
    totalProjects: number;
    activeProjects: number;
    criticalProjects: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    averageAutomationRate: number;
  }> {
    try {
      // Get all projects and calculate system metrics
      const projects = await this.monitoringRepository.getAllProjects();
      
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => 
        ['active', 'in_progress', 'en_cours'].includes(p.status)
      ).length;
      
      const criticalProjects = projects.filter(p => 
        ['critical', 'at_risk', 'en_retard'].includes(p.status)
      ).length;

      // Calculate system health
      const criticalRatio = totalProjects > 0 ? criticalProjects / totalProjects : 0;
      let systemHealth: 'excellent';
      if (criticalRatio > 0.2) systemHealth = 'critical';
      else if (criticalRatio > 0.1) systemHealth = 'warning';
      else if (criticalRatio > 0.05) systemHealth = 'good';
      
      return {
        totalProjects,
        activeProjects,
        criticalProjects,
        systemHealth,
        averageAutomationRate: 85 // Mock calculation
      };
    } catch (error) {
      console.error('Error getting system monitoring metrics:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get system monitoring metrics',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create monitoring alert
   */
  async createAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
    try {
      // Validate alert data
      this.validateAlertData(alert);

      const alertEntity = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...alert,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await this.monitoringRepository.createAlert(alertEntity);
      return this.validateAndTransformAlert(result);
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to create alert',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId: string, status: string): Promise<void> {
    try {
      // Validate alert exists
      const existingAlert = await this.monitoringRepository.getAlertById(alertId);
      if (!existingAlert) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
      }

      // Validate status transition
      this.validateAlertStatusTransition(existingAlert.status, status);

      await this.monitoringRepository.updateAlert(alertId, {
        status,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update alert status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get monitoring configuration
   */
  async getMonitoringConfiguration(): Promise<{
    autoAcknowledgeLevel: 'none' | 'low' | 'medium' | 'high';
    autoEscalationEnabled: boolean;
    autoNotificationEnabled: boolean;
    autoReportGeneration: boolean;
  }> {
    try {
      const config = await this.monitoringRepository.getMonitoringConfiguration();
      
      return {
        autoAcknowledgeLevel: config.autoAcknowledgeLevel || 'medium',
        autoEscalationEnabled: Boolean(config.autoEscalationEnabled) || false,
        autoNotificationEnabled: Boolean(config.autoNotificationEnabled) || false,
        autoReportGeneration: Boolean(config.autoReportGeneration) || false
      };
    } catch (error) {
      console.error('Error getting monitoring configuration:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get monitoring configuration',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update monitoring configuration
   */
  async updateMonitoringConfiguration(config: {
    autoAcknowledgeLevel?: 'none' | 'low' | 'medium' | 'high';
    autoEscalationEnabled?: boolean;
    autoNotificationEnabled?: boolean;
    autoReportGeneration?: boolean;
  }): Promise<void> {
    try {
      await this.monitoringRepository.updateMonitoringConfiguration({
        ...config,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating monitoring configuration:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update monitoring configuration',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  /**
   * Calculate monitoring metrics
   */
  private calculateMonitoringMetrics(
    alerts: Alert[], 
    evmData: EVMData, 
    projectData: ProjectData
  ): {
    projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
    automationRate: number;
    manualInterventionsRequired: number;
    alertsResolved: number;
    alertsPending: number;
  } {
    // Calculate project health based on alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    
    let projectHealth: 'excellent';
    if (criticalAlerts > 0) {
      projectHealth = 'critical';
    } else if (highAlerts > 2) {
      projectHealth = 'warning';
    } else if (criticalAlerts > 0 || highAlerts > 2) {
      projectHealth = 'good';
    }

    // Calculate automation rate based on EVM data
    const automationRate = this.calculateAutomationRate(evmData);

    // Calculate manual interventions required
    const manualInterventionsRequired = criticalAlerts + highAlerts;

    return {
      projectHealth,
      automationRate,
      manualInterventionsRequired,
      alertsResolved: alerts.filter(a => a.status === 'resolved').length,
      alertsPending: alerts.filter(a => a.status === 'pending' || a.status === 'active').length
    };
  }

  /**
   * Calculate automation rate
   */
  private calculateAutomationRate(evmData: EVMData): number {
    if (!evmData || !evmData.tasks || evmData.tasks.length === 0) {
      return 0;
    }

    // Calculate automation rate based on task completion
    const completedTasks = evmData.tasks.filter(task => task.status === 'completed').length;
    return (completedTasks / evmData.tasks.length) * 100;
  }

  /**
   * Validate alert data
   */
  private validateAlertData(alert: Omit<Alert, 'id'>): void {
    if (!alert.title || alert.title.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert title is required');
    }

    if (!alert.severity || !['low', 'medium', 'high', 'critical'].includes(alert.severity)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid alert severity');
    }

    if (!alert.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    }
  }

  /**
   * Validate alert status transition
   */
  private validateAlertStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'pending': ['acknowledged', 'resolved', 'escalated'],
      'acknowledged': ['resolved', 'escalated'],
      'resolved': ['pending'], // Can reopen resolved alerts
      'escalated': ['pending'] // Can reopen escalated alerts
    };

    if (newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid alert status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Validate and transform alert
   */
  private validateAndTransformAlert(alert: any): Alert {
    return {
      id: alert.id,
      project_id: alert.project_id,
      title: alert.title,
      description: alert.description || null,
      severity: alert.severity,
      status: alert.status,
      created_at: alert.created_at,
      updated_at: alert.updated_at
    };
  }
}

// Factory function for service instance
let monitoringServiceInstance: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new MonitoringService();
  }
  return monitoringServiceInstance;
}
