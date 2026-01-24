// Domain Entity: Position
// Dynamic position instance with hierarchical structure

import { UserRole } from './UserRole';

export interface PositionPermissions {
  can_approve_projects: boolean;
  can_approve_payments: boolean;
  can_escalate_to_director: boolean;
  can_schedule_inspections: boolean;
  can_execute_inspections: boolean;
  can_manage_team: boolean;
  can_manage_users: boolean;
  can_manage_system: boolean;
}

export class Position {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly department: string,
    public readonly category: string,
    public readonly level: number,
    public readonly permissions: PositionPermissions,
    public readonly parentId: string | null,
    public readonly description?: string,
    public readonly requirements?: string[],
    public readonly responsibilities?: string[],
    public readonly isActive: boolean = true,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt: string = new Date().toISOString()
  ) {}

  // Hierarchical relationships
  isRootPosition(): boolean {
    return this.parentId === null && this.level === 1;
  }

  isChildOf(parentPosition: Position): boolean {
    return this.parentId === parentPosition.id;
  }

  isParentOf(childPosition: Position): boolean {
    return childPosition.parentId === this.id;
  }

  isAtSameLevel(otherPosition: Position): boolean {
    return this.level === otherPosition.level;
  }

  isSeniorTo(otherPosition: Position): boolean {
    return this.level < otherPosition.level; // Lower level number = higher seniority
  }

  isJuniorTo(otherPosition: Position): boolean {
    return this.level > otherPosition.level;
  }

  // Permission checking
  hasPermission(permission: keyof PositionPermissions): boolean {
    return this.permissions[permission];
  }

  hasAllPermissions(permissions: (keyof PositionPermissions)[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  hasAnyPermission(permissions: (keyof PositionPermissions)[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  // Position validation
  isValid(): boolean {
    return !!(this.id && this.title && this.department && this.category && this.level > 0);
  }

  // Position metadata
  getPermissionCount(): number {
    return Object.values(this.permissions).filter(Boolean).length;
  }

  getActivePermissions(): (keyof PositionPermissions)[] {
    return (Object.keys(this.permissions) as (keyof PositionPermissions)[])
      .filter(key => this.permissions[key]);
  }

  // Position comparison
  isSimilarTo(otherPosition: Position): boolean {
    const titleSimilarity = this.calculateTitleSimilarity(this.title, otherPosition.title);
    const departmentMatch = this.department.toLowerCase() === otherPosition.department.toLowerCase();
    const levelMatch = Math.abs(this.level - otherPosition.level) <= 1;
    
    return titleSimilarity > 0.7 && departmentMatch && levelMatch;
  }

  private calculateTitleSimilarity(title1: string, title2: string): number {
    const normalized1 = this.normalizeTitle(title1);
    const normalized2 = this.normalizeTitle(title2);
    
    if (normalized1 === normalized2) return 1.0;
    
    // Simple word-based similarity
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Immutable updates (return new instances)
  withPermission(permission: keyof PositionPermissions, value: boolean): Position {
    return new Position(
      this.id,
      this.title,
      this.department,
      this.category,
      this.level,
      { ...this.permissions, [permission]: value },
      this.parentId,
      this.description,
      this.requirements,
      this.responsibilities,
      this.isActive,
      this.createdAt,
      new Date().toISOString()
    );
  }

  withParent(parentId: string | null): Position {
    return new Position(
      this.id,
      this.title,
      this.department,
      this.category,
      this.level,
      this.permissions,
      parentId,
      this.description,
      this.requirements,
      this.responsibilities,
      this.isActive,
      this.createdAt,
      this.updatedAt
    );
  }

  // Factory methods
  static create(params: {
    id: string;
    title: string;
    department: string;
    category: string;
    level: number;
    permissions: PositionPermissions;
    parentId?: string | null;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
  }): Position {
    return new Position(
      params.id,
      params.title,
      params.department,
      params.category,
      params.level,
      params.permissions,
      params.parentId || null,
      params.description,
      params.requirements,
      params.responsibilities
    );
  }

  // Predefined position factory methods
  static directorGeneral(): Position {
    return new Position(
      'director-general',
      'Directeur Général',
      'Direction Générale',
      'décisionnel',
      1,
      {
        can_approve_projects: true,
        can_approve_payments: true,
        can_escalate_to_director: false,
        can_schedule_inspections: true,
        can_execute_inspections: true,
        can_manage_team: true,
        can_manage_users: true,
        can_manage_system: true
      },
      null,
      'Responsable de la stratégie globale et de la direction de l\'entreprise'
    );
  }

  static technicalDirector(): Position {
    return new Position(
      'technical-director',
      'Directeur des Études et des Travaux',
      'Études et Travaux',
      'technique',
      2,
      {
        can_approve_projects: true,
        can_approve_payments: true,
        can_escalate_to_director: true,
        can_schedule_inspections: true,
        can_execute_inspections: true,
        can_manage_team: true,
        can_manage_users: false,
        can_manage_system: false
      },
      'director-general',
      'Supervision technique des projets et des études'
    );
  }

  static projectManager(): Position {
    return new Position(
      'project-manager',
      'Chef de Projet',
      'Études et Travaux',
      'technique',
      3,
      {
        can_approve_projects: false,
        can_approve_payments: false,
        can_escalate_to_director: false,
        can_schedule_inspections: true,
        can_execute_inspections: true,
        can_manage_team: true,
        can_manage_users: false,
        can_manage_system: false
      },
      'technical-director',
      'Gestion quotidienne des projets'
    );
  }

  static siteManager(): Position {
    return new Position(
      'site-manager',
      'Chef Chantier',
      'Études et Travaux',
      'opérationnel',
      3,
      {
        can_approve_projects: false,
        can_approve_payments: false,
        can_escalate_to_director: false,
        can_schedule_inspections: false,
        can_execute_inspections: true,
        can_manage_team: false,
        can_manage_users: false,
        can_manage_system: false
      },
      'technical-director',
      'Supervision des opérations sur chantier'
    );
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      department: this.department,
      category: this.category,
      level: this.level,
      permissions: this.permissions,
      parentId: this.parentId,
      description: this.description,
      requirements: this.requirements,
      responsibilities: this.responsibilities,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data: any): Position {
    return new Position(
      data.id,
      data.title,
      data.department,
      data.category,
      data.level,
      data.permissions,
      data.parentId,
      data.description,
      data.requirements,
      data.responsibilities,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }
}
