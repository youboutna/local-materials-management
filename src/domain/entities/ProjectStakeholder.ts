/**
 * Project Stakeholder Entity
 * Represents a stakeholder in a project following hexagonal architecture
 */

export type StakeholderType = 
  | 'client'
  | 'consultant'
  | 'contractor'
  | 'supplier'
  | 'inspector'
  | 'manager'
  | 'engineer'
  | 'architect'
  | 'other';

export type StakeholderEntityType = 
  | 'employee'
  | 'supplier'
  | 'external';

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  stakeholderType: StakeholderType;
  stakeholderEntityType: StakeholderEntityType;
  employeeId?: string | null;
  supplierId?: string | null;
  externalName?: string | null;
  externalEmail?: string | null;
  externalPhone?: string | null;
  roleDescription?: string | null;
  responsibilities?: string[] | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  hourlyRate?: number | null;
  contractType?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProjectStakeholderEntity implements ProjectStakeholder {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly stakeholderType: StakeholderType,
    public readonly stakeholderEntityType: StakeholderEntityType,
    public readonly employeeId: string | null,
    public readonly supplierId: string | null,
    public readonly externalName: string | null,
    public readonly externalEmail: string | null,
    public readonly externalPhone: string | null,
    public readonly roleDescription: string | null,
    public readonly responsibilities: string[] | null,
    public readonly isActive: boolean,
    public readonly startDate: string | null,
    public readonly endDate: string | null,
    public readonly hourlyRate: number | null,
    public readonly contractType: string | null,
    public readonly notes: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic methods
  isEmployee(): boolean {
    return this.stakeholderEntityType === 'employee' && this.employeeId !== null;
  }

  isSupplier(): boolean {
    return this.stakeholderEntityType === 'supplier' && this.supplierId !== null;
  }

  isExternal(): boolean {
    return this.stakeholderEntityType === 'external';
  }

  isActiveDuringPeriod(date: string): boolean {
    if (!this.isActive) return false;
    
    if (this.startDate && date < this.startDate) return false;
    if (this.endDate && date > this.endDate) return false;
    
    return true;
  }

  canApproveDocuments(): boolean {
    const approvingRoles = ['consultant', 'manager', 'inspector'];
    return approvingRoles.includes(this.stakeholderType) && this.isActive;
  }

  getDisplayName(): string {
    if (this.isEmployee()) {
      return `Employee: ${this.employeeId}`;
    } else if (this.isSupplier()) {
      return `Supplier: ${this.supplierId}`;
    } else {
      return this.externalName || 'External Stakeholder';
    }
  }

  getContactInfo(): { email?: string; phone?: string } | null {
    if (this.isExternal()) {
      return {
        email: this.externalEmail || undefined,
        phone: this.externalPhone || undefined
      };
    }
    return null;
  }
}
