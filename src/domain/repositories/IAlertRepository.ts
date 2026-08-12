// ============================================================
// src/domain/repositories/IAlertRepository.ts
// ============================================================
/**
 * Alert Repository Interface (Port)
 * Pure business logic - NO external dependencies
 */

import { Alert, AlertStatistics, AlertStatus, AlertType, AlertSeverity, AlertSource } from '@/domain/entities/Alert';

// ===== Filter Interface =====
export interface AlertFilter {
  severity?: AlertSeverity;
  type?: AlertType;
  status?: AlertStatus;
  source?: AlertSource;
  projectId?: string;
  acknowledged?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// ===== Repository Interface =====
export interface IAlertRepository {
  /**
   * Crée une nouvelle alerte
   */
  create(alert: Alert): Promise<Alert>;

  /**
   * Récupère une alerte par son ID
   */
  findById(id: string): Promise<Alert | null>;

  /**
   * Récupère toutes les alertes avec filtres optionnels
   */
  find(filters?: AlertFilter): Promise<Alert[]>;

  /**
   * Récupère toutes les alertes d'un projet
   */
  findByProjectId(projectId: string): Promise<Alert[]>;

  /**
   * Récupère toutes les alertes actives (open + acknowledged)
   */
  findActive(): Promise<Alert[]>;

  /**
   * Récupère les alertes par type
   */
  findByType(type: AlertType): Promise<Alert[]>;

  /**
   * Récupère les alertes par sévérité
   */
  findBySeverity(severity: AlertSeverity): Promise<Alert[]>;

  /**
   * Récupère les alertes par source
   */
  findBySource(source: AlertSource): Promise<Alert[]>;

  /**
   * Récupère les alertes par statut
   */
  findByStatus(status: AlertStatus): Promise<Alert[]>;

  /**
   * Met à jour une alerte
   */
  update(id: string, alert: Partial<Alert>): Promise<Alert>;

  /**
   * Supprime une alerte
   */
  delete(id: string): Promise<void>;

  /**
   * Accuse réception d'une alerte
   */
  acknowledge(id: string, userId: string): Promise<Alert>;

  /**
   * Résout une alerte
   */
  resolve(id: string, userId: string): Promise<Alert>;

  /**
   * Escalade une alerte
   */
  escalate(id: string): Promise<Alert>;

  /**
   * Accuse réception de plusieurs alertes
   */
  acknowledgeBatch(ids: string[], userId: string): Promise<Alert[]>;

  /**
   * Résout plusieurs alertes
   */
  resolveBatch(ids: string[], userId: string): Promise<Alert[]>;

  /**
   * Récupère les statistiques des alertes
   */
  getStatistics(projectId?: string): Promise<AlertStatistics>;

  /**
   * Compte le nombre d'alertes
   */
  count(filters?: AlertFilter): Promise<number>;

  /**
   * Vérifie si une alerte existe
   */
  exists(id: string): Promise<boolean>;

  /**
   * Supprime toutes les alertes d'un projet
   */
  deleteByProjectId(projectId: string): Promise<number>;
}