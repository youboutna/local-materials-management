/**
 * Project Transformer - Hexagonal Architecture
 * Handles transformation between Project entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Project } from '@/domain/entities/Project';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/types/project';

// Interface for create project request
interface CreateProjectRequestDTO {
  title: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  teamSize?: number;
  thumbnail?: string;
  createdBy?: string;
  latitude?: number;
  longitude?: number;
  financingSource?: string;
  mainContractor?: string;
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
  completionDate?: string;
  estimatedDays?: number;
  launchDate?: string;
  attributionDate?: string;
  requiresConsultantValidation?: boolean;
  requiresMinistryApproval?: boolean;
  requiresPermits?: boolean;
  permitNumber?: string;
  hasUtilities?: boolean;
  // Domain objects - following hexagonal principles
  engineeringConsultant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  technicalManager?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  projectResponsable?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  // Domain collections
  payments?: {
    id: string;
    amount: number;
    date: string;
    status: string;
  }[];
  inspections?: {
    id: string;
    date: string;
    status: string;
    report: string;
  }[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    dueDate: string;
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  materials?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  phases?: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  }[];
  milestones?: {
    id: string;
    title: string;
    date: string;
    status: string;
  }[];
  risks?: {
    id: string;
    title: string;
    probability: number;
    impact: number;
    mitigation: string;
  }[];
  tenders?: {
    id: string;
    title: string;
    status: string;
    deadline: string;
  }[];
  suppliers?: {
    id: string;
    name: string;
    contact: string;
  }[];
  employees?: {
    id: string;
    name: string;
    role: string;
  }[];
  projectReference?: string;
}

/**
 * Project Transformer - Hexagonal Architecture
 * Handles transformation between Project entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */
