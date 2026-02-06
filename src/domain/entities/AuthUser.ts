/**
 * AuthUser Entity
 * Représente un utilisateur authentifié dans le domaine
 * Architecture hexagonale pure - aucune dépendance externe
 */

export enum AuthProvider {
  SUPABASE = 'supabase',
  KEYCLOAK = 'keycloak',
  AUTH0 = 'auth0',
  DATABASE = 'database'
}

export enum AuthUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export class AuthUser {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _provider: AuthProvider;
  private _status: AuthUserStatus;
  private readonly _metadata: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;

  constructor(
    id: string,
    email: string,
    provider: AuthProvider,
    status: AuthUserStatus = AuthUserStatus.ACTIVE,
    metadata: Record<string, any> = {},
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    lastLoginAt?: Date
  ) {
    this._id = id;
    this._email = email;
    this._provider = provider;
    this._status = status;
    this._metadata = { ...metadata };
    this._createdAt = new Date(createdAt);
    this._updatedAt = new Date(updatedAt);
    this._lastLoginAt = lastLoginAt ? new Date(lastLoginAt) : undefined;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  get status(): AuthUserStatus {
    return this._status;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt ? new Date(this._lastLoginAt) : undefined;
  }

  // Méthodes métier pures
  isActive(): boolean {
    return this._status === AuthUserStatus.ACTIVE;
  }

  isFromProvider(provider: AuthProvider): boolean {
    return this._provider === provider;
  }

  canAuthenticate(): boolean {
    return this._status === AuthUserStatus.ACTIVE || this._status === AuthUserStatus.PENDING;
  }

  suspend(): void {
    if (this._status === AuthUserStatus.SUSPENDED) {
      throw new Error('User is already suspended');
    }
    this._status = AuthUserStatus.SUSPENDED;
  }

  reactivate(): void {
    if (this._status !== AuthUserStatus.SUSPENDED && this._status !== AuthUserStatus.INACTIVE) {
      throw new Error('User cannot be reactivated from current status');
    }
    this._status = AuthUserStatus.ACTIVE;
  }

  updateLastLogin(): void {
    this._lastLoginAt = new Date();
  }

  updateMetadata(newMetadata: Record<string, any>): void {
    Object.assign(this._metadata, newMetadata);
  }

  hasMetadata(key: string): boolean {
    return key in this._metadata;
  }

  getMetadataValue(key: string): any {
    return this._metadata[key];
  }

  // Validation
  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._email.includes('@') &&
      Object.values(AuthProvider).includes(this._provider) &&
      Object.values(AuthUserStatus).includes(this._status)
    );
  }

  // Factory methods
  static create(
    id: string,
    email: string,
    provider: AuthProvider,
    metadata?: Record<string, any>
  ): AuthUser {
    return new AuthUser(
      id,
      email,
      provider,
      AuthUserStatus.ACTIVE,
      metadata || {},
      new Date(),
      new Date()
    );
  }

  static fromSupabaseUser(
    id: string,
    email: string,
    metadata: Record<string, any> = {}
  ): AuthUser {
    return new AuthUser(
      id,
      email,
      AuthProvider.SUPABASE,
      AuthUserStatus.ACTIVE,
      metadata,
      new Date(),
      new Date(),
      metadata.last_sign_in_at ? new Date(metadata.last_sign_in_at) : undefined
    );
  }
}
