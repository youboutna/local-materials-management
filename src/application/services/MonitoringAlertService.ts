/**
 * Monitoring Alert Service - Hexagonal Architecture
 * Business logic for monitoring alerts management
 * 
 * Pattern: Hook → Service → Adapter → Supabase
 */

import type { AlertData } from '@/dtos/entities/AlertDTO';
import {
    CreateMonitoringAlertDTO,
    IMonitoringAlertRepository,
    MonitoringAlertDTO,
    SupabaseMonitoringAlertAdapter,
    UpdateMonitoringAlertDTO
} from '@/infrastructure/adapters/supabase/SupabaseMonitoringAlertAdapter';

// Re-export types for consumers
export type { CreateMonitoringAlertDTO, MonitoringAlertDTO, UpdateMonitoringAlertDTO };

// Statistics interface
export interface MonitoringAlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  acknowledged: number;
  pending: number;
}

/**
 * Transform MonitoringAlertDTO to AlertData for UI compatibility
 */
function transformToAlertData(dto: MonitoringAlertDTO): AlertData {
  return {
    id: dto.id,
    type: mapAlertType(dto.alertType),
    severity: mapPriorityToSeverity(dto.priority),
    title: dto.title,
    message: dto.description || '',
    projectId: dto.stationId || '',
    relatedEntityId: dto.id,
    source: 'notification',
    timestamp: dto.createdAt,
    triggerDate: dto.createdAt,
    acknowledged: dto.status === 'acknowledged' || dto.status === 'resolved',
    acknowledgedBy: dto.resolvedBy || undefined,
    acknowledgedAt: dto.resolvedAt || undefined,
    actionRequired: dto.status === 'active' || dto.status === 'pending',
    actionTaken: dto.resolutionNotes || undefined,
    actionTakenBy: dto.resolvedBy || undefined,
    actionTakenAt: dto.resolvedAt || undefined,
    status: dto.status
  };
}

function mapAlertType(dbType: string): AlertData['type'] {
  const typeMap: Record<string, AlertData['type']> = {
    'insurance': 'insurance_expiry',
    'delay': 'project_delay',
    'inspection': 'inspection_issue',
    'financial': 'financial_risk',
    'guarantee': 'bank_guarantee',
    'payment': 'payment_blocked',
    'compliance': 'compliance_violation',
    'delivery': 'delivery',
    'deadline': 'deadline',
    'quality': 'quality'
  };
  return typeMap[dbType] || 'project_delay';
}

function mapPriorityToSeverity(priority: string): AlertData['severity'] {
  const severityMap: Record<string, AlertData['severity']> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  return severityMap[priority] || 'medium';
}

export class MonitoringAlertService {
  private repository: IMonitoringAlertRepository;

  constructor(repository?: IMonitoringAlertRepository) {
    this.repository = repository || new SupabaseMonitoringAlertAdapter();
  }

  /**
   * Get all monitoring alerts as AlertData for UI
   */
  async getAllAlerts(): Promise<AlertData[]> {
    const dtos = await this.repository.findAll();
    return dtos.map(transformToAlertData);
  }

  /**
   * Get raw DTOs for advanced use cases
   */
  async getAllAlertsDTO(): Promise<MonitoringAlertDTO[]> {
    return this.repository.findAll();
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string): Promise<AlertData | null> {
    const dto = await this.repository.findById(id);
    return dto ? transformToAlertData(dto) : null;
  }

  /**
   * Create a new monitoring alert
   */
  async createAlert(data: Partial<AlertData>): Promise<AlertData> {
    const createDto: CreateMonitoringAlertDTO = {
      title: data.title || 'New Alert',
      alertType: data.type || 'general',
      priority: data.severity || 'medium',
      description: data.message,
      stationId: data.projectId
    };

    const created = await this.repository.create(createDto);
    return transformToAlertData(created);
  }

  /**
   * Update an existing alert
   */
  async updateAlert(id: string, data: Partial<AlertData>): Promise<void> {
    const updateDto: UpdateMonitoringAlertDTO = {};
    
    if (data.title) updateDto.title = data.title;
    if (data.message) updateDto.description = data.message;
    if (data.severity) updateDto.priority = data.severity;

    await this.repository.update(id, updateDto);
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string): Promise<void> {
    await this.repository.acknowledge(id);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, resolutionNotes?: string): Promise<void> {
    await this.repository.resolve(id, resolutionNotes);
  }

  /**
   * Calculate statistics from alerts
   */
  calculateStats(alerts: AlertData[]): MonitoringAlertStats {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      pending: alerts.filter(a => !a.acknowledged).length
    };
  }

  /**
   * Filter alerts by type
   */
  filterByType(alerts: AlertData[], type: string): AlertData[] {
    if (type === 'all') return alerts;
    
    return alerts.filter(alert => {
      if (type === 'delay') return alert.type === 'project_delay';
      if (type === 'payment') return alert.type === 'payment_blocked' || alert.type === 'financial_risk';
      if (type === 'inspection') return alert.type === 'inspection_issue' || alert.type === 'inspection_overdue';
      if (type === 'guarantee') return alert.type === 'bank_guarantee';
      return true;
    });
  }
}

// Singleton instance for convenience
let serviceInstance: MonitoringAlertService | null = null;

export function getMonitoringAlertService(): MonitoringAlertService {
  if (!serviceInstance) {
    serviceInstance = new MonitoringAlertService();
  }
  return serviceInstance;
}