export class ProjectTransformer {
  /**
   * Transform Project entity to ProjectDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Project): ProjectDTO {
    return {
      // Core Identity
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      location: entity.location || '',
      status: entity.status,
      progress: entity.progress || 0,
      budget: entity.budget || 0,
      startDate: entity.startDate?.toISOString() || new Date().toISOString(),
      endDate: entity.endDate?.toISOString() || undefined,
      thumbnail: entity.thumbnail || '',
      teamSize: entity.teamSize || 0,
      
      // Geographic
      coordinates: entity.coordinates ? {
        latitude: entity.coordinates.latitude,
        longitude: entity.coordinates.longitude,
      } : undefined,
      
      // Location Details
      geographicZone: entity.geographicZone || '',
      terrainType: entity.terrainType || '',
      environmentalConstraints: entity.environmentalConstraints || '',
      hasUtilities: entity.hasUtilities || false,
      requiresPermits: entity.requiresPermits || false,
      
      // Classification
      category: entity.projectType || '',
      priorityLevel: entity.priority as 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée',
      
      // Financial
      financingSource: entity.financingSource || '',
      marketType: entity.marketType || '',
      selectionMode: entity.selectionMode || '',
      methodology: entity.methodology || 'waterfall',
      allowsInitialPayment: entity.allowsInitialPayment || false,
      initialPaymentPercentage: entity.initialPaymentPercentage || 0,
      
      // Timeline
      launchDate: entity.launchDate?.toISOString(),
      attributionDate: entity.attributionDate?.toISOString(),
      currentPhase: entity.currentPhase || '',
      currentStage: entity.currentStage || '',
      
      // Financial and insurance attributes
      bankGuaranteeRequired: entity.bankGuaranteeRequired || false,
      bankGuaranteeAmount: entity.bankGuaranteeAmount || 0,
      bankGuaranteePercentage: entity.bankGuaranteePercentage || 0,
      insuranceRequired: entity.insuranceRequired || false,
      materialsBudget: entity.materialsBudget || 0,
      procurementLeadTime: entity.procurementLeadTime || 0,
      resourceAssignment: entity.resourceAssignment || [],
      receptionStatus: entity.receptionStatus || '',
      closureNotes: entity.closureNotes || '',
      
      // Organizations
      mainContractor: typeof entity.mainContractor === 'string' 
        ? entity.mainContractor 
        : entity.mainContractor?.name || '',
      projectReference: entity.projectReference || '',
      projectResponsableId: entity.createdBy || '',
      
      // Additional fields (from ProjectDomainTransformer)
      forme: '',
      adresse: entity.location || '',
      localisation: entity.coordinates ? [entity.coordinates.latitude, entity.coordinates.longitude] : [],
      
      // Base properties
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Transform Project entity to Update DTO (partial)
   * Used for partial updates in form workflows
   */
  static toUpdateDTO(entity: Partial<Project>): Partial<ProjectDTO> {
    const dto: Partial<ProjectDTO> = {};

    // Core Identity
    if (entity.title !== undefined) dto.title = entity.title;
    if (entity.description !== undefined) dto.description = entity.description;
    if (entity.location !== undefined) dto.location = entity.location;
    if (entity.status !== undefined) dto.status = entity.status as ProjectStatus;
    
    // Financial
    if (entity.budget !== undefined) dto.budget = entity.budget;
    
    // Timeline
    if (entity.startDate !== undefined) dto.startDate = entity.startDate?.toISOString() || '';
    if (entity.endDate !== undefined) dto.endDate = entity.endDate?.toISOString() || '';
    
    // Geographic
    if (entity.coordinates !== undefined) {
      dto.coordinates = {
        latitude: entity.coordinates.latitude,
        longitude: entity.coordinates.longitude,
      };
    }
    
    // Location Details
    if (entity.geographicZone !== undefined) dto.geographicZone = entity.geographicZone;
    if (entity.terrainType !== undefined) dto.terrainType = entity.terrainType;
    if (entity.environmentConstraints !== undefined) dto.environmentConstraints = entity.environmentalConstraints;
    if (entity.hasUtilities !== undefined) dto.hasUtilities = entity.hasUtilities;
    if (entity.requiresPermits !== undefined) dto.requiresPermits = entity.requiresPermits;
    
    // Classification
    if (entity.projectType !== undefined) dto.category = entity.projectType;
    if (entity.priority !== undefined) dto.priorityLevel = entity.priority as 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée';
    
    // Financial
    if (entity.financingSource !== undefined) dto.financingSource = entity.financingSource;
    if (entity.allowsInitialPayment !== undefined) dto.allowsInitialPayment = entity.allowsInitialPayment;
    if (entity.initialPaymentPercentage !== undefined) dto.initialPaymentPercentage = entity.initialPaymentPercentage;
    
    // Timeline
    if (entity.launchDate !== undefined) dto.launchDate = entity.launchDate?.toISOString();
    if (entity.attributionDate !== undefined) dto.attributionDate = entity.attributionDate?.toISOString();
    if (entity.currentPhase !== undefined) dto.currentPhase = entity.currentPhase;
    if (entity.currentStage !== undefined) dto.currentStage = entity.currentStage;
    
    // Organizations
    if (entity.mainContractor !== undefined) {
      dto.mainContractor = typeof entity.mainContractor === 'string' 
        ? entity.mainContractor 
        : entity.mainContractor?.name || '';
    }
    if (entity.projectReference !== undefined) dto.projectReference = entity.projectReference;
    
    // Computed values
    if (entity.progress !== undefined) dto.progress = entity.progress;
    if (entity.teamSize !== undefined) dto.teamSize = entity.teamSize;

    return dto;
  }

