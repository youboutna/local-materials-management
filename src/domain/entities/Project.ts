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
export interface ProjectResource {
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
export type ProjectStatus = string; // Change to string instead of enum
// Removed conflicting export

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
  private _resourceAssignment?: string;
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
  
  // Additional missing fields
  private _checkScheduleLastRun?: unknown;
  private _forme?: string;
  private _fundingSource?: string;
  private _initialAdvancePercentage?: number;
  private _localisation?: Record<string, unknown>;
  private _paymentWorkflowConfig?: Record<string, unknown>;
  private _projectResponsableId?: string;
  private _retentionPercentage?: number;
  private _siteDetails?: string;
  
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

  // Additional relationship properties
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

  // Missing fields for getters
  private _currentStage?: string;
  private _allowsInitialPayment?: boolean;

  // ============= CONSTRUCTOR =============

  constructor(
    id: string,
    title: string,
    description: string,
    status: ProjectStatus,
    progress: number,
    budget: number,
    startDate: Date | null,
    endDate: Date | null,
    location: string,
    teamSize: number,
    thumbnail?: string,
    createdBy?: string,
    createdAt?: Date,
    updatedAt?: Date,
    coordinates?: ProjectCoordinates,
    financingSource?: string,
    mainContractor?: string | ProjectStakeholder,
    currency?: string,
    payments: Payment[] = [],
    inspections: Inspection[] = [],
    tasks: Task[] = [],
    documents: Document[] = [],
    materials: Material[] = [],
    phases: Phase[] = [],
    milestones: Milestone[] = [],
    risks: Risk[] = [],
    tenders: Tender[] = [],
    suppliers: Supplier[] = [],
    employees: Employee[] = []
  ) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._status = status;
    this._progress = progress;
    this._budget = budget;
    this._startDate = startDate;
    this._endDate = endDate;
    this._location = location;
    this._teamSize = teamSize;
    this._thumbnail = thumbnail;
    this._createdBy = createdBy;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._coordinates = coordinates;
    this._financingSource = financingSource;
    this._mainContractor = mainContractor;
    this._currency = currency;
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

  // ============= PUBLIC GETTERS =============

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
  get mainContractor(): string | ProjectStakeholder | undefined { return this._mainContractor; }
  get currency(): string | undefined { return this._currency; }

  // Financial and insurance attributes
  get bankGuaranteeRequired(): boolean | undefined { return this._bankGuaranteeRequired; }
  get bankGuaranteeAmount(): number | undefined { return this._bankGuaranteeAmount; }
  get bankGuaranteePercentage(): number | undefined { return this._bankGuaranteePercentage; }
  get insuranceRequired(): boolean | undefined { return this._insuranceRequired; }
  get materialsBudget(): number | undefined { return this._materialsBudget; }
  get procurementLeadTime(): number | undefined { return this._procurementLeadTime; }
  get resourceAssignment(): string | undefined { return this._resourceAssignment; } // Changed from ProjectResource[] to string
  get receptionStatus(): string | undefined { return this._receptionStatus; }
  get closureNotes(): string | undefined { return this._closureNotes; }
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
  get initialPaymentPercentage(): number | undefined { return this._initialPaymentPercentage; }
  get paymentFrequency(): string | undefined { return this._paymentFrequency; }
  get paymentMode(): string | undefined { return this._paymentMode; }
  get supervisorId(): string | undefined { return this._supervisorId; }
  get completionDate(): Date | undefined { return this._completionDate; }
  get estimatedDays(): number | undefined { return this._estimatedDays; }
  get launchDate(): Date | undefined { return this._launchDate; }
  get attributionDate(): Date | undefined { return this._attributionDate; }

  // Additional financial properties
  get retentionPercentage(): number | undefined { return this._retentionPercentage; }
  get initialAdvancePercentage(): number | undefined { return this._initialAdvancePercentage; }

  // Validation and requirements properties
  get requiresConsultantValidation(): boolean | undefined { return this._requiresConsultantValidation; }
  get requiresMinistryApproval(): boolean | undefined { return this._requiresMinistryApproval; }
  get requiresPermits(): boolean | undefined { return this._requiresPermits; }
  get permitNumber(): string | undefined { return this._permitNumber; }
  get hasUtilities(): boolean | undefined { return this._hasUtilities; }

