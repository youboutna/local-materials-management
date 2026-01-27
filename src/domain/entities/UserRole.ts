// Domain Entity: UserRole
// Dynamic role instance with configurable permissions

import { Permission } from './Employee';

export class UserRole {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly level: number,
    public readonly permissions: Permission[],
    public readonly description?: string,
    public readonly category?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt: string = new Date().toISOString()
  ) {}

  // Dynamic permission checking
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  hasPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  // Role comparison
  isSeniorTo(otherRole: UserRole): boolean {
    return this.level > otherRole.level;
  }

  isJuniorTo(otherRole: UserRole): boolean {
    return this.level < otherRole.level;
  }

  isSameLevel(otherRole: UserRole): boolean {
    return this.level === otherRole.level;
  }

  // Role validation
  isValid(): boolean {
    return !!(this.id && this.name && this.displayName && this.level > 0);
  }

  // Permission management (returns new instance - immutable)
  withPermission(permission: Permission): UserRole {
    if (this.hasPermission(permission)) return this;
    
    return new UserRole(
      this.id,
      this.name,
      this.displayName,
      this.level,
      [...this.permissions, permission],
      this.description,
      this.category,
      this.isActive,
      this.createdAt,
      new Date().toISOString()
    );
  }

  withoutPermission(permission: Permission): UserRole {
    if (!this.hasPermission(permission)) return this;
    
    return new UserRole(
      this.id,
      this.name,
      this.displayName,
      this.level,
      this.permissions.filter(p => p !== permission),
      this.description,
      this.category,
      this.isActive,
      this.createdAt,
      new Date().toISOString()
    );
  }

  withPermissions(permissions: Permission[]): UserRole {
    return new UserRole(
      this.id,
      this.name,
      this.displayName,
      this.level,
      permissions,
      this.description,
      this.category,
      this.isActive,
      this.createdAt,
      new Date().toISOString()
    );
  }

  // Role metadata
  getPermissionCount(): number {
    return this.permissions.length;
  }

  getPermissionNames(): string[] {
    return this.permissions;
  }

  // Factory methods
  static create(params: {
    id: string;
    name: string;
    displayName: string;
    level: number;
    permissions: Permission[];
    description?: string;
    category?: string;
  }): UserRole {
    return new UserRole(
      params.id,
      params.name,
      params.displayName,
      params.level,
      params.permissions,
      params.description,
      params.category
    );
  }

  // Predefined role factory methods
  static admin(): UserRole {
    return new UserRole(
      'admin',
      'admin',
      'Administrateur',
      10,
      ['approve_projects', 'approve_payments', 'schedule_inspections', 'execute_inspections', 'manage_team', 'manage_users', 'manage_system'],
      'Accès complet au système',
      'system'
    );
  }

  static director(): UserRole {
    return new UserRole(
      'director',
      'director',
      'Directeur',
      8,
      ['approve_projects', 'approve_payments', 'schedule_inspections', 'execute_inspections', 'manage_team', 'manage_users'],
      'Gestion stratégique',
      'management'
    );
  }

  static projectManager(): UserRole {
    return new UserRole(
      'project_manager',
      'project_manager',
      'Chef de Projet',
      6,
      ['approve_projects', 'schedule_inspections', 'execute_inspections', 'manage_team'],
      'Gestion de projets',
      'project'
    );
  }

  static technicalManager(): UserRole {
    return new UserRole(
      'technical_manager',
      'technical_manager',
      'Manager Technique',
      6,
      ['schedule_inspections', 'execute_inspections', 'manage_team'],
      'Supervision technique',
      'technical'
    );
  }

  static engineeringConsultant(): UserRole {
    return new UserRole(
      'engineering_consultant',
      'engineering_consultant',
      'Consultant Ingénieur',
      5,
      ['schedule_inspections', 'execute_inspections'],
      'Expertise technique',
      'consulting'
    );
  }

  static supervisor(): UserRole {
    return new UserRole(
      'supervisor',
      'supervisor',
      'Superviseur',
      4,
      ['execute_inspections'],
      'Supervision terrain',
      'field'
    );
  }

  static inspector(): UserRole {
    return new UserRole(
      'inspector',
      'inspector',
      'Inspecteur',
      4,
      ['execute_inspections'],
      'Contrôle qualité',
      'quality'
    );
  }

  static financeManager(): UserRole {
    return new UserRole(
      'finance_manager',
      'finance_manager',
      'Manager Financier',
      7,
      ['approve_payments'],
      'Gestion financière',
      'finance'
    );
  }

  static legal(): UserRole {
    return new UserRole(
      'legal',
      'legal',
      'Juridique',
      5,
      [],
      'Conseil juridique',
      'legal'
    );
  }

  static worker(): UserRole {
    return new UserRole(
      'worker',
      'worker',
      'Employé',
      2,
      [],
      'Exécution tâches',
      'operational'
    );
  }

  static supplier(): UserRole {
    return new UserRole(
      'supplier',
      'supplier',
      'Fournisseur',
      3,
      [],
      'Services externes',
      'external'
    );
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      level: this.level,
      permissions: this.permissions,
      description: this.description,
      category: this.category,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data: {
    id: string;
    name: string;
    displayName: string;
    level: number;
    permissions?: Permission[];
    description?: string;
    category?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }): UserRole {
    return new UserRole(
      data.id,
      data.name,
      data.displayName,
      data.level,
      data.permissions || [],
      data.description,
      data.category,
      data.isActive ?? true,
      data.createdAt,
      data.updatedAt
    );
  }
}
