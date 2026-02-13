/**
 * Project Domain Entity
 * Simplified class based on actual form and repository implementation
 * Following hexagonal architecture principles
 */

import { User } from './User';
import { Payment } from './Payment';
import { Inspection } from './Inspection';
import { Task } from './Task';
import { Document } from './Document';
import { Material } from './Material';
import { Supplier } from './Supplier';
import { Employee } from './Employee';
import { Phase } from './Phase';
import { Milestone } from './Milestone';
import { Tender } from './Tender';
import { Risk } from './Risk';
import { GeographicUnit } from '@/utils/mauritania';

// Interface for project resources
interface ProjectResource {
  id: string;
  name: string;
  type: 'human' | 'material' | 'equipment';
  quantity?: number;
  unit?: string;
  cost?: number;
  assignedTo?: string;
}

// Re-export ProjectStatus from DTO for type alignment
import { ProjectStatus as DTOProjectStatus } from '@/dtos/entities/ProjectDTO';
export type ProjectStatus = DTOProjectStatus;
export { ProjectStatus } from '@/dtos/entities/ProjectDTO';

// Interface commune pour les références de projet (Employee ou Supplier)
export interface ProjectStakeholder {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  type: 'employee' | 'supplier';
}

export class ProjectCoordinates {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Methods
  isValid(): boolean {
    return !isNaN(this.latitude) && !isNaN(this.longitude);
  }

  toString(): string {
    return `${this.latitude}, ${this.longitude}`;
  }
}

export interface ProjectBudget {
  total: number; // In MRU (auto-convert if USD entered)
  spent: number;
  currency: "MRU" | "USD"; // Defaults to MRU
  exchangeRate?: number; // For USD conversions
  lastUpdated: Date;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export interface Tag {
  id: string; // Unique identifier
  name: string; // Display name ("Construction")
  slug: string; // URL-safe version ("construction")
  color?: string; // For UI display ("#FF5733")
  description?: string; // Additional context
  userId: string;
}

export interface TimeLine {
  start: Date; // Auto-set to Mauritania timezone
  end: Date;
  estimatedDuration?: number; // In days
}

export class Project {
  // Private fields for encapsulation
  private _id: string;
  private _title: string;
  private _description: string;
  private _status: ProjectStatus;
  private _progress: number;
  private _budget: number;
  private _startDate: Date | null;
  private _endDate: Date | null;
  private _location?: string;
  private _teamSize?: number;
  private _thumbnail?: string;
  private _createdBy?: string;
  private _metadata?: Record<string, unknown>;
  private _updatedAt?: Date;
  private _createdAt?: Date;
  private _coordinates?: ProjectCoordinates;
  private _financingSource?: string;
  private _marketType?: string;
  private _selectionMode?: string;
  private _methodology?: string;
  private _mainContractor?: string | ProjectStakeholder;
  private _currency?: string;
  
  // Financial and insurance attributes
  private _bankGuaranteeRequired?: boolean;
  private _bankGuaranteeAmount?: number;
  private _bankGuaranteePercentage?: number;
  private _insuranceRequired?: boolean;
  private _materialsBudget?: number;
  private _procurementLeadTime?: number;
  private _resourceAssignment?: ProjectResource[];
  private _receptionStatus?: string;
  private _closureNotes?: string;
  private _clientOrganization?: string;
  private _donorOrganization?: string;
  private _sector?: string;
  private _projectType?: string;
  private _priority?: string;
  private _geographicZone?: string;
  private _terrainType?: string;
  private _environmentalConstraints?: string;
  private _areaSqm?: number;
  private _projectReferenceNumber?: string;
  private _projectOrder?: string;
  private _clientId?: string;
  private _currentPhase?: string;
  private _initialPaymentPercentage?: number;
  private _paymentFrequency?: string;
  private _paymentMode?: string;
  private _supervisorId?: string;
  private _completionDate?: Date;
  private _customFields?: Record<string, string | number | boolean>;
  private _estimatedDays?: number;
  private _launchDate?: Date;
  private _attributionDate?: Date;
  
  // Payment and financial settings
  
  // Validation and requirements properties
  private _requiresConsultantValidation?: boolean;
  private _requiresMinistryApproval?: boolean;
  private _requiresPermits?: boolean;
  private _permitNumber?: string;
  private _hasUtilities?: boolean;
  
  // Optional references (loaded when needed)
  private _engineeringConsultant?: User | ProjectStakeholder;
  private _technicalManager?: User | ProjectStakeholder;
  private _projectResponsable?: User | ProjectStakeholder;
  private _supervisor?: User | ProjectStakeholder;
  