  /**
   * Transform CreateProjectRequestDTO to Project entity
   * Used for creating new projects from form data
   */
  static fromCreateDTOToEntity(dto: CreateProjectRequestDTO): Project {
    return new Project(
      /* id */ '', // Will be set by repository
      /* title */ dto.title || '',
      /* description */ dto.description || '',
      /* status */ 'planifié' as ProjectStatus, // Default status for new projects
      /* progress */ 0,
      /* budget */ dto.budget || 0,
      /* startDate */ dto.startDate ? new Date(dto.startDate) : null,
      /* endDate */ dto.endDate ? new Date(dto.endDate) : null,
      /* location */ dto.location || '',
      /* teamSize */ dto.teamSize || 0,
      /* thumbnail */ dto.thumbnail || undefined,
      /* createdBy */ dto.createdBy || '',
      /* createdAt */ new Date(),
      /* updatedAt */ new Date(),
      /* coordinates */ dto.latitude && dto.longitude ? 
        { latitude: dto.latitude, longitude: dto.longitude, isValid: true } : undefined,
      /* financingSource */ dto.financingSource || '',
      /* mainContractor */ dto.mainContractor || '',
      /* currency */ 'MRU',
      /* clientOrganization */ dto.clientOrganization || '',
      /* donorOrganization */ dto.donorOrganization || '',
      /* sector */ dto.sector || '',
      /* projectType */ dto.projectType || '',
      /* priority */ dto.priority || 'Moyenne',
      /* geographicZone */ dto.geographicZone || '',
      /* terrainType */ dto.terrainType || '',
      /* environmentalConstraints */ dto.environmentalConstraints || '',
      /* areaSqm */ dto.areaSqm || undefined,
      /* projectReferenceNumber */ dto.projectReferenceNumber || '',
      /* projectOrder */ dto.projectOrder || '',
      /* clientId */ dto.clientId || '',
      /* currentPhase */ dto.currentPhase || '',
      /* currentStage */ dto.currentStage || '',
      /* allowsInitialPayment */ dto.allowsInitialPayment || false,
      /* initialPaymentPercentage */ dto.initialPaymentPercentage || 0,
      /* paymentFrequency */ dto.paymentFrequency || '',
      /* paymentMode */ dto.paymentMode || '',
      /* retentionPercentage */ dto.retentionPercentage || 0,
      /* initialAdvancePercentage */ dto.initialAdvancePercentage || 0,
      /* completionDate */ dto.completionDate ? new Date(dto.completionDate) : undefined,
      /* estimatedDays */ dto.estimatedDays || 0,
      /* launchDate */ dto.launchDate ? new Date(dto.launchDate) : undefined,
      /* attributionDate */ dto.attributionDate ? new Date(dto.attributionDate) : undefined,
      /* requiresConsultantValidation */ dto.requiresConsultantValidation || false,
      /* requiresMinistryApproval */ dto.requiresMinistryApproval || false,
      /* requiresPermits */ dto.requiresPermits || false,
      /* permitNumber */ dto.permitNumber || '',
      /* hasUtilities */ dto.hasUtilities || false,
      /* engineeringConsultant */ dto.engineeringConsultant || undefined,
      /* technicalManager */ dto.technicalManager || undefined,
      /* projectResponsable */ dto.projectResponsable || undefined,
      /* supervisor */ dto.supervisor || undefined,
      /* payments */ dto.payments || [],
      /* inspections */ dto.inspections || [],
      /* tasks */ dto.tasks || [],
      /* documents */ dto.documents || [],
      /* materials */ dto.materials || [],
      /* phases */ dto.phases || [],
      /* milestones */ dto.milestones || [],
      /* risks */ dto.risks || [],
      /* tenders */ dto.tenders || [],
      /* suppliers */ dto.suppliers || [],
      /* employees */ dto.employees || [],
      /* projectReference */ dto.projectReference || ''
    );
  }

  /**
   * Transform Project entity to ProjectDTO (alias for toDTO)
   * From ProjectDomainTransformer - maintained for compatibility
   */
  static fromEntityToDTO(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }

  /**
   * Transform ProjectDTO to Project entity (alias for fromDTO)
   * From ProjectDomainTransformer - maintained for compatibility
   */
  static toEntity(dto: ProjectDTO): Project {
    return this.fromDTO(dto);
  }

  /**
   * Transform Project entity to ProjectDTO (alias for toDTO)
   * From ProjectDomainTransformer - maintained for compatibility
   */
  static toResponseDto(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }

  /**
   * Transform ProjectDTO to Project entity (Domain DTO → Entity)
   * Converts ISO strings to Date objects
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: ProjectDTO): Project {
    return new Project(
      dto.id,
      dto.title,
      dto.description,
      dto.status,
      dto.progress,
      dto.budget,
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.location,
      dto.coordinates ? {
        latitude: dto.coordinates.latitude || 0,
        longitude: dto.coordinates.longitude || 0,
        isValid: true
      } : undefined,
      dto.teamSize,
      dto.thumbnail
    );
  }
}