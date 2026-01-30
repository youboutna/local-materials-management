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

export type ProjectStatus = 
  | "en cours"
  | "terminé"
  | "en attente"
  | "en inspection"
  | "suspendu"
  | "annulé"
  | "attribué"
  | "planifié"
  | "pré-qualification"
  | "en conception"
  | "en construction"
  | "en clôture"
  | "en retard";

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
    public readonly longitude: number
  ) {}

  // Methods
  isValid(): boolean {
    return !isNaN(this.latitude) && !isNaN(this.longitude);
  }

  toString(): string {
    return `${this.latitude}, ${this.longitude}`;
  }
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
  private _createdAt?: Date;
  private _updatedAt?: Date;
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
  private _resourceAssignment?: any[]; // ✅ SEMANTIC: Array of ProjectResource[] from project_resources table
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
  private _currentStage?: string;
  private _allowsInitialPayment?: boolean;
  private _initialPaymentPercentage?: number;
  private _paymentFrequency?: string;
  private _paymentMode?: string;
  private _retentionPercentage?: number;
  private _initialAdvancePercentage?: number;
  private _completionDate?: Date;
  private _estimatedDays?: number;
  private _launchDate?: Date;
  private _attributionDate?: Date;
  private _requiresConsultantValidation?: boolean;
  private _requiresMinistryApproval?: boolean;
  private _requiresPermits?: boolean;
  private _permitNumber?: string;
  private _hasUtilities?: boolean;
  private _engineeringConsultant?: User | ProjectStakeholder;
  private _technicalManager?: User | ProjectStakeholder;
  private _projectResponsable?: User | ProjectStakeholder;
  private _supervisor?: User | ProjectStakeholder;
  private _payments?: Payment[];
  private _inspections?: Inspection[];
  private _tasks?: Task[];
  private _documents?: Document[];
  private _materials?: Material[];
  private _phases?: Phase[];
  private _milestones?: Milestone[];
  private _risks?: Risk[]; // Temporarily use any until ProjectRisk is created
  private _tenders?: Tender[];
  private _suppliers?: Supplier[];
  private _employees?: Employee[];
  private _projectReference?: string;
  
  // Additional relationship properties from database
  private _bankGuarantees?: any[];
  private _insuranceCertificates?: any[];
  private _projectAlerts?: any[];
  private _projectComments?: any[];
  private _projectOrganizations?: any[];
  private _quantityTakeoffs?: any[];
  private _progressInvoices?: any[];
  private _paymentBlocks?: any[];
  private _supplierPaymentRequests?: any[];
  private _taskAssignments?: any[];
  private _projectResources?: any[]; // ⚠️ CRITICAL: For resourceAssignment mapping

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
    marketType?: string,
    selectionMode?: string,
    methodology?: string,
    mainContractor?: string | ProjectStakeholder,
    currency?: string,
    
    // Financial and insurance attributes
    bankGuaranteeRequired?: boolean,
    bankGuaranteeAmount?: number,
    bankGuaranteePercentage?: number,
    insuranceRequired?: boolean,
    materialsBudget?: number,
    procurementLeadTime?: number,
    resourceAssignment?: any[], // ✅ SEMANTIC: Array of ProjectResource[] from project_resources table
    receptionStatus?: string,
    closureNotes?: string,
    
    // Additional project details
    clientOrganization?: string,
    donorOrganization?: string,
    sector?: string,
    projectType?: string,
    priority?: string,
    geographicZone?: string,
    terrainType?: string,
    environmentalConstraints?: string,
    areaSqm?: number,
    projectReferenceNumber?: string,
    projectOrder?: string,
    clientId?: string,
    
    // Project phases and stages
    currentPhase?: string,
    currentStage?: string,
    
    // Payment and financial settings
    allowsInitialPayment?: boolean,
    initialPaymentPercentage?: number,
    paymentFrequency?: string,
    paymentMode?: string,
    retentionPercentage?: number,
    initialAdvancePercentage?: number,
    
    // Dates and timeline
    completionDate?: Date,
    estimatedDays?: number,
    launchDate?: Date,
    attributionDate?: Date,
    
    // Validation and requirements
    requiresConsultantValidation?: boolean,
    requiresMinistryApproval?: boolean,
    requiresPermits?: boolean,
    permitNumber?: string,
    hasUtilities?: boolean,
    
    // Optional references (loaded when needed)
    engineeringConsultant?: User | ProjectStakeholder,
    technicalManager?: User | ProjectStakeholder,
    projectResponsable?: User | ProjectStakeholder,
    supervisor?: User | ProjectStakeholder,
    
    // Collections (direct entity relationships)
    payments?: Payment[],      // Direct entity relationship
    inspections?: Inspection[],  // Direct entity relationship
    tasks?: Task[],            // Direct entity relationship
    documents?: Document[],      // Direct entity relationship
    materials?: Material[],      // Direct entity relationship
    phases?: Phase[],          // Direct entity relationship
    milestones?: Milestone[],    // Direct entity relationship
    risks?: any[],     // Direct entity relationship (temporarily any)
    tenders?: Tender[],        // Direct entity relationship
    suppliers?: Supplier[],     // Direct entity relationship
    employees?: Employee[],     // Direct entity relationship
    
    // Additional metadata from database
    projectReference?: string
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
    this._marketType = marketType;
    this._selectionMode = selectionMode;
    this._methodology = methodology;
    this._mainContractor = mainContractor;
    this._currency = currency;
    
    // Financial and insurance attributes
    this._bankGuaranteeRequired = bankGuaranteeRequired;
    this._bankGuaranteeAmount = bankGuaranteeAmount;
    this._bankGuaranteePercentage = bankGuaranteePercentage;
    this._insuranceRequired = insuranceRequired;
    this._materialsBudget = materialsBudget;
    this._procurementLeadTime = procurementLeadTime;
    this._resourceAssignment = resourceAssignment;
    this._receptionStatus = receptionStatus;
    this._closureNotes = closureNotes;
    
    this._clientOrganization = clientOrganization;
    this._donorOrganization = donorOrganization;
    this._sector = sector;
    this._projectType = projectType;
    this._priority = priority;
    this._geographicZone = geographicZone;
    this._terrainType = terrainType;
    this._environmentalConstraints = environmentalConstraints;
    this._areaSqm = areaSqm;
    this._projectReferenceNumber = projectReferenceNumber;
    this._projectOrder = projectOrder;
    this._clientId = clientId;
    this._currentPhase = currentPhase;
    this._currentStage = currentStage;
    this._allowsInitialPayment = allowsInitialPayment;
    this._initialPaymentPercentage = this.validatePercentage(initialPaymentPercentage);
    this._paymentFrequency = paymentFrequency;
    this._paymentMode = paymentMode;
    this._retentionPercentage = this.validatePercentage(retentionPercentage);
    this._initialAdvancePercentage = this.validatePercentage(initialAdvancePercentage);
    this._completionDate = completionDate;
    this._estimatedDays = estimatedDays;
    this._launchDate = launchDate;
    this._attributionDate = attributionDate;
    this._requiresConsultantValidation = requiresConsultantValidation;
    this._requiresMinistryApproval = requiresMinistryApproval;
    this._requiresPermits = requiresPermits;
    this._permitNumber = permitNumber;
    this._hasUtilities = hasUtilities;
    this._engineeringConsultant = engineeringConsultant;
    this._technicalManager = technicalManager;
    this._projectResponsable = projectResponsable;
    this._supervisor = supervisor;
    this._payments = payments || [];
    this._inspections = inspections || [];
    this._tasks = tasks || [];
    this._documents = documents || [];
    this._materials = materials || [];
    this._phases = phases || [];
    this._milestones = milestones || [];
    this._risks = risks || [];
    this._tenders = tenders || [];
    this._suppliers = suppliers || [];
    this._employees = employees || [];
    this._projectReference = projectReference;
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
  get resourceAssignment(): any[] { return this._resourceAssignment || []; } // ✅ SEMANTIC: Array of ProjectResource[]
  get receptionStatus(): string | undefined { return this._receptionStatus; }
  get closureNotes(): string | undefined { return this._closureNotes; }
  
  // Relationship getters
  get bankGuarantees(): any[] { return this._bankGuarantees || []; }
  get insuranceCertificates(): any[] { return this._insuranceCertificates || []; }
  get projectAlerts(): any[] { return this._projectAlerts || []; }
  get projectComments(): any[] { return this._projectComments || []; }
  get projectOrganizations(): any[] { return this._projectOrganizations || []; }
  get quantityTakeoffs(): any[] { return this._quantityTakeoffs || []; }
  get progressInvoices(): any[] { return this._progressInvoices || []; }
  get paymentBlocks(): any[] { return this._paymentBlocks || []; }
  get supplierPaymentRequests(): any[] { return this._supplierPaymentRequests || []; }
  get taskAssignments(): any[] { return this._taskAssignments || []; }
  get projectResources(): any[] { return this._projectResources || []; } // ⚠️ CRITICAL: For resourceAssignment
  
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
  get projectReference(): string | undefined { return this._projectReference; }

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
      this._clientOrganization,
      this._donorOrganization,
      this._sector,
      this._projectType,
      this._priority,
      this._geographicZone,
      this._terrainType,
      this._environmentalConstraints,
      this._areaSqm,
      this._projectReferenceNumber,
      this._projectOrder,
      this._clientId,
      this._currentPhase,
      this._currentStage,
      this._allowsInitialPayment,
      this._initialPaymentPercentage,
      this._paymentFrequency,
      this._paymentMode,
      this._retentionPercentage,
      this._initialAdvancePercentage,
      this._completionDate,
      this._estimatedDays,
      this._launchDate,
      this._attributionDate,
      this._requiresConsultantValidation,
      this._requiresMinistryApproval,
      this._requiresPermits,
      this._permitNumber,
      this._hasUtilities,
      this._engineeringConsultant,
      this._technicalManager,
      this._projectResponsable,
      this._supervisor,
      this._payments,
      this._inspections,
      this._tasks,
      this._documents,
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
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
      this._clientOrganization,
      this._donorOrganization,
      this._sector,
      this._projectType,
      this._priority,
      this._geographicZone,
      this._terrainType,
      this._environmentalConstraints,
      this._areaSqm,
      this._projectReferenceNumber,
      this._projectOrder,
      this._clientId,
      this._currentPhase,
      this._currentStage,
      this._allowsInitialPayment,
      this._initialPaymentPercentage,
      this._paymentFrequency,
      this._paymentMode,
      this._retentionPercentage,
      this._initialAdvancePercentage,
      this._completionDate,
      this._estimatedDays,
      this._launchDate,
      this._attributionDate,
      this._requiresConsultantValidation,
      this._requiresMinistryApproval,
      this._requiresPermits,
      this._permitNumber,
      this._hasUtilities,
      this._engineeringConsultant,
      this._technicalManager,
      this._projectResponsable,
      this._supervisor,
      this._payments,
      this._inspections,
      this._tasks,
      this._documents,
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
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
      this._clientOrganization,
      this._donorOrganization,
      this._sector,
      this._projectType,
      this._priority,
      this._geographicZone,
      this._terrainType,
      this._environmentalConstraints,
      this._areaSqm,
      this._projectReferenceNumber,
      this._projectOrder,
      this._clientId,
      this._currentPhase,
      this._currentStage,
      this._allowsInitialPayment,
      this._initialPaymentPercentage,
      this._paymentFrequency,
      this._paymentMode,
      this._retentionPercentage,
      this._initialAdvancePercentage,
      this._completionDate,
      this._estimatedDays,
      this._launchDate,
      this._attributionDate,
      this._requiresConsultantValidation,
      this._requiresMinistryApproval,
      this._requiresPermits,
      this._permitNumber,
      this._hasUtilities,
      this._engineeringConsultant,
      this._technicalManager,
      this._projectResponsable,
      this._supervisor,
      this._payments,
      this._inspections,
      this._tasks,
      this._documents,
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
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
    const validStatuses: ProjectStatus[] = [
      "en cours", "terminé", "en attente", "en inspection", "suspendu", 
      "annulé", "attribué", "planifié", "pré-qualification", "en conception", 
      "en construction", "en clôture", "en retard"
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid project status: ${status}`);
    }
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
      updates.clientOrganization !== undefined ? updates.clientOrganization : this._clientOrganization,
      updates.donorOrganization !== undefined ? updates.donorOrganization : this._donorOrganization,
      updates.sector !== undefined ? updates.sector : this._sector,
      updates.projectType !== undefined ? updates.projectType : this._projectType,
      updates.priority !== undefined ? updates.priority : this._priority,
      updates.geographicZone !== undefined ? updates.geographicZone : this._geographicZone,
      updates.terrainType !== undefined ? updates.terrainType : this._terrainType,
      updates.environmentalConstraints !== undefined ? updates.environmentalConstraints : this._environmentalConstraints,
      updates.areaSqm !== undefined ? updates.areaSqm : this._areaSqm,
      updates.projectReferenceNumber !== undefined ? updates.projectReferenceNumber : this._projectReferenceNumber,
      updates.projectOrder !== undefined ? updates.projectOrder : this._projectOrder,
      updates.clientId !== undefined ? updates.clientId : this._clientId,
      updates.currentPhase !== undefined ? updates.currentPhase : this._currentPhase,
      updates.currentStage !== undefined ? updates.currentStage : this._currentStage,
      updates.allowsInitialPayment !== undefined ? updates.allowsInitialPayment : this._allowsInitialPayment,
      updates.initialPaymentPercentage !== undefined ? updates.initialPaymentPercentage : this._initialPaymentPercentage,
      updates.paymentFrequency !== undefined ? updates.paymentFrequency : this._paymentFrequency,
      updates.paymentMode !== undefined ? updates.paymentMode : this._paymentMode,
      updates.retentionPercentage !== undefined ? updates.retentionPercentage : this._retentionPercentage,
      updates.initialAdvancePercentage !== undefined ? updates.initialAdvancePercentage : this._initialAdvancePercentage,
      updates.completionDate !== undefined ? updates.completionDate : this._completionDate,
      updates.estimatedDays !== undefined ? updates.estimatedDays : this._estimatedDays,
      updates.launchDate !== undefined ? updates.launchDate : this._launchDate,
      updates.attributionDate !== undefined ? updates.attributionDate : this._attributionDate,
      updates.requiresConsultantValidation !== undefined ? updates.requiresConsultantValidation : this._requiresConsultantValidation,
      updates.requiresMinistryApproval !== undefined ? updates.requiresMinistryApproval : this._requiresMinistryApproval,
      updates.requiresPermits !== undefined ? updates.requiresPermits : this._requiresPermits,
      updates.permitNumber !== undefined ? updates.permitNumber : this._permitNumber,
      updates.hasUtilities !== undefined ? updates.hasUtilities : this._hasUtilities,
      updates.engineeringConsultant !== undefined ? updates.engineeringConsultant : this._engineeringConsultant,
      updates.technicalManager !== undefined ? updates.technicalManager : this._technicalManager,
      updates.projectResponsable !== undefined ? updates.projectResponsable : this._projectResponsable,
      updates.supervisor !== undefined ? updates.supervisor : this._supervisor,
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
      updates.employees !== undefined ? updates.employees : this._employees,
      updates.projectReference !== undefined ? updates.projectReference : this._projectReference
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

    // Required field validations
    try {
      this.validateId(this._id);
    } catch (e: any) {
      errors.push(e.message);
    }

    try {
      this.validateTitle(this._title);
    } catch (e: any) {
      errors.push(e.message);
    }

    try {
      this.validateStatus(this._status);
    } catch (e: any) {
      errors.push(e.message);
    }

    try {
      this.validateProgress(this._progress);
    } catch (e: any) {
      errors.push(e.message);
    }

    try {
      this.validateBudget(this._budget);
    } catch (e: any) {
      errors.push(e.message);
    }

    // Business logic validations
    if (this._startDate && this._endDate && this._startDate > this._endDate) {
      errors.push('Start date must be before end date');
    }

    if (this._progress === 100 && this._status !== 'terminé') {
      warnings.push('Project is 100% complete but status is not "terminé"');
    }

    if (this._progress === 0 && this._status === 'en cours') {
      warnings.push('Project has 0% progress but status is "en cours"');
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
      mainContractor: this._mainContractor,
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
        (data.coordinates as any).latitude,
        (data.coordinates as any).longitude
      ) : undefined,
      data.financingSource as string,
      data.mainContractor as string | ProjectStakeholder,
      data.currency as string,
      data.clientOrganization as string,
      data.donorOrganization as string,
      data.sector as string,
      data.projectType as string,
      data.priority as string,
      data.geographicZone as string,
      data.terrainType as string,
      data.environmentalConstraints as string,
      data.areaSqm as number,
      data.projectReferenceNumber as string,
      data.projectOrder as string,
      data.clientId as string,
      data.currentPhase as string,
      data.currentStage as string,
      data.allowsInitialPayment as boolean,
      data.initialPaymentPercentage as number,
      data.paymentFrequency as string,
      data.paymentMode as string,
      data.retentionPercentage as number,
      data.initialAdvancePercentage as number,
      data.completionDate ? new Date(data.completionDate as string) : undefined,
      data.estimatedDays as number,
      data.launchDate ? new Date(data.launchDate as string) : undefined,
      data.attributionDate ? new Date(data.attributionDate as string) : undefined,
      data.requiresConsultantValidation as boolean,
      data.requiresMinistryApproval as boolean,
      data.requiresPermits as boolean,
      data.permitNumber as string,
      data.hasUtilities as boolean,
      data.engineeringConsultant as User | ProjectStakeholder,
      data.technicalManager as User | ProjectStakeholder,
      data.projectResponsable as User | ProjectStakeholder,
      data.supervisor as User | ProjectStakeholder,
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
      data.employees as Employee[],
      data.projectReference as string
    );
  }

  // ============= Business Logic =============

  isActive(): boolean {
    return this.status === 'en cours';
  }

  isCompleted(): boolean {
    return this.status === 'terminé';
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

  getMaterialsByCategory(category: string): Material[] {
    return this.materials?.filter(m => m.category === category) || [];
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
  }): Project {
    const now = new Date();
    return new Project(
      data.id || crypto.randomUUID(),
      data.title || '',
      data.description || '',
      data.status || 'en attente',
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
      data.clientOrganization,
      data.donorOrganization,
      data.sector,
      data.projectType,
      data.priority,
      data.geographicZone,
      data.terrainType,
      data.environmentalConstraints,
      data.areaSqm,
      data.projectReferenceNumber,
      data.projectOrder,
      data.clientId,
      data.currentPhase,
      data.currentStage,
      data.allowsInitialPayment,
      data.initialPaymentPercentage,
      data.paymentFrequency,
      data.paymentMode,
      data.retentionPercentage,
      data.initialAdvancePercentage,
      data.completionDate,
      data.estimatedDays,
      data.launchDate,
      data.attributionDate,
      data.requiresConsultantValidation,
      data.requiresMinistryApproval,
      data.requiresPermits,
      data.permitNumber,
      data.hasUtilities,
      data.engineeringConsultant,
      data.technicalManager,
      data.projectResponsable,
      data.supervisor,
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
      data.employees || [],
      data.projectReference
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
      this.clientOrganization,
      this.donorOrganization,
      this.sector,
      this.projectType,
      this.priority,
      this.geographicZone,
      this.terrainType,
      this.environmentalConstraints,
      this.areaSqm,
      this.projectReferenceNumber,
      this.projectOrder,
      this.clientId,
      this.currentPhase,
      this.currentStage,
      this.allowsInitialPayment,
      this.initialPaymentPercentage,
      this.paymentFrequency,
      this.paymentMode,
      this.retentionPercentage,
      this.initialAdvancePercentage,
      this.completionDate,
      this.estimatedDays,
      this.launchDate,
      this.attributionDate,
      this.requiresConsultantValidation,
      this.requiresMinistryApproval,
      this.requiresPermits,
      this.permitNumber,
      this.hasUtilities,
      this.engineeringConsultant,
      this.technicalManager,
      this.projectResponsable,
      this.supervisor,
      this._payments || [],
      this._inspections || [],
      this._tasks || [],
      this._documents || [],
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
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
      this.clientOrganization,
      this.donorOrganization,
      this.sector,
      this.projectType,
      this.priority,
      this.geographicZone,
      this.terrainType,
      this.environmentalConstraints,
      this.areaSqm,
      this.projectReferenceNumber,
      this.projectOrder,
      this.clientId,
      this.currentPhase,
      this.currentStage,
      this.allowsInitialPayment,
      this.initialPaymentPercentage,
      this.paymentFrequency,
      this.paymentMode,
      this.retentionPercentage,
      this.initialAdvancePercentage,
      this.completionDate,
      this.estimatedDays,
      this.launchDate,
      this.attributionDate,
      this.requiresConsultantValidation,
      this.requiresMinistryApproval,
      this.requiresPermits,
      this.permitNumber,
      this.hasUtilities,
      this.engineeringConsultant,
      this.technicalManager,
      this.projectResponsable,
      this.supervisor,
      this._payments || [],
      this._inspections || [],
      this._tasks || [],
      this._documents || [],
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
    );
  }

  // ============= Clone Methods =============

  copy(): Project {
    return new Project(
      this.id,
      this.title,
      this.description,
      this.status,
      this.progress,
      this.budget,
      this.startDate,
      this.endDate,
      this.location,
      this.teamSize,
      this.thumbnail,
      this.createdBy,
      this.createdAt,
      this.updatedAt,
      this.coordinates,
      this.financingSource,
      this.mainContractor,
      this.currency,
      this.clientOrganization,
      this.donorOrganization,
      this.sector,
      this.projectType,
      this.priority,
      this.geographicZone,
      this.terrainType,
      this.environmentalConstraints,
      this.areaSqm,
      this.projectReferenceNumber,
      this.projectOrder,
      this.clientId,
      this.currentPhase,
      this.currentStage,
      this.allowsInitialPayment,
      this.initialPaymentPercentage,
      this.paymentFrequency,
      this.paymentMode,
      this.retentionPercentage,
      this.initialAdvancePercentage,
      this.completionDate,
      this.estimatedDays,
      this.launchDate,
      this.attributionDate,
      this.requiresConsultantValidation,
      this.requiresMinistryApproval,
      this.requiresPermits,
      this.permitNumber,
      this.hasUtilities,
      this.engineeringConsultant,
      this.technicalManager,
      this.projectResponsable,
      this.supervisor,
      this._payments || [],
      this._inspections || [],
      this._tasks || [],
      this._documents || [],
      this._materials,
      this._phases,
      this._milestones,
      this._risks,
      this._tenders,
      this._suppliers,
      this._employees,
      this._projectReference
    );
  }
}