  // Collections (direct entity relationships)
  private _payments?: Payment[];
  private _inspections?: Inspection[];
  private _tasks?: Task[];
  private _documents?: Document[];
  private _materials?: Material[];
  private _phases?: Phase[];
  private _milestones?: Milestone[];
  private _risks?: Risk[];
  private _tenders?: Tender[];
  private _suppliers?: Supplier[];
  private _employees?: Employee[];
  private _projectReference?: string;
  
  // Additional relationship properties (removed duplicates, now using getters)
  private _bankGuarantees?: { id: string; amount: number }[];
  private _insuranceCertificates?: { id: string; date: Date }[];
  private _projectAlerts?: { id: string; message: string }[];
  private _projectComments?: { id: string; comment: string }[];
  private _projectOrganizations?: { id: string; name: string }[];
  private _quantityTakeoffs?: Record<string, unknown>[];
  private _progressInvoices?: { id: string; date: Date }[];
  private _paymentBlocks?: { id: string; amount: number }[];
  private _supplierPaymentRequests?: { id: string; date: Date }[];
  private _taskAssignments?: { id: string; taskId: string }[];
  private _projectResources?: { id: string; resourceId: string }[];

  constructor(
    // Core attributes from form and database
    id: string,
    title: string,
    description: string,
    status: ProjectStatus,
    progress: number,
    budget: number,
    startDate: Date | null,
    endDate: Date | null,
    
    // Simple attributes
    location?: string,
    teamSize?: number,
    thumbnail?: string,
    createdBy?: string,
    createdAt?: Date,
    updatedAt?: Date,
    
    // Object references
    coordinates?: ProjectCoordinates,
    financingSource?: string,
    mainContractor?: string | ProjectStakeholder,
    currency?: string,
    
    // Collections (direct entity relationships)
    payments?: Payment[],
    inspections?: Inspection[],
    tasks?: Task[],
    documents?: Document[],
    materials?: Material[],
    phases?: Phase[],
    milestones?: Milestone[],
    risks?: Risk[],
    tenders?: Tender[],
    suppliers?: Supplier[],
    employees?: Employee[]
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._title = this.validateTitle(title);
    this._description = description;
    this._status = this.validateStatus(status);
    this._progress = this.validateProgress(progress);
    this._budget = this.validateBudget(budget);
    this._startDate = startDate;
    this._endDate = endDate;
    
    // Assign other fields
    this._location = location;
    this._teamSize = teamSize;
    this._thumbnail = thumbnail;
    this._createdBy = createdBy;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._coordinates = coordinates;
    this._financingSource = financingSource;
    this._mainContractor = mainContractor;
    this._currency = currency;
    
    // Collections
    this._payments = payments;
    this._inspections = inspections;
    this._tasks = tasks;
    this._documents = documents;
    this._materials = materials;
    this._phases = phases;
    this._milestones = milestones;
    this._risks = risks;
    this._tenders = tenders;
    this._suppliers = suppliers;
    this._employees = employees;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get status(): ProjectStatus { return this._status; }
  get progress(): number { return this._progress; }
  get budget(): number { return this._budget; }
  get startDate(): Date | null { return this._startDate; }
  get endDate(): Date | null { return this._endDate; }
  get location(): string | undefined { return this._location; }
  get teamSize(): number | undefined { return this._teamSize; }
  get thumbnail(): string | undefined { return this._thumbnail; }
  get createdBy(): string | undefined { return this._createdBy; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }
  get coordinates(): ProjectCoordinates | undefined { return this._coordinates; }
  get financingSource(): string | undefined { return this._financingSource; }
  get marketType(): string | undefined { return this._marketType; }
  get selectionMode(): string | undefined { return this._selectionMode; }
  get methodology(): string | undefined { return this._methodology; }
  get mainContractor(): string | ProjectStakeholder | undefined { return this._mainContractor; }
  get currency(): string | undefined { return this._currency; }
  
  // Financial and insurance getters
  get bankGuaranteeRequired(): boolean | undefined { return this._bankGuaranteeRequired; }
  get bankGuaranteeAmount(): number | undefined { return this._bankGuaranteeAmount; }
  get bankGuaranteePercentage(): number | undefined { return this._bankGuaranteePercentage; }
  get insuranceRequired(): boolean | undefined { return this._insuranceRequired; }
  get materialsBudget(): number | undefined { return this._materialsBudget; }
  get procurementLeadTime(): number | undefined { return this._procurementLeadTime; }
  
  // Relationship getters
  get bankGuarantees(): { id: string; amount: number }[] { return this._bankGuarantees || []; }
  get insuranceCertificates(): { id: string; date: Date }[] { return this._insuranceCertificates || []; }
  get projectAlerts(): { id: string; message: string }[] { return this._projectAlerts || []; }
  get projectComments(): { id: string; comment: string }[] { return this._projectComments || []; }
  get projectOrganizations(): { id: string; name: string }[] { return this._projectOrganizations || []; }
  get quantityTakeoffs(): Record<string, unknown>[] { return this._quantityTakeoffs || []; }
  get progressInvoices(): { id: string; date: Date }[] { return this._progressInvoices || []; }
  get paymentBlocks(): { id: string; amount: number }[] { return this._paymentBlocks || []; }
  get checkScheduleLastRun(): Record<string, unknown> | undefined { return this._checkScheduleLastRun; }
  get closureNotes(): string | undefined { return this._closureNotes; }
  get forme(): string | undefined { return this._forme; }
  get fundingSource(): string | undefined { return this._fundingSource; }
  get localisation(): Record<string, unknown> | undefined { return this._localisation; }
  get paymentWorkflowConfig(): Record<string, unknown> | undefined { return this._paymentWorkflowConfig; }
  get projectResponsableId(): string | undefined { return this._projectResponsableId; }
  get siteDetails(): string | undefined { return this._siteDetails; }
  
  get clientOrganization(): string | undefined { return this._clientOrganization; }
  get donorOrganization(): string | undefined { return this._donorOrganization; }
  get sector(): string | undefined { return this._sector; }
  get projectType(): string | undefined { return this._projectType; }
  get priority(): string | undefined { return this._priority; }
  get geographicZone(): string | undefined { return this._geographicZone; }
  get terrainType(): string | undefined { return this._terrainType; }
  get environmentalConstraints(): string | undefined { return this._environmentalConstraints; }
  get areaSqm(): number | undefined { return this._areaSqm; }
  get projectReferenceNumber(): string | undefined { return this._projectReferenceNumber; }
  get projectOrder(): string | undefined { return this._projectOrder; }
  get clientId(): string | undefined { return this._clientId; }
  get currentPhase(): string | undefined { return this._currentPhase; }
  get currentStage(): string | undefined { return this._currentStage; }
  get allowsInitialPayment(): boolean | undefined { return this._allowsInitialPayment; }
  get initialPaymentPercentage(): number | undefined { return this._initialPaymentPercentage; }
  get paymentFrequency(): string | undefined { return this._paymentFrequency; }
  get paymentMode(): string | undefined { return this._paymentMode; }
  get retentionPercentage(): number | undefined { return this._retentionPercentage; }
  get initialAdvancePercentage(): number | undefined { return this._initialAdvancePercentage; }
  get completionDate(): Date | undefined { return this._completionDate; }
  get estimatedDays(): number | undefined { return this._estimatedDays; }
  get launchDate(): Date | undefined { return this._launchDate; }
  get attributionDate(): Date | undefined { return this._attributionDate; }
  get requiresConsultantValidation(): boolean | undefined { return this._requiresConsultantValidation; }
  get requiresMinistryApproval(): boolean | undefined { return this._requiresMinistryApproval; }
  get requiresPermits(): boolean | undefined { return this._requiresPermits; }
  get permitNumber(): string | undefined { return this._permitNumber; }
  get hasUtilities(): boolean | undefined { return this._hasUtilities; }
  get engineeringConsultant(): User | ProjectStakeholder | undefined { return this._engineeringConsultant; }
  get technicalManager(): User | ProjectStakeholder | undefined { return this._technicalManager; }
  get projectResponsable(): User | ProjectStakeholder | undefined { return this._projectResponsable; }
  get supervisor(): User | ProjectStakeholder | undefined { return this._supervisor; }
  get payments(): Payment[] | undefined { return this._payments; }
  get inspections(): Inspection[] | undefined { return this._inspections; }
  get tasks(): Task[] | undefined { return this._tasks; }
  get documents(): Document[] | undefined { return this._documents; }
  get materials(): Material[] | undefined { return this._materials; }
  get phases(): Phase[] | undefined { return this._phases; }
  get milestones(): Milestone[] | undefined { return this._milestones; }
  get risks(): Risk[] | undefined { return this._risks; }
  get tenders(): Tender[] | undefined { return this._tenders; }
  get suppliers(): Supplier[] | undefined { return this._suppliers; }
  get employees(): Employee[] | undefined { return this._employees; }
  get projectReference(): string | undefined { return this._projectReference; }
  get receptionStatus(): string | undefined { return this._receptionStatus; }
  get resourceAssignment(): ProjectResource[] | undefined { return this._resourceAssignment; }
  get supervisorId(): string | undefined { 
    return typeof this._supervisor === 'string' ? this._supervisor : this._supervisor?.id; 
  }

  // ============= Setters with Validation =============
  set title(value: string) { 
    this._title = this.validateTitle(value); 
    this._updatedAt = new Date();
  }
  
  set description(value: string) { 
    this._description = value; 
    this._updatedAt = new Date();
  }
  
  set status(value: ProjectStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date();
  }
  
  set progress(value: number) { 
    this._progress = this.validateProgress(value); 
    this._updatedAt = new Date();
  }
  
  set budget(value: number) { 
    this._budget = this.validateBudget(value); 
    this._updatedAt = new Date();
  }
  
  set startDate(value: Date | null) { 
    this._startDate = value; 
    this._updatedAt = new Date();
  }
  
  set endDate(value: Date | null) { 
    this._endDate = value; 
    this._updatedAt = new Date();
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: ProjectStatus): Project {
    return new Project(
      this._id,
      this._title,
      this._description,
      this.validateStatus(newStatus),
      this._progress,
      this._budget,
      this._startDate,
      this._endDate,
      this._location,
      this._teamSize,
      this._thumbnail,
      this._createdBy,
      this._createdAt,
      new Date(),
      this._coordinates,
      this._financingSource,
      this._mainContractor,
      this._currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }

  withProgress(newProgress: number): Project {
    return new Project(
      this._id,
      this._title,
      this._description,
      this._status,
      this.validateProgress(newProgress),
      this._budget,
      this._startDate,
      this._endDate,
      this._location,
      this._teamSize,
      this._thumbnail,
      this._createdBy,
      this._createdAt,
      new Date(),
      this._coordinates,
      this._financingSource,
      this._mainContractor,
      this._currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }

  withBudget(newBudget: number): Project {
    return new Project(
      this._id,
      this._title,
      this._description,
      this._status,
      this._progress,
      this.validateBudget(newBudget),
      this._startDate,
      this._endDate,
      this._location,
      this._teamSize,
      this._thumbnail,
      this._createdBy,
      this._createdAt,
      new Date(),
      this._coordinates,
      this._financingSource,
      this._mainContractor,
      this._currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }
  
  set location(value: string | undefined) { 
    this._location = value; 
    this._updatedAt = new Date();
  }
  
  set teamSize(value: number | undefined) { 
    this._teamSize = value; 
    this._updatedAt = new Date();
  }
  
  set initialPaymentPercentage(value: number | undefined) { 
    this._initialPaymentPercentage = this.validatePercentage(value); 
    this._updatedAt = new Date();
  }
  
  set retentionPercentage(value: number | undefined) { 
    this._retentionPercentage = this.validatePercentage(value); 
    this._updatedAt = new Date();
  }
  
  set initialAdvancePercentage(value: number | undefined) { 
    this._initialAdvancePercentage = this.validatePercentage(value); 
    this._updatedAt = new Date();
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Project ID is required');
    }
    return id.trim();
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Project title is required');
    }
    if (title.length > 200) {
      throw new Error('Project title must be less than 200 characters');
    }
    return title.trim();
  }

  private validateStatus(status: ProjectStatus): ProjectStatus {
    // The status is already validated by the DTO enum, so just return it
    return status;
  }

  private validateProgress(progress: number): number {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    return progress;
  }

  private validateBudget(budget: number): number {
    if (budget < 0) {
      throw new Error('Budget must be positive');
    }
    return budget;
  }

  private validatePercentage(value: number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return value;
  }

  // ============= Transformation Methods for Services =============
  
  // Create a copy with updated fields (immutable pattern)
  clone(updates: {
    id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
    progress?: number;
    budget?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    location?: string;
    teamSize?: number;
    thumbnail?: string;
    createdBy?: string;
    createdAt?: Date;
    coordinates?: ProjectCoordinates;
    financingSource?: string;
    mainContractor?: string | ProjectStakeholder;
    currency?: string;
    payments?: Payment[];
    inspections?: Inspection[];
    tasks?: Task[];
    documents?: Document[];
    materials?: Material[];
    phases?: Phase[];
    milestones?: Milestone[];
    risks?: Risk[];
    tenders?: Tender[];
    suppliers?: Supplier[];
    employees?: Employee[];
  }): Project {
    return new Project(
      updates.id !== undefined ? updates.id : this._id,
      updates.title !== undefined ? updates.title : this._title,
      updates.description !== undefined ? updates.description : this._description,
      updates.status !== undefined ? updates.status : this._status,
      updates.progress !== undefined ? updates.progress : this._progress,
      updates.budget !== undefined ? updates.budget : this._budget,
      updates.startDate !== undefined ? updates.startDate : this._startDate,
      updates.endDate !== undefined ? updates.endDate : this._endDate,
      updates.location !== undefined ? updates.location : this._location,
      updates.teamSize !== undefined ? updates.teamSize : this._teamSize,
      updates.thumbnail !== undefined ? updates.thumbnail : this._thumbnail,
      updates.createdBy !== undefined ? updates.createdBy : this._createdBy,
      updates.createdAt !== undefined ? updates.createdAt : this._createdAt,
      new Date(), // Always update timestamp on clone
      updates.coordinates !== undefined ? updates.coordinates : this._coordinates,
      updates.financingSource !== undefined ? updates.financingSource : this._financingSource,
      updates.mainContractor !== undefined ? updates.mainContractor : this._mainContractor,
      updates.currency !== undefined ? updates.currency : this._currency,
      updates.payments !== undefined ? updates.payments : this._payments,
      updates.inspections !== undefined ? updates.inspections : this._inspections,
      updates.tasks !== undefined ? updates.tasks : this._tasks,
      updates.documents !== undefined ? updates.documents : this._documents,
      updates.materials !== undefined ? updates.materials : this._materials,
      updates.phases !== undefined ? updates.phases : this._phases,
      updates.milestones !== undefined ? updates.milestones : this._milestones,
      updates.risks !== undefined ? updates.risks : this._risks,
      updates.tenders !== undefined ? updates.tenders : this._tenders,
      updates.suppliers !== undefined ? updates.suppliers : this._suppliers,
      updates.employees !== undefined ? updates.employees : this._employees
    );
  }

  // Update multiple fields at once
  updateFields(fields: {
    title?: string;
    description?: string;
    status?: ProjectStatus;
    progress?: number;
    budget?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    location?: string;
    teamSize?: number;
    initialPaymentPercentage?: number;
    retentionPercentage?: number;
    initialAdvancePercentage?: number;
  }): Project {
    return this.clone(fields);
  }

  // Validation method for services
  validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateId(this._id);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      errors.push(error.message);
    }

    try {
      this.validateTitle(this._title);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      errors.push(error.message);
    }

    try {
      this.validateStatus(this._status);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      errors.push(error.message);
    }

    try {
      this.validateProgress(this._progress);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      errors.push(error.message);
    }

    try {
      this.validateBudget(this._budget);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      errors.push(error.message);
    }

    // Business logic validations
    if (this._startDate && this._endDate && this._startDate > this._endDate) {
      errors.push('Start date must be before end date');
    }

    if (this._progress === 100 && this._status !== ProjectStatus.TERMINE) {
      warnings.push('Project is 100% complete but status is not "Terminé"');
    }

    if (this._progress === 0 && this._status === ProjectStatus.EN_COURS) {
      warnings.push('Project has 0% progress but status is "En cours"');
    }

    if (this._budget > 0 && this._estimatedDays && this._estimatedDays > 0) {
      const dailyBudget = this._budget / this._estimatedDays;
      if (dailyBudget > 100000) {
        warnings.push('Daily budget seems very high');
      }
    }

    if (this._requiresPermits && !this._permitNumber) {
      warnings.push('Project requires permits but no permit number is provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get project summary for services
  getSummary(): {
    id: string;
    title: string;
    status: ProjectStatus;
    progress: number;
    budget: number;
    isActive: boolean;
    isCompleted: boolean;
    isOverdue: boolean;
    daysRemaining: number;
    riskScore: number;
  } {
    return {
      id: this._id,
      title: this._title,
      status: this._status,
      progress: this._progress,
      budget: this._budget,
      isActive: this.isActive(),
      isCompleted: this.isCompleted(),
      isOverdue: this.isOverdue(),
      daysRemaining: this.getDaysRemaining(),
      riskScore: this.getRiskScore()
    };
  }

  // Convert to plain object for services
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      status: this._status,
      progress: this._progress,
      budget: this._budget,
      startDate: this._startDate?.toISOString(),
      endDate: this._endDate?.toISOString(),
      location: this._location,
      teamSize: this._teamSize,
      createdBy: this._createdBy,
      createdAt: this._createdAt?.toISOString(),
      updatedAt: this._updatedAt?.toISOString(),
      coordinates: this._coordinates ? {
        latitude: this._coordinates.latitude,
        longitude: this._coordinates.longitude
      } : undefined,
      financingSource: this._financingSource,
      mainContractor: typeof this._mainContractor === 'string' ? this._mainContractor : this._mainContractor?.id,
      currency: this._currency,
      clientOrganization: this._clientOrganization,
      donorOrganization: this._donorOrganization,
      sector: this._sector,
      projectType: this._projectType,
      priority: this._priority,
      geographicZone: this._geographicZone,
      terrainType: this._terrainType,
      environmentalConstraints: this._environmentalConstraints,
      areaSqm: this._areaSqm,
      projectReferenceNumber: this._projectReferenceNumber,
      projectOrder: this._projectOrder,
      clientId: this._clientId,
      currentPhase: this._currentPhase,
      currentStage: this._currentStage,
      allowsInitialPayment: this._allowsInitialPayment,
      initialPaymentPercentage: this._initialPaymentPercentage,
      paymentFrequency: this._paymentFrequency,
      paymentMode: this._paymentMode,
      retentionPercentage: this._retentionPercentage,
      initialAdvancePercentage: this._initialAdvancePercentage,
      completionDate: this._completionDate?.toISOString(),
      estimatedDays: this._estimatedDays,
      launchDate: this._launchDate?.toISOString(),
      attributionDate: this._attributionDate?.toISOString(),
      requiresConsultantValidation: this._requiresConsultantValidation,
      requiresMinistryApproval: this._requiresMinistryApproval,
      requiresPermits: this._requiresPermits,
      permitNumber: this._permitNumber,
      hasUtilities: this._hasUtilities,
      projectReference: this._projectReference
    };
  }

  // Factory method for services
  static createFromPlainObject(data: Record<string, unknown>): Project {
    return new Project(
      data.id as string,
      data.title as string,
      (data.description || '') as string,
      data.status as ProjectStatus,
      (data.progress || 0) as number,
      (data.budget || 0) as number,
      data.startDate ? new Date(data.startDate as string) : null,
      data.endDate ? new Date(data.endDate as string) : null,
      data.location as string,
      data.teamSize as number,
      data.thumbnail as string,
      data.createdBy as string,
      data.createdAt ? new Date(data.createdAt as string) : undefined,
      undefined, // updatedAt will be set in constructor
      data.coordinates ? new ProjectCoordinates(
        (data.coordinates as { latitude: number; longitude: number }).latitude,
        (data.coordinates as { latitude: number; longitude: number }).longitude
      ) : undefined,
      data.financingSource as string,
      data.mainContractor as string | ProjectStakeholder,
      data.currency as string,
      data.payments as Payment[],
      data.inspections as Inspection[],
      data.tasks as Task[],
      data.documents as Document[],
      data.materials as Material[],
      data.phases as Phase[],
      data.milestones as Milestone[],
      data.risks as Risk[],
      data.tenders as Tender[],
      data.suppliers as Supplier[],
      data.employees as Employee[]
    );
  }

  // ============= Business Logic =============

  isActive(): boolean {
    return this.status === ProjectStatus.EN_COURS;
  }

  isCompleted(): boolean {
    return this.status === ProjectStatus.TERMINE;
  }

  isOverdue(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate && !this.isCompleted();
  }

  isOnSchedule(): boolean {
    if (!this.startDate || !this.endDate) return true;
    
    const now = new Date();
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    // Allow 10% variance
    return this.progress >= expectedProgress - 10;
  }

  getDaysRemaining(): number {
    if (!this.endDate) return 0;
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressStatus(): 'on-track' | 'at-risk' | 'behind' | 'completed' {
    if (this.isCompleted()) return 'completed';
    if (this.isOverdue()) return 'behind';
    if (this.isOnSchedule()) return 'on-track';
    return 'at-risk';
  }

  
  getBudgetUtilization(): number {
    const actualCost = this.payments
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0) || 0;
    
    if (this.budget <= 0) return 0;
    return (actualCost / this.budget) * 100;
  }

  getRiskScore(): number {
    let score = 0;
    
    // Budget risk
    const budgetUtilization = this.getBudgetUtilization();
    if (budgetUtilization > 90) score += 30;
    else if (budgetUtilization > 75) score += 20;
    
    // Schedule risk
    if (this.isOverdue()) score += 40;
    else if (!this.isOnSchedule()) score += 20;
    
    // Progress risk
    if (this.progress < 50 && this.getDaysRemaining() < 30) score += 30;
    
    return Math.min(score, 100);
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const riskScore = this.getRiskScore();
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 40) return 'warning';
    return 'healthy';
  }