  // Stakeholder references
  get engineeringConsultant(): User | ProjectStakeholder | undefined { return this._engineeringConsultant; }
  get technicalManager(): User | ProjectStakeholder | undefined { return this._technicalManager; }
  get projectResponsable(): User | ProjectStakeholder | undefined { return this._projectResponsable; }
  get supervisor(): User | ProjectStakeholder | undefined { return this._supervisor; }

  // Collections
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
  get currentStage(): string | undefined { return this._currentStage; }
  get projectReference(): string | undefined { return this._projectReference; }

  // Additional properties for UI DTO compatibility
  get address(): string | undefined { return this._location; } // Alias for location
  get category(): string | undefined { return this._sector; } // Alias for sector
  get subCategory(): string | undefined { return this._projectType; } // Alias for projectType
  get marketType(): string | undefined { return this._marketType; }
  get selectionMode(): string | undefined { return this._selectionMode; }
  get methodology(): string | undefined { return this._methodology; }
  get allowsInitialPayment(): boolean | undefined { return this._allowsInitialPayment; }
  get projectManagerId(): string | undefined { return this._projectResponsableId; } // Alias for projectResponsableId
  get technicalManagerId(): string | undefined { return this._technicalManager?.id; }

  // Additional computed properties for UI
  get forme(): string | undefined { return this._forme; }
  get fundingSource(): string | undefined { return this._fundingSource; }
  get localisation(): Record<string, unknown> | undefined { return this._localisation; }
  get siteDetails(): string | undefined { return this._siteDetails; }
  get checkScheduleLastRun(): unknown { return this._checkScheduleLastRun; }
  get paymentWorkflowConfig(): Record<string, unknown> | undefined { return this._paymentWorkflowConfig; }

  // Computed properties
  getRiskScore(): number {
    // Simple risk calculation - can be enhanced
    return this._risks ? this._risks.length * 10 : 0;
  }

  isOnSchedule(): boolean {
    if (!this._endDate) return true;
    return this._endDate > new Date();
  }

  isOverdue(): boolean {
    if (!this._endDate) return false;
    return this._endDate < new Date();
  }

  isCompleted(): boolean {
    return this._status === 'terminé';
  }

  calculateScheduleVariance(): number {
    // Placeholder implementation
    return 0;
  }

  getPendingPayments(): Payment[] {
    return this._payments ? this._payments.filter(p => p.status !== 'paid') : [];
  }

  // ============= STATIC FACTORY METHODS =============

