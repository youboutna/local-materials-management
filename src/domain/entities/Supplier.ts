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
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly nif: string | null,
    public readonly category: SupplierCategory | null,
    public readonly status: SupplierStatus,
    public readonly rating: SupplierRating | null,
    public readonly contacts: SupplierContact[],
    public readonly isVerified: boolean,
    public readonly verifiedAt: string | null,
    public readonly workspaceId: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  isActive(): boolean {
    return this.status === 'active';
  }

  canParticipateInTenders(): boolean {
    return this.status === 'active' && this.isVerified;
  }

  isBlacklisted(): boolean {
    return this.status === 'blacklisted';
  }

  getOverallRating(): number {
    if (!this.rating) return 0;
    return this.rating.overall;
  }

  getDisplayRating(): string {
    const rating = this.getOverallRating();
    return `${rating.toFixed(1)}/5`;
  }

  hasValidContact(): boolean {
    return !!(this.email || this.phone || this.contacts.length > 0);
  }

  getPrimaryContact(): SupplierContact | null {
    return this.contacts.length > 0 ? this.contacts[0] : null;
  }

  meetsMinimumRating(threshold: number = 3): boolean {
    return this.getOverallRating() >= threshold;
  }

  // Factory method
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
}