  getPendingPayments(): Payment[] {
    return this.payments?.filter(p => ['requested', 'pending_validation', 'validated', 'approved'].includes(p.status)) || [];
  }

  getCompletedInspections(): Inspection[] {
    return this.inspections?.filter(i => ['completed', 'approved', 'rejected', 'cancelled'].includes(i.status)) || [];
  }

  getActiveTasks(): Task[] {
    return this.tasks?.filter(t => ['pending', 'in_progress'].includes(t.status)) || [];
  }

  getDocumentsByType(type: string): Document[] {
    return this.documents?.filter(d => d.documentType === type) || [];
  }

  getTeamProductivity(): number {
    if (!this.teamSize || this.teamSize <= 0) return 0;
    return this.progress / this.teamSize;
  }

  isValid(): boolean {
    return !!(this.id && this.title && this.status && this.budget >= 0);
  }

  hasValidDates(): boolean {
    if (!this.startDate || !this.endDate) return true;
    return this.startDate <= this.endDate;
  }

  hasValidProgress(): boolean {
    return this.progress >= 0 && this.progress <= 100;
  }

  hasValidBudget(): boolean {
    return this.budget > 0;
  }

  calculateTotalCost(): number {
    return this.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }

  calculateRemainingBudget(): number {
    return this.budget - this.calculateTotalCost();
  }

