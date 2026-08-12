// ============================================================
// src/infrastructure/adapters/local/LocalAlertAdapter.ts
// ============================================================
/**
 * LocalStorage Alert Adapter (Infrastructure)
 * Implémentation utilisant localStorage du navigateur
 * Implémente le port IAlertRepository
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
import { IAlertRepository, AlertFilter } from '@/domain/repositories/IAlertRepository';

const STORAGE_KEY = 'project_alerts';

export class LocalAlertAdapter implements IAlertRepository {
  private alerts: Map<string, Alert> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Charge les alertes depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Alert[];
        for (const item of data) {
          const alert = AlertEntity.fromDTO(item).toDTO();
          this.alerts.set(alert.id, alert);
        }
      }
    } catch (error) {
      console.error('[LocalAlertAdapter] Erreur de chargement:', error);
    }
  }

  /**
   * Sauvegarde les alertes dans localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.alerts.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[LocalAlertAdapter] Erreur de sauvegarde:', error);
    }
  }

  /**
   * Filtre les alertes selon les critères
   */
  private applyFilters(alerts: Alert[], filters?: AlertFilter): Alert[] {
    if (!filters) return alerts;

    let result = [...alerts];

    if (filters.severity) {
      result = result.filter(a => a.severity === filters.severity);
    }

    if (filters.type) {
      result = result.filter(a => a.type === filters.type);
    }

    if (filters.status) {
      result = result.filter(a => a.status === filters.status);
    }

    if (filters.source) {
      result = result.filter(a => a.source === filters.source);
    }

    if (filters.projectId) {
      result = result.filter(a => a.projectId === filters.projectId);
    }

    if (filters.acknowledged !== undefined) {
      result = result.filter(a => a.acknowledged === filters.acknowledged);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        result = result.filter(a => a.createdAt >= filters.dateRange!.start);
      }
      if (filters.dateRange.end) {
        result = result.filter(a => a.createdAt <= filters.dateRange!.end);
      }
    }

    return result;
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================
  // IAlertRepository Implementation
  // ============================================================

  /**
   * Crée une nouvelle alerte
   */
  async create(alert: Alert): Promise<Alert> {
    const newAlert = {
      ...alert,
      id: alert.id || this.generateId(),
      createdAt: alert.createdAt || new Date().toISOString(),
      updatedAt: alert.updatedAt || new Date().toISOString(),
      timestamp: alert.timestamp || new Date().toISOString(),
      triggerDate: alert.triggerDate || new Date().toISOString(),
      status: alert.status || 'open',
      acknowledged: alert.acknowledged || false,
      escalationLevel: alert.escalationLevel || 0,
      actionProof: alert.actionProof || [],
      availableActions: alert.availableActions || [],
    };

    this.alerts.set(newAlert.id, newAlert);
    this.saveToStorage();
    return newAlert;
  }

  /**
   * Récupère une alerte par son ID
   */
  async findById(id: string): Promise<Alert | null> {
    return this.alerts.get(id) || null;
  }

  /**
   * Récupère toutes les alertes avec filtres optionnels
   */
  async find(filters?: AlertFilter): Promise<Alert[]> {
    const allAlerts = Array.from(this.alerts.values());
    return this.applyFilters(allAlerts, filters);
  }

  /**
   * Récupère toutes les alertes d'un projet
   */
  async findByProjectId(projectId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      a => a.projectId === projectId
    );
  }

  /**
   * Récupère toutes les alertes actives (open + acknowledged)
   */
  async findActive(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      a => a.status === 'open' || a.status === 'acknowledged'
    );
  }

  /**
   * Récupère les alertes par type
   */
  async findByType(type: AlertType): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.type === type);
  }

  /**
   * Récupère les alertes par sévérité
   */
  async findBySeverity(severity: AlertSeverity): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.severity === severity);
  }

  /**
   * Récupère les alertes par source
   */
  async findBySource(source: AlertSource): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.source === source);
  }

  /**
   * Récupère les alertes par statut
   */
  async findByStatus(status: AlertStatus): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.status === status);
  }

  /**
   * Met à jour une alerte
   */
  async update(id: string, alert: Partial<Alert>): Promise<Alert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...alert,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Supprime une alerte
   */
  async delete(id: string): Promise<void> {
    this.alerts.delete(id);
    this.saveToStorage();
  }

  /**
   * Accuse réception d'une alerte
   */
  async acknowledge(id: string, userId: string): Promise<Alert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const updated = {
      ...existing,
      status: 'acknowledged' as AlertStatus,
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Résout une alerte
   */
  async resolve(id: string, userId: string): Promise<Alert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const updated = {
      ...existing,
      status: 'resolved' as AlertStatus,
      acknowledged: true,
      actionTakenBy: userId,
      actionTakenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Escalade une alerte
   */
  async escalate(id: string): Promise<Alert> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const updated = {
      ...existing,
      status: 'escalated' as AlertStatus,
      escalationLevel: (existing.escalationLevel || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Accuse réception de plusieurs alertes
   */
  async acknowledgeBatch(ids: string[], userId: string): Promise<Alert[]> {
    const results: Alert[] = [];
    for (const id of ids) {
      try {
        const updated = await this.acknowledge(id, userId);
        results.push(updated);
      } catch (error) {
        console.error(`[LocalAlertAdapter] Erreur acknowledge ${id}:`, error);
      }
    }
    return results;
  }

  /**
   * Résout plusieurs alertes
   */
  async resolveBatch(ids: string[], userId: string): Promise<Alert[]> {
    const results: Alert[] = [];
    for (const id of ids) {
      try {
        const updated = await this.resolve(id, userId);
        results.push(updated);
      } catch (error) {
        console.error(`[LocalAlertAdapter] Erreur resolve ${id}:`, error);
      }
    }
    return results;
  }

  /**
   * Récupère les statistiques des alertes
   */
  async getStatistics(projectId?: string): Promise<AlertStatistics> {
    let alerts = Array.from(this.alerts.values());
    
    if (projectId) {
      alerts = alerts.filter(a => a.projectId === projectId);
    }

    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;
    const open = alerts.filter(a => a.status === 'open').length;
    const acknowledged = alerts.filter(a => a.status === 'acknowledged').length;
    const resolved = alerts.filter(a => a.status === 'resolved' || a.status === 'closed').length;

    // Calcul du temps moyen de résolution (simulé)
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'closed');
    let totalResolutionTime = 0;
    for (const alert of resolvedAlerts) {
      if (alert.resolvedAt) {
        const created = new Date(alert.createdAt).getTime();
        const resolved = new Date(alert.resolvedAt).getTime();
        totalResolutionTime += (resolved - created) / (1000 * 60 * 60); // en heures
      }
    }
    const avgResolutionTime = resolvedAlerts.length > 0 
      ? Math.round(totalResolutionTime / resolvedAlerts.length) 
      : 0;

    return {
      total,
      critical,
      high,
      medium,
      low,
      open,
      acknowledged,
      resolved,
      pendingActions: open + acknowledged,
      activeRisks: alerts.filter(a => a.type === 'risk' && a.status === 'open').length,
      overdueTasks: alerts.filter(a => 
        a.deadline && 
        new Date(a.deadline) < new Date() && 
        a.status !== 'resolved' && 
        a.status !== 'closed'
      ).length,
      avgResolutionTime,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  }

  /**
   * Compte le nombre d'alertes
   */
  async count(filters?: AlertFilter): Promise<number> {
    const alerts = await this.find(filters);
    return alerts.length;
  }

  /**
   * Vérifie si une alerte existe
   */
  async exists(id: string): Promise<boolean> {
    return this.alerts.has(id);
  }

  /**
   * Supprime toutes les alertes d'un projet
   */
  async deleteByProjectId(projectId: string): Promise<number> {
    const toDelete = Array.from(this.alerts.values()).filter(
      a => a.projectId === projectId
    );
    for (const alert of toDelete) {
      this.alerts.delete(alert.id);
    }
    this.saveToStorage();
    return toDelete.length;
  }

  // ============================================================
  // Additional Utility Methods
  // ============================================================

  /**
   * Retourne un résumé des alertes
   */
  getSummary(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const alert of alerts) {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;
    }

    return {
      total: alerts.length,
      byType,
      bySeverity,
      byStatus
    };
  }

  /**
   * Supprime toutes les alertes
   */
  async deleteAll(): Promise<void> {
    this.alerts.clear();
    this.saveToStorage();
  }

  /**
   * Sauvegarde plusieurs alertes
   */
  async saveAll(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      this.alerts.set(alert.id, alert);
    }
    this.saveToStorage();
  }
}

// ===== Factory =====
export function createLocalAlertAdapter(): LocalAlertAdapter {
  return new LocalAlertAdapter();
}