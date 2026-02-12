/**
 * User Entity
 * Représente un utilisateur complet dans le domaine SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 *
 * // Domain Entity: User
// Pure business logic without infrastructure concerns
*/

// SOMELEC Role Enum - Centralized from UserRoleSomelec
export enum SomelecRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  DIRECTOR = 'director',
  AGENT = 'agent',
  SUPPLIER = 'supplier'
}

export enum UserRoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

// Legacy UserRole enum for backward compatibility
export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  FieldAgent = "field_agent",
  Inspector = "inspector",
  Viewer = "viewer",
}

// UserRole Entity from UserRoleSomelec - Enhanced domain entity
export class UserRoleEntity {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _roleName: SomelecRole;
  private _status: UserRoleStatus;
  private readonly _assignedAt: Date;
  private readonly _assignedBy?: string;
  private _revokedAt?: Date;
  private _expiresAt?: Date;

  constructor(
    id: string,
    userId: string,
    roleName: SomelecRole,
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

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get roleName(): SomelecRole {
    return this._roleName;
  }

  get status(): UserRoleStatus {
    return this._status;
  }

  get assignedAt(): Date {
    return new Date(this._assignedAt);
  }

  get assignedBy(): string | undefined {
    return this._assignedBy;
  }

  get revokedAt(): Date | undefined {
    return this._revokedAt ? new Date(this._revokedAt) : undefined;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt ? new Date(this._expiresAt) : undefined;
  }

  // Business logic methods
  isActive(): boolean {
    return this._status === UserRoleStatus.ACTIVE && !this.isExpired() && !this.isRevoked();
  }

  isExpired(): boolean {
    if (!this._expiresAt) return false;
    return new Date() > this._expiresAt;
  }

  isRevoked(): boolean {
    return this._status === UserRoleStatus.REVOKED || 
           (this._revokedAt !== undefined && new Date() > this._revokedAt);
  }

  canBeUsed(): boolean {
    return this.isActive() && !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    if (this._status === UserRoleStatus.REVOKED) {
      throw new Error('Role is already revoked');
    }
    this._status = UserRoleStatus.REVOKED;
    this._revokedAt = new Date();
  }

  reactivate(): void {
    if (this._status !== UserRoleStatus.INACTIVE && this._status !== UserRoleStatus.REVOKED) {
      throw new Error('Role cannot be reactivated from current status');
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

  hasHigherPriorityThan(otherRole: SomelecRole): boolean {
    const priority = {
      [SomelecRole.ADMIN]: 5,
      [SomelecRole.DIRECTOR]: 4,
      [SomelecRole.MANAGER]: 3,
      [SomelecRole.AGENT]: 2,
      [SomelecRole.SUPPLIER]: 1
    };
    
    return priority[this._roleName] > priority[otherRole];
  }

  // Validation
  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._userId.length > 0 &&
      Object.values(SomelecRole).includes(this._roleName) &&
      Object.values(UserRoleStatus).includes(this._status) &&
      this._assignedAt <= new Date()
    );
  }

  // Factory methods
  static assign(
    id: string,
    userId: string,
    roleName: SomelecRole,
    assignedBy?: string,
    expiresAt?: Date
  ): UserRoleEntity {
    return new UserRoleEntity(
      id,
      userId,
      roleName,
      UserRoleStatus.ACTIVE,
      new Date(),
      assignedBy,
      undefined,
      expiresAt
    );
  }

  static createTemporary(
    id: string,
    userId: string,
    roleName: SomelecRole,
    expiresAt: Date,
    assignedBy?: string
  ): UserRoleEntity {
    return new UserRoleEntity(
      id,
      userId,
      roleName,
      UserRoleStatus.ACTIVE,
      new Date(),
      assignedBy,
      undefined,
      expiresAt
    );
  }

  // Comparison
  equals(other: UserRoleEntity): boolean {
    return (
      this._id === other._id &&
      this._userId === other._userId &&
      this._roleName === other._roleName
    );
  }

  // System info
  getSystemInfo(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      roleName: this._roleName,
      status: this._status,
      assignedAt: this._assignedAt.toISOString(),
      assignedBy: this._assignedBy,
      revokedAt: this._revokedAt?.toISOString(),
      expiresAt: this._expiresAt?.toISOString(),
      isActive: this.isActive(),
      isExpired: this.isExpired(),
      isRevoked: this.isRevoked(),
      canBeUsed: this.canBeUsed()
    };
  }
}

export class User {
  // Private fields for encapsulation
  private _id: string;
  private _name: string;
  private _email: string;
  private _phone: string;
  private _role: UserRole;
  private _image: string;
  private _workspaceIds: string[];
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _userRoles: UserRoleEntity[]; // Add support for multiple roles
  private _fullName: string; // Additional field for backward compatibility
  private _avatar: string; // Additional field for backward compatibility  
  private _lastLogin?: Date; // Additional field for backward compatibility

