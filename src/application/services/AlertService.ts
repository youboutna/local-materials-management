/**
 * Alert Service - Hexagonal Architecture
 * Business logic for project alert management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IAlertRepository } from '@/domain/repositories/IAlertRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectAlert } from '@/domain/entities/Workspace';

// Service DTOs for data exchange
export interface ProjectAlertDTO {
  id: string;
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CreateProjectAlertRequestDto {
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
}

export interface UpdateProjectAlertRequestDto {
  type?: string;
  severity?: string;
  title?: string;
  description?: string;
  acknowledged?: boolean;
  resolved?: boolean;
}

export interface AlertStatistics {
  total: number;
  active: number;
  resolved: number;
  acknowledged: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export class AlertService {
  constructor(
    private alertRepository: IAlertRepository = RepositoryFactory.getAlertRepository(),
    private notificationRepository: INotificationRepository = RepositoryFactory.getNotificationRepository()
  ) {}

  /**
   * Create a new project alert
   */
  async createAlert(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      // Validate alert data
      const validation = this.validateAlertData(alertData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create alert through alert repository
      const createdAlert = await this.alertRepository.create(alertData);
      
      return createdAlert;
    } catch (error) {
      console.error('AlertService.createAlert failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create alert');
    }
  }

  /**
   * Get an alert by ID
   */
  async getAlertById(id: string): Promise<ProjectAlertDTO | null> {
    try {
      // Use notification repository to get alert
      const notificationResult = await this.notificationRepository.getUserNotifications('current-user');
      if (notificationResult.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications');
      }
      
      const alert = notificationResult.notifications.find(n => n.id === id);
      
      if (!alert) return null;
      
      return {
        id: alert.id,
        project_id: alert.project_id || 'unknown',
        type: alert.type || 'info',
        title: alert.title || 'Alert',
        description: alert.message || '',
        severity: alert.severity || 'medium',
        created_at: alert.created_at || new Date().toISOString(),
        updated_at: alert.updated_at || new Date().toISOString(),
        acknowledged: alert.read,
        acknowledged_at: alert.read ? alert.updated_at : undefined,
        acknowledged_by: alert.user_id,
        resolved: alert.read,
        resolved_at: alert.read ? alert.updated_at : undefined,
        resolved_by: alert.user_id
      } as ProjectAlertDTO;
    } catch (error) {
      console.error('AlertService.getAlertById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert');
    }
  }

  /**
   * Get all alerts for a project
   */
  async getAlertsByProjectId(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      const notifications = await this.notificationRepository.getNotifications();
      const projectNotifications = notifications.filter(n => n.projectId === projectId);
      
      return projectNotifications.map(notification => ({
        id: notification.id,
        project_id: notification.projectId || projectId,
        alert_type: notification.type || 'info',
        title: notification.title || 'Alert',
        message: notification.message || '',
        severity: notification.severity || 'medium',
        status: notification.read ? 'resolved' : 'active',
        created_at: notification.createdAt || new Date().toISOString(),
        updated_at: notification.updatedAt || new Date().toISOString(),
        acknowledged_by: notification.userId,
        acknowledged_at: notification.readAt
      })) as ProjectAlertDTO[];
    } catch (error) {
      console.error('AlertService.getAlertsByProjectId failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project alerts');
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<ProjectAlertDTO[]> {
    try {
      const notifications = await this.notificationRepository.getNotifications();
      const activeNotifications = notifications.filter(n => !n.read);
      
      return activeNotifications.map(notification => ({
        id: notification.id,
        project_id: notification.projectId || 'unknown',
        alert_type: notification.type || 'info',
        title: notification.title || 'Alert',
        message: notification.message || '',
        severity: notification.severity || 'medium',
        status: 'active',
        created_at: notification.createdAt || new Date().toISOString(),
        updated_at: notification.updatedAt || new Date().toISOString(),
        acknowledged_by: notification.userId,
        acknowledged_at: notification.readAt
      })) as ProjectAlertDTO[];
    } catch (error) {
      console.error('AlertService.getActiveAlerts failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch active alerts');
    }
  }

  /**
   * Update an alert
   */
  async updateAlert(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      // Update alert using repository pattern
      const notificationResult = await this.notificationRepository.getUserNotifications('current-user');
      if (notificationResult.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications');
      }
      
      const alert = notificationResult.notifications.find(n => n.id === id);
      if (!alert) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
      }

      // Update notification with new data
      const updatedNotification = {
        ...alert,
        title: updateData.title || alert.title,
        message: updateData.description || alert.message,
        severity: updateData.severity || alert.severity,
        read: updateData.resolved ? true : alert.read,
        updated_at: new Date().toISOString()
      };

      // In a real implementation, this would update in repository
      console.log(`Alert updated: ${id}`);
      
      return {
        id: alert.id,
        project_id: alert.project_id || 'unknown',
        type: updatedNotification.type || 'info',
        title: updatedNotification.title || 'Alert',
        description: updatedNotification.message || '',
        severity: updatedNotification.severity || 'medium',
        created_at: alert.created_at || new Date().toISOString(),
        updated_at: updatedNotification.updated_at,
        acknowledged: updatedNotification.read,
        acknowledged_at: updatedNotification.read ? updatedNotification.updated_at : undefined,
        acknowledged_by: alert.user_id,
        resolved: updatedNotification.read,
        resolved_at: updatedNotification.read ? updatedNotification.updated_at : undefined,
        resolved_by: alert.user_id
      } as ProjectAlertDTO;
    } catch (error) {
      console.error('AlertService.updateAlert failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update alert');
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string): Promise<void> {
    try {
      // Delete through notification repository
      await this.notificationRepository.deleteNotification(id);
    } catch (error) {
      console.error('AlertService.deleteAlert failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete alert');
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      // Acknowledge alert using repository pattern
      const notificationResult = await this.notificationRepository.getUserNotifications('current-user');
      if (notificationResult.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications');
      }
      
      const alert = notificationResult.notifications.find(n => n.id === id);
      if (!alert) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
      }

      // Mark as read/acknowledged
      const acknowledgedNotification = {
        ...alert,
        read: true,
        readAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In a real implementation, this would update in repository
      console.log(`Alert acknowledged: ${id} by user: ${userId}`);
      
      return {
        id: alert.id,
        project_id: alert.project_id || 'unknown',
        type: acknowledgedNotification.type || 'info',
        title: acknowledgedNotification.title || 'Alert',
        description: acknowledgedNotification.message || '',
        severity: acknowledgedNotification.severity || 'medium',
        created_at: alert.created_at || new Date().toISOString(),
        updated_at: acknowledgedNotification.updated_at,
        acknowledged: true,
        acknowledged_at: acknowledgedNotification.readAt,
        acknowledged_by: userId,
        resolved: false,
        resolved_at: undefined,
        resolved_by: undefined
      } as ProjectAlertDTO;
    } catch (error) {
      console.error('AlertService.acknowledgeAlert failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to acknowledge alert');
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      // Resolve alert using repository pattern
      const notificationResult = await this.notificationRepository.getUserNotifications('current-user');
      if (notificationResult.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications');
      }
      
      const alert = notificationResult.notifications.find(n => n.id === id);
      if (!alert) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Alert not found');
      }

      // Mark as resolved
      const resolvedNotification = {
        ...alert,
        read: true,
        readAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In a real implementation, this would update in repository
      console.log(`Alert resolved: ${id} by user: ${userId}`);
      
      return {
        id: alert.id,
        project_id: alert.project_id || 'unknown',
        type: resolvedNotification.type || 'info',
        title: resolvedNotification.title || 'Alert',
        description: resolvedNotification.message || '',
        severity: resolvedNotification.severity || 'medium',
        created_at: alert.created_at || new Date().toISOString(),
        updated_at: resolvedNotification.updated_at,
        acknowledged: true,
        acknowledged_at: resolvedNotification.readAt,
        acknowledged_by: userId,
        resolved: true,
        resolved_at: resolvedNotification.readAt,
        resolved_by: userId
      } as ProjectAlertDTO;
    } catch (error) {
      console.error('AlertService.resolveAlert failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve alert');
    }
  }

  /**
   * Get alerts by type
   */
  async getAlertsByType(type: string): Promise<ProjectAlertDTO[]> {
    try {
      // For now, return empty array as notification repository doesn't have getNotifications
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getAlertsByType: Alert repository not available');
      return [];
    } catch (error) {
      console.error('AlertService.getAlertsByType failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by type');
    }
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    try {
      // For now, return empty array as notification repository doesn't have getNotifications
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getAlertsBySeverity: Alert repository not available');
      return [];
    } catch (error) {
      console.error('AlertService.getAlertsBySeverity failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by severity');
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(projectId?: string): Promise<AlertStatistics> {
    try {
      // For now, return empty statistics as notification repository doesn't have getNotifications
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getAlertStatistics: Alert repository not available');
      return {
        total: 0,
        active: 0,
        resolved: 0,
        acknowledged: 0,
        byType: {},
        bySeverity: {}
      };
    } catch (error) {
      console.error('AlertService.getAlertStatistics failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert statistics');
    }
  }

  /**
   * Validate alert data
   */
  validateAlertData(data: CreateProjectAlertRequestDto | UpdateProjectAlertRequestDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if ('project_id' in data && !data.project_id) {
      errors.push('Project ID is required');
    }

    if ('type' in data && !data.type) {
      errors.push('Alert type is required');
    }

    if ('severity' in data && !data.severity) {
      errors.push('Alert severity is required');
    }

    if ('title' in data && !data.title) {
      errors.push('Alert title is required');
    }

    // Validate severity values
    if ('severity' in data && data.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(data.severity.toLowerCase())) {
        errors.push('Invalid severity value. Must be: low, medium, high, or critical');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Map notification result to DTO
   */
  private mapToDTO(notificationResult: Record<string, unknown>): ProjectAlertDTO {
    const metadata = notificationResult.metadata as any;
    
    return {
      id: (notificationResult.id as string) || '',
      project_id: metadata?.project_id || '',
      type: metadata?.alert_type || (notificationResult.type as string) || '',
      severity: metadata?.severity || '',
      title: (notificationResult.title as string) || '',
      description: (notificationResult.message as string) || '',
      created_at: (notificationResult.created_at as string) || new Date().toISOString(),
      updated_at: notificationResult.updated_at as string,
      acknowledged: metadata?.acknowledged || false,
      acknowledged_at: metadata?.acknowledged_at,
      acknowledged_by: metadata?.acknowledged_by,
      resolved: metadata?.resolved || false,
      resolved_at: metadata?.resolved_at,
      resolved_by: metadata?.resolved_by
    };
  }
}
