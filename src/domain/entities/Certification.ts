// Domain Entity: Certification
// Pure business logic without infrastructure concerns

export class Certification {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly issuedBy: string,
    public readonly issuedDate: string,
    public readonly expiryDate: string | null,
    public readonly employeeId: string | null,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt: string = new Date().toISOString()
  ) {}

  // Business logic methods
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
  }

  isExpiringSoon(daysAhead: number = 30): boolean {
    if (!this.expiryDate) return false;
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(this.expiryDate);
    return expiryDate > now && expiryDate <= futureDate;
  }

  getDaysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const now = new Date();
    const expiryDate = new Date(this.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isValid(): boolean {
    return !!(this.name && this.issuedBy && this.issuedDate);
  }

  getStatus(): 'valid' | 'expiring' | 'expired' {
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon()) return 'expiring';
    return 'valid';
  }

  // Factory method
  static create(params: {
    id: string;
    name: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
    employeeId?: string;
  }): Certification {
    return new Certification(
      params.id,
      params.name,
      params.issuedBy,
      params.issuedDate,
      params.expiryDate || null,
      params.employeeId || null
    );
  }
}
