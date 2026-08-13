// ============================================================
// src/application/services/AlertService.ts
// ============================================================
/**
 * Alert Service - Hexagonal Architecture
 * Business logic for project alert management
 * 
 * Pattern: Repository → Service → DTO
 * Uses RepositoryFactory for dependency injection
 * 
 * Optimisations:
 * - Rate limiting
 * - Cache
 * - Non-blocking operations
 */

import { 
  Alert, 
  AlertStatistics, 
  AlertStatus, 
  AlertType, 
  AlertSeverity, 
  AlertSource,
  AlertEntity
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
import {
  MetricAlertRulesService,
  type AlertRuleInput,
  type DerivedAlert,
} from '@/application/services/MetricAlertRulesService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// ============================================================
// Types
// ============================================================
export interface ProjectAlertContext {
  projectId: string;
  projectTitle: string;
  userId?: string;
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
// Validation
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
// Alert Service
// ============================================================
export class AlertService {
  private alertRepository: IAlertRepository;
  private projectContext?: ProjectAlertContext;
  
  // Performance optimisations
  private alertCache = new Map<string, { timestamp: number; count: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly MAX_ALERTS_PER_MINUTE = 10;

  constructor(alertRepository?: IAlertRepository, projectContext?: ProjectAlertContext) {
    this.alertRepository = alertRepository || RepositoryFactory.getAlertRepository();
    this.projectContext = projectContext;
  }

  /**
   * Rate limiting check
   */
  private canCreateAlert(key: string): boolean {
    const now = Date.now();
    const cached = this.alertCache.get(key);

    if (cached) {
      if (now - cached.timestamp < this.CACHE_TTL) {
        if (cached.count >= this.MAX_ALERTS_PER_MINUTE) {
          return false;
        }
        this.alertCache.set(key, { timestamp: now, count: cached.count + 1 });
      } else {
        this.alertCache.set(key, { timestamp: now, count: 1 });
      }
    } else {
      this.alertCache.set(key, { timestamp: now, count: 1 });
    }
    return true;
  }

  /**
   * Set project context
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
   * Create alert with rate limiting
   */
  async createAlert(data: CreateAlertData): Promise<AlertActionResult> {
    try {
      // Rate limiting
      const key = `${data.projectId}-${data.type}`;
      if (!this.canCreateAlert(key)) {
        return {
          success: false,
          error: 'Rate limit exceeded for alert creation'
        };
      }

      // Validation
      const validation = AlertValidation.validateCreate(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Enrich with project context
      if (this.projectContext && !data.projectTitle) {
        data.projectTitle = this.projectContext.projectTitle;
      }

      // Create entity and persist
      const alert = AlertTransformer.createFromData(data);
      const createdAlert = await this.alertRepository.create(alert);
      
      return {
        success: true,
        alert: AlertTransformer.toDTO(createdAlert),
        message: 'Alert created successfully'
      };
    } catch (error) {
      console.error('AlertService.createAlert failed:', error);
      return {
        success: false,
        error: this.handleError(error, 'Failed to create alert').message
      };
    }
  }

  /**
   * Create alert asynchronously (non-blocking)
   */
  createAlertBackground(data: CreateAlertData): void {
    setTimeout(async () => {
      try {
        await this.createAlert(data);
      } catch (error) {
        console.warn('Background alert creation failed:', error);
      }
    });
  }

  /**
   * Get alert by ID
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
   * Get all alerts with filters
   */
  async getAlerts(filters?: AlertFilterDTO): Promise<AlertDTO[]> {
    try {
      if (filters) {
        const validation = AlertValidation.validateFilter(filters);
        if (!validation.isValid) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid filters: ${validation.errors.join(', ')}`
          );
        }
      }

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
   * Get alerts by project ID
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
   * Get alerts for current project context
   */
  async getCurrentProjectAlerts(): Promise<AlertDTO[]> {
    if (!this.projectContext) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'No project context set');
    }
    return this.getAlertsByProjectId(this.projectContext.projectId);
  }

  /**
   * Get active alerts
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
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<AlertActionResult> {
    try {
      if (!id) return { success: false, error: 'Alert ID is required' };
      if (!userId) return { success: false, error: 'User ID is required' };

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
   * Resolve alert
   */
  async resolveAlert(id: string, userId: string): Promise<AlertActionResult> {
    try {
      if (!id) return { success: false, error: 'Alert ID is required' };
      if (!userId) return { success: false, error: 'User ID is required' };

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
   * Escalate alert
   */
  async escalateAlert(id: string): Promise<AlertActionResult> {
    try {
      if (!id) return { success: false, error: 'Alert ID is required' };

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
   * Delete alerts by project ID
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
   * Update an alert (statut, assignation, résolution...)
   */
  async updateAlert(id: string, updates: Partial<AlertDTO>): Promise<AlertActionResult> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Alert ID is required');
      }
      const updated = await this.alertRepository.update(id, updates as Partial<Alert>);
      return { success: true, alert: AlertTransformer.toDTO(updated) };
    } catch (error) {
      console.error('AlertService.updateAlert failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alert',
      };
    }
  }

  /**
   * Statistiques agrégées pour le pilotage projet (ProjectManagerProvider)
   */
  async getSummaryStats(projectId?: string): Promise<AlertStatistics> {
    try {
      const stats = await this.alertRepository.getStatistics(projectId);
      return {
        ...stats,
        totalAlerts: stats.total ?? 0,
        criticalAlerts: stats.critical ?? 0,
        highAlerts: stats.high ?? 0,
        mediumAlerts: stats.medium ?? 0,
        lowAlerts: stats.low ?? 0,
        openAlerts: stats.open ?? 0,
        acknowledgedAlerts: stats.acknowledged ?? 0,
        resolvedAlerts: stats.resolved ?? 0,
        pendingActions: stats.open ?? 0,
      };
    } catch (error) {
      console.error('AlertService.getSummaryStats failed:', error);
      throw this.handleError(error, 'Failed to fetch summary statistics');
    }
  }

  /**
   * Chaîne d'escalade en fonction de la sévérité
   */
  getEscalationPath(alert: Pick<AlertDTO, 'severity'>): string[] {
    const paths: Record<string, string[]> = {
      critical: ['Chef de projet', 'Directeur', 'Direction générale'],
      high: ['Chef de projet', 'Directeur'],
      medium: ['Chef de projet'],
      low: ['Chef de projet'],
    };
    return paths[String(alert.severity)] || paths.low;
  }

  /**
   * Détermine si une alerte doit être escaladée
   */
  needsEscalation(alert: Pick<AlertDTO, 'severity' | 'createdAt' | 'status'>): boolean {
    if (alert.status === 'resolved' || alert.status === 'closed') return false;
    const createdAt = new Date(alert.createdAt as string);
    if (Number.isNaN(createdAt.getTime())) return false;
    const hoursOpen = (Date.now() - createdAt.getTime()) / 3_600_000;
    if (alert.severity === 'critical' && hoursOpen > 1) return true;
    if (alert.severity === 'high' && hoursOpen > 4) return true;
    return hoursOpen > 24;
  }

  /**
   * Libellé d'action métier par type d'alerte
   */
  getActionLabel(alertType: string): string {
    const labels: Record<string, string> = {
      budget: 'Revoir le budget',
      deadline: 'Replanifier',
      resource: 'Réaffecter des ressources',
      risk: 'Traiter le risque',
      compliance: 'Vérifier la conformité',
      system: 'Vérifier le système',
      payment: 'Contrôler le paiement',
      quality: 'Contrôle qualité',
    };
    return labels[alertType] || 'Traiter';
  }


  /**
   * Handle errors
   */
  private handleError(error: unknown, defaultMessage: string): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) {
      return new AppError(ErrorCode.INTERNAL_ERROR, `${defaultMessage}: ${error.message}`);
    }
    return new AppError(ErrorCode.INTERNAL_ERROR, defaultMessage);
  }

  // ============================================================
  // Alertes CALCULÉES (fusion avec MetricAlertRulesService)
  // ============================================================
  /**
   * Règles de déclenchement dérivées des métriques (SPI < 0.8, CPI < 0.8,
   * progression faible, risques ouverts > 3...). Point d'entrée UNIQUE :
   * les vues n'appellent plus `MetricAlertRulesService` directement.
   */
  static evaluateDerived(input: AlertRuleInput): DerivedAlert[] {
    return MetricAlertRulesService.evaluate(input);
  }

  /** Alertes calculées + alertes persistées d'un projet, dans une seule liste. */
  async listUnifiedAlerts(
    projectId: string,
    derivedInput?: AlertRuleInput,
  ): Promise<{ derived: DerivedAlert[]; persisted: AlertDTO[] }> {
    const derived = derivedInput ? MetricAlertRulesService.evaluate(derivedInput) : [];
    let persisted: AlertDTO[] = [];
    try {
      persisted = await this.getAlertsByProjectId(projectId);
    } catch {
      persisted = [];
    }
    return { derived, persisted };
  }
}


// ============================================================
// Singleton
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

export function createAlertService(projectContext: ProjectAlertContext): AlertService {
  return new AlertService(undefined, projectContext);
}