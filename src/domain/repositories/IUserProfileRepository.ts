/**
 * IUserProfileRepository Interface
 * Port pour la gestion des profils utilisateur
 * Architecture hexagonale pure - aucune dépendance externe
 */

import { UserProfile, ProfileStatus } from '../entities/UserProfile';

export interface CreateProfileData {
  userId: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  status: ProfileStatus;
  lastLoginAt?: Date;
  department?: string;
  position?: string;
  location?: string;
}

export interface ProfileSearchCriteria {
  fullName?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  department?: string;
  position?: string;
  location?: string;
  status?: ProfileStatus;
  isAdmin?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface ProfileStatistics {
  totalProfiles: number;
  activeProfiles: number;
  inactiveProfiles: number;
  suspendedProfiles: number;
  pendingVerification: number;
  adminProfiles: number;
  profilesByDepartment: Record<string, number>;
  profilesByPosition: Record<string, number>;
  profilesByLocation: Record<string, number>;
  recentRegistrations: UserProfile[];
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  department?: string;
  position?: string;
  location?: string;
  lastLogin?: Date;
}

export interface IUserProfileRepository {
  /**
   * Crée un nouveau profil utilisateur
   */
  createProfile(profileData: CreateProfileData): Promise<UserProfile>;

  /**
   * Récupère un profil par son ID
   */
  getProfileById(id: string): Promise<UserProfile | null>;

  /**
   * Récupère un profil par l'ID utilisateur
   */
  getProfileByUserId(userId: string): Promise<UserProfile | null>;

  /**
   * Met à jour un profil utilisateur
   */
  updateProfile(id: string, updateData: UpdateProfileData): Promise<UserProfile>;

  /**
   * Supprime un profil utilisateur
   */
  deleteProfile(id: string): Promise<void>;

  /**
   * Recherche des profils selon des critères
   */
  searchProfiles(criteria: ProfileSearchCriteria): Promise<UserProfile[]>;

  /**
   * Compte le nombre de profils selon des critères
   */
  countProfiles(criteria: Omit<ProfileSearchCriteria, 'limit' | 'offset'>): Promise<number>;

  /**
   * Met à jour le statut d'un profil
   */
  updateProfileStatus(id: string, status: ProfileStatus): Promise<void>;

  /**
   * Active/désactive les privilèges admin d'un profil
   */
  updateAdminPrivileges(id: string, isAdmin: boolean): Promise<void>;

  /**
   * Met à jour la date de dernière connexion
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Vérifie si un profil existe pour un utilisateur
   */
  profileExists(userId: string): Promise<boolean>;

  /**
   * Récupère les statistiques sur les profils
   */
  getProfileStatistics(criteria?: Omit<ProfileSearchCriteria, 'limit' | 'offset'>): Promise<ProfileStatistics>;

  /**
   * Récupère tous les profils administrateurs
   */
  getAdminProfiles(): Promise<UserProfile[]>;

  /**
   * Récupère les profils par département
   */
  getProfilesByDepartment(department: string): Promise<UserProfile[]>;

  /**
   * Récupère les profils par position
   */
  getProfilesByPosition(position: string): Promise<UserProfile[]>;

  /**
   * Récupère les profils par lieu
   */
  getProfilesByLocation(location: string): Promise<UserProfile[]>;

  /**
   * Valide les données d'un profil
   */
  validateProfileData(profileData: UpdateProfileData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Exporte les profils au format CSV
   */
  exportProfiles(criteria?: ProfileSearchCriteria): Promise<string>;

  /**
   * Importe les profils depuis un fichier CSV
   */
  importProfiles(csvData: string): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }>;

  /**
   * Synchronise un profil avec les données d'authentification
   */
  syncWithAuthData(userId: string, authData: {
    email?: string;
    lastLoginAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<UserProfile>;

  /**
   * Nettoie les profils inactifs depuis une certaine date
   */
  cleanupInactiveProfiles(since: Date): Promise<number>;

  /**
   * Recherche des profils par texte plein
   */
  searchProfilesByText(query: string, limit?: number): Promise<UserProfile[]>;

  /**
   * Vérifie si un email est déjà utilisé dans les profils
   */
  isEmailTaken(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Vérifie si un numéro de téléphone est déjà utilisé
   */
  isPhoneTaken(phone: string, excludeId?: string): Promise<boolean>;

  /**
   * Vérifie si un numéro d'identité nationale est déjà utilisé
   */
  isNationalIdTaken(nationalId: string, excludeId?: string): Promise<boolean>;
}
