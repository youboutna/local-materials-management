/**
 * Alert Service - Hexagonal Architecture
 * Business logic for project alert management
 * 
 * Pattern: Repository → Service → DTO
 * Uses IAlertRepository for data access (not INotificationRepository)
 */

import { AlertStatistics, CreateProjectAlertRequestDto, IAlertRepository, ProjectAlertDTO, UpdateProjectAlertRequestDto } from '@/domain/repositories/IAlertRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Re-export DTOs for consumers
export type { AlertStatistics, CreateProjectAlertRequestDto, ProjectAlertDTO, UpdateProjectAlertRequestDto };

// Validation utility
const AlertValidation = {
  validateCreate(data: CreateProjectAlertRequestDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.project_id) errors.push('Project ID is required');
    if (!data.type) errors.push('Alert type is required');
    if (!data.severity) errors.push('Alert severity is required');
    if (!data.title) errors.push('Alert title is required');
    
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (data.severity && !validSeverities.includes(data.severity.toLowerCase())) {
      errors.push('Invalid severity. Must be: low, medium, high, or critical');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  validateUpdate(data: UpdateProjectAlertRequestDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(data.severity.toLowerCase())) {
        errors.push('Invalid severity. Must be: low, medium, high, or critical');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
};

export class AlertService {
  private alertRepository: IAlertRepository;

  constructor(alertRepository?: IAlertRepository) {
    this.alertRepository = alertRepository || RepositoryFactory.getAlertRepository();
  }

  /**
   * Create a new project alert
   * Validation → Repository → DTO
   */
  async createAlert(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      // 1. Validation Layer
      const validation = AlertValidation.validateCreate(alertData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Repository Layer - Create through Supabase adapter
      const createdAlert = await this.alertRepository.create(alertData);
      
      // 3. Return DTO (already mapped by repository)
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
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }

      return await this.alertRepository.findById(id);
    } catch (error) {
      console.error('AlertService.getAlertById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert');
    }
  }

  /**
   * Get all alerts for a project
   */
  async getAlertsByProjectId(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.alertRepository.findByProjectId(projectId);
    } catch (error) {
      console.error('AlertService.getAlertsByProjectId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project alerts');
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<ProjectAlertDTO[]> {
    try {
      return await this.alertRepository.findActive();
    } catch (error) {
      console.error('AlertService.getActiveAlerts failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch active alerts');
    }
  }

  /**
   * Update an alert
   */
  async updateAlert(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }

      // Validation
      const validation = AlertValidation.validateUpdate(updateData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      return await this.alertRepository.update(id, updateData);
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
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }

      await this.alertRepository.delete(id);
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
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }
      if (!userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.alertRepository.acknowledge(id, userId);
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
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }
      if (!userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.alertRepository.resolve(id, userId);
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
      if (!type) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert type is required');
      }

      return await this.alertRepository.findByType(type);
    } catch (error) {
      console.error('AlertService.getAlertsByType failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by type');
    }
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    try {
      if (!severity) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Severity is required');
      }

      return await this.alertRepository.findBySeverity(severity);
    } catch (error) {
      console.error('AlertService.getAlertsBySeverity failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alerts by severity');
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(projectId?: string): Promise<AlertStatistics> {
    try {
      return await this.alertRepository.getStatistics(projectId);
    } catch (error) {
      console.error('AlertService.getAlertStatistics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch alert statistics');
    }
  }

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeAlertsBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    try {
      if (!alertIds || alertIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert IDs are required');
      }
      if (!userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.alertRepository.acknowledgeBatch(alertIds, userId);
    } catch (error) {
      console.error('AlertService.acknowledgeAlertsBatch failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to acknowledge alerts batch');
    }
  }

  /**
   * Resolve multiple alerts
   */
  async resolveAlertsBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]> {
    try {
      if (!alertIds || alertIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert IDs are required');
      }
      if (!userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.alertRepository.resolveBatch(alertIds, userId);
    } catch (error) {
      console.error('AlertService.resolveAlertsBatch failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve alerts batch');
    }
  }

  /**
   * Validate alert data (legacy method for compatibility)
   */
  validateAlertData(data: CreateProjectAlertRequestDto | UpdateProjectAlertRequestDto): { isValid: boolean; errors: string[] } {
    if ('projectId' in data) {
      return AlertValidation.validateCreate(data as CreateProjectAlertRequestDto);
    }
    return AlertValidation.validateUpdate(data);
  }
}
