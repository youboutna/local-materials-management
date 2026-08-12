// ============================================================
// src/domain/repositories/IProjectAlertRepository.ts
// ============================================================
/**
 * Project Alert Repository Interface (Port)
 * Pure business logic - NO external dependencies
 */

import { AlertSeverity, AlertType, Alert } from '@/domain/entities/Alert';

export interface IProjectAlertRepository {
  /**
   * Récupère toutes les alertes
   */
  findAll(): Promise<Alert[]>;
  
  /**
   * Récupère une alerte par son ID
   */
  findById(id: string): Promise<Alert | null>;
  
  /**
   * Récupère les alertes par type
   */
  findByType(type: AlertType): Promise<Alert[]>;
  
  /**
   * Récupère les alertes par sévérité
   */
  findBySeverity(severity: AlertSeverity): Promise<Alert[]>;
  
  /**
   * Récupère les alertes ouvertes
   */
  findOpen(): Promise<Alert[]>;
  
  /**
   * Sauvegarde une alerte
   */
  save(alert: Alert): Promise<void>;
  
  /**
   * Sauvegarde plusieurs alertes
   */
  saveAll(alerts: Alert[]): Promise<void>;
  
  /**
   * Supprime une alerte
   */
  delete(id: string): Promise<void>;
}