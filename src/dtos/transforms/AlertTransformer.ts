// ============================================================
// src/dtos/transforms/AlertTransformer.ts
// ============================================================
/**
 * Alert Transformer
 * Transforme entre l'entité Alert et les DTOs
 */

import {
  Alert,
  AlertEntity,
  AlertSeverity,
  AlertStatus,
  AlertType,
  AlertSource,
  AlertStatistics,
  ActionProof
} from '@/domain/entities/Alert';
import {
  AlertDTO,
  AlertStatisticsDTO,
  AlertStateDTO,
  CreateAlertData,
  UpdateAlertData,
  AlertFilter
} from '@/dtos/entities/AlertDTO';

// ===== Mapping des sévérités (UI uniquement) =====
const SEVERITY_MAP: Record<AlertSeverity, { icon: string; color: string; bgColor: string; label: string }> = {
  'critical': { 
    icon: '🚨', 
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    label: 'Critique'
  },
  'high': { 
    icon: '⚠️', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    label: 'Élevée'
  },
  'medium': { 
    icon: '📢', 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 border-yellow-200',
    label: 'Moyenne'
  },
  'low': { 
    icon: 'ℹ️', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    label: 'Basse'
  }
};

const STATUS_LABELS: Record<AlertStatus, string> = {
  'open': 'Ouvert',
  'acknowledged': 'Accusé',
  'resolved': 'Résolu',
  'closed': 'Fermé',
  'escalated': 'Escaladé'
};

