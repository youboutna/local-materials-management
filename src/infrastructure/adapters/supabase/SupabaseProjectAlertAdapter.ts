// ============================================================
// src/infrastructure/supabase/SupabaseProjectAlertAdapter.ts
// ============================================================
/**TODO
 * Supabase Project Alert Adapter (Infrastructure)
 * Implémentation utilisant Supabase comme base de données
 * Implémente le port IProjectAlertRepository
 */
/*Alert Service - Hexagonal Architecture
 * Business logic for project alert management
 * 
 * Pattern: Repository → Service → DTO
 * Integrates with ProjectManagerProvider and uses IAlertRepository
 */

import { 
  Alert, 
  AlertStatistics, 
  AlertStatus, 
  AlertType, 
  AlertSeverity, 
  AlertSource,
  AlertEntity,
  ProjectManagerState
} from '@/domain/entities/Alert';
import { 
  IAlertRepository, 
  AlertFilter 
} from '@/domain/repositories/IAlertRepository';
import { 
  AlertDTO, 
  AlertStatisticsDTO, 
  AlertStateDTO,
  CreateAlertData,
  UpdateAlertData,
  AlertFilter as AlertFilterDTO
} from '@/dtos/entities/AlertDTO';
import { AlertTransformer } from '@/dtos/transforms/AlertTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import type { EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';

// ============================================================
// Types for Project Context Integration
// ============================================================
export interface ProjectAlertContext {
  projectId: string;
  projectTitle: string;
  userId?: string;
  roles?: EscalationRoles;
}

export interface AlertActionResult {
  success: boolean;
  alert?: AlertDTO;
  message?: string;
  error?: string;
}

export interface AlertBatchActionResult {
  success: boolean;
  alerts?: AlertDTO[];
  message?: string;
  error?: string;
  failedIds?: string[];
}

