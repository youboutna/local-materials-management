/**
 * UserRole Entity (SOMELEC)
 * Représente un rôle d'autorisation pour un utilisateur dans le contexte SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 */

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

export class UserRole {
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

  // Méthodes métier pures
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
  ): UserRole {
    return new UserRole(
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
  ): UserRole {
    return new UserRole(
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

  // Comparaison
  equals(other: UserRole): boolean {
    return (
      this._id === other._id &&
      this._userId === other._userId &&
      this._roleName === other._roleName
    );
  }

  // Informations système
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
