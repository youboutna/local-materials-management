/**
 * Monitoring Alert Service - Hexagonal Architecture
 * Business logic for monitoring alerts management
 * 
 * Pattern: Hook → Service → Adapter → Supabase
 */

import type { AlertData } from '@/dtos/entities/AlertDTO';
import {
    alertCategoryOf,
    alertSeverityFromNotification,
    canonicalAlertType,
    isAlertWorthyNotificationType,
    resolveAlertSeverity,
} from '@/config/referentials/notifications/alerts.referential';
import type { INotificationRepository, NotificationData } from '@/domain/repositories/INotificationRepository';
import type { IDerivedAlertRepository } from '@/domain/repositories/IDerivedAlertRepository';
import { SupabaseDerivedAlertAdapter } from '@/infrastructure/adapters/supabase/SupabaseDerivedAlertAdapter';
import { isDerivedAlertId, toDerivedAlerts, type DerivedThresholdMap } from '@/application/services/alerts/DerivedAlertEngine';
import { resolveDerivedThresholds } from '@/application/services/alerts/AlertThresholdResolver';
import { getEscalationThresholdService } from '@/application/services/EscalationThresholdService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getProjectService } from '@/application/services/ProjectService';

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
    projectId: dto.projectId || '',
    phaseId: dto.phaseId || undefined,
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
    status: dto.status as AlertData['status'],
    escalationLevel: dto.escalationLevel,
    availableActions: dto.assignedActions,
    actionProof: [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? dto.createdAt,
  };
}

function mapAlertType(dbType: string): AlertData['type'] {
  // Résolution via le référentiel (code canonique + alias historiques),
  // sans fallback trompeur vers 'project_delay'.
  return canonicalAlertType(dbType) as AlertData['type'];
}

function mapPriorityToSeverity(priority: string): AlertData['severity'] {
  return resolveAlertSeverity(priority).code as AlertData['severity'];
}

/**
 * Notification métier → alerte opérationnelle.
 * Garantit la cohérence « N notifications d'inspection » ↔ « N alertes inspection ».
 */
function transformNotificationToAlertData(n: NotificationData): AlertData {
  const metadata = (n.metadata ?? {}) as Record<string, unknown>;
  const projectId =
    (metadata.project_id as string | undefined) ??
    (metadata.projectId as string | undefined) ??
    '';
  const phaseId =
    (metadata.phase_id as string | undefined) ??
    (metadata.phaseId as string | undefined) ??
    undefined;
  const priority = (metadata.priority as string | undefined) ?? n.priority ?? null;
  const createdAt = n.createdAt ?? new Date().toISOString();

  return {
    id: n.id,
    type: canonicalAlertType(n.type) as AlertData['type'],
    severity: alertSeverityFromNotification(n.type, priority) as AlertData['severity'],
    title: n.title,
    message: n.message ?? '',
    projectId,
    phaseId,
    relatedEntityId: (metadata.related_id as string | undefined) ?? n.id,
    source: 'notification',
    timestamp: createdAt,
    triggerDate: createdAt,
    acknowledged: Boolean(n.read),
    actionRequired: !n.read,
    status: (n.read ? 'acknowledged' : 'open') as AlertData['status'],
    escalationLevel: Number(metadata.escalation_level ?? 0) || 0,
    availableActions: [],
    actionProof: [],
    createdAt,
    updatedAt: n.updatedAt ?? createdAt,
  };
}

/** Identifiants d'alertes dérivées déjà matérialisées en base (évite les doublons). */
function collectMaterializedDerivedIds(dtos: MonitoringAlertDTO[]): Set<string> {
  const ids = new Set<string>();
  dtos.forEach((dto) => {
    const derivedId = (dto.metadata as Record<string, unknown> | null | undefined)?.derived_id;
    if (typeof derivedId === 'string') ids.add(derivedId);
  });
  return ids;
}

export class MonitoringAlertService {
  private repository: IMonitoringAlertRepository;
  private notificationRepository?: INotificationRepository;
  private derivedRepository?: IDerivedAlertRepository;

  constructor(
    repository?: IMonitoringAlertRepository,
    notificationRepository?: INotificationRepository,
    derivedRepository?: IDerivedAlertRepository,
  ) {
    this.repository = repository || new SupabaseMonitoringAlertAdapter();
    this.notificationRepository = notificationRepository;
    this.derivedRepository = derivedRepository;
  }

  private getDerivedRepository(): IDerivedAlertRepository {
    if (!this.derivedRepository) {
      this.derivedRepository = new SupabaseDerivedAlertAdapter();
    }
    return this.derivedRepository;
  }

  /**
   * Seuils de sévérité administrés dans `/settings` (mise en cache courte pour
   * éviter un aller-retour par appel du tableau de bord).
   */
  private thresholdCache: { at: number; map: DerivedThresholdMap } | null = null;

  private async getDerivedThresholds(): Promise<DerivedThresholdMap> {
    const TTL = 60_000;
    if (this.thresholdCache && Date.now() - this.thresholdCache.at < TTL) {
      return this.thresholdCache.map;
    }
    try {
      const rows = await getEscalationThresholdService().getAll();
      const map = resolveDerivedThresholds(rows);
      this.thresholdCache = { at: Date.now(), map };
      return map;
    } catch (error) {
      console.warn('MonitoringAlertService: escalation thresholds unavailable', error);
      return {};
    }
  }