// ============================================================
// Validation Utilities
// ============================================================
const AlertValidation = {
  validateCreate(data: CreateAlertData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.type) errors.push('Alert type is required');
    if (!data.severity) errors.push('Alert severity is required');
    if (!data.title) errors.push('Alert title is required');
    if (!data.message) errors.push('Alert message is required');
    if (!data.source) errors.push('Alert source is required');
    
    const validSeverities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
    if (data.severity && !validSeverities.includes(data.severity)) {
      errors.push('Invalid severity. Must be: critical, high, medium, or low');
    }
    
    const validTypes: AlertType[] = ['budget', 'deadline', 'resource', 'risk', 'compliance', 'system'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Invalid alert type');
    }
    
    const validSources: AlertSource[] = ['deadline', 'budget', 'resource', 'risk', 'compliance', 'system', 'user'];
    if (data.source && !validSources.includes(data.source)) {
      errors.push('Invalid alert source');
    }
    
    if (data.delayDays !== undefined && data.delayDays < 0) {
      errors.push('Delay days cannot be negative');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  validateUpdate(data: UpdateAlertData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.severity) {
      const validSeverities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
      if (!validSeverities.includes(data.severity)) {
        errors.push('Invalid severity. Must be: critical, high, medium, or low');
      }
    }
    
    if (data.status) {
      const validStatuses: AlertStatus[] = ['open', 'acknowledged', 'resolved', 'closed', 'escalated'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Invalid status');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },

  validateFilter(filters: AlertFilterDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (filters.severity) {
      const validSeverities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
      if (!validSeverities.includes(filters.severity)) {
        errors.push('Invalid severity filter');
      }
    }
    
    if (filters.type) {
      const validTypes: AlertType[] = ['budget', 'deadline', 'resource', 'risk', 'compliance', 'system'];
      if (!validTypes.includes(filters.type)) {
        errors.push('Invalid type filter');
      }
    }
    
    if (filters.status) {
      const validStatuses: AlertStatus[] = ['open', 'acknowledged', 'resolved', 'closed', 'escalated'];
      if (!validStatuses.includes(filters.status)) {
        errors.push('Invalid status filter');
      }
    }
    
    if (filters.source) {
      const validSources: AlertSource[] = ['deadline', 'budget', 'resource', 'risk', 'compliance', 'system', 'user'];
      if (!validSources.includes(filters.source)) {
        errors.push('Invalid source filter');
      }
    }
    
    if (filters.dateRange) {
      if (filters.dateRange.start && isNaN(Date.parse(filters.dateRange.start))) {
        errors.push('Invalid start date format');
      }
      if (filters.dateRange.end && isNaN(Date.parse(filters.dateRange.end))) {
        errors.push('Invalid end date format');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
};

// ============================================================
// Alert Service with Project Context Support
// ============================================================
export class SupabaseProjectAlertAdapter {
  private alertRepository: IAlertRepository;
  private projectContext?: ProjectAlertContext;

  constructor(alertRepository?: IAlertRepository, projectContext?: ProjectAlertContext) {
    this.alertRepository = alertRepository || RepositoryFactory.getAlertRepository();
    this.projectContext = projectContext;
  }

  /**
   * Set the project context for operations
   */
  setProjectContext(context: ProjectAlertContext): void {
    this.projectContext = context;
  }

  /**
   * Get current project context
   */
  getProjectContext(): ProjectAlertContext | undefined {
    return this.projectContext;
  }

  /**
   * Create a new alert with project context
   */
  async createAlert(data: CreateAlertData): Promise<AlertActionResult> {
    try {
      // 1. Validation Layer
      const validation = AlertValidation.validateCreate(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // 2. If project context is available, use it to enrich data
      if (this.projectContext && !data.projectTitle) {
        data.projectTitle = this.projectContext.projectTitle;
      }

      // 3. Create domain entity
      const alert = AlertTransformer.createFromData(data);
      
      // 4. Repository Layer
      const createdAlert = await this.alertRepository.create(alert);
      
      // 5. Transform to DTO
      return {
        success: true,
        alert: AlertTransformer.toDTO(createdAlert),
        message: 'Alert created successfully'
      };
    } catch (error) {
      console.error('SupabaseProjectAlertAdapter.createAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to create alert').message
      };
    }
  }

  /**
   * Create alerts for a specific project with context
   */
  async createProjectAlert(
    projectContext: ProjectAlertContext,
    data: Omit<CreateAlertData, 'projectId' | 'projectTitle'>
  ): Promise<AlertActionResult> {
    return this.createAlert({
      ...data,
      projectId: projectContext.projectId,
      projectTitle: projectContext.projectTitle
    });
  }

  /**
   * Get an alert by ID
   */
  async getAlertById(id: string): Promise<AlertDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }

      const alert = await this.alertRepository.findById(id);
      return alert ? AlertTransformer.toDTO(alert) : null;
    } catch (error) {
      console.error('AlertService.getAlertById failed:', error);
      throw this.handleError(error, 'Failed to fetch alert');
    }
  }

  /**
   * Get all alerts with optional filters
   */
  async getAlerts(filters?: AlertFilterDTO): Promise<AlertDTO[]> {
    try {
      // Validate filters
      if (filters) {
        const validation = AlertValidation.validateFilter(filters);
        if (!validation.isValid) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid filters: ${validation.errors.join(', ')}`
          );
        }
      }

      // Convert DTO filter to repository filter
      const repositoryFilter: AlertFilter = {};
      if (filters) {
        if (filters.severity) repositoryFilter.severity = filters.severity;
        if (filters.type) repositoryFilter.type = filters.type;
        if (filters.status) repositoryFilter.status = filters.status;
        if (filters.source) repositoryFilter.source = filters.source;
        if (filters.projectId) repositoryFilter.projectId = filters.projectId;
        if (filters.acknowledged !== undefined) repositoryFilter.acknowledged = filters.acknowledged;
        if (filters.dateRange) repositoryFilter.dateRange = filters.dateRange;
      }

      // If project context is available and no project filter is set, use context
      if (this.projectContext && !repositoryFilter.projectId) {
        repositoryFilter.projectId = this.projectContext.projectId;
      }

      const alerts = await this.alertRepository.find(repositoryFilter);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlerts failed:', error);
      throw this.handleError(error, 'Failed to fetch alerts');
    }
  }

  /**
   * Get all alerts for a project
   */
  async getAlertsByProjectId(projectId: string): Promise<AlertDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const alerts = await this.alertRepository.findByProjectId(projectId);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlertsByProjectId failed:', error);
      throw this.handleError(error, 'Failed to fetch project alerts');
    }
  }

  /**
   * Get alerts for the current project context
   */
  async getCurrentProjectAlerts(): Promise<AlertDTO[]> {
    if (!this.projectContext) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'No project context set');
    }
    return this.getAlertsByProjectId(this.projectContext.projectId);
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<AlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findActive();
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getActiveAlerts failed:', error);
      throw this.handleError(error, 'Failed to fetch active alerts');
    }
  }

  /**
   * Get active alerts for current project context
   */
  async getCurrentProjectActiveAlerts(): Promise<AlertDTO[]> {
    if (!this.projectContext) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'No project context set');
    }
    const alerts = await this.alertRepository.findActive();
    const filtered = alerts.filter(a => a.projectId === this.projectContext?.projectId);
    return AlertTransformer.toDTOList(filtered);
  }

  /**
   * Get alerts by type
   */
  async getAlertsByType(type: AlertType): Promise<AlertDTO[]> {
    try {
      if (!type) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert type is required');
      }

      const alerts = await this.alertRepository.findByType(type);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlertsByType failed:', error);
      throw this.handleError(error, 'Failed to fetch alerts by type');
    }
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(severity: AlertSeverity): Promise<AlertDTO[]> {
    try {
      if (!severity) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Severity is required');
      }

      const alerts = await this.alertRepository.findBySeverity(severity);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlertsBySeverity failed:', error);
      throw this.handleError(error, 'Failed to fetch alerts by severity');
    }
  }

  /**
   * Get alerts by source
   */
  async getAlertsBySource(source: AlertSource): Promise<AlertDTO[]> {
    try {
      if (!source) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Source is required');
      }

      const alerts = await this.alertRepository.findBySource(source);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlertsBySource failed:', error);
      throw this.handleError(error, 'Failed to fetch alerts by source');
    }
  }

  /**
   * Get alerts by status
   */
  async getAlertsByStatus(status: AlertStatus): Promise<AlertDTO[]> {
    try {
      if (!status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      const alerts = await this.alertRepository.findByStatus(status);
      return AlertTransformer.toDTOList(alerts);
    } catch (error) {
      console.error('AlertService.getAlertsByStatus failed:', error);
      throw this.handleError(error, 'Failed to fetch alerts by status');
    }
  }

  /**
   * Update an alert
   */
  async updateAlert(id: string, data: UpdateAlertData): Promise<AlertActionResult> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Alert ID is required'
        };
      }

      // Validation
      const validation = AlertValidation.validateUpdate(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Get existing alert
      const existingAlert = await this.alertRepository.findById(id);
      if (!existingAlert) {
        return {
          success: false,
          error: `Alert with ID ${id} not found`
        };
      }

      // Update alert
      const updatedAlert = AlertTransformer.updateFromData(existingAlert, data);
      const result = await this.alertRepository.update(id, updatedAlert);
      
      return {
        success: true,
        alert: AlertTransformer.toDTO(result),
        message: 'Alert updated successfully'
      };
    } catch (error) {
      console.error('AlertService.updateAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to update alert').message
      };
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!id) {
        return { success: false, error: 'Alert ID is required' };
      }

      // Check if alert exists
      const exists = await this.alertRepository.exists(id);
      if (!exists) {
        return { success: false, error: `Alert with ID ${id} not found` };
      }

      await this.alertRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error('AlertService.deleteAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to delete alert').message
      };
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<AlertActionResult> {
    try {
      if (!id) {
        return { success: false, error: 'Alert ID is required' };
      }
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const alert = await this.alertRepository.acknowledge(id, userId);
      return {
        success: true,
        alert: AlertTransformer.toDTO(alert),
        message: 'Alert acknowledged successfully'
      };
    } catch (error) {
      console.error('AlertService.acknowledgeAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to acknowledge alert').message
      };
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, userId: string): Promise<AlertActionResult> {
    try {
      if (!id) {
        return { success: false, error: 'Alert ID is required' };
      }
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const alert = await this.alertRepository.resolve(id, userId);
      return {
        success: true,
        alert: AlertTransformer.toDTO(alert),
        message: 'Alert resolved successfully'
      };
    } catch (error) {
      console.error('AlertService.resolveAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to resolve alert').message
      };
    }
  }

  /**
   * Escalate an alert
   */
  async escalateAlert(id: string): Promise<AlertActionResult> {
    try {
      if (!id) {
        return { success: false, error: 'Alert ID is required' };
      }

      const alert = await this.alertRepository.escalate(id);
      return {
        success: true,
        alert: AlertTransformer.toDTO(alert),
        message: 'Alert escalated successfully'
      };
    } catch (error) {
      console.error('AlertService.escalateAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to escalate alert').message
      };
    }
  }

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeAlertsBatch(ids: string[], userId: string): Promise<AlertBatchActionResult> {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, error: 'Alert IDs are required' };
      }
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const alerts = await this.alertRepository.acknowledgeBatch(ids, userId);
      return {
        success: true,
        alerts: AlertTransformer.toDTOList(alerts),
        message: `${alerts.length} alerts acknowledged successfully`
      };
    } catch (error) {
      console.error('AlertService.acknowledgeAlertsBatch failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to acknowledge alerts batch').message
      };
    }
  }

  /**
   * Resolve multiple alerts
   */
  async resolveAlertsBatch(ids: string[], userId: string): Promise<AlertBatchActionResult> {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, error: 'Alert IDs are required' };
      }
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const alerts = await this.alertRepository.resolveBatch(ids, userId);
      return {
        success: true,
        alerts: AlertTransformer.toDTOList(alerts),
        message: `${alerts.length} alerts resolved successfully`
      };
    } catch (error) {
      console.error('AlertService.resolveAlertsBatch failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to resolve alerts batch').message
      };
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(projectId?: string): Promise<AlertStatisticsDTO> {
    try {
      const stats = await this.alertRepository.getStatistics(projectId);
      return AlertTransformer.statsToDTO(stats);
    } catch (error) {
      console.error('AlertService.getAlertStatistics failed:', error);
      throw this.handleError(error, 'Failed to fetch alert statistics');
    }
  }

  /**
   * Get statistics for current project context
   */
  async getCurrentProjectStatistics(): Promise<AlertStatisticsDTO> {
    if (!this.projectContext) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'No project context set');
    }
    return this.getAlertStatistics(this.projectContext.projectId);
  }

  /**
   * Count alerts with filters
   */
  async countAlerts(filters?: AlertFilterDTO): Promise<number> {
    try {
      // Convert DTO filter to repository filter
      const repositoryFilter: AlertFilter = {};
      if (filters) {
        if (filters.severity) repositoryFilter.severity = filters.severity;
        if (filters.type) repositoryFilter.type = filters.type;
        if (filters.status) repositoryFilter.status = filters.status;
        if (filters.source) repositoryFilter.source = filters.source;
        if (filters.projectId) repositoryFilter.projectId = filters.projectId;
        if (filters.acknowledged !== undefined) repositoryFilter.acknowledged = filters.acknowledged;
        if (filters.dateRange) repositoryFilter.dateRange = filters.dateRange;
      }

      return await this.alertRepository.count(repositoryFilter);
    } catch (error) {
      console.error('AlertService.countAlerts failed:', error);
      throw this.handleError(error, 'Failed to count alerts');
    }
  }

  /**
   * Get full alert state (alerts + stats)
   */
  async getAlertState(projectId?: string): Promise<AlertStateDTO> {
    try {
      const [alerts, stats] = await Promise.all([
        projectId ? this.getAlertsByProjectId(projectId) : this.getAlerts(),
        this.getAlertStatistics(projectId)
      ]);

      // Convert DTOs back to entities for transformer
      const alertEntities = alerts.map(dto => AlertTransformer.fromDTO(dto));
      const statsEntity = AlertTransformer.fromDTOStats(stats);

      return AlertTransformer.stateToDTO({
        alerts: alertEntities,
        stats: statsEntity,
        lastUpdated: new Date().toISOString(),
        progress: stats.resolutionRate
      });
    } catch (error) {
      console.error('AlertService.getAlertState failed:', error);
      throw this.handleError(error, 'Failed to fetch alert state');
    }
  }

  /**
   * Get state for current project context
   */
  async getCurrentProjectState(): Promise<AlertStateDTO> {
    if (!this.projectContext) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'No project context set');
    }
    return this.getAlertState(this.projectContext.projectId);
  }

  /**
   * Delete all alerts for a project
   */
  async deleteAlertsByProjectId(projectId: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.alertRepository.deleteByProjectId(projectId);
    } catch (error) {
      console.error('AlertService.deleteAlertsByProjectId failed:', error);
      throw this.handleError(error, 'Failed to delete project alerts');
    }
  }

  /**
   * Get overdue alerts
   */
  async getOverdueAlerts(): Promise<AlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findActive();
      const overdue = AlertTransformer.filterOverdue(alerts);
      return AlertTransformer.toDTOList(overdue);
    } catch (error) {
      console.error('AlertService.getOverdueAlerts failed:', error);
      throw this.handleError(error, 'Failed to fetch overdue alerts');
    }
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(): Promise<AlertDTO[]> {
    try {
      const alerts = await this.alertRepository.findActive();
      const critical = AlertTransformer.filterCritical(alerts);
      return AlertTransformer.toDTOList(critical);
    } catch (error) {
      console.error('AlertService.getCriticalAlerts failed:', error);
      throw this.handleError(error, 'Failed to fetch critical alerts');
    }
  }

  /**
   * Check if an alert exists
   */
  async alertExists(id: string): Promise<boolean> {
    try {
      return await this.alertRepository.exists(id);
    } catch (error) {
      console.error('AlertService.alertExists failed:', error);
      return false;
    }
  }

  /**
   * Get escalation path for an alert (compatible with ProjectManager)
   */
  getEscalationPath(alert: Alert | AlertDTO): string[] {
    try {
      const entity = alert instanceof AlertEntity ? alert : AlertTransformer.fromDTO(alert as AlertDTO);
      
      // Default escalation path based on severity
      const paths: Record<AlertSeverity, string[]> = {
        'critical': ['Project Manager', 'Director', 'VP'],
        'high': ['Project Manager', 'Director'],
        'medium': ['Project Manager'],
        'low': ['Project Manager']
      };
      
      return paths[entity.severity] || paths['low'];
    } catch (error) {
      console.error('AlertService.getEscalationPath failed:', error);
      return [];
    }
  }

  /**
   * Check if an alert needs escalation
   */
  needsEscalation(alert: Alert | AlertDTO): boolean {
    try {
      const entity = alert instanceof AlertEntity ? alert : AlertTransformer.fromDTO(alert as AlertDTO);
      
      // Escalate if:
      // 1. Alert has been open for more than 24 hours
      // 2. Alert is critical and not acknowledged within 1 hour
      // 3. Alert has been escalated before and still not resolved
      
      const createdAt = new Date(entity.createdAt);
      const now = new Date();
      const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (entity.severity === 'critical' && hoursOpen > 1) return true;
      if (entity.severity === 'high' && hoursOpen > 4) return true;
      if (hoursOpen > 24) return true;
      
      return false;
    } catch (error) {
      console.error('AlertService.needsEscalation failed:', error);
      return false;
    }
  }

  /**
   * Get action label for alert type (compatible with ProjectManager)
   */
  getActionLabel(alertType: AlertType | string): string {
    const labels: Record<AlertType, string> = {
      'budget': 'Review Budget',
      'deadline': 'Extend Deadline',
      'resource': 'Allocate Resources',
      'risk': 'Mitigate Risk',
      'compliance': 'Review Compliance',
      'system': 'Check System'
    };
    
    return labels[alertType as AlertType] || 'Take Action';
  }

  /**
   * Get summary statistics (compatible with ProjectManager)
   */
  async getSummaryStats(projectId?: string): Promise<AlertStatistics> {
    try {
      const stats = await this.alertRepository.getStatistics(projectId);
      return {
        totalAlerts: stats.total,
        criticalAlerts: stats.critical || 0,
        highAlerts: 0, // Not provided by current stats, calculate separately
        mediumAlerts: 0,
        lowAlerts: 0,
        openAlerts: stats.open || 0,
        acknowledgedAlerts: 0,
        resolvedAlerts: stats.resolved || 0,
        pendingActions: stats.open || 0,
        activeRisks: 0,
        overdueTasks: 0
      };
    } catch (error) {
      console.error('AlertService.getSummaryStats failed:', error);
      throw this.handleError(error, 'Failed to fetch summary statistics');
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, defaultMessage: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    if (error instanceof Error) {
      return new AppError(ErrorCode.INTERNAL_ERROR, `${defaultMessage}: ${error.message}`);
    }
    return new AppError(ErrorCode.INTERNAL_ERROR, defaultMessage);
  }
}

// ============================================================
// Singleton Factory with Project Context Support
// ============================================================
let alertServiceInstance: AlertService | null = null;

export function getAlertService(projectContext?: ProjectAlertContext): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService(undefined, projectContext);
  } else if (projectContext) {
    alertServiceInstance.setProjectContext(projectContext);
  }
  return alertServiceInstance;
}

/**
 * Create a new AlertService instance with project context
 * Useful for components like ProjectManagerProvider
 */
export function createAlertService(projectContext: ProjectAlertContext): AlertService {
  return new AlertService(undefined, projectContext);
}

// ============================================================
// Re-exports for convenience
// ============================================================
export type { 
  Alert, 
  AlertStatistics, 
  AlertStatus, 
  AlertType, 
  AlertSeverity, 
  AlertSource,
  AlertDTO, 
  AlertStatisticsDTO, 
  AlertStateDTO, 
  CreateAlertData, 
  UpdateAlertData,
  AlertFilterDTO
};