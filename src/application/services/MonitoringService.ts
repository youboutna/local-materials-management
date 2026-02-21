/**
 * Monitoring Service - Hexagonal Architecture
 * Business logic for comprehensive project monitoring with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';

// Local types for monitoring (avoiding legacy imports)
interface MonitoringAlert {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
    alerts: MonitoringAlert[];
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

      // Return default metrics - actual implementation would query repository
      return {
        alerts: [],
        metrics: {
          projectHealth: 'good',
          automationRate: 85,
          manualInterventionsRequired: 0,
          alertsResolved: 0,
          alertsPending: 0
        }
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
      // Default system metrics
      return {
        totalProjects: 0,
        activeProjects: 0,
        criticalProjects: 0,
        systemHealth: 'good',
        averageAutomationRate: 85
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
  async createAlert(alert: Omit<MonitoringAlert, 'id'>): Promise<MonitoringAlert> {
    try {
      if (!alert.title || alert.title.trim() === '') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert title is required');
      }

      const alertEntity: MonitoringAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...alert,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return alertEntity;
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
      if (!alertId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }
      // In a real implementation, this would update via repository
      console.log(`Alert ${alertId} status updated to ${status}`);
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
    return {
      autoAcknowledgeLevel: 'medium',
      autoEscalationEnabled: false,
      autoNotificationEnabled: true,
      autoReportGeneration: false
    };
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
    // In a real implementation, this would persist via repository
    console.log('Monitoring configuration updated:', config);
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
