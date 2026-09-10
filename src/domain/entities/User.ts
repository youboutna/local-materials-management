/**
 * User Entity
 * Représente un utilisateur complet dans le domaine SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 * Centralise les concepts de rôle via UserRoleEntity (riche) et SomelecRole (alias)
 */

import { UserProfile } from './UserProfile';
import { ENUM_LABELS, type EnumLabel } from '@/config/referentials/i18n/enum-labels.referential';

/**
 * Alias pour la compatibilité avec l'existant.
 * Reste permissif (string) car la table user_roles n'a pas de CHECK sur role_name.
 *
 * ⚠️ La priorité officielle des rôles est définie dans ROLE_PRIORITY (ci-dessous)
 * et doit rester synchronisée avec UnifiedAuthService.ROLE_PRIORITY.
 */
export type SomelecRole = string;

/**
 * Statuts d'un rôle utilisateur
 *
 * ⚠️ DOIT être aligné sur le CHECK constraint de public.user_roles :
 *   CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'inactive'::text]))
 *
 * Note métier : 'revoked' est un statut métier côté domaine.
 * Il est persisté en base sous la valeur 'inactive' (voir SupabaseUserRoleAdapter).
 */
export enum UserRoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  /** Statut métier : persisté en base sous 'inactive' */
  REVOKED = 'inactive',
}

/**
 * Valeurs valides en base (aligné sur le CHECK SQL)
 */
export const USER_ROLE_STATUS_DB_VALUES: readonly string[] = [
  'active',
  'pending',
  'inactive',
] as const;

/**
 * Set des statuts valides côté domaine
 */
const VALID_DOMAIN_STATUSES = new Set<string>(Object.values(UserRoleStatus));

// ────────────────────────────────────────────────────────────
// UserRoleEntity – instance d'un rôle attribué à un utilisateur
// ────────────────────────────────────────────────────────────

export interface UserRoleEntityProps {
  id: string;
  userId: string;
  roleName: string;
  status?: UserRoleStatus;
  assignedAt?: Date;
  assignedBy?: string;
  revokedAt?: Date;
  expiresAt?: Date;
}

export class UserRoleEntity {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _roleName: string;
  private _status: UserRoleStatus;
  private readonly _assignedAt: Date;
  private readonly _assignedBy?: string;
  private _revokedAt?: Date;
  private _expiresAt?: Date;

  constructor(
    id: string,
    userId: string,
    roleName: string,
    status: UserRoleStatus = UserRoleStatus.ACTIVE,
    assignedAt: Date = new Date(),
    assignedBy?: string,
    revokedAt?: Date,
    expiresAt?: Date
  ) {
    this._id = id;
    this._userId = userId;
    this._roleName = roleName;
    this._status = status;
    this._assignedAt = new Date(assignedAt);
    this._assignedBy = assignedBy;
    this._revokedAt = revokedAt ? new Date(revokedAt) : undefined;
    this._expiresAt = expiresAt ? new Date(expiresAt) : undefined;
  }

  static create(props: UserRoleEntityProps): UserRoleEntity {
    return new UserRoleEntity(
      props.id,
      props.userId,
      props.roleName,
      props.status || UserRoleStatus.ACTIVE,
      props.assignedAt || new Date(),
      props.assignedBy,
      props.revokedAt,
      props.expiresAt
    );
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get roleName(): string { return this._roleName; }
  get status(): UserRoleStatus { return this._status; }
  get assignedAt(): Date { return new Date(this._assignedAt); }
  get assignedBy(): string | undefined { return this._assignedBy; }
  get revokedAt(): Date | undefined {
    return this._revokedAt ? new Date(this._revokedAt) : undefined;
  }
  get expiresAt(): Date | undefined {
    return this._expiresAt ? new Date(this._expiresAt) : undefined;
  }

  /**
   * Rôle actif : statut ACTIVE, non expiré, non révoqué
   */
  isActive(): boolean {
    return (
      this._status === UserRoleStatus.ACTIVE &&
      !this.isExpired() &&
      !this.isRevoked()
    );
  }

  isExpired(): boolean {
    return this._expiresAt ? new Date() > this._expiresAt : false;
  }

  /**
   * Révoqué si statut REVOKED OU revokedAt défini
   */
  isRevoked(): boolean {
    return this._status === UserRoleStatus.REVOKED || this._revokedAt !== undefined;
  }

  canBeUsed(): boolean {
    return this.isActive();
  }

  revoke(): void {
    if (this._status === UserRoleStatus.REVOKED) {
      throw new Error('Role is already revoked');
    }
    this._status = UserRoleStatus.REVOKED;
    this._revokedAt = new Date();
  }

  reactivate(): void {
    if (
      this._status !== UserRoleStatus.INACTIVE &&
      this._status !== UserRoleStatus.REVOKED
    ) {
      throw new Error('Cannot reactivate a role that is not inactive or revoked');
    }
    this._status = UserRoleStatus.ACTIVE;
    this._revokedAt = undefined;
  }

  deactivate(): void {
    if (this._status === UserRoleStatus.INACTIVE) {
      throw new Error('Role is already inactive');
    }
    this._status = UserRoleStatus.INACTIVE;
  }

  extendExpiry(newExpiryDate: Date): void {
    if (newExpiryDate <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }
    this._expiresAt = new Date(newExpiryDate);
  }

  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._userId.length > 0 &&
      this._roleName.length > 0 &&
      VALID_DOMAIN_STATUSES.has(this._status)
    );
  }

  equals(other: UserRoleEntity): boolean {
    return (
      this._id === other._id &&
      this._userId === other._userId &&
      this._roleName === other._roleName
    );
  }
}

