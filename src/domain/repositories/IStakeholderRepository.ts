/**
 * Repository Interface: IStakeholderRepository
 * Interface pour le repository des parties prenantes
 */

import { Stakeholder } from '@/domain/entities/Stakeholder';

export interface IStakeholderRepository {
  /**
   * Sauvegarde une partie prenante
   */
  save(stakeholder: Stakeholder): Promise<Stakeholder>;

  /**
   * Met à jour une partie prenante
   */
  update(id: string, data: Partial<any>): Promise<Stakeholder>;

  /**
   * Récupère une partie prenante par son ID
   */
  findById(id: string): Promise<Stakeholder | null>;

  /**
   * Récupère toutes les parties prenantes d'un projet
   */
  findByProjectId(projectId: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes par type
   */
  findByType(type: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes par rôle
   */
  findByRole(role: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes actives d'un projet
   */
  findActiveByProjectId(projectId: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes internes d'un projet
   */
  findInternalByProjectId(projectId: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes externes d'un projet
   */
  findExternalByProjectId(projectId: string): Promise<Stakeholder[]>;

  /**
   * Récupère les parties prenantes principales d'un projet
   */
  findPrimaryByProjectId(projectId: string): Promise<Stakeholder[]>;

  /**
   * Supprime une partie prenante
   */
  delete(id: string): Promise<void>;

  /**
   * Vérifie si une partie prenante existe
   */
  exists(id: string): Promise<boolean>;

  /**
   * Compte les parties prenantes d'un projet
   */
  countByProjectId(projectId: string): Promise<number>;

  /**
   * Compte les parties prenantes par type
   */
  countByType(type: string): Promise<number>;

  /**
   * Met à jour uniquement le rôle métier (`stakeholder_type`) d'une partie prenante.
   * Utilisé pour la désignation / révocation du consultant projet.
   */
  setBusinessRole?(id: string, businessRole: string): Promise<Stakeholder>;

  /**
   * Retourne les affectations correspondant à des rôles métier donnés.
   */
  findAssignmentsByBusinessRoles?(businessRoles: string[]): Promise<StakeholderAssignment[]>;
}

/** Affectation brute d'une partie prenante (projection légère). */
export interface StakeholderAssignment {
  id: string;
  projectId: string;
  businessRole: string;
  entityType: string;
  employeeId: string | null;
  supplierId: string | null;
  name: string | null;
}

