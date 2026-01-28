/**
 * User Entity
 * Représente un utilisateur complet dans le domaine SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 */

import { UserRole, SomelecRole } from './UserRoleSomelec';

export class User {
  private readonly _id: string;
  private readonly _email: string;
  private _fullName: string;
  private _primaryRole: string;
  private _phone?: string;
  private _nationalId?: string;
  private _avatar?: string;
  private _isActive: boolean;
  private _lastLogin?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _userRoles: UserRole[];

  constructor(
    id: string,
    email: string,
    fullName: string,
    primaryRole: string = 'user',
    phone?: string,
    nationalId?: string,
    avatar?: string,
    isActive: boolean = true,
    lastLogin?: Date,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    userRoles: UserRole[] = []
  ) {
    this._id = id;
    this._email = email;
    this._fullName = fullName;
    this._primaryRole = primaryRole;
    this._phone = phone;
    this._nationalId = nationalId;
    this._avatar = avatar;
    this._isActive = isActive;
    this._lastLogin = lastLogin;
    this._createdAt = new Date(createdAt);
    this._updatedAt = new Date(updatedAt);
    this._userRoles = [...userRoles];
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get fullName(): string {
    return this._fullName;
  }

  get primaryRole(): string {
    return this._primaryRole;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get nationalId(): string | undefined {
    return this._nationalId;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastLogin(): Date | undefined {
    return this._lastLogin;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get userRoles(): UserRole[] {
    return [...this._userRoles];
  }

  // Méthodes métier pures
  hasRole(role: SomelecRole): boolean {
    return this._userRoles.some(userRole => 
      userRole.roleName === role && userRole.canBeUsed()
    );
  }

  hasAnyRole(roles: SomelecRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  getActiveRoles(): SomelecRole[] {
    return this._userRoles
      .filter(userRole => userRole.canBeUsed())
      .map(userRole => userRole.roleName);
  }

  getHighestRole(): SomelecRole | null {
    const activeRoles = this.getActiveRoles();
    if (activeRoles.length === 0) return null;

    const priority = {
      [SomelecRole.ADMIN]: 5,
      [SomelecRole.DIRECTOR]: 4,
      [SomelecRole.MANAGER]: 3,
      [SomelecRole.AGENT]: 2,
      [SomelecRole.SUPPLIER]: 1
    };

    return activeRoles.reduce((highest, current) => 
      priority[current] > priority[highest] ? current : highest
    );
  }

  isAdmin(): boolean {
    return this.hasRole(SomelecRole.ADMIN);
  }

  isDirector(): boolean {
    return this.hasRole(SomelecRole.DIRECTOR);
  }

  isManager(): boolean {
    return this.hasRole(SomelecRole.MANAGER);
  }

  isAgent(): boolean {
    return this.hasRole(SomelecRole.AGENT);
  }

  isSupplier(): boolean {
    return this.hasRole(SomelecRole.SUPPLIER);
  }

  canAccessDashboard(): boolean {
    return this.hasAnyRole([SomelecRole.ADMIN, SomelecRole.DIRECTOR, SomelecRole.MANAGER]);
  }

  canManageProjects(): boolean {
    return this.hasAnyRole([SomelecRole.ADMIN, SomelecRole.DIRECTOR, SomelecRole.MANAGER]);
  }

  canViewReports(): boolean {
    return this.hasAnyRole([SomelecRole.ADMIN, SomelecRole.DIRECTOR, SomelecRole.MANAGER]);
  }

  addRole(userRole: UserRole): void {
    if (!this._userRoles.some(existing => existing.id === userRole.id)) {
      this._userRoles.push(userRole);
    }
  }

  removeRole(roleId: string): void {
    const index = this._userRoles.findIndex(role => role.id === roleId);
    if (index > -1) {
      this._userRoles.splice(index, 1);
    }
  }

  updateFullName(newFullName: string): void {
    this._fullName = newFullName;
  }

  updatePhone(newPhone?: string): void {
    this._phone = newPhone;
  }

  updateAvatar(newAvatar?: string): void {
    this._avatar = newAvatar;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  updateLastLogin(): void {
    this._lastLogin = new Date();
  }

  // Validation
  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._email.includes('@') &&
      this._fullName.length > 0 &&
      this._userRoles.every(role => role.validate())
    );
  }

  // Factory methods
  static create(
    id: string,
    email: string,
    fullName: string,
    primaryRole: string = 'user'
  ): User {
    return new User(
      id,
      email,
      fullName,
      primaryRole,
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      new Date(),
      new Date(),
      []
    );
  }

  static withRoles(
    id: string,
    email: string,
    fullName: string,
    primaryRole: string,
    userRoles: UserRole[]
  ): User {
    return new User(
      id,
      email,
      fullName,
      primaryRole,
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      new Date(),
      new Date(),
      userRoles
    );
  }
}

export type UserRoleType = 'admin' | 'manager' | 'employee' | 'supplier' | 'inspector' | 'engineer' | 'user';

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

// Legacy interface for backward compatibility
export interface UserProfile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean;
  userRoles?: UserRole[]; // Add support for multiple roles
  primaryRole?: string; // Add primary role for multi-role support
  avatar_url?: string | null;
}
