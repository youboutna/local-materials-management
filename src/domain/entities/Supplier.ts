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

/**
 * SupplierProps - Pure data interface for factory creation
 * Used by Transformers (infra layer) to build domain entities
 * No infrastructure dependencies allowed
 */
export interface SupplierProps {
  id: string;
  externalRef?: string | null;
  contactPerson?: string | null;
  commerceRegisterRef?: string | null;
  bankName?: string | null;
  rib?: string | null;
  accountNumber?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  nif?: string | null;
  category?: SupplierCategory | null;
  status?: SupplierStatus;
  rating?: SupplierRating | null;
  contacts?: SupplierContact[];
  isVerified?: boolean;
  verifiedAt?: string | null;
  workspaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export class Supplier {
  private _externalRef: string | null;
  private _contactPerson: string | null = null;
  private _commerceRegisterRef: string | null = null;
  private _bankName: string | null = null;
  private _rib: string | null = null;
  private _accountNumber: string | null = null;
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
    this._externalRef = null;
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
  get externalRef(): string | null { return this._externalRef; }
  get contactPerson(): string | null { return this._contactPerson ?? this._contacts[0]?.name ?? null; }
  set contactPerson(value: string | null) { this._contactPerson = value?.trim() || null; }
  get commerceRegisterRef(): string | null { return this._commerceRegisterRef; }
  set commerceRegisterRef(value: string | null) { this._commerceRegisterRef = value?.trim() || null; }
  get bankName(): string | null { return this._bankName; }
  set bankName(value: string | null) { this._bankName = value?.trim() || null; }
  get rib(): string | null { return this._rib; }
  set rib(value: string | null) { this._rib = value?.trim() || null; }
  get accountNumber(): string | null { return this._accountNumber; }
  set accountNumber(value: string | null) { this._accountNumber = value?.trim() || null; }
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

  set externalRef(value: string | null) {
    this._externalRef = value?.trim() || null;
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
    if (contact) return `${contact.name} - ${contact.email}`;
    if (this._email) return this._email;
    if (this._phone) return this._phone;
    return 'No contact info available';
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: SupplierStatus): Supplier {
    return Supplier.create({
      ...this.toProps(),
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  }

  withRating(newRating: SupplierRating): Supplier {
    return Supplier.create({
      ...this.toProps(),
      rating: newRating,
      updatedAt: new Date().toISOString()
    });
  }

  // ============= Factory Methods =============
  /**
   * Primary factory method - accepts SupplierProps (pure data)
   * This is the ONLY way external code should create Supplier instances
   */
  static create(props: SupplierProps): Supplier {
    const supplier = new Supplier(
      props.id,
      props.name,
      props.email ?? null,
      props.phone ?? null,
      props.address ?? null,
      props.nif ?? null,
      props.category ?? null,
      props.status ?? 'active',
      props.rating ?? null,
      props.contacts ?? [],
      props.isVerified ?? false,
      props.verifiedAt ?? null,
      props.workspaceId ?? null,
      props.createdAt ?? new Date().toISOString(),
      props.updatedAt ?? new Date().toISOString()
    );
    supplier._externalRef = props.externalRef ?? null;
    supplier._contactPerson = props.contactPerson ?? props.contacts?.[0]?.name ?? null;
    supplier._commerceRegisterRef = props.commerceRegisterRef ?? null;
    supplier._bankName = props.bankName ?? null;
    supplier._rib = props.rib ?? null;
    supplier._accountNumber = props.accountNumber ?? null;
    return supplier;
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      externalRef: this._externalRef,
      name: this._name,
      email: this._email,
      phone: this._phone,
      address: this._address,
      nif: this._nif,
      category: this._category,
      status: this._status,
      rating: this._rating,
      contacts: this._contacts,
      isVerified: this._isVerified,
      verifiedAt: this._verifiedAt,
      workspaceId: this._workspaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /** Returns pure Props for immutability methods */
  private toProps(): SupplierProps {
    return {
      id: this._id,
      externalRef: this._externalRef,
      contactPerson: this._contactPerson,
      commerceRegisterRef: this._commerceRegisterRef,
      bankName: this._bankName,
      rib: this._rib,
      accountNumber: this._accountNumber,
      name: this._name,
      email: this._email,
      phone: this._phone,
      address: this._address,
      nif: this._nif,
      category: this._category,
      status: this._status,
      rating: this._rating,
      contacts: [...this._contacts],
      isVerified: this._isVerified,
      verifiedAt: this._verifiedAt,
      workspaceId: this._workspaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) throw new Error('Supplier ID is required');
    return id.trim();
  }

  private validateName(name: string): string {
    if (!name || name.trim().length === 0) throw new Error('Supplier name is required');
    if (name.length > 200) throw new Error('Supplier name must be less than 200 characters');
    return name.trim();
  }

  private validateEmail(email: string | null): string | null {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');
    return email.trim();
  }

  private validateNif(nif: string | null): string | null {
    if (!nif) return null;
    const error = validateSupplierNif(nif);
    if (error) throw new Error(error);
    return nif.trim();
  }

  private validateStatus(status: SupplierStatus): SupplierStatus {
    const validStatuses: SupplierStatus[] = ['active', 'inactive', 'suspended', 'blacklisted'];
    if (!validStatuses.includes(status)) throw new Error(`Invalid supplier status: ${status}`);
    return status;
  }
}

/** Règles métier NIF (pures) — partagées entre UI et domaine. */
export const SUPPLIER_NIF_RULES = { MIN_LENGTH: 8, MAX_LENGTH: 20 } as const;

/** Retourne un message d'erreur métier, ou null si le NIF est valide. */
export function validateSupplierNif(nif?: string | null): string | null {
  if (!nif || !nif.trim()) return null;
  const value = nif.trim();
  if (value.length < SUPPLIER_NIF_RULES.MIN_LENGTH || value.length > SUPPLIER_NIF_RULES.MAX_LENGTH) {
    return `Le NIF doit contenir entre ${SUPPLIER_NIF_RULES.MIN_LENGTH} et ${SUPPLIER_NIF_RULES.MAX_LENGTH} caractères`;
  }
  return null;
}
