/**
 * AlertService - Placeholder service for project alerts
 * Uses in-memory storage since the tables don't exist yet
 */

import { ProjectAlert } from '@/domain/entities/Workspace';

// Simplified DTO interfaces
interface ProjectAlertDTO {
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

interface CreateProjectAlertRequestDto {
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
}

interface UpdateProjectAlertRequestDto {
  type?: string;
  severity?: string;
  title?: string;
  description?: string;
  acknowledged?: boolean;
  resolved?: boolean;
}

// In-memory storage for alerts (placeholder)
const alertsStore: Map<string, ProjectAlert> = new Map();

export class AlertService {
  /**
   * Create a new project alert
   */
  async createAlert(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const id = `alert-${Date.now()}`;
      const alert: ProjectAlert = {
        id,
        projectId: alertData.project_id,
        type: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        acknowledged: false,
        resolved: false
      };
      alertsStore.set(id, alert);
      return this.toDTO(alert);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create alert: ${message}`);
    }
  }

  /**
   * Get an alert by ID
   */
  async getAlertById(id: string): Promise<ProjectAlertDTO | null> {
    try {
      const alert = alertsStore.get(id);
      return alert ? this.toDTO(alert) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch alert: ${message}`);
    }
  }

  /**
   * Get all alerts for a project
   */
  async getAlertsByProjectId(projectId: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = Array.from(alertsStore.values())
        .filter(a => a.projectId === projectId);
      return alerts.map(a => this.toDTO(a));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch project alerts: ${message}`);
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = Array.from(alertsStore.values())
        .filter(a => !a.resolved);
      return alerts.map(a => this.toDTO(a));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch active alerts: ${message}`);
    }
  }

  /**
   * Update an alert
   */
  async updateAlert(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    try {
      const existing = alertsStore.get(id);
      if (!existing) throw new Error('Alert not found');
      
      const updated: ProjectAlert = {
        ...existing,
        ...updateData,
        updatedAt: new Date()
      };
      alertsStore.set(id, updated);
      return this.toDTO(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update alert: ${message}`);
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string): Promise<void> {
    try {
      alertsStore.delete(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete alert: ${message}`);
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const existing = alertsStore.get(id);
      if (!existing) throw new Error('Alert not found');
      
      const updated: ProjectAlert = {
        ...existing,
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        updatedAt: new Date()
      };
      alertsStore.set(id, updated);
      return this.toDTO(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to acknowledge alert: ${message}`);
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, userId: string): Promise<ProjectAlertDTO> {
    try {
      const existing = alertsStore.get(id);
      if (!existing) throw new Error('Alert not found');
      
      const updated: ProjectAlert = {
        ...existing,
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        updatedAt: new Date()
      };
      alertsStore.set(id, updated);
      return this.toDTO(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to resolve alert: ${message}`);
    }
  }

  /**
   * Get alerts by type
   */
  async getAlertsByType(type: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = Array.from(alertsStore.values())
        .filter(a => a.type === type);
      return alerts.map(a => this.toDTO(a));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch alerts by type: ${message}`);
    }
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(severity: string): Promise<ProjectAlertDTO[]> {
    try {
      const alerts = Array.from(alertsStore.values())
        .filter(a => a.severity === severity);
      return alerts.map(a => this.toDTO(a));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch alerts by severity: ${message}`);
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
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Convert entity to DTO
   */
  private toDTO(alert: ProjectAlert): ProjectAlertDTO {
    return {
      id: alert.id,
      project_id: alert.projectId,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      created_at: alert.createdAt.toISOString(),
      updated_at: alert.updatedAt?.toISOString(),
      acknowledged: alert.acknowledged,
      acknowledged_at: alert.acknowledgedAt?.toISOString(),
      acknowledged_by: alert.acknowledgedBy,
      resolved: alert.resolved,
      resolved_at: alert.resolvedAt?.toISOString(),
      resolved_by: alert.resolvedBy
    };
  }

  // Static methods
  static async create(data: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO> {
    const service = new AlertService();
    return service.createAlert(data);
  }

  static async getById(id: string): Promise<ProjectAlertDTO | null> {
    const service = new AlertService();
    return service.getAlertById(id);
  }

  static async getByProject(projectId: string): Promise<ProjectAlertDTO[]> {
    const service = new AlertService();
    return service.getAlertsByProjectId(projectId);
  }

  static async getActive(): Promise<ProjectAlertDTO[]> {
    const service = new AlertService();
    return service.getActiveAlerts();
  }
}