  /**
   * Static factory method to create Project from database/transformer data
   * Used by ProjectTransformer.fromSupabase()
   */
  static create(data: {
    id: string;
    title: string;
    description: string;
    status: string;
    progress: number;
    budget: number;
    startDate: Date | null;
    endDate: Date | null;
    location: string;
    coordinates?: ProjectCoordinates;
    teamSize: number;
    thumbnail?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    financingSource?: string;
    mainContractor?: string | ProjectStakeholder;
    currency?: string;

    // Additional fields from transformer
    attributionDate?: Date;
    bankGuaranteeAmount?: number;
    bankGuaranteePercentage?: number;
    bankGuaranteeRequired?: boolean;
    checkScheduleLastRun?: unknown;
    closureNotes?: string;
    completionDate?: Date;
    donorOrganization?: string;
    estimatedDays?: number;
    forme?: string;
    fundingSource?: string;
    initialAdvancePercentage?: number;
    initialPaymentPercentage?: number;
    localisation?: Record<string, unknown>;
    materialsBudget?: number;
    paymentFrequency?: string;
    paymentMode?: string;
    paymentWorkflowConfig?: Record<string, unknown>;
    procurementLeadTime?: number;
    projectOrder?: string;
    projectReferenceNumber?: string;
    projectResponsableId?: string;
    receptionStatus?: string;
    requiresConsultantValidation?: boolean;
    requiresMinistryApproval?: boolean;
    resourceAssignment?: string;
    retentionPercentage?: number;
    sector?: string;
    siteDetails?: string;
    supervisorId?: string;
    terrainType?: string;
  }): Project {
    const project = new Project(
      data.id,
      data.title,
      data.description,
      data.status as ProjectStatus,
      data.progress,
      data.budget,
      data.startDate,
      data.endDate,
      data.location,
      data.teamSize,
      data.thumbnail,
      data.createdBy,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.coordinates,
      data.financingSource,
      data.mainContractor,
      data.currency,
      [], // payments
      [], // inspections
      [], // tasks
      [], // documents
      [], // materials
      [], // phases
      [], // milestones
      [], // risks
      [], // tenders
      [], // suppliers
      []  // employees
    );

    // Set additional properties that aren't in constructor
    if (data.attributionDate !== undefined) project._attributionDate = data.attributionDate;
    if (data.bankGuaranteeAmount !== undefined) project._bankGuaranteeAmount = data.bankGuaranteeAmount;
    if (data.bankGuaranteePercentage !== undefined) project._bankGuaranteePercentage = data.bankGuaranteePercentage;
    if (data.bankGuaranteeRequired !== undefined) project._bankGuaranteeRequired = data.bankGuaranteeRequired;
    if (data.checkScheduleLastRun !== undefined) project._checkScheduleLastRun = data.checkScheduleLastRun;
    if (data.closureNotes !== undefined) project._closureNotes = data.closureNotes;
    if (data.completionDate !== undefined) project._completionDate = data.completionDate;
    if (data.donorOrganization !== undefined) project._donorOrganization = data.donorOrganization;
    if (data.estimatedDays !== undefined) project._estimatedDays = data.estimatedDays;
    if (data.forme !== undefined) project._forme = data.forme;
    if (data.fundingSource !== undefined) project._fundingSource = data.fundingSource;
    if (data.initialAdvancePercentage !== undefined) project._initialAdvancePercentage = data.initialAdvancePercentage;
    if (data.initialPaymentPercentage !== undefined) project._initialPaymentPercentage = data.initialPaymentPercentage;
    if (data.localisation !== undefined) project._localisation = data.localisation;
    if (data.materialsBudget !== undefined) project._materialsBudget = data.materialsBudget;
    if (data.paymentFrequency !== undefined) project._paymentFrequency = data.paymentFrequency;
    if (data.paymentMode !== undefined) project._paymentMode = data.paymentMode;
    if (data.paymentWorkflowConfig !== undefined) project._paymentWorkflowConfig = data.paymentWorkflowConfig;
    if (data.procurementLeadTime !== undefined) project._procurementLeadTime = data.procurementLeadTime;
    if (data.projectOrder !== undefined) project._projectOrder = data.projectOrder;
    if (data.projectReferenceNumber !== undefined) project._projectReferenceNumber = data.projectReferenceNumber;
    if (data.projectResponsableId !== undefined) project._projectResponsableId = data.projectResponsableId;
    if (data.receptionStatus !== undefined) project._receptionStatus = data.receptionStatus;
    if (data.requiresConsultantValidation !== undefined) project._requiresConsultantValidation = data.requiresConsultantValidation;
    if (data.requiresMinistryApproval !== undefined) project._requiresMinistryApproval = data.requiresMinistryApproval;
    if (data.resourceAssignment !== undefined) project._resourceAssignment = data.resourceAssignment;
    if (data.retentionPercentage !== undefined) project._retentionPercentage = data.retentionPercentage;
    if (data.sector !== undefined) project._sector = data.sector;
    if (data.siteDetails !== undefined) project._siteDetails = data.siteDetails;
    if (data.supervisorId !== undefined) project._supervisorId = data.supervisorId;
    if (data.terrainType !== undefined) project._terrainType = data.terrainType;

    return project;
  }

  // ============= SERIALIZATION METHODS =============

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
      attributionDate: this.attributionDate || '',
      projectReferenceNumber: this.projectReferenceNumber || '',
      projectOrder: this.projectOrder || '',
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
      this.location || '',
      this.teamSize || 0,
      this.thumbnail || '',
      this.createdBy || '',
      this.createdAt || new Date(),
      new Date(), // updatedAt
      this.coordinates,
      this.financingSource,
      this.mainContractor,
      this.currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases || [],
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
      this.location || '',
      this.teamSize || 0,
      this.thumbnail || '',
      this.createdBy || '',
      this.createdAt || new Date(),
      new Date(), // updatedAt
      this.coordinates,
      this.financingSource,
      this.mainContractor,
      this.currency,
      this.payments,
      this.inspections,
      this.tasks,
      this.documents,
      this.materials,
      this.phases || [],
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
      this._location as string,
      this._teamSize as number,
      this._thumbnail,
      this._createdBy,
      this._createdAt,
      new Date(), // Always update updatedAt for copy
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