// ============================================================
// Alert Transformer
// ============================================================
export class AlertTransformer {
  /**
   * Convertit une entité Alert en DTO
   */
  static toDTO(alert: Alert | AlertEntity): AlertDTO {
    const entity = alert instanceof AlertEntity ? alert.toDTO() : alert;
    const severity = SEVERITY_MAP[entity.severity] || SEVERITY_MAP['low'];
    
    const now = new Date();
    const deadline = entity.deadline ? new Date(entity.deadline) : null;
    const isOverdue = deadline ? deadline < now && entity.status !== 'resolved' && entity.status !== 'closed' : false;
    const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

    return {
      ...entity,
      displayName: entity.title,
      formattedDate: new Date(entity.timestamp || entity.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      formattedTriggerDate: new Date(entity.triggerDate || entity.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      formattedDeadline: entity.deadline ? new Date(entity.deadline).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : undefined,
      icon: severity.icon,
      color: severity.color,
      severityLabel: severity.label,
      statusLabel: STATUS_LABELS[entity.status] || entity.status,
      isOverdue,
      daysUntilDeadline
    };
  }

  /**
   * Convertit une liste d'entités en DTOs
   */
  static toDTOList(alerts: (Alert | AlertEntity)[]): AlertDTO[] {
    return alerts.map(alert => this.toDTO(alert));
  }

  /**
   * Convertit un DTO en entité Alert
   */
  static fromDTO(dto: AlertDTO): Alert {
    return {
      id: dto.id,
      type: dto.type,
      severity: dto.severity,
      title: dto.title,
      message: dto.message,
      projectId: dto.projectId,
      projectTitle: dto.projectTitle,
      relatedEntityId: dto.relatedEntityId,
      source: dto.source,
      delayDays: dto.delayDays,
      timestamp: dto.timestamp,
      triggerDate: dto.triggerDate,
      acknowledged: dto.acknowledged || false,
      acknowledgedBy: dto.acknowledgedBy,
      acknowledgedAt: dto.acknowledgedAt,
      actionRequired: dto.actionRequired || false,
      actionTaken: dto.actionTaken,
      actionTakenBy: dto.actionTakenBy,
      actionTakenAt: dto.actionTakenAt,
      escalationLevel: dto.escalationLevel || 0,
      availableActions: dto.availableActions || [],
      actionProof: dto.actionProof || [],
      deadline: dto.deadline,
      recurrence: dto.recurrence,
      status: dto.status || 'open',
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Convertit un DTO en entité avec classe
   */
  static fromDTOToEntity(dto: AlertDTO): AlertEntity {
    return AlertEntity.fromDTO(this.fromDTO(dto));
  }

  /**
   * Transforme les statistiques en DTO
   */
  static statsToDTO(stats: AlertStatistics): AlertStatisticsDTO {
    const total = stats.total || 0;
    const critical = stats.critical || 0;
    const resolved = stats.resolved || 0;
    const closed = stats.closed || 0;

    return {
      ...stats,
      formattedTotal: `${total} alerte${total > 1 ? 's' : ''}`,
      formattedAvgResolutionTime: `${stats.avgResolutionTime || 0}h`,
      criticalPercentage: total > 0 ? (critical / total) * 100 : 0,
      resolutionRate: total > 0 ? ((resolved + closed) / total) * 100 : 0
    };
  }

  /**
   * Transforme l'état complet en DTO
   */
  static stateToDTO(state: {
    alerts: Alert[];
    stats: AlertStatistics;
    lastUpdated: string;
    progress?: number;
  }): AlertStateDTO {
    return {
      alerts: this.toDTOList(state.alerts),
      stats: this.statsToDTO(state.stats),
      lastUpdated: state.lastUpdated,
      progress: state.progress
    };
  }

  /**
   * Crée une nouvelle alerte à partir des données
   */
  static createFromData(data: CreateAlertData): Alert {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}`,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      relatedEntityId: data.relatedEntityId,
      source: data.source,
      delayDays: data.delayDays,
      timestamp: new Date().toISOString(),
      triggerDate: new Date().toISOString(),
      acknowledged: false,
      actionRequired: data.actionRequired || false,
      escalationLevel: 0,
      availableActions: data.availableActions || [],
      actionProof: [],
      deadline: data.deadline,
      recurrence: data.recurrence,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Met à jour une alerte existante
   */
  static updateFromData(alert: Alert, data: UpdateAlertData): Alert {
    return {
      ...alert,
      severity: data.severity || alert.severity,
      title: data.title || alert.title,
      message: data.message || alert.message,
      acknowledged: data.acknowledged !== undefined ? data.acknowledged : alert.acknowledged,
      acknowledgedBy: data.acknowledgedBy || alert.acknowledgedBy,
      actionTaken: data.actionTaken || alert.actionTaken,
      actionTakenBy: data.actionTakenBy || alert.actionTakenBy,
      escalationLevel: data.escalationLevel !== undefined ? data.escalationLevel : alert.escalationLevel,
      availableActions: data.availableActions || alert.availableActions,
      actionProof: data.actionProof || alert.actionProof,
      deadline: data.deadline || alert.deadline,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtient l'icône pour une sévérité
   */
  static getSeverityIcon(severity: AlertSeverity): string {
    return SEVERITY_MAP[severity]?.icon || 'ℹ️';
  }

  /**
   * Obtient la couleur pour une sévérité
   */
  static getSeverityColor(severity: AlertSeverity): string {
    return SEVERITY_MAP[severity]?.color || 'text-gray-500';
  }

  /**
   * Obtient la classe CSS pour une sévérité
   */
  static getSeverityBgColor(severity: AlertSeverity): string {
    return SEVERITY_MAP[severity]?.bgColor || 'bg-gray-50 border-gray-200';
  }

  /**
   * Obtient le label d'un statut
   */
  static getStatusLabel(status: AlertStatus): string {
    return STATUS_LABELS[status] || status;
  }

  /**
   * Vérifie si une alerte nécessite une action
   */
  static requiresAction(alert: Alert | AlertDTO): boolean {
    return alert.status === 'open' || alert.status === 'acknowledged';
  }

  /**
   * Filtre les alertes actives
   */
  static filterActive(alerts: (Alert | AlertEntity)[]): Alert[] {
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        return alert.status === 'open' || alert.status === 'acknowledged';
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Filtre les alertes critiques
   */
  static filterCritical(alerts: (Alert | AlertEntity)[]): Alert[] {
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        return alert.severity === 'critical' || alert.severity === 'high';
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Filtre les alertes par type
   */
  static filterByType(alerts: (Alert | AlertEntity)[], type: AlertType): Alert[] {
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        return alert.type === type;
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Filtre les alertes par source
   */
  static filterBySource(alerts: (Alert | AlertEntity)[], source: AlertSource): Alert[] {
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        return alert.source === source;
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Filtre les alertes par statut
   */
  static filterByStatus(alerts: (Alert | AlertEntity)[], status: AlertStatus): Alert[] {
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        return alert.status === status;
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Filtre les alertes en retard
   */
  static filterOverdue(alerts: (Alert | AlertEntity)[]): Alert[] {
    const now = new Date();
    return alerts
      .filter(a => {
        const alert = a instanceof AlertEntity ? a.toDTO() : a;
        if (!alert.deadline) return false;
        if (alert.status === 'resolved' || alert.status === 'closed') return false;
        return new Date(alert.deadline) < now;
      })
      .map(a => a instanceof AlertEntity ? a.toDTO() : a);
  }

  /**
   * Applique tous les filtres
   */
  static applyFilters(
    alerts: (Alert | AlertEntity)[],
    filters: AlertFilter
  ): Alert[] {
    let result = alerts.map(a => a instanceof AlertEntity ? a.toDTO() : a);

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

    if (filters.acknowledged !== undefined) {
      result = result.filter(a => a.acknowledged === filters.acknowledged);
    }

    if (filters.projectId) {
      result = result.filter(a => a.projectId === filters.projectId);
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
   * Trie les alertes par date (plus récentes d'abord)
   */
  static sortByDate(alerts: (Alert | AlertEntity)[], ascending: boolean = false): Alert[] {
    return alerts
      .map(a => a instanceof AlertEntity ? a.toDTO() : a)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
      });
  }

  /**
   * Trie les alertes par sévérité (plus critiques d'abord)
   */
  static sortBySeverity(alerts: (Alert | AlertEntity)[]): Alert[] {
    const severityOrder: Record<AlertSeverity, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return alerts
      .map(a => a instanceof AlertEntity ? a.toDTO() : a)
      .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  }
}

// ===== Export singleton =====
export const alertTransformer = new AlertTransformer();