  constructor(
    id: string,
    name: string,
    email: string,
    phone: string,
    role: UserRole,
    image: string,
    workspaceIds: string[],
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    userRoles?: UserRoleEntity[], // Add userRoles parameter
    fullName?: string, // Additional field for backward compatibility
    avatar?: string, // Additional field for backward compatibility
    lastLogin?: Date // Additional field for backward compatibility
  ) {
    this._id = this.validateId(id);
    this._name = this.validateName(name);
    this._email = this.validateEmail(email);
    this._phone = this.validatePhone(phone);
    this._role = this.validateRole(role);
    this._image = image;
    this._workspaceIds = workspaceIds || [];
    this._isActive = isActive !== undefined ? isActive : true;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._userRoles = userRoles || [];
    this._fullName = fullName || name; // Initialize with fallback
    this._avatar = avatar || image; // Initialize with fallback
    this._lastLogin = lastLogin; // Initialize optional field
  }

  // Validation methods
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('User ID is required');
    }
    return id;
  }

  private validateName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('User name is required');
    }
    return name;
  }

  private validateEmail(email: string): string {
    if (!email || email.trim().length === 0) {
      throw new Error('User email is required');
    }
    return email;
  }

  private validatePhone(phone: string): string {
    if (!phone || phone.trim().length === 0) {
      throw new Error('User phone is required');
    }
    return phone;
  }

  private validateRole(role: UserRole): UserRole {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid user role: ${role}`);
    }
    return role;
  }

  private validateRoleEntity(role: UserRoleEntity): UserRoleEntity {
    const validRoles = Object.values(SomelecRole);
    if (!validRoles.includes(role.roleName)) {
      throw new Error(`Invalid user role: ${role.roleName}`);
    }
    return role;
  }

  // Public getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get phone(): string {
    return this._phone;
  }

  get role(): UserRole {
    return this._role;
  }

  get image(): string {
    return this._image;
  }

  get workspaceIds(): string[] {
    return this._workspaceIds;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get userRoles(): UserRoleEntity[] {
    return this._userRoles;
  }

  // Additional getters for backward compatibility
  get fullName(): string {
    return this._name;
  }

  get avatar(): string {
    return this._image;
  }

  get lastLogin(): Date | undefined {
    return this._lastLogin;
  }

  // Business logic methods
  updateRole(newRole: UserRole): void {
    this._role = this.validateRole(newRole);
    this._updatedAt = new Date();
  }

  updateUserRole(newRole: UserRoleEntity): void {
    // Find and update the role in userRoles array
    const existingIndex = this._userRoles.findIndex(role => role.id === newRole.id);
    if (existingIndex > -1) {
      this._userRoles[existingIndex] = newRole;
    }
    this._updatedAt = new Date();
  }

  // Role checking methods
  hasRole(role: SomelecRole): boolean {
    return this._userRoles.some(userRole => userRole.roleName === role && userRole.isActive());
  }

  hasAnyRole(roles: SomelecRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasRoleEntity(role: UserRoleEntity): boolean {
    return this._userRoles.some(userRole => userRole.id === role.id && userRole.isActive());
  }

  hasAnyRoleEntity(roles: UserRoleEntity[]): boolean {
    return roles.some(role => this.hasRoleEntity(role));
  }

  // Role priority mapping
  private static readonly ROLE_PRIORITY = {
    [ SomelecRole.ADMIN]: 5,
    [ SomelecRole.DIRECTOR]: 4,
    [ SomelecRole.MANAGER]: 3,
    [SomelecRole.AGENT]: 2,
    [SomelecRole.SUPPLIER]: 1
  };

  // Role priority mapping for UserRoleEntity
  private static readonly ROLE_PRIORITY_ENTITY = {
    [SomelecRole.ADMIN]: 5,
    [SomelecRole.DIRECTOR]: 4,
    [SomelecRole.MANAGER]: 3,
    [SomelecRole.AGENT]: 2,
    [SomelecRole.SUPPLIER]: 1
  };

  static getHighestRole(roles: UserRole[]): UserRole {
    const priority = User.ROLE_PRIORITY;
    return roles.reduce((highest, current) => 
      priority[current] > priority[highest] ? current : highest
    );
  }

  static getHighestRoleEntity(roles: UserRoleEntity[]): UserRoleEntity {
    const priority = User.ROLE_PRIORITY_ENTITY;
    return roles.reduce((highest, current) => 
      priority[current.roleName] > priority[highest.roleName] ? current : highest
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

  addRole(userRole: UserRoleEntity): void {
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
    this._phone = newPhone || '';
  }

  updateAvatar(newAvatar?: string): void {
    this._avatar = newAvatar || '';
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
  static withRoles(
    id: string,
    email: string,
    fullName: string,
    primaryRole: UserRole,
    userRoles: UserRoleEntity[]
  ): User {
    return new User(
      id,
      fullName,
      email,
      '',
      primaryRole,
      '',
      [],
      true,
      undefined,
      undefined,
      userRoles,
      fullName,
      '',
      undefined
    );
  }

  static create(
    id: string,
    email: string,
    fullName: string,
    primaryRole: UserRole,
    image?: string,
    workspaceIds?: string[],
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    userRoles?: UserRoleEntity[],
    avatar?: string,
    lastLogin?: Date
  ): User {
    return new User(
      id,
      fullName,
      email,
      '',
      primaryRole,
      image || '',
      workspaceIds || [],
      isActive !== undefined ? isActive : true,
      createdAt || new Date(),
      updatedAt || new Date(),
      userRoles || [],
      fullName,
      avatar || '',
      lastLogin
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
