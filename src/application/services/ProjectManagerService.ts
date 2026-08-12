// ============================================================
// src/application/services/ProjectManagerService.ts
// ============================================================
/**
 * Project Manager Service
 * Application Layer - Orchestrates domain entities and repositories
 */

import type { EscalationRoles } from "@/dtos/entities/ProjectAggregateDTO";
import { ProjectManager, type ActionLabels, type ProjectManagerState } from "./projectManagerWithActions";
import type { AlertSeverity, AlertType } from "@/domain/entities/Alert";

// ===== Types exportés =====
export type { ProjectManagerState } from "./projectManagerWithActions";

// ===== Action Labels =====
export const actionLabels: ActionLabels = {
  budget: 'Revue budgétaire',
  timeline: 'Revue planning',
  quality: 'Contrôle qualité',
  resource: 'Allocation ressources',
  risk: 'Analyse du risque',
  compliance: 'Contrôle de conformité',
  insurance: 'Vérification assurance',
  document: 'Vérification document',
  security: 'Contrôle sécurité'
};

// ===== Interface du service =====
export interface IProjectManagerService {
  runChecks(): Promise<ProjectManagerState>;
  acknowledgeAlert(alertId: string, userId: string, actionTaken?: string): Promise<void>;
  resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void>;
  closeAlert(alertId: string, userId: string): Promise<void>;
  getAlerts(): Promise<any[]>;
  getAlertsByType(type: string): Promise<any[]>;
  getAlertsBySeverity(severity: string): Promise<any[]>;
  getSummaryStats(): Promise<any>;
  getState(): ProjectManagerState;
}

// ===== Service Implementation =====
export class ProjectManagerService implements IProjectManagerService {
  private manager: ProjectManager;

  constructor(
    project: any,
    roles: EscalationRoles,
    private actionLabels: ActionLabels = actionLabels
  ) {
    this.manager = new ProjectManager(project, roles, this.actionLabels);
  }

  async runChecks(): Promise<ProjectManagerState> {
    try {
      const result = this.manager.runAllChecks();
      return result;
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors des vérifications:', error);
      throw new Error('Échec de l\'exécution des vérifications du projet');
    }
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
    actionTaken?: string
  ): Promise<void> {
    try {
      this.manager.acknowledgeAlert(alertId, userId, actionTaken);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de l\'accusé de réception:', error);
      throw new Error('Échec de l\'accusé de réception de l\'alerte');
    }
  }

  async resolveAlert(
    alertId: string,
    userId: string,
    resolution?: string
  ): Promise<void> {
    try {
      this.manager.resolveAlert(alertId, userId, resolution);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la résolution:', error);
      throw new Error('Échec de la résolution de l\'alerte');
    }
  }

  async closeAlert(
    alertId: string,
    userId: string
  ): Promise<void> {
    try {
      this.manager.closeAlert(alertId, userId);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la fermeture:', error);
      throw new Error('Échec de la fermeture de l\'alerte');
    }
  }

  async getAlerts(): Promise<any[]> {
    try {
      return this.manager.getAlerts();
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la récupération des alertes:', error);
      return [];
    }
  }

  async getAlertsByType(type: string): Promise<any[]> {
    try {
      return this.manager.getAlertsByType(type as AlertType);
    } catch (error) {
      console.error(`[ProjectManagerService] Erreur lors de la récupération des alertes de type ${type}:`, error);
      return [];
    }
  }

  async getAlertsBySeverity(severity: string): Promise<any[]> {
    try {
      return this.manager.getAlertsBySeverity(severity as AlertSeverity);
    } catch (error) {
      console.error(`[ProjectManagerService] Erreur lors de la récupération des alertes de sévérité ${severity}:`, error);
      return [];
    }
  }

  async getSummaryStats(): Promise<any> {
    try {
      return this.manager.getSummaryStats();
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la récupération des statistiques:', error);
      return {
        totalAlerts: 0,
        criticalAlerts: 0,
        activeRisks: 0,
        overdueTasks: 0
      };
    }
  }

  getState(): ProjectManagerState {
    try {
      return this.manager.getState();
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la récupération de l\'état:', error);
      return {
        alerts: [],
        stats: { totalAlerts: 0, criticalAlerts: 0, activeRisks: 0, overdueTasks: 0 },
        lastCheck: new Date().toISOString()
      };
    }
  }

  needsEscalation(alert: any): boolean {
    try {
      return this.manager.needsEscalation(alert);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la vérification d\'escalade:', error);
      return false;
    }
  }

  getEscalationPath(alert: any): string[] {
    try {
      return this.manager.getEscalationPath(alert);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la récupération du chemin d\'escalade:', error);
      return [];
    }
  }

  getActionLabel(alertType: string): string {
    try {
      return this.manager.getActionLabel(alertType as AlertType);
    } catch (error) {
      console.error('[ProjectManagerService] Erreur lors de la récupération du label:', error);
      return 'Action';
    }
  }
}

// ===== Factory =====
export function createProjectManagerService(
  project: any,
  roles: EscalationRoles,
  customActionLabels?: ActionLabels
): IProjectManagerService {
  return new ProjectManagerService(project, roles, customActionLabels);
}

export function getProjectManagerService(
  project: any,
  roles: EscalationRoles
): IProjectManagerService {
  return createProjectManagerService(project, roles);
}