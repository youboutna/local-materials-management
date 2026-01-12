// Domain Entity: Employee
// Pure business logic without infrastructure concerns

export type EmployeeRole = 
  | 'admin'
  | 'director'
  | 'project_manager'
  | 'technical_manager'
  | 'engineering_consultant'
  | 'supervisor'
  | 'inspector'
  | 'finance_manager'
  | 'legal'
  | 'worker'
  | 'supplier';

export type Department = 
  | 'management'
  | 'engineering'
  | 'construction'
  | 'finance'
  | 'legal'
  | 'hr'
  | 'logistics'
  | 'quality';

export interface Certification {
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
}

export class Employee {
  constructor(
    public readonly id: string,
    public readonly employeeId: string,
    public readonly fullName: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly position: string | null,
    public readonly department: Department | null,
    public readonly role: EmployeeRole,
    public readonly hireDate: string | null,
    public readonly salary: number | null,
    public readonly isActive: boolean,
    public readonly userId: string | null,
    public readonly managerId: string | null,
    public readonly superiorId: string | null,
    public readonly skills: string[],
    public readonly certifications: Certification[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  canApproveProjects(): boolean {
    return ['admin', 'director', 'project_manager'].includes(this.role);
  }

  canApprovePayments(): boolean {
    return ['admin', 'director', 'finance_manager'].includes(this.role);
  }

  canScheduleInspections(): boolean {
    return ['admin', 'project_manager', 'technical_manager', 'engineering_consultant'].includes(this.role);
  }

  canExecuteInspections(): boolean {
    return ['admin', 'inspector', 'technical_manager', 'engineering_consultant', 'supervisor'].includes(this.role);
  }

  canManageTeam(): boolean {
    return ['admin', 'director', 'project_manager', 'technical_manager'].includes(this.role);
  }

  isManager(): boolean {
    return ['admin', 'director', 'project_manager', 'technical_manager'].includes(this.role);
  }

  hasValidCertifications(): boolean {
    const now = new Date();
    return this.certifications.every(cert => {
      if (!cert.expiryDate) return true;
      return new Date(cert.expiryDate) > now;
    });
  }

  getExpiringCertifications(daysAhead: number = 30): Certification[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return this.certifications.filter(cert => {
      if (!cert.expiryDate) return false;
      const expiryDate = new Date(cert.expiryDate);
      return expiryDate > now && expiryDate <= futureDate;
    });
  }

  getDisplayName(): string {
    return this.fullName || this.email || this.employeeId;
  }

  // Factory method
  static create(params: {
    id: string;
    employeeId: string;
    fullName: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: Department;
    role?: EmployeeRole;
    hireDate?: string;
  }): Employee {
    return new Employee(
      params.id,
      params.employeeId,
      params.fullName,
      params.email || null,
      params.phone || null,
      params.position || null,
      params.department || null,
      params.role || 'worker',
      params.hireDate || null,
      null,
      true,
      null,
      null,
      null,
      [],
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
