// Domain Entity: Employee
// Pure business logic without infrastructure concerns
// Following hexagonal architecture with objects and collections

import { Certification } from './Certification';
import { UserRole } from './UserRole';
import { User } from './User';
import { Project } from './Project';
import { Permission, Department, EmployeeData, EmployeeRole } from '../types';

// Re-export for backward compatibility
export type { Permission, Department, EmployeeData, EmployeeRole };

/**
 * EmployeeProps - Pure data interface for factory creation
 * Used by Transformers (infra layer) to build domain entities
 * No infrastructure dependencies allowed
 */
export interface EmployeeProps {
  id: string;
  employeeId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  department?: Department | null;
  role?: string;
  hireDate?: string | null;
  salary?: number | null;
  isActive?: boolean;
  userId?: string | null;
  managerId?: string | null;
  superiorId?: string | null;
  skills?: string[];
  certifications?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export class Employee {
  // Private fields for encapsulation
  private _id: string;
  private _employeeId: string;
  private _fullName: string;
  private _email: string | null;
  private _phone: string | null;
  private _position: string | null;
  private _department: Department | null;
  private _role: UserRole;
  private _hireDate: string | null;
  private _salary: number | null;
  private _isActive: boolean;
  private _user: User | null;
  private _manager: Employee | null;
  private _superior: Employee | null;
  private _directReports: Employee[];
  private _managedProjects: Project[];
  private _teamMembers: Employee[];
  private _skills: string[];
  private _certifications: Certification[];
  private _userId: string | null;
  private _managerId: string | null;
  private _superiorId: string | null;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    employeeId: string,
    fullName: string,
    email: string | null,
    phone: string | null,
    position: string | null,
    department: Department | null,
    role: UserRole,
    hireDate: string | null,
    salary: number | null,
    isActive: boolean,
    user: User | null,
    manager: Employee | null,
    superior: Employee | null,
    directReports: Employee[],
    managedProjects: Project[],
    teamMembers: Employee[],
    skills: string[],
    certifications: Certification[],
    createdAt: string,
    updatedAt: string
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._employeeId = this.validateEmployeeId(employeeId);
    this._fullName = this.validateFullName(fullName);
    this._email = email;
    this._phone = phone;
    this._position = position;
    this._department = department;
    this._role = role;
    this._hireDate = hireDate;
    this._salary = this.validateSalary(salary);
    this._isActive = isActive;
    this._user = user;
    this._manager = manager;
    this._superior = superior;
    this._directReports = directReports || [];
    this._managedProjects = managedProjects || [];
    this._teamMembers = teamMembers || [];
    this._skills = skills || [];
    this._certifications = certifications || [];
    this._userId = null;
    this._managerId = null;
    this._superiorId = null;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get employeeId(): string { return this._employeeId; }
  get fullName(): string { return this._fullName; }
  get email(): string | null { return this._email; }
  get phone(): string | null { return this._phone; }
  get position(): string | null { return this._position; }
  get department(): Department | null { return this._department; }
  get role(): UserRole { return this._role; }
  get hireDate(): string | null { return this._hireDate; }
  get salary(): number | null { return this._salary; }
  get isActive(): boolean { return this._isActive; }
  get user(): User | null { return this._user; }
  get manager(): Employee | null { return this._manager; }
  get superior(): Employee | null { return this._superior; }
  get directReports(): Employee[] { return this._directReports; }
  get managedProjects(): Project[] { return this._managedProjects; }
  get teamMembers(): Employee[] { return this._teamMembers; }
  get skills(): string[] { return this._skills; }
  get certifications(): Certification[] { return this._certifications; }
  get userId(): string | null { return this._userId; }
  get managerId(): string | null { return this._managerId; }
  get superiorId(): string | null { return this._superiorId; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._fullName || this._email || this._employeeId;
  }

  getManagerName(): string | null {
    return this._manager?.fullName || null;
  }

  getSuperiorName(): string | null {
    return this._superior?.fullName || null;
  }

  getUserEmail(): string | null {
    return this._user?.email || null;
  }

  getDirectReportsCount(): number {
    return this._directReports.length;
  }

  getManagedProjectsCount(): number {
    return this._managedProjects.length;
  }

  getTeamSize(): number {
    return this._teamMembers.length;
  }

  getProgressPercentage(): number {
    const totalSkills = this._skills.length;
    const completedCertifications = this._certifications.filter(cert => !cert.isExpired()).length;
    return totalSkills > 0 ? (completedCertifications / totalSkills) * 100 : 0;
  }

  getActiveProjects(): Project[] {
    return this._managedProjects.filter(p => (p as any).status === 'active' || (p as any).status === 'in_progress');
  }

  getExpiringCertifications(daysAhead: number = 30): Certification[] {
    return this._certifications.filter(cert => cert.isExpiringSoon(daysAhead));
  }

  getCertificationsByStatus(): {
    valid: Certification[];
    expiring: Certification[];
    expired: Certification[];
  } {
    return this._certifications.reduce(
      (acc, cert) => {
        const status = cert.getStatus();
        acc[status].push(cert);
        return acc;
      },
      { valid: [], expiring: [], expired: [] } as {
        valid: Certification[];
        expiring: Certification[];
        expired: Certification[];
      }
    );
  }

  // ============= Setters with Validation =============
  set fullName(value: string) { 
    this._fullName = this.validateFullName(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set email(value: string | null) { 
    this._email = value ? this.validateEmail(value) : null; 
    this._updatedAt = new Date().toISOString();
  }
  
  set phone(value: string | null) { 
    this._phone = value ? this.validatePhone(value) : null; 
    this._updatedAt = new Date().toISOString();
  }
  
  set position(value: string | null) { 
    this._position = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set department(value: Department | null) { 
    this._department = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set salary(value: number | null) { 
    this._salary = this.validateSalary(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set isActive(value: boolean) { 
    this._isActive = value; 
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  hasPermission(permission: Permission): boolean {
    return this._role.hasPermission(permission);
  }

  canApproveProjects(): boolean {
    return this.hasPermission('approve_projects');
  }

  canApprovePayments(): boolean {
    return this.hasPermission('approve_payments');
  }

  canScheduleInspections(): boolean {
    return this.hasPermission('schedule_inspections');
  }

  canExecuteInspections(): boolean {
    return this.hasPermission('execute_inspections');
  }

  canManageTeam(): boolean {
    return this.hasPermission('manage_team');
  }

  canManageUsers(): boolean {
    return this.hasPermission('manage_users');
  }

  canManageSystem(): boolean {
    return this.hasPermission('manage_system');
  }

  isManager(): boolean {
    return this.canManageTeam();
  }

  isSeniorTo(employee: Employee): boolean {
    return this._role.isSeniorTo(employee.role);
  }

  isJuniorTo(employee: Employee): boolean {
    return this._role.isJuniorTo(employee.role);
  }

  isSameLevel(employee: Employee): boolean {
    return this._role.isSameLevel(employee.role);
  }

  hasValidCertifications(): boolean {
    return this._certifications.every(cert => !cert.isExpired());
  }

  // ============= Immutability Methods =============
  withRole(newRole: UserRole): Employee {
    const emp = new Employee(
      this._id, this._employeeId, this._fullName, this._email, this._phone,
      this._position, this._department, newRole, this._hireDate, this._salary,
      this._isActive, this._user, this._manager, this._superior,
      this._directReports, this._managedProjects, this._teamMembers,
      this._skills, this._certifications, this._createdAt, new Date().toISOString()
    );
    emp._userId = this._userId;
    emp._managerId = this._managerId;
    emp._superiorId = this._superiorId;
    return emp;
  }

  withAdditionalPermission(permission: Permission): Employee {
    return this.withRole(this._role.withPermission(permission));
  }

  withoutPermission(permission: Permission): Employee {
    return this.withRole(this._role.withoutPermission(permission));
  }

  // ============= Factory Methods =============
  /**
   * Primary factory method - accepts EmployeeProps (pure data)
   * This is the ONLY way external code should create Employee instances
   */
  static create(props: EmployeeProps): Employee {
    const roleInstance = props.role 
      ? UserRole.create({
          id: props.role,
          name: props.role,
          displayName: Employee.getRoleDisplayName(props.role),
          level: Employee.getRoleLevel(props.role),
          permissions: Employee.getRolePermissions(props.role)
        })
      : UserRole.worker();

    const emp = new Employee(
      props.id,
      props.employeeId,
      props.fullName,
      props.email ?? null,
      props.phone ?? null,
      props.position ?? null,
      props.department ?? null,
      roleInstance,
      props.hireDate ?? null,
      props.salary ?? null,
      props.isActive ?? true,
      null,           // user
      null,           // manager
      null,           // superior
      [],             // directReports
      [],             // managedProjects
      [],             // teamMembers
      props.skills || [],
      [],             // certifications
      props.createdAt || new Date().toISOString(),
      props.updatedAt || new Date().toISOString()
    );
    emp._userId = props.userId ?? null;
    emp._managerId = props.managerId ?? null;
    emp._superiorId = props.superiorId ?? null;
    return emp;
  }

  // ============= Data Transformation Methods =============
  static fromData(data: EmployeeData): Employee {
    return Employee.create({
      id: data.id,
      employeeId: data.employee_id,
      fullName: data.full_name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      position: data.position || undefined,
      department: data.department as Department || undefined
    });
  }

  toData(): EmployeeData {
    return {
      id: this._id,
      full_name: this._fullName,
      position: this._position,
      department: this._department,
      email: this._email,
      phone: this._phone,
      employee_id: this._employeeId,
      is_active: this._isActive,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Employee ID is required');
    }
    return id.trim();
  }

  private validateEmployeeId(employeeId: string): string {
    if (!employeeId || employeeId.trim().length === 0) {
      throw new Error('Employee ID is required');
    }
    return employeeId.trim();
  }

  private validateFullName(fullName: string): string {
    if (!fullName || fullName.trim().length === 0) {
      throw new Error('Full name is required');
    }
    if (fullName.length > 100) {
      throw new Error('Full name must be less than 100 characters');
    }
    return fullName.trim();
  }

  private validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.trim();
  }

  private validatePhone(phone: string): string {
    const phoneRegex = /^\+?[0-9\s\-()]+$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone format');
    }
    return phone.replace(/\s/g, '');
  }

  private validateSalary(salary: number | null): number | null {
    if (salary === null) return null;
    if (salary < 0) {
      throw new Error('Salary must be positive');
    }
    if (salary > 1000000) {
      throw new Error('Salary seems too high');
    }
    return salary;
  }

  // ============= Helper Methods =============
  private static getRoleDisplayName(role: string): string {
    const displayNames: Record<string, string> = {
      admin: 'Administrateur',
      director: 'Directeur',
      project_manager: 'Chef de projet',
      technical_manager: 'Manager technique',
      engineering_consultant: 'Ingénieur consultant',
      supervisor: 'Superviseur',
      inspector: 'Inspecteur',
      finance_manager: 'Manager financier',
      legal: 'Juriste',
      worker: 'Employé',
      supplier: 'Fournisseur'
    };
    return displayNames[role] || role;
  }

  private static getRoleLevel(role: string): number {
    const levels: Record<string, number> = {
      admin: 10, director: 9, project_manager: 8,
      technical_manager: 7, engineering_consultant: 6,
      supervisor: 5, inspector: 5, finance_manager: 7,
      legal: 6, worker: 3, supplier: 2
    };
    return levels[role] || 1;
  }

  private static getRolePermissions(role: string): Permission[] {
    const permissions: Record<string, Permission[]> = {
      admin: ['approve_projects', 'approve_payments', 'schedule_inspections', 'execute_inspections', 'manage_team', 'manage_users', 'manage_system'],
      director: ['approve_projects', 'approve_payments', 'schedule_inspections', 'manage_team', 'manage_users'],
      project_manager: ['approve_projects', 'schedule_inspections', 'execute_inspections', 'manage_team'],
      technical_manager: ['schedule_inspections', 'execute_inspections', 'manage_team'],
      engineering_consultant: ['schedule_inspections', 'execute_inspections'],
      supervisor: ['execute_inspections', 'manage_team'],
      inspector: ['execute_inspections'],
      finance_manager: ['approve_payments'],
      legal: [], worker: [], supplier: []
    };
    return permissions[role] || [];
  }
}
