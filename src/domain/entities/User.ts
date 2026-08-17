/**
 * User Entity
 * Représente un utilisateur complet dans le domaine SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 * Centralise les concepts de rôle via UserRoleEntity (riche) et SomelecRole (alias)
 */

import { UserProfile } from './UserProfile';

// Alias pour la compatibilité avec l'existant – il s'agit du nom du rôle
export type SomelecRole = string; // ou enum restreint si souhaité

export enum UserRoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

// UserRoleEntity – instance d'un rôle attribué à un utilisateur
export interface UserRoleEntityProps {
  id: string;
  userId: string;
  roleName: string; // correspond au nom du rôle (ex: 'admin', 'supplier')
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
  get revokedAt(): Date | undefined { return this._revokedAt ? new Date(this._revokedAt) : undefined; }
  get expiresAt(): Date | undefined { return this._expiresAt ? new Date(this._expiresAt) : undefined; }

  isActive(): boolean { return this._status === UserRoleStatus.ACTIVE && !this.isExpired() && !this.isRevoked(); }
  isExpired(): boolean { return this._expiresAt ? new Date() > this._expiresAt : false; }
  isRevoked(): boolean { return this._status === UserRoleStatus.REVOKED || (this._revokedAt !== undefined && new Date() > this._revokedAt); }
  canBeUsed(): boolean { return this.isActive() && !this.isExpired() && !this.isRevoked(); }

  revoke(): void {
    if (this._status === UserRoleStatus.REVOKED) throw new Error('Role is already revoked');
    this._status = UserRoleStatus.REVOKED;
    this._revokedAt = new Date();
  }
  reactivate(): void {
    if (this._status !== UserRoleStatus.INACTIVE && this._status !== UserRoleStatus.REVOKED) throw new Error('Cannot reactivate');
    this._status = UserRoleStatus.ACTIVE;
    this._revokedAt = undefined;
  }
  deactivate(): void {
    if (this._status === UserRoleStatus.INACTIVE) throw new Error('Already inactive');
    this._status = UserRoleStatus.INACTIVE;
  }
  extendExpiry(newExpiryDate: Date): void {
    if (newExpiryDate <= new Date()) throw new Error('Expiry date must be in the future');
    this._expiresAt = new Date(newExpiryDate);
  }

  validate(): boolean {
    return this._id.length > 0 && this._userId.length > 0 && this._roleName.length > 0 && Object.values(UserRoleStatus).includes(this._status);
  }

  equals(other: UserRoleEntity): boolean {
    return this._id === other._id && this._userId === other._userId && this._roleName === other._roleName;
  }
}

// Entité User principale
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
  private _profile?: UserProfile; // Profil associé

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

  // Getters
  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get fullName(): string { return this._fullName; }
  get phone(): string | undefined { return this._phone; }
  get nationalId(): string | undefined { return this._nationalId; }
  get avatarUrl(): string | undefined { return this._avatarUrl; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }
  get lastLogin(): Date | undefined { return this._lastLogin ? new Date(this._lastLogin) : undefined; }
  get userRoles(): UserRoleEntity[] { return this._userRoles; }
  get profile(): UserProfile | undefined { return this._profile; }

  // Rôle principal (le premier actif ou le plus élevé)
  get primaryRole(): string {
    const activeRoles = this._userRoles.filter(r => r.isActive());
    if (activeRoles.length === 0) return 'user';
    // Priorité par nom (admin > director > manager > ...)
    const priority: Record<string, number> = { admin: 10, director: 8, manager: 6, engineering_consultant: 5, supervisor: 4, inspector: 4, finance_manager: 7, supplier: 3, worker: 2, consultant: 1, agent: 1 };
    return activeRoles.reduce((a, b) => (priority[a.roleName] || 0) > (priority[b.roleName] || 0) ? a : b).roleName;
  }

  // Méthodes métier
  hasRole(roleName: string): boolean {
    return this._userRoles.some(r => r.roleName === roleName && r.isActive());
  }
  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(r => this.hasRole(r));
  }
  isAdmin(): boolean { return this.hasRole('admin'); }
  isDirector(): boolean { return this.hasRole('director'); }
  isManager(): boolean { return this.hasRole('manager'); }
  isSupplier(): boolean { return this.hasRole('supplier'); }

  canAccessDashboard(): boolean {
    return this.hasAnyRole(['admin', 'director', 'manager']);
  }
  canManageProjects(): boolean {
    return this.hasAnyRole(['admin', 'director', 'manager']);
  }

  updateFullName(newFullName: string): void { this._fullName = newFullName.trim(); }
  updatePhone(newPhone?: string): void { this._phone = newPhone?.trim(); }
  updateEmail(newEmail: string): void { this._email = this.validateEmail(newEmail); }
  updateAvatar(newAvatarUrl?: string): void { this._avatarUrl = newAvatarUrl?.trim(); }
  activate(): void { this._isActive = true; }
  deactivate(): void { this._isActive = false; }
  updateLastLogin(): void { this._lastLogin = new Date(); }

  addRole(role: UserRoleEntity): void {
    if (!this._userRoles.some(r => r.id === role.id)) {
      this._userRoles.push(role);
    }
  }
  removeRole(roleId: string): void {
    this._userRoles = this._userRoles.filter(r => r.id !== roleId);
  }

  setProfile(profile: UserProfile): void { this._profile = profile; }

  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._email.includes('@') &&
      this._fullName.length > 0 &&
      this._userRoles.every(r => r.validate())
    );
  }

  // Factory
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