  /** Alertes dérivées de l'état réel du projet (retards, échéances, blocages). */
  private async getDerivedAlerts(projectId?: string): Promise<AlertData[]> {
    try {
      const repo = this.getDerivedRepository();
      const [signals, thresholds] = await Promise.all([
        projectId ? repo.findSignalsByProject(projectId) : repo.findSignals(),
        this.getDerivedThresholds(),
      ]);
      return toDerivedAlerts(signals, 'fr', Date.now(), thresholds);
    } catch (error) {
      console.warn('MonitoringAlertService: derived alerts unavailable', error);
      return [];
    }
  }

  private getNotificationRepository(): INotificationRepository | undefined {
    if (!this.notificationRepository) {
      try {
        this.notificationRepository = RepositoryFactory.getNotificationRepository();
      } catch (error) {
        console.warn('MonitoringAlertService: notification repository unavailable', error);
      }
    }
    return this.notificationRepository;
  }


  /** Alertes issues des notifications métier (inspection, retard, paiement...). */
  private async getNotificationAlerts(): Promise<AlertData[]> {
    const repo = this.getNotificationRepository();
    if (!repo?.listAllNotifications) return [];

    const { notifications, error } = await repo.listAllNotifications(200);
    if (error) {
      console.warn('MonitoringAlertService: notification alerts unavailable', error);
      return [];
    }

    return (notifications || [])
      .filter((n) => isAlertWorthyNotificationType(n.type))
      .map(transformNotificationToAlertData);
  }

  /**
   * Get all monitoring alerts as AlertData for UI
   * (alertes projet + notifications métier + alertes dérivées de l'état réel,
   * dédupliquées).
   */
  async getAllAlerts(): Promise<AlertData[]> {
    const [dtos, notificationAlerts, derivedAlerts, projects] = await Promise.all([
      this.repository.findAll(),
      this.getNotificationAlerts(),
      this.getDerivedAlerts(),
      getProjectService().getAllProjects(),
    ]);

    const alerts = dtos.map(transformToAlertData);
    const known = new Set(alerts.map((a) => a.id));
    const materialized = collectMaterializedDerivedIds(dtos);
    const merged = [
      ...alerts,
      ...notificationAlerts.filter((a) => !known.has(a.id)),
      ...derivedAlerts.filter((a) => !known.has(a.id) && !materialized.has(a.id)),
    ];

    const projectTitles = new Map(projects.map((project) => [project.id, project.title]));
    return merged.map((alert) => ({
      ...alert,
      projectTitle: alert.projectId ? projectTitles.get(alert.projectId) : undefined,
    })).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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
      projectId: data.projectId,
      phaseId: data.phaseId ?? null,
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
   * Matérialise une alerte dérivée en alerte persistée (traçabilité de l'action).
   * Retourne l'identifiant persisté, ou null si le signal n'existe plus.
   */
  private async materializeDerivedAlert(derivedId: string): Promise<string | null> {
    const derived = await this.getDerivedAlerts();
    const alert = derived.find((a) => a.id === derivedId);
    if (!alert) return null;

    const created = await this.repository.create({
      title: alert.title,
      alertType: alert.type,
      priority: alert.severity,
      description: alert.message,
      projectId: alert.projectId || undefined,
      phaseId: alert.phaseId ?? null,
      source: alert.source,
      metadata: { ...(alert.metadata ?? {}), derived_id: derivedId },
    });
    return created.id;
  }

  /**
   * Acknowledge an alert
   * Repli notification : une alerte issue d'une notification est acquittée
   * en marquant la notification comme lue (même identifiant métier).
   * Alerte dérivée : elle est d'abord matérialisée en base pour tracer l'action.
   */
  async acknowledgeAlert(id: string): Promise<void> {
    if (isDerivedAlertId(id)) {
      const persistedId = await this.materializeDerivedAlert(id);
      if (persistedId) await this.repository.acknowledge(persistedId);
      return;
    }
    try {
      await this.repository.acknowledge(id);
    } catch (error) {
      const repo = this.getNotificationRepository();
      if (!repo) throw error;
      const { error: readError } = await repo.markAsRead(id);
      if (readError) throw error;
    }
  }


  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, resolutionNotes?: string): Promise<void> {
    if (isDerivedAlertId(id)) {
      const persistedId = await this.materializeDerivedAlert(id);
      if (persistedId) await this.repository.resolve(persistedId, resolutionNotes);
      return;
    }
    try {
      await this.repository.resolve(id, resolutionNotes);
    } catch (error) {
      const repo = this.getNotificationRepository();
      if (!repo) throw error;
      const { error: readError } = await repo.markAsRead(id);
      if (readError) throw error;
    }
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
    if (!type || type === 'all') return alerts;
    return alerts.filter((alert) => alertCategoryOf(alert.type) === type);
  }

  /** Alertes contextualisées projet (alertes projet + notifications + dérivées) */
  async getAlertsByProject(projectId: string): Promise<AlertData[]> {
    if (!projectId) return [];
    const [dtos, notificationAlerts, derivedAlerts] = await Promise.all([
      this.repository.findByProjectId(projectId),
      this.getNotificationAlerts(),
      this.getDerivedAlerts(projectId),
    ]);
    const alerts = dtos.map(transformToAlertData);
    const known = new Set(alerts.map((a) => a.id));
    const materialized = collectMaterializedDerivedIds(dtos);
    return [
      ...alerts,
      ...notificationAlerts.filter((a) => a.projectId === projectId && !known.has(a.id)),
      ...derivedAlerts.filter((a) => !known.has(a.id) && !materialized.has(a.id)),
    ];
  }



  /** Alertes contextualisées phase */
  async getAlertsByPhase(projectId: string, phaseId: string): Promise<AlertData[]> {
    const alerts = await this.getAlertsByProject(projectId);
    return phaseId ? alerts.filter((a) => a.phaseId === phaseId) : alerts;
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
