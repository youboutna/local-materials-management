/**
 * IUserRoleRepository Interface
 * Port pour la gestion des rôles utilisateur
 * Architecture hexagonale pure - aucune dépendance externe
 */

import { UserRole, SomelecRole, UserRoleStatus } from '../entities/UserRoleSomelec';

export interface AssignRoleOptions {
  assignedBy?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface RoleSearchCriteria {
  userId?: string;
  roleName?: SomelecRole;
  status?: UserRoleStatus;
  assignedBy?: string;
  assignedAfter?: Date;
  assignedBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface RoleStatistics {
  totalRoles: number;
  activeRoles: number;
  expiredRoles: number;
  revokedRoles: number;
  rolesByType: Record<SomelecRole, number>;
  recentAssignments: UserRole[];
}

export interface IUserRoleRepository {
  /**
   * Assigne un rôle à un utilisateur
   */
  assignRole(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<UserRole>;

  /**
   * Retire un rôle d'un utilisateur
   */
  revokeRole(userId: string, roleName: string, revokedBy?: string): Promise<void>;

  /**
   * Récupère tous les rôles d'un utilisateur
   */
  getUserRoles(userId: string): Promise<UserRole[]>;

  /**
   * Récupère les rôles actifs d'un utilisateur
   */
  getActiveUserRoles(userId: string): Promise<UserRole[]>;

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   */
  hasRole(userId: string, roleName: SomelecRole): Promise<boolean>;

  /**
   * Vérifie si un utilisateur a au moins un des rôles spécifiés
   */
  hasAnyRole(userId: string, roleNames: SomelecRole[]): Promise<boolean>;

  /**
   * Récupère tous les utilisateurs ayant un rôle spécifique
   */
  getUsersByRole(roleName: SomelecRole, includeInactive?: boolean): Promise<UserRole[]>;

  /**
   * Récupère tous les rôles selon des critères de recherche
   */
  searchRoles(criteria: RoleSearchCriteria): Promise<UserRole[]>;

  /**
   * Compte le nombre de rôles selon des critères
   */
  countRoles(criteria: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<number>;

  /**
   * Met à jour le statut d'un rôle
   */
  updateRoleStatus(roleId: string, status: UserRoleStatus): Promise<void>;

  /**
   * Prolonge la date d'expiration d'un rôle
   */
  extendRoleExpiry(roleId: string, newExpiryDate: Date): Promise<void>;

  /**
   * Récupère les statistiques sur les rôles
   */
  getRoleStatistics(criteria?: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<RoleStatistics>;

  /**
   * Nettoie les rôles expirés
   */
  cleanupExpiredRoles(): Promise<number>;

  /**
   * Vérifie si une combinaison utilisateur/rôle existe déjà
   */
  roleExists(userId: string, roleName: SomelecRole): Promise<boolean>;

  /**
   * Récupère l'historique des changements de rôle pour un utilisateur
   */
  getRoleHistory(userId: string): Promise<UserRole[]>;

  /**
   * Exporte les rôles au format CSV
   */
  exportRoles(criteria?: RoleSearchCriteria): Promise<string>;

  /**
   * Importe les rôles depuis un fichier CSV
   */
  importRoles(csvData: string): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }>;

  /**
   * Valide une configuration de rôle
   */
  validateRoleConfiguration(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}
