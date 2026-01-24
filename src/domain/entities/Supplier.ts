// Domain Entity: Supplier
// Pure business logic without infrastructure concerns

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted';
export type SupplierCategory = 
  | 'materials'
  | 'equipment'
  | 'services'
  | 'subcontractor'
  | 'consultant';

export interface SupplierContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface SupplierRating {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  overall: number;
}

export class Supplier {
  // Private fields for encapsulation
  private _id: string;
  private _name: string;
  private _email: string | null;
  private _phone: string | null;
  private _address: string | null;
  private _nif: string | null;
  private _category: SupplierCategory | null;
  private _status: SupplierStatus;
  private _rating: SupplierRating | null;
  private _contacts: SupplierContact[];
  private _isVerified: boolean;
  private _verifiedAt: string | null;
  private _workspaceId: string | null;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    name: string,
    email: string | null,
    phone: string | null,
    address: string | null,
    nif: string | null,
    category: SupplierCategory | null,
    status: SupplierStatus,
    rating: SupplierRating | null,
    contacts: SupplierContact[],
    isVerified: boolean,
    verifiedAt: string | null,
    workspaceId: string | null,
    createdAt: string,
    updatedAt: string
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._name = this.validateName(name);
    this._email = this.validateEmail(email);
    this._phone = phone;
    this._address = address;
    this._nif = this.validateNif(nif);
    this._category = category;
    this._status = this.validateStatus(status);
    this._rating = rating;
    this._contacts = contacts || [];
    this._isVerified = isVerified;
    this._verifiedAt = verifiedAt;
    this._workspaceId = workspaceId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string | null { return this._email; }
  get phone(): string | null { return this._phone; }
  get address(): string | null { return this._address; }
  get nif(): string | null { return this._nif; }
  get category(): SupplierCategory | null { return this._category; }
  get status(): SupplierStatus { return this._status; }
  get rating(): SupplierRating | null { return this._rating; }
  get contacts(): SupplierContact[] { return this._contacts; }
  get isVerified(): boolean { return this._isVerified; }
  get verifiedAt(): string | null { return this._verifiedAt; }
  get workspaceId(): string | null { return this._workspaceId; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._name || `Supplier-${this._id}`;
  }

  getContactsCount(): number {
    return this._contacts.length;
  }

  getPrimaryContact(): SupplierContact | null {
    return this._contacts.length > 0 ? this._contacts[0] : null;
  }

  getOverallRating(): number {
    return this._rating?.overall || 0;
  }

  // ============= Setters with Validation =============
  set name(value: string) { 
    this._name = this.validateName(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set email(value: string | null) { 
    this._email = this.validateEmail(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set status(value: SupplierStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set category(value: SupplierCategory | null) { 
    this._category = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set rating(value: SupplierRating | null) { 
    this._rating = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set contacts(value: SupplierContact[]) { 
    this._contacts = value || []; 
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  isActive(): boolean {
    return this._status === 'active';
  }

  canParticipateInTenders(): boolean {
    return this._status === 'active' && this._isVerified;
  }

  isBlacklisted(): boolean {
    return this._status === 'blacklisted';
  }

  isSuspended(): boolean {
    return this._status === 'suspended';
  }

  hasValidRating(): boolean {
    return this._rating !== null && this._rating.overall > 0;
  }

  getContactInfo(): string {
    const contact = this.getPrimaryContact();
    if (contact) {
      return `${contact.name} - ${contact.email}`;
    }
    if (this._email) {
      return this._email;
    }
    if (this._phone) {
      return this._phone;
    }
    return 'No contact info available';
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: SupplierStatus): Supplier {
    return new Supplier(
      this._id,
      this._name,
      this._email,
      this._phone,
      this._address,
      this._nif,
      this._category,
      this.validateStatus(newStatus),
      this._rating,
      this._contacts,
      this._isVerified,
      this._verifiedAt,
      this._workspaceId,
      this._createdAt,
      new Date().toISOString()
    );
  }

  withRating(newRating: SupplierRating): Supplier {
    return new Supplier(
      this._id,
      this._name,
      this._email,
      this._phone,
      this._address,
      this._nif,
      this._category,
      this._status,
      newRating,
      this._contacts,
      this._isVerified,
      this._verifiedAt,
      this._workspaceId,
      this._createdAt,
      new Date().toISOString()
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    nif?: string;
    category?: SupplierCategory;
    workspaceId?: string;
  }): Supplier {
    return new Supplier(
      params.id,
      params.name,
      params.email || null,
      params.phone || null,
      params.address || null,
      params.nif || null,
      params.category || null,
      'active',
      null,
      [],
      false,
      null,
      params.workspaceId || null,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      address: this._address,
      nif: this._nif,
      category: this._category,
      status: this._status,
      rating: this._rating,
      contacts: this._contacts,
      is_verified: this._isVerified,
      verified_at: this._verifiedAt,
      workspace_id: this._workspaceId,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Supplier ID is required');
    }
    return id.trim();
  }

  private validateName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Supplier name is required');
    }
    if (name.length > 200) {
      throw new Error('Supplier name must be less than 200 characters');
    }
    return name.trim();
  }

  private validateEmail(email: string | null): string | null {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.trim();
  }

  private validateNif(nif: string | null): string | null {
    if (!nif) return null;
    if (nif.length < 8 || nif.length > 20) {
      throw new Error('NIF must be between 8 and 20 characters');
    }
    return nif.trim();
  }

  private validateStatus(status: SupplierStatus): SupplierStatus {
    const validStatuses: SupplierStatus[] = ['active', 'inactive', 'suspended', 'blacklisted'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid supplier status: ${status}`);
    }
    return status;
  }
}