  calculateProgressPercentage(): number {
    return this.progress;
  }

  calculateScheduleVariance(): number {
    if (!this.startDate || !this.endDate) return 0;
    
    const now = new Date();
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    return this.progress - expectedProgress;
  }

  matchesStatus(status: ProjectStatus): boolean {
    return this.status === status;
  }

  matchesLocation(location: string): boolean {
    return this.location?.toLowerCase().includes(location.toLowerCase()) || false;
  }

  matchesBudgetRange(min: number, max: number): boolean {
    return this.budget >= min && this.budget <= max;
  }

  matchesDateRange(startDate: Date, endDate: Date): boolean {
    if (!this.startDate || !this.endDate) return false;
    return this.startDate >= startDate && this.endDate <= endDate;
  }

  getDisplayName(): string {
    return this.title;
  }

  getFullDescription(): string {
    return `${this.title} - ${this.description || 'No description'}`;
  }

  getDuration(): string {
    if (!this.startDate || !this.endDate) return 'Not specified';
    const days = this.getDaysRemaining();
    return days > 0 ? `${days} days remaining` : 'Completed';
  }

  getFormattedBudget(): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: this.currency || 'MRU'
    }).format(this.budget);
  }

  getFormattedProgress(): string {
    return `${this.progress}%`;
  }

  // ============= Factory Methods =============

  static create(data: {
    id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
    progress?: number;
    budget?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    location?: string;
    teamSize?: number;
    thumbnail?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    coordinates?: ProjectCoordinates;
    financingSource?: string;
    mainContractor?: string | ProjectStakeholder;
    currency?: string;
    clientOrganization?: string;
    donorOrganization?: string;
    sector?: string;
    projectType?: string;
    priority?: string;
    geographicZone?: string;
    terrainType?: string;
    environmentalConstraints?: string;
    areaSqm?: number;
    projectReferenceNumber?: string;
    projectOrder?: string;
    clientId?: string;
    currentPhase?: string;
    currentStage?: string;
    allowsInitialPayment?: boolean;
    initialPaymentPercentage?: number;
    paymentFrequency?: string;
    paymentMode?: string;
    retentionPercentage?: number;
    initialAdvancePercentage?: number;
    completionDate?: Date;
    estimatedDays?: number;
    launchDate?: Date;
    attributionDate?: Date;
    requiresConsultantValidation?: boolean;
    requiresMinistryApproval?: boolean;
    requiresPermits?: boolean;
    permitNumber?: string;
    hasUtilities?: boolean;
    engineeringConsultant?: User | ProjectStakeholder;
    technicalManager?: User | ProjectStakeholder;
    projectResponsable?: User | ProjectStakeholder;
    supervisor?: User | ProjectStakeholder;
    supervisorId?: string;
    payments?: Payment[];
    inspections?: Inspection[];
    tasks?: Task[];
    documents?: Document[];
    materials?: Material[];
    phases?: Phase[];
    milestones?: Milestone[];
    risks?: Risk[];
    tenders?: Tender[];
    suppliers?: Supplier[];
    employees?: Employee[];
    projectReference?: string;
    receptionStatus?: string;
    resourceAssignment?: ProjectResource[];
  }): Project {
    const now = new Date();
    return new Project(
      data.id || crypto.randomUUID(),
      data.title || '',
      data.description || '',
      (data.status as ProjectStatus) || ProjectStatus.EN_ATTENTE,
      data.progress || 0,
      data.budget || 0,
      data.startDate || null,
      data.endDate || null,
      data.location,
      data.teamSize,
      data.thumbnail,
      data.createdBy,
      data.createdAt || now,
      data.updatedAt || now,
      data.coordinates,
      data.financingSource,
      data.mainContractor,
      data.currency,
      data.payments || [],
      data.inspections || [],
      data.tasks || [],
      data.documents || [],
      data.materials || [],
      data.phases || [],
      data.milestones || [],
      data.risks || [],
      data.tenders || [],
      data.suppliers || [],
      data.employees || []
    );
  }

  // ============= Serialization Methods =============

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      progress: this.progress,
      budget: this.budget,
      startDate: this.startDate?.toISOString() || null,
      endDate: this.endDate?.toISOString() || null,
      location: this.location,
      coordinates: this.coordinates,
      teamSize: this.teamSize,
      thumbnail: this.thumbnail,
      createdBy: this.createdBy,
      createdAt: this.createdAt?.toISOString() || null,
      updatedAt: this.updatedAt?.toISOString() || null,
      financingSource: this.financingSource,
      mainContractor: this.mainContractor,
      clientOrganization: this.clientOrganization,
      donorOrganization: this.donorOrganization,
      engineeringConsultant: this.engineeringConsultant,
      technicalManager: this.technicalManager,
      projectResponsable: this.projectResponsable,
      supervisor: this.supervisor,
      sector: this.sector,
      projectType: this.projectType,
      priority: this.priority,
      payments: this.payments?.map(p => ({ ...p })) || [],
      inspections: this.inspections?.map(i => ({ ...i })) || [],
      tasks: this.tasks?.map(t => ({ ...t })) || [],
      documents: this.documents?.map(d => ({ ...d })) || [],
      materials: this.materials?.map(m => ({ ...m })) || [],
      geographicZone: this.geographicZone,
      terrainType: this.terrainType,
      environmentalConstraints: this.environmentalConstraints,
      allowsInitialPayment: this.allowsInitialPayment,
      initialPaymentPercentage: this.initialPaymentPercentage,
      currentPhase: this.currentPhase,
      currentStage: this.currentStage,
      projectReference: this.projectReference,
      currency: this.currency,
      areaSqm: this.areaSqm,
      requiresConsultantValidation: this.requiresConsultantValidation,
      requiresMinistryApproval: this.requiresMinistryApproval,
      requiresPermits: this.requiresPermits,
      permitNumber: this.permitNumber,
      hasUtilities: this.hasUtilities,
      paymentFrequency: this.paymentFrequency,
      paymentMode: this.paymentMode,
      retentionPercentage: this.retentionPercentage,
      initialAdvancePercentage: this.initialAdvancePercentage,
      completionDate: this.completionDate,
      estimatedDays: this.estimatedDays,
      launchDate: this.launchDate,
      attributionDate: this.attributionDate,
      projectReferenceNumber: this.projectReferenceNumber,
      projectOrder: this.projectOrder,
      clientId: this.clientId
    };
  }

  // ============= Update Methods =============

  updateProgress(newProgress: number): Project {
    return new Project(
      this.id,
      this.title,
      this.description,
      this.status,
      Math.min(100, Math.max(0, newProgress)),
      this.budget,
      this.startDate,
      this.endDate,
      this.location,
      this.teamSize,
      this.thumbnail,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.coordinates,
      this.financingSource,
      this.mainContractor,
      this.currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }

  updateStatus(newStatus: ProjectStatus): Project {
    return new Project(
      this.id,
      this.title,
      this.description,
      newStatus,
      this.progress,
      this.budget,
      this.startDate,
      this.endDate,
      this.location,
      this.teamSize,
      this.thumbnail,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.coordinates,
      this.financingSource,
      this.mainContractor,
      this.currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }

  // ============= Clone Methods =============

  copy(): Project {
    return new Project(
      this._id,
      this._title,
      this._description,
      this._status,
      this._progress,
      this._budget,
      this._startDate,
      this._endDate,
      this._location,
      this._teamSize,
      this._thumbnail,
      this._createdBy,
      this._createdAt,
      this._updatedAt,
      this._coordinates,
      this._financingSource,
      this._mainContractor,
      this._currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases,
      this.milestones,
      this.risks,
      this.tenders,
      this.suppliers,
      this.employees
    );
  }
}
