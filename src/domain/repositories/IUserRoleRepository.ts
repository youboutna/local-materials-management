/**
 * IUserRoleRepository Interface
 * Port pour la gestion des rôles utilisateur
 * Architecture hexagonale pure - aucune dépendance externe
 * 
 * Aligné sur la table public.user_roles :
 *   - id, user_id, role_name, assigned_by, assigned_at, status, expired_at
 *   - UNIQUE(user_id, role_name)
 *   - status IN ('active', 'pending', 'inactive')
 */

import { SomelecRole, UserRoleEntity as UserRole, UserRoleStatus } from '../entities/User';

/**
 * Options d'assignation d'un rôle
 * Note : la colonne `metadata` n'existe pas encore dans la table,
 * elle est conservée pour extensibilité future (ignorée par l'adapter actuel)
 */
export interface AssignRoleOptions {
  assignedBy?: string;
  expiresAt?: Date;
  /** Réservé pour usage futur - non persisté actuellement */
  metadata?: Record<string, unknown>;
}

/**
 * Critères de recherche pour les rôles
 */
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

/**
 * Statistiques sur les rôles
 * 
 * Note sur la sémantique :
 *   - activeRoles   : status = 'active' ET (expired_at IS NULL OU expired_at > now())
 *   - expiredRoles  : expired_at < now() (indépendamment du status)
 *   - revokedRoles  : status = 'inactive'
 */
export interface RoleStatistics {
  totalRoles: number;
  activeRoles: number;
  expiredRoles: number;
  revokedRoles: number;
  rolesByType: Record<SomelecRole, number>;
  recentAssignments: UserRole[];
}

/**
 * Port de gestion des rôles utilisateur
 * Toutes les méthodes respectent la contrainte UNIQUE(user_id, role_name)
 */
export interface IUserRoleRepository {
  /**
   * Assigne un rôle à un utilisateur
   * @throws AppError si le rôle est déjà assigné (UNIQUE constraint)
   */
  assignRole(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<UserRole>;

  /**
   * Révoque un rôle (status = 'inactive', expired_at = now())
   * @param roleName - Utilise SomelecRole pour cohérence de typage
   */
  revokeRole(userId: string, roleName: SomelecRole, revokedBy?: string): Promise<void>;

  /**
   * Récupère tous les rôles d'un utilisateur (actifs + inactifs + expirés)
   */
  getUserRoles(userId: string): Promise<UserRole[]>;

  /**
   * Récupère les rôles actifs d'un utilisateur
   * Filtre : status = 'active' ET (expired_at IS NULL OR expired_at > now())
   */
  getActiveUserRoles(userId: string): Promise<UserRole[]>;

  /**
   * Vérifie si un utilisateur possède un rôle actif spécifique
   */
  hasRole(userId: string, roleName: SomelecRole): Promise<boolean>;

  /**
   * Vérifie si un utilisateur possède au moins un rôle actif parmi la liste
   */
  hasAnyRole(userId: string, roleNames: SomelecRole[]): Promise<boolean>;

  /**
   * Récupère tous les utilisateurs ayant un rôle spécifique
   * @param includeInactive - Si false, ne retourne que les rôles actifs non expirés
   */
  getUsersByRole(roleName: SomelecRole, includeInactive?: boolean): Promise<UserRole[]>;

  /**
   * Recherche des rôles selon des critères
   */
  searchRoles(criteria: RoleSearchCriteria): Promise<UserRole[]>;

  /**
   * Compte les rôles selon des critères
   */
  countRoles(criteria: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<number>;

  /**
   * Met à jour le statut d'un rôle
   * @param status - 'active' | 'pending' | 'inactive' (aligné sur CHECK constraint)
   */
  updateRoleStatus(roleId: string, status: UserRoleStatus): Promise<void>;

  /**
   * Prolonge la date d'expiration d'un rôle
   */
  extendRoleExpiry(roleId: string, newExpiryDate: Date): Promise<void>;

  /**
   * Récupère les statistiques sur les rôles
   */
  getRoleStatistics(
    criteria?: Omit<RoleSearchCriteria, 'limit' | 'offset'>
  ): Promise<RoleStatistics>;

  /**
   * Nettoie les rôles expirés en les marquant 'inactive'
   * @returns Nombre de rôles nettoyés
   */
  cleanupExpiredRoles(): Promise<number>;

  /**
   * Vérifie si une combinaison (user_id, role_name) existe déjà
   * Note : ignore le status et l'expiration
   */
  roleExists(userId: string, roleName: SomelecRole): Promise<boolean>;

  /**
   * Récupère l'historique des rôles d'un utilisateur
   * Note : dans la table actuelle, l'historique est implicite
   * (une ligne = une assignation, contrainte UNIQUE)
   */
  getRoleHistory(userId: string): Promise<UserRole[]>;

  /**
   * Exporte les rôles au format CSV
   */
  exportRoles(criteria?: RoleSearchCriteria): Promise<string>;

  /**
   * Importe les rôles depuis un contenu CSV
   * Colonnes attendues : user_id, role_name, assigned_by?, expired_at?
   */
  importRoles(csvData: string): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }>;

  /**
   * Valide une configuration de rôle avant assignation
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