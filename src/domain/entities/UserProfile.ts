/**
 * UserProfile Entity
 * Représente le profil complémentaire d'un utilisateur dans SOMELEC
 * Architecture hexagonale pure - aucune dépendance externe
 */

export enum ProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export class UserProfile {
  private readonly _id: string;
  private readonly _userId: string;
  private _fullName: string;
  private _phone?: string;
  private _nationalId?: string;
  private _avatarUrl?: string;
  private _isAdmin: boolean;
  private _status: ProfileStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _department?: string;
  private _position?: string;
  private _location?: string;

  constructor(
    id: string,
    userId: string,
    fullName: string,
    phone?: string,
    nationalId?: string,
    avatarUrl?: string,
    isAdmin: boolean = false,
    status: ProfileStatus = ProfileStatus.ACTIVE,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    lastLoginAt?: Date,
    department?: string,
    position?: string,
    location?: string
  ) {
    this._id = id;
    this._userId = userId;
    this._fullName = fullName.trim();
    this._phone = phone?.trim();
    this._nationalId = nationalId?.trim();
    this._avatarUrl = avatarUrl?.trim();
    this._isAdmin = isAdmin;
    this._status = status;
    this._createdAt = new Date(createdAt);
    this._updatedAt = new Date(updatedAt);
    this._lastLoginAt = lastLoginAt ? new Date(lastLoginAt) : undefined;
    this._department = department?.trim();
    this._position = position?.trim();
    this._location = location?.trim();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get fullName(): string {
    return this._fullName;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get nationalId(): string | undefined {
    return this._nationalId;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get status(): ProfileStatus {
    return this._status;
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

  get department(): string | undefined {
    return this._department;
  }

  get position(): string | undefined {
    return this._position;
  }

  get location(): string | undefined {
    return this._location;
  }

  // Méthodes métier pures
  isActive(): boolean {
    return this._status === ProfileStatus.ACTIVE;
  }

  isPendingVerification(): boolean {
    return this._status === ProfileStatus.PENDING_VERIFICATION;
  }

  isSuspended(): boolean {
    return this._status === ProfileStatus.SUSPENDED;
  }

  canAccessSystem(): boolean {
    return this._status === ProfileStatus.ACTIVE || this._status === ProfileStatus.PENDING_VERIFICATION;
  }

  hasAdminPrivileges(): boolean {
    return this._isAdmin && this.isActive();
  }

  updateFullName(newFullName: string): void {
    const trimmed = newFullName.trim();
    if (trimmed.length === 0) {
      throw new Error('Full name cannot be empty');
    }
    this._fullName = trimmed;
  }

  updatePhone(newPhone?: string): void {
    this._phone = newPhone?.trim();
  }

  updateNationalId(newNationalId?: string): void {
    this._nationalId = newNationalId?.trim();
  }

  updateAvatarUrl(newAvatarUrl?: string): void {
    this._avatarUrl = newAvatarUrl?.trim();
  }

  grantAdminPrivileges(): void {
    this._isAdmin = true;
  }

  revokeAdminPrivileges(): void {
    this._isAdmin = false;
  }

  activate(): void {
    if (this._status === ProfileStatus.ACTIVE) {
      throw new Error('Profile is already active');
    }
    this._status = ProfileStatus.ACTIVE;
  }

  suspend(): void {
    if (this._status === ProfileStatus.SUSPENDED) {
      throw new Error('Profile is already suspended');
    }
    this._status = ProfileStatus.SUSPENDED;
  }

  markAsPendingVerification(): void {
    this._status = ProfileStatus.PENDING_VERIFICATION;
  }

  updateLastLogin(): void {
    this._lastLoginAt = new Date();
  }

  setLastLoginAt(lastLoginAt: Date): void {
    this._lastLoginAt = new Date(lastLoginAt);
  }

  updateDepartment(newDepartment?: string): void {
    this._department = newDepartment?.trim();
  }

  updatePosition(newPosition?: string): void {
    this._position = newPosition?.trim();
  }

  updateLocation(newLocation?: string): void {
    this._location = newLocation?.trim();
  }

  // Validation
  validate(): boolean {
    return (
      this._id.length > 0 &&
      this._userId.length > 0 &&
      this._fullName.length > 0 &&
      Object.values(ProfileStatus).includes(this._status) &&
      this._createdAt <= new Date()
    );
  }

  // Validation des données
  validatePhoneNumber(): boolean {
    if (!this._phone) return true; // Phone is optional
    // Basic phone validation (can be enhanced based on requirements)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(this._phone);
  }

  validateNationalId(): boolean {
    if (!this._nationalId) return true; // National ID is optional
    return this._nationalId.length >= 6; // Basic validation
  }

  // Factory methods
  static create(
    id: string,
    userId: string,
    fullName: string,
    phone?: string,
    nationalId?: string
  ): UserProfile {
    return new UserProfile(
      id,
      userId,
      fullName,
      phone,
      nationalId,
      undefined,
      false,
      ProfileStatus.PENDING_VERIFICATION
    );
  }

  static createAdmin(
    id: string,
    userId: string,
    fullName: string,
    phone?: string,
    nationalId?: string
  ): UserProfile {
    return new UserProfile(
      id,
      userId,
      fullName,
      phone,
      nationalId,
      undefined,
      true,
      ProfileStatus.ACTIVE
    );
  }

  // Comparaison
  equals(other: UserProfile): boolean {
    return (
      this._id === other._id &&
      this._userId === other._userId
    );
  }

  // Informations système
  getSystemInfo(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      fullName: this._fullName,
      phone: this._phone,
      nationalId: this._nationalId,
      avatarUrl: this._avatarUrl,
      isAdmin: this._isAdmin,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      lastLoginAt: this._lastLoginAt?.toISOString(),
      department: this._department,
      position: this._position,
      location: this._location,
      isActive: this.isActive(),
      canAccessSystem: this.canAccessSystem(),
      hasAdminPrivileges: this.hasAdminPrivileges()
    };
  }

  // Représentation textuelle
  getDisplayName(): string {
    return this._fullName;
  }

  getShortInfo(): string {
    const parts = [this._fullName];
    if (this._position) parts.push(this._position);
    if (this._department) parts.push(this._department);
    return parts.join(' - ');
  }
}
