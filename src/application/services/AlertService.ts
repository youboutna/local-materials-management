import { RepositoryFactory } from './RepositoryFactory';
import { IProjectAlertRepository } from '@/domain/repositories/IProjectAlertRepository';
import { ProjectAlert } from '@/domain/entities/Workspace';
import { ProjectAlertDTO, CreateProjectAlertRequestDto, UpdateProjectAlertRequestDto } from '@/dtos/transforms/shared';
import { ProjectAlertDomainTransformer } from '@/dtos/transforms/WorkspaceDomainTransformer';

export class AlertService {
  private alertRepository: IProjectAlertRepository;
  private alertTransformer: ProjectAlertDomainTransformer;

  constructor() {
    this.alertRepository = RepositoryFactory.getProjectAlertRepository();
    this.alertTransformer = new ProjectAlertDomainTransformer();
  }

  /**
   * Create a new project alert
   * @param alertData The alert data
   * @returns The created alert DTO
   */
  async createAlert(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const entity = this.alertTransformer.fromCreateDtoToEntity(alertData);
      const createdAlert = await this.alertRepository.create(entity);
      return this.alertTransformer.toDTO(createdAlert);
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  /**
   * Get an alert by ID
   * @param id The alert ID
   * @returns The alert DTO or null
   */
  async getAlertById(id: string): Promise<ProjectAlertDTO | null> {
    try {
      const alert = await this.alertRepository.findById(id);
      return alert ? this.alertTransformer.toDTO(alert) : null;
    } catch (error) {
      console.error('Error fetching alert:', error);
      throw new Error(`Failed to fetch alert: ${error.message}`);
    }
  }

  /**
   * Get all alerts for a project
   * @param projectId The project ID
   * @returns Array of alert DTOs
   */
  async getProjectAlerts(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findByProjectId(projectId);
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching project alerts:', error);
      throw new Error(`Failed to fetch project alerts: ${error.message}`);
    }
  }

  /**
   * Get all alerts
   * @returns Array of alert DTOs
   */
  async getAllAlerts(): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findAll();
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching all alerts:', error);
      throw new Error(`Failed to fetch all alerts: ${error.message}`);
    }
  }

  /**
   * Update an alert
   * @param id The alert ID
   * @param updates The updates to apply
   * @returns The updated alert DTO
   */
  async updateAlert(id: string, updates: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const entityUpdates = this.alertTransformer.fromUpdateDtoToEntity(updates);
      const updatedAlert = await this.alertRepository.update(id, entityUpdates);
      return this.alertTransformer.toDTO(updatedAlert);
    } catch (error) {
      console.error('Error updating alert:', error);
      throw new Error(`Failed to update alert: ${error.message}`);
    }
  }

  /**
   * Delete an alert
   * @param id The alert ID
   */
  async deleteAlert(id: string): Promise<void> {
    try {
      await this.alertRepository.delete(id);
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw new Error(`Failed to delete alert: ${error.message}`);
    }
  }

  /**
   * Acknowledge an alert
   * @param id The alert ID
   * @param userId The user ID acknowledging the alert
   * @returns The updated alert DTO
   */
  async acknowledgeAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const updates = {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      };
      
      const updatedAlert = await this.alertRepository.update(id, updates);
      return this.alertTransformer.toDTO(updatedAlert);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  /**
   * Resolve an alert
   * @param id The alert ID
   * @param userId The user ID resolving the alert
   * @returns The updated alert DTO
   */
  async resolveAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const updates = {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId
      };
      
      const updatedAlert = await this.alertRepository.update(id, updates);
      return this.alertTransformer.toDTO(updatedAlert);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }

  /**
   * Get alerts by severity
   * @param severity The severity filter
   * @returns Array of alert DTOs
   */
  async getAlertsBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findBySeverity(severity);
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching alerts by severity:', error);
      throw new Error(`Failed to fetch alerts by severity: ${error.message}`);
    }
  }

  /**
   * Get alerts by type
   * @param type The type filter
   * @returns Array of alert DTOs
   */
  async getAlertsByType(type: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findByType(type);
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching alerts by type:', error);
      throw new Error(`Failed to fetch alerts by type: ${error.message}`);
    }
  }

  /**
   * Get unresolved alerts for a project
   * @param projectId The project ID
   * @returns Array of unresolved alert DTOs
   */
  async getUnresolvedAlerts(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findUnresolvedByProjectId(projectId);
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching unresolved alerts:', error);
      throw new Error(`Failed to fetch unresolved alerts: ${error.message}`);
    }
  }

  /**
   * Get alerts that need escalation
   * @returns Array of alert DTOs needing escalation
   */
  async getAlertsNeedingEscalation(): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findNeedingEscalation();
      return alerts.map(alert => this.alertTransformer.toDTO(alert));
    } catch (error) {
      console.error('Error fetching alerts needing escalation:', error);
      throw new Error(`Failed to fetch alerts needing escalation: ${error.message}`);
    }
  }

  /**
   * Get alert statistics for a project
   * @param projectId The project ID
   * @returns Statistics object
   */
  async getProjectAlertStats(projectId: string): Promise<{
    total: number;
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<string, number>;
  }> {
    try {
      const alerts = await this.alertRepository.findByProjectId(projectId);
      const stats = {
        total: alerts.length,
        unresolved: alerts.filter(a => !a.resolved).length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
        byType: {} as Record<string, number>
      };

      alerts.forEach(alert => {
        if (stats.byType[alert.type]) {
          stats.byType[alert.type]++;
        } else {
          stats.byType[alert.type] = 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      throw new Error(`Failed to fetch alert stats: ${error.message}`);
    }
  }

  /**
   * Validate alert data
   * @param data The alert data to validate
   * @returns Validation result
   */
  validateAlertData(data: CreateProjectAlertRequestDto | UpdateProjectAlertRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.project_id || data.project_id.trim().length === 0) {
      errors.push('Project ID is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Alert title is required');
    }

    if (!data.type || data.type.trim().length === 0) {
      errors.push('Alert type is required');
    }

    if (!data.severity || !['low', 'medium', 'high', 'critical'].includes(data.severity)) {
      errors.push('Alert severity must be one of: low, medium, high, critical');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
