/**
 * Alert Service - Hexagonal Architecture
 * Business logic for project alert management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
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

      // Create alert through notification repository
      const createdAlert = await this.notificationRepository.createNotification({
        recipient_id: 'system', // System alert
        title: alertData.title,
        message: alertData.description || '',
        type: alertData.type as any,
        read: false
      });
      
      if (!createdAlert.notification) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create alert');
      }

      return this.mapToDTO(createdAlert.notification as unknown as Record<string, unknown>);
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
      // For now, return null as notification repository doesn't have findById
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getAlertById: Alert repository not available');
      return null;
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
      // For now, return empty array as notification repository doesn't have getNotifications
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getAlertsByProjectId: Alert repository not available');
      return [];
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
      // For now, return empty array as notification repository doesn't have getNotifications
      // TODO: Implement proper alert retrieval when alert repository is available
      console.warn('AlertService.getActiveAlerts: Alert repository not available');
      return [];
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
      // For now, throw not implemented as notification repository doesn't support updates
      // TODO: Implement proper alert update when alert repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Alert update not yet implemented');
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
      // For now, throw not implemented as notification repository doesn't support updates
      // TODO: Implement proper alert acknowledgment when alert repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Alert acknowledgment not yet implemented');
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
      // For now, throw not implemented as notification repository doesn't support updates
      // TODO: Implement proper alert resolution when alert repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Alert resolution not yet implemented');
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