// ────────────────────────────────────────────────────────────
// Priorité des rôles (source unique de vérité)
// ────────────────────────────────────────────────────────────

/**
 * Priorité des rôles (identique à UnifiedAuthService.ROLE_PRIORITY)
 * Utilisée pour déterminer le rôle principal
 */
export const ROLE_PRIORITY: Readonly<Record<string, number>> = {
  super_admin: 100,
  admin: 90,
  director: 80,
  manager: 70,
  project_manager: 60,
  finance_manager: 55,
  engineering_consultant: 50,
  consultant: 45,
  supervisor: 40,
  inspector: 40,
  supplier: 30,
  worker: 20,
  agent: 10,
  user: 0,
} as const;

// ────────────────────────────────────────────────────────────
// User Entity
// ────────────────────────────────────────────────────────────

export class User {
  private _id: string;
  private _email: string;
  private _fullName: string;
  private _phone?: string;
  private _nationalId?: string;
  private _avatarUrl?: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLogin?: Date;
  private _userRoles: UserRoleEntity[];
  private _profile?: UserProfile;

  constructor(
    id: string,
    email: string,
    fullName: string,
    phone?: string,
    nationalId?: string,
    avatarUrl?: string,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    lastLogin?: Date,
    userRoles: UserRoleEntity[] = [],
    profile?: UserProfile
  ) {
    this._id = this.validateId(id);
    this._email = this.validateEmail(email);
    this._fullName = fullName.trim();
    this._phone = phone?.trim();
    this._nationalId = nationalId?.trim();
    this._avatarUrl = avatarUrl?.trim();
    this._isActive = isActive;
    this._createdAt = new Date(createdAt);
    this._updatedAt = new Date(updatedAt);
    this._lastLogin = lastLogin ? new Date(lastLogin) : undefined;
    this._userRoles = userRoles;
    this._profile = profile;
  }

  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get fullName(): string { return this._fullName; }
  get phone(): string | undefined { return this._phone; }
  get nationalId(): string | undefined { return this._nationalId; }
  get avatarUrl(): string | undefined { return this._avatarUrl; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }
  get lastLogin(): Date | undefined {
    return this._lastLogin ? new Date(this._lastLogin) : undefined;
  }
  get userRoles(): UserRoleEntity[] { return this._userRoles; }
  get profile(): UserProfile | undefined { return this._profile; }

  /**
   * Rôle principal (le premier actif selon ROLE_PRIORITY)
   * Retourne 'user' si aucun rôle actif
   */
  get primaryRole(): string {
    const activeRoles = this._userRoles.filter((r) => r.isActive());
    if (activeRoles.length === 0) return 'user';

    return activeRoles.reduce((a, b) =>
      (ROLE_PRIORITY[a.roleName] || 0) > (ROLE_PRIORITY[b.roleName] || 0) ? a : b
    ).roleName;
  }

  hasRole(roleName: string): boolean {
    return this._userRoles.some((r) => r.roleName === roleName && r.isActive());
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((r) => this.hasRole(r));
  }

  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }

  isDirector(): boolean { return this.hasRole('director'); }
  isManager(): boolean { return this.hasRole('manager'); }
  isSupplier(): boolean { return this.hasRole('supplier'); }

  canAccessDashboard(): boolean {
    return this.hasAnyRole(['admin', 'super_admin', 'director', 'manager']);
  }

  canManageProjects(): boolean {
    return this.hasAnyRole([
      'admin',
      'super_admin',
      'director',
      'manager',
      'project_manager',
    ]);
  }

  updateFullName(newFullName: string): void { this._fullName = newFullName.trim(); }
  updatePhone(newPhone?: string): void { this._phone = newPhone?.trim(); }
  updateEmail(newEmail: string): void { this._email = this.validateEmail(newEmail); }
  updateAvatar(newAvatarUrl?: string): void { this._avatarUrl = newAvatarUrl?.trim(); }
  activate(): void { this._isActive = true; }
  deactivate(): void { this._isActive = false; }
  updateLastLogin(): void { this._lastLogin = new Date(); }

  addRole(role: UserRoleEntity): void {
    if (!this._userRoles.some((r) => r.id === role.id)) {
      this._userRoles.push(role);
    }
  }

  removeRole(roleId: string): void {
    this._userRoles = this._userRoles.filter((r) => r.id !== roleId);
  }

  setProfile(profile: UserProfile): void { this._profile = profile; }

  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._email.includes('@') &&
      this._fullName.length > 0 &&
      this._userRoles.every((r) => r.validate())
    );
  }

  static create(
    id: string,
    email: string,
    fullName: string,
    phone?: string,
    nationalId?: string,
    avatarUrl?: string
  ): User {
    return new User(id, email, fullName, phone, nationalId, avatarUrl);
  }

  private validateId(id: string): string {
    if (!id || id.trim().length === 0) throw new Error('User ID is required');
    return id;
  }

  private validateEmail(email: string): string {
    if (!email || !email.includes('@')) throw new Error('Invalid email');
    return email;
  }
}

/** Libellés multilingues de UserRoleStatus. */
export const USER_ROLE_STATUS_LABELS: Readonly<Record<UserRoleStatus, EnumLabel>> =
  ENUM_LABELS.UserRoleStatus as Readonly<Record<UserRoleStatus, EnumLabel>>;