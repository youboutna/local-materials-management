/**
 * Domain Entity: Stakeholder
 * Représente une partie prenante dans un projet
 * Peut être un employé interne ou une organisation externe (fournisseur, sous-traitant, etc.)
 */

export type StakeholderType = 
  | 'employee'           // Employé interne (inspecteur, responsable, etc.)
  | 'supplier'           // Fournisseur de matériaux
  | 'subcontractor'      // Sous-traitant
  | 'consultant'         // Bureau d'étude / consultant
  | 'contractor'         // Contractant principal
  | 'freelancer'         // Freelance
  | 'client'             // Client
  | 'partner';           // Partenaire

export type StakeholderRole = 
  | 'project_manager'
  | 'technical_manager'
  | 'site_manager'
  | 'quality_inspector'
  | 'safety_inspector'
  | 'engineer'
  | 'architect'
  | 'consultant'
  | 'supplier'
  | 'subcontractor'
  | 'contractor'
  | 'client'
  | 'partner'
  | 'observer';

export interface StakeholderContact {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface StakeholderOrganization {
  id: string;
  name: string;
  type: StakeholderType;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  nif?: string;
  registrationNumber?: string;
}

export class Stakeholder {
  // Private fields for encapsulation
  private _id: string;
  private _projectId: string;
  private _type: StakeholderType;
  private _role: StakeholderRole;
  private _organizationId: string | null;
  private _employeeId: string | null;
  private _isPrimary: boolean;
  private _isInternal: boolean;
  private _contact: StakeholderContact;
  private _organization: StakeholderOrganization | null;
  private _responsibilities: string[];
  private _accessLevel: 'read' | 'write' | 'admin' | 'full';
  private _startDate: string | null;
  private _endDate: string | null;
  private _hourlyRate: number | null;
  private _contractType: string | null;
  private _notes: string | null;
  private _isActive: boolean;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    projectId: string,
    type: StakeholderType,
    role: StakeholderRole,
    organizationId: string | null,
    employeeId: string | null,
    isPrimary: boolean,
    isInternal: boolean,
    contact: StakeholderContact,
    organization: StakeholderOrganization | null,
    responsibilities: string[],
    accessLevel: 'read' | 'write' | 'admin' | 'full',
    startDate: string | null,
    endDate: string | null,
    hourlyRate: number | null,
    contractType: string | null,
    notes: string | null,
    isActive: boolean,
    createdAt: string,
    updatedAt: string
  ) {
    this._id = id;
    this._projectId = projectId;
    this._type = type;
    this._role = role;
    this._organizationId = organizationId;
    this._employeeId = employeeId;
    this._isPrimary = isPrimary;
    this._isInternal = isInternal;
    this._contact = contact;
    this._organization = organization;
    this._responsibilities = responsibilities;
    this._accessLevel = accessLevel;
    this._startDate = startDate;
    this._endDate = endDate;
    this._hourlyRate = hourlyRate;
    this._contractType = contractType;
    this._notes = notes;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string { return this._id; }
  get projectId(): string { return this._projectId; }
  get type(): StakeholderType { return this._type; }
  get role(): StakeholderRole { return this._role; }
  get organizationId(): string | null { return this._organizationId; }
  get employeeId(): string | null { return this._employeeId; }
  get isPrimary(): boolean { return this._isPrimary; }
  get isInternal(): boolean { return this._isInternal; }
  get contact(): StakeholderContact { return this._contact; }
  get organization(): StakeholderOrganization | null { return this._organization; }
  get responsibilities(): string[] { return [...this._responsibilities]; }
  get accessLevel(): 'read' | 'write' | 'admin' | 'full' { return this._accessLevel; }
  get startDate(): string | null { return this._startDate; }
  get endDate(): string | null { return this._endDate; }
  get hourlyRate(): number | null { return this._hourlyRate; }
  get contractType(): string | null { return this._contractType; }
  get notes(): string | null { return this._notes; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // Business Logic Methods
  isEmployee(): boolean {
    return this._type === 'employee' && this._employeeId !== null;
  }

  isExternal(): boolean {
    return this._type !== 'employee' && this._organizationId !== null;
  }

  isSupplier(): boolean {
    return ['supplier', 'subcontractor', 'consultant', 'contractor'].includes(this._type);
  }

  isInspector(): boolean {
    return ['quality_inspector', 'safety_inspector'].includes(this._role);
  }

  isManager(): boolean {
    return ['project_manager', 'technical_manager', 'site_manager'].includes(this._role);
  }

  canRead(): boolean {
    return ['read', 'write', 'admin', 'full'].includes(this._accessLevel);
  }

  canWrite(): boolean {
    return ['write', 'admin', 'full'].includes(this._accessLevel);
  }

  canAdmin(): boolean {
    return ['admin', 'full'].includes(this._accessLevel);
  }

  hasFullAccess(): boolean {
    return this._accessLevel === 'full';
  }

  isActiveInProject(): boolean {
    if (!this._isActive) return false;
    
    const now = new Date();
    if (this._startDate && new Date(this._startDate) > now) return false;
    if (this._endDate && new Date(this._endDate) < now) return false;
    
    return true;
  }

  getDisplayName(): string {
    if (this._isInternal && this._contact.name) {
      return this._contact.name;
    }
    
    if (this._organization) {
      return this._organization.name;
    }
    
    return this._contact.name || 'Inconnu';
  }

  getFullTitle(): string {
    const name = this.getDisplayName();
    const position = this._contact.position || this._role;
    
    if (this._organization) {
      return `${name} - ${position} @ ${this._organization.name}`;
    }
    
    return `${name} - ${position}`;
  }

  addResponsibility(responsibility: string): void {
    if (!this._responsibilities.includes(responsibility)) {
      this._responsibilities.push(responsibility);
    }
  }

  removeResponsibility(responsibility: string): void {
    const index = this._responsibilities.indexOf(responsibility);
    if (index > -1) {
      this._responsibilities.splice(index, 1);
    }
  }

  updateAccessLevel(level: 'read' | 'write' | 'admin' | 'full'): void {
    this._accessLevel = level;
  }

  setPrimary(isPrimary: boolean): void {
    this._isPrimary = isPrimary;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  // Factory methods
  static createEmployeeStakeholder(
    projectId: string,
    employeeId: string,
    role: StakeholderRole,
    contact: StakeholderContact,
    responsibilities: string[] = []
  ): Stakeholder {
    const id = `stakeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    return new Stakeholder(
      id,
      projectId,
      'employee',
      role,
      null,
      employeeId,
      false,
      true,
      contact,
      null,
      responsibilities,
      'write',
      now,
      null,
      null,
      null,
      null,
      true,
      now,
      now
    );
  }

  static createExternalStakeholder(
    projectId: string,
    type: StakeholderType,
    role: StakeholderRole,
    organization: StakeholderOrganization,
    contact: StakeholderContact,
    responsibilities: string[] = []
  ): Stakeholder {
    const id = `stakeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    return new Stakeholder(
      id,
      projectId,
      type,
      role,
      organization.id,
      null,
      false,
      false,
      contact,
      organization,
      responsibilities,
      'read',
      now,
      null,
      null,
      null,
      null,
      true,
      now,
      now
    );
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._projectId || this._projectId.trim() === '') {
      errors.push('L\'ID du projet est requis');
    }

    if (!this._contact.name || this._contact.name.trim() === '') {
      errors.push('Le nom du contact est requis');
    }

    if (!this._contact.email || this._contact.email.trim() === '') {
      errors.push('L\'email du contact est requis');
    }

    if (this._isInternal && !this._employeeId) {
      errors.push('L\'ID de l\'employé est requis pour les parties prenantes internes');
    }

    if (!this._isInternal && !this._organizationId) {
      errors.push('L\'ID de l\'organisation est requis pour les parties prenantes externes');
    }

    if (this._responsibilities.length === 0) {
      errors.push('Au moins une responsabilité est requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
