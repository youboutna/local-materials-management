/**
 * Project Transformer - Hexagonal Architecture
 * Complete conversion methods following the guide pattern:
 * 
 * Database ↔ Domain (fromSupabase, toSupabase)
 * Domain ↔ DTO (toDTO, fromDTO)  
 * UI ↔ DTO (formToCreateRequest, formToUpdateRequest, toUI)
 * Batch operations (manyFromSupabase, manyToDTO, manyToUI)
 */

import { Project, ProjectCoordinates, ProjectResource } from '@/domain/entities/Project';
import {
  ProjectDTO,
  ProjectStatus,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectDetailDTO,
  ProjectSummaryDTO,
  CreateProjectRequestDTO
} from '@/dtos/entities/ProjectDTO';
import type { ConstructionStage } from '@/dtos/entities/ProjectDTO';
import { PhaseTransformer } from './PhaseTransformer';
import { TaskTransformer } from './TaskTransformer';
import { RiskTransformer } from './RiskTransformer';
import { MilestoneTransformer } from './MilestoneTransformer';
import { PaymentTransformer } from './PaymentTransformer';
import { TenderDomainTransformer } from './TenderDomainTransformer';
import { MaterialTransformer } from './MaterialTransformer';
import { InspectionTransformer } from './InspectionTransformer';
import { StakeholderTransformer } from './StakeholderTransformer';
import { InspectionStatus } from '@/domain/entities/Inspection';

// TYPE-SAFE INTERFACES FOR DTOs WITH RELATED COLLECTIONS
interface ProjectDTOWithCollections extends ProjectDTO {
  phases?: import('@/dtos/entities/PhaseDTO').PhaseDTO[];
  tasks?: import('@/dtos/entities/TaskDTO').TaskDTO[];
  risks?: import('@/dtos/entities/RiskDTO').RiskDTO[];
  inspections?: import('@/dtos/entities/InspectionDTO').InspectionDTO[];
  payments?: import('@/dtos/entities/PaymentDTO').PaymentDTO[];
  materials?: import('@/dtos/entities/MaterialDTO').MaterialDTO[];
  stakeholders?: import('@/dtos/entities/StakeholderDTO').StakeholderDTO[];
  milestones?: import('@/dtos/entities/MilestoneDTO').MilestoneDTO[];
}

export class ProjectTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================
  
  /**
   * Supabase Row → Domain Entity
   * Converts snake_case database fields to camelCase domain properties
   */
  static fromSupabase(row: Record<string, unknown>): Project {
    const coordinates = row.coordinates_latitude && row.coordinates_longitude
      ? new ProjectCoordinates(
          Number(row.coordinates_latitude),
          Number(row.coordinates_longitude)
        )
      : undefined;

    return Project.create({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string) || '',
      status: (row.status as string) || 'planifié',
      progress: Number(row.progress) || 0,
      budget: Number(row.budget) || 0,
      startDate: row.start_date ? new Date(row.start_date as string) : null,
      endDate: row.end_date ? new Date(row.end_date as string) : null,
      location: row.location as string,
      coordinates,
      teamSize: Number(row.team_size) || 0,
      thumbnail: row.thumbnail as string,
      financingSource: row.financing_source as string,
      mainContractor: row.main_contractor as string,
      currency: (row.currency as string) || 'XOF',
      createdBy: row.created_by as string,
      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),

      // NEW: Additional database fields mapping
      attributionDate: row.attribution_date ? new Date(row.attribution_date as string) : undefined,
      bankGuaranteeAmount: row.bank_guarantee_amount ? Number(row.bank_guarantee_amount) : undefined,
      bankGuaranteePercentage: row.bank_guarantee_percentage ? Number(row.bank_guarantee_percentage) : undefined,
      bankGuaranteeRequired: row.bank_guarantee_required as boolean,
      checkScheduleLastRun: row.check_schedule_last_run as Record<string, unknown> | undefined,
      closureNotes: row.closure_notes as string,
      completionDate: row.completion_date ? new Date(row.completion_date as string) : undefined,
      donorOrganization: row.donor_organization as string,
      estimatedDays: row.estimated_days ? Number(row.estimated_days) : undefined,
      forme: row.forme as string,
      fundingSource: row.funding_source as string,
      initialAdvancePercentage: row.initial_advance_percentage ? Number(row.initial_advance_percentage) : undefined,
      initialPaymentPercentage: row.initial_payment_percentage ? Number(row.initial_payment_percentage) : undefined,
      localisation: row.localisation as Record<string, unknown> | undefined,
      materialsBudget: row.materials_budget ? Number(row.materials_budget) : undefined,
      paymentFrequency: row.payment_frequency as string,
      paymentMode: row.payment_mode as string,
      paymentWorkflowConfig: row.payment_workflow_config as Record<string, unknown> | undefined,
      procurementLeadTime: row.procurement_lead_time ? Number(row.procurement_lead_time) : undefined,
      projectOrder: row.project_order ? String(row.project_order) : undefined,
      projectReferenceNumber: row.project_reference_number as string,
      projectResponsableId: row.project_responsable_id as string,
      receptionStatus: row.reception_status as string,
      requiresConsultantValidation: row.requires_consultant_validation as boolean,
      requiresMinistryApproval: row.requires_ministry_approval as boolean,
      resourceAssignment: row.resource_assignment as string,
      retentionPercentage: row.retention_percentage ? Number(row.retention_percentage) : undefined,
      sector: row.sector as string,
      siteDetails: row.site_details as string,
      supervisorId: row.supervisor_id as string,
      terrainType: row.terrain_type as string,
    });
  }

  /**
   * Domain Entity → Supabase Insert/Update Object
   * Converts camelCase domain properties to snake_case database fields
   */
  static toSupabase(project: Project): Record<string, unknown> {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      start_date: project.startDate?.toISOString(),
      end_date: project.endDate?.toISOString(),
      location: project.location,
      coordinates_latitude: project.coordinates?.latitude,
      coordinates_longitude: project.coordinates?.longitude,
      team_size: project.teamSize,
      thumbnail: project.thumbnail,
      financing_source: project.financingSource,
      main_contractor: typeof project.mainContractor === 'string' 
        ? project.mainContractor 
        : project.mainContractor?.name,
      currency: project.currency,
      created_by: project.createdBy,
      updated_at: new Date().toISOString(),

      // NEW: Additional database fields mapping
      attribution_date: project.attributionDate?.toISOString(),
      bank_guarantee_amount: project.bankGuaranteeAmount,
      bank_guarantee_percentage: project.bankGuaranteePercentage,
      bank_guarantee_required: project.bankGuaranteeRequired,
      check_schedule_last_run: project.checkScheduleLastRun,
      closure_notes: project.closureNotes,
      completion_date: project.completionDate?.toISOString(),
      donor_organization: project.donorOrganization,
      estimated_days: project.estimatedDays,
      forme: project.forme,
      funding_source: project.fundingSource,
      initial_advance_percentage: project.initialAdvancePercentage,
      initial_payment_percentage: project.initialPaymentPercentage,
      localisation: project.localisation,
      materials_budget: project.materialsBudget,
      payment_frequency: project.paymentFrequency,
      payment_mode: project.paymentMode,
      payment_workflow_config: project.paymentWorkflowConfig,
      procurement_lead_time: project.procurementLeadTime,
      project_order: project.projectOrder,
      project_reference_number: project.projectReferenceNumber,
      project_responsable_id: project.projectManagerId,
      reception_status: project.receptionStatus,
      requires_consultant_validation: project.requiresConsultantValidation,
      requires_ministry_approval: project.requiresMinistryApproval,
      resource_assignment: project.resourceAssignment,
      retention_percentage: project.retentionPercentage,
      sector: project.sector,
      site_details: project.siteDetails,
      supervisor_id: project.supervisorId,
      terrain_type: project.terrainType || '',
    };
  }

  /**
   * Batch: Supabase Rows → Domain Entities
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Project[] {
    return rows.map(row => this.fromSupabase(row));
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Entity → DTO
   * Converts domain entity to DTO for API responses
   */
  static toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status as ProjectStatus,
      progress: project.progress,
      location: project.location || '',
      latitude: project.coordinates?.latitude,
      longitude: project.coordinates?.longitude,
      startDate: project.startDate?.toISOString() || '',
      endDate: project.endDate?.toISOString(),
      budget: project.budget,
      currency: project.currency || 'EUR',
      teamSize: project.teamSize || 0,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
      address: project.location || undefined,
      geographicZone: project.geographicZone || undefined,
      terrainType: project.terrainType || undefined,
      category: project.sector || undefined,
      subCategory: project.projectType || undefined,
      priorityLevel: project.priority as "faible" | "moyenne" | "elevee" | "tresElevee" | undefined, // Proper enum mapping
      riskLevel: (project.getRiskScore() > 70 ? 'critique' : project.getRiskScore() > 40 ? 'eleve' : 'faible') as "faible" | "moyen" | "eleve" | "critique",
      projectManagerId: project.projectResponsable?.id || undefined,
      technicalManagerId: project.technicalManager?.id || undefined,
      supervisorId: project.supervisorId || project.supervisor?.id,
      clientId: project.clientId || undefined,
      mainContractor: typeof project.mainContractor === 'string'
        ? project.mainContractor
        : project.mainContractor?.name,
      currentPhase: project.currentPhase || undefined,
      currentStage: project.currentStage as ConstructionStage | undefined, // Cast to ConstructionStage enum
      methodology: project.methodology as "waterfall" | "agile" | "hybrid" | undefined, // Cast to Methodology enum
      projectReference: project.projectReferenceNumber,
      selectionMode: project.selectionMode || undefined,
      financingSource: project.financingSource || undefined,
      marketType: project.marketType || undefined,
      requiresPermits: project.requiresPermits || undefined,
      permitNumber: project.permitNumber || undefined,
      environmentalImpact: project.environmentalConstraints as "nul" | "faible" | "modere" | "eleve" | undefined,
      environmentalConstraints: project.environmentalConstraints || undefined,
      insuranceRequired: project.insuranceRequired || undefined,
      bankGuaranteeRequired: project.bankGuaranteeRequired || undefined,
      bankGuaranteeAmount: project.bankGuaranteeAmount || undefined,
      hasUtilities: project.hasUtilities || undefined,
      areaSqm: project.areaSqm || undefined,
      siteDetails: project.siteDetails || undefined,
     // workspaceId: undefined, // Not in entity
      createdBy: project.createdBy || undefined,
      taskCount: project.tasks?.length || 0,
      completedTasks: project.tasks?.filter(t => (t.status as string) === 'completed' || (t.status as string) === 'done' || (t.status as string) === 'validated').length || 0,
      overdueTasks: project.tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length || 0,
      riskCount: project.risks?.length || 0,
      highRiskCount: project.risks?.filter(r => r.probability * r.impact > 0.7).length || 0,
      inspectionCount: project.inspections?.length || 0,
      passedInspections: project.inspections?.filter(i => i.status === InspectionStatus.Completed || i.status === InspectionStatus.Approved).length || 0,
      failedInspections: project.inspections?.filter(i => i.status === InspectionStatus.Rejected).length || 0,
      paymentCount: project.payments?.length || 0,
      paidAmount: project.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0,
      pendingPayments: project.getPendingPayments().length || 0,
      phaseCount: project.phases?.length || 0,
      completedPhases: project.phases?.filter(p => p.status === 'completed').length || 0,
      activePhases: project.phases?.filter(p => p.status === 'in_progress').length || 0,
      isOnTrack: project.isOnSchedule(),
      scheduleVariance: project.calculateScheduleVariance(),
      activeTeamMembers: project.teamSize || 0,
      ganttChart: undefined, // Complex data, leave undefined for now
      pertAnalysis: undefined, // Complex data, leave undefined for now
      earnedValueManagement: undefined, // Complex data, leave undefined for now
      projectAnalytics: undefined, // Complex data, leave undefined for now
      performanceMetrics: undefined, // Complex data, leave undefined for now

      // NEW: Additional database fields in DTO
      attributionDate: project.attributionDate?.toISOString(),
      bankGuaranteePercentage: project.bankGuaranteePercentage,
      checkScheduleLastRun: project.checkScheduleLastRun as Record<string, unknown> | undefined,
      closureNotes: project.closureNotes,
      completionDate: project.completionDate?.toISOString(),
      // coordinates already mapped via latitude/longitude above
      donorOrganization: project.donorOrganization,
      estimatedDays: project.estimatedDays,
      forme: project.forme,
      fundingSource: project.fundingSource,
      initialAdvancePercentage: project.initialAdvancePercentage,
      initialPaymentPercentage: project.initialPaymentPercentage,
      localisation: project.localisation,
      materialsBudget: project.materialsBudget,
      paymentFrequency: project.paymentFrequency,
      paymentMode: project.paymentMode,
      paymentWorkflowConfig: project.paymentWorkflowConfig,
      procurementLeadTime: project.procurementLeadTime,
      projectOrder: project.projectOrder,
      projectReferenceNumber: project.projectReferenceNumber,
      projectResponsableId: project.projectManagerId,
      receptionStatus: project.receptionStatus,
      requiresConsultantValidation: project.requiresConsultantValidation,
      requiresMinistryApproval: project.requiresMinistryApproval,
      resourceAssignment: project.resourceAssignment ? [{ id: 'default', name: project.resourceAssignment, type: 'human' as const }] : undefined,
      retentionPercentage: project.retentionPercentage,
      sector: project.sector,
    };
  }

  /**
   * DTO → Domain Entity
   * For processing incoming API requests
   */
  static fromDTO(dto: ProjectDTO | ProjectDTOWithCollections): Project {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : dto.coordinates
      ? new ProjectCoordinates(dto.coordinates.latitude, dto.coordinates.longitude)
      : undefined;

    return Project.create({
      id: dto.id,
      title: dto.title,
      description: dto.description || '',
      status: dto.status,
      progress: dto.progress || 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location,
      coordinates,
      teamSize: dto.teamSize || 0,
      thumbnail: dto.thumbnail,
      currency: dto.currency || 'EUR',
      // Additional fields that exist in domain entity
      financingSource: dto.financingSource,
      mainContractor: dto.mainContractor,

      // NEW: Additional database fields from DTO
      attributionDate: dto.attributionDate ? new Date(dto.attributionDate) : undefined,
      bankGuaranteeAmount: dto.bankGuaranteeAmount,
      bankGuaranteePercentage: dto.bankGuaranteePercentage,
      bankGuaranteeRequired: dto.bankGuaranteeRequired,
      checkScheduleLastRun: dto.checkScheduleLastRun,
      closureNotes: dto.closureNotes,
      completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
      donorOrganization: dto.donorOrganization,
      estimatedDays: dto.estimatedDays,
      forme: dto.forme,
      fundingSource: dto.fundingSource,
      initialAdvancePercentage: dto.initialAdvancePercentage,
      initialPaymentPercentage: dto.initialPaymentPercentage,
      localisation: dto.localisation,
      materialsBudget: dto.materialsBudget,
      paymentFrequency: dto.paymentFrequency,
      paymentMode: dto.paymentMode,
      paymentWorkflowConfig: dto.paymentWorkflowConfig,
      procurementLeadTime: dto.procurementLeadTime,
      projectOrder: dto.projectOrder,
      projectReferenceNumber: dto.projectReferenceNumber || dto.projectReference,
      projectResponsableId: dto.projectResponsableId,
      receptionStatus: dto.receptionStatus,
      requiresConsultantValidation: dto.requiresConsultantValidation,
      requiresMinistryApproval: dto.requiresMinistryApproval,
      resourceAssignment: dto.resourceAssignment ? (dto.resourceAssignment as any)[0]?.name || '' : undefined,
      retentionPercentage: dto.retentionPercentage,
      sector: dto.sector,
      siteDetails: dto.siteDetails,
      supervisorId: dto.supervisorId,
      terrainType: dto.terrainType,
    });

    // Hydrate related sub-objects if available on extended DTO
    const extDto = dto as any;
    if (extDto.phases) result['_phases'] = PhaseTransformer.manyFromDTO(extDto.phases);
    if (extDto.tasks) result['_tasks'] = TaskTransformer.manyFromDTO(extDto.tasks);
    if (extDto.risks) result['_risks'] = RiskTransformer.manyFromDTO(extDto.risks);
    if (extDto.inspections) result['_inspections'] = InspectionTransformer.manyFromDTO(extDto.inspections);
    if (extDto.payments) result['_payments'] = PaymentTransformer.manyFromDTO(extDto.payments);
    if (extDto.materials) result['_materials'] = MaterialTransformer.manyFromDTO(extDto.materials);
    if (extDto.stakeholders) result['_suppliers'] = StakeholderTransformer.manyFromDTO(extDto.stakeholders) as any;
    if (extDto.milestones) result['_milestones'] = MilestoneTransformer.manyFromDTO(extDto.milestones);

    return result;
  }

  /**
   * ProjectDetailDTO → Domain Entity with Collections
   * For processing detailed API requests with all related data
   */
  static fromDetailDTO(dto: ProjectDetailDTO): Project {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : dto.coordinates
      ? new ProjectCoordinates(dto.coordinates.latitude, dto.coordinates.longitude)
      : undefined;

    return Project.create({
      id: dto.id,
      title: dto.title,
      description: dto.description || '',
      status: dto.status,
      progress: dto.progress || 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location,
      coordinates,
      teamSize: dto.teamSize || 0,
      thumbnail: dto.thumbnail,
      currency: dto.currency || 'EUR',
      // Additional fields that exist in domain entity
      financingSource: dto.financingSource,
      mainContractor: dto.mainContractor,

      // NEW: Additional database fields from DTO
      attributionDate: dto.attributionDate ? new Date(dto.attributionDate) : undefined,
      bankGuaranteeAmount: dto.bankGuaranteeAmount,
      bankGuaranteePercentage: dto.bankGuaranteePercentage,
      bankGuaranteeRequired: dto.bankGuaranteeRequired,
      checkScheduleLastRun: dto.checkScheduleLastRun,
      closureNotes: dto.closureNotes,
      completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
      donorOrganization: dto.donorOrganization,
      estimatedDays: dto.estimatedDays,
      forme: dto.forme,
      fundingSource: dto.fundingSource,
      initialAdvancePercentage: dto.initialAdvancePercentage,
      initialPaymentPercentage: dto.initialPaymentPercentage,
      localisation: dto.localisation,
      materialsBudget: dto.materialsBudget,
      paymentFrequency: dto.paymentFrequency,
      paymentMode: dto.paymentMode,
      paymentWorkflowConfig: dto.paymentWorkflowConfig,
      procurementLeadTime: dto.procurementLeadTime,
      projectOrder: dto.projectOrder,
      projectReferenceNumber: dto.projectReferenceNumber || dto.projectReference,
      projectResponsableId: dto.projectResponsableId,
      receptionStatus: dto.receptionStatus,
      requiresConsultantValidation: dto.requiresConsultantValidation,
      requiresMinistryApproval: dto.requiresMinistryApproval,
      resourceAssignment: dto.resourceAssignment?.toString(),
      retentionPercentage: dto.retentionPercentage,
      sector: dto.sector,
      siteDetails: dto.siteDetails,
      supervisorId: dto.supervisorId,
      terrainType: dto.terrainType,
    });
  }

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(projects: Project[]): ProjectDTO[] {
    return projects.map(project => this.toDTO(project));
  }

  // =================== UI ↔ DTO ===================
  
  static formToCreateRequest(formData: Record<string, unknown>): CreateProjectDTO {
    return {
      title: formData.title as string,
      description: (formData.description as string) || '',
      location: (formData.location as string) || '',
      status: (formData.status as ProjectStatus) || ProjectStatus.PLANIFIE,
      budget: Number(formData.budget) || 0,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      teamSize: Number(formData.teamSize) || 0,
      thumbnail: formData.thumbnail as string,
      currency: (formData.currency as string) || 'XOF',
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      createdBy: formData.createdBy as string,

      // Extended fields from comprehensive Project entity
      address: formData.address as string,
      geographicZone: formData.geographicZone as string,
      terrainType: formData.terrainType as string,
      category: formData.category as string,
      subCategory: formData.subCategory as string,
      priorityLevel: formData.priorityLevel as "faible" | "moyenne" | "elevee" | "tresElevee",
      riskLevel: formData.riskLevel as "faible" | "moyen" | "eleve" | "critique",
      projectManagerId: formData.projectManagerId as string,
      clientId: formData.clientId as string,
      mainContractor: formData.mainContractor as string,
      currentStage: formData.currentStage as ConstructionStage,
      methodology: formData.methodology as "waterfall" | "agile" | "hybrid",
      projectReference: formData.projectReference as string,
      selectionMode: formData.selectionMode as string,
      financingSource: formData.financingSource as string,
      marketType: formData.marketType as string,
      launchDate: formData.launchDate as string,
      attributionDate: formData.attributionDate as string,
      allowsInitialPayment: formData.allowsInitialPayment as boolean,
      initialPaymentPercentage: formData.initialPaymentPercentage as number,
      paymentFrequency: formData.paymentFrequency as string,
      paymentMode: formData.paymentMode as string,
      retentionPercentage: formData.retentionPercentage as number,
      initialAdvancePercentage: formData.initialAdvancePercentage as number,
      completionDate: formData.completionDate as string,
      estimatedDays: formData.estimatedDays as number,
      requiresConsultantValidation: formData.requiresConsultantValidation as boolean,
      requiresMinistryApproval: formData.requiresMinistryApproval as boolean,
      requiresPermits: formData.requiresPermits as boolean,
      permitNumber: formData.permitNumber as string,
      hasUtilities: formData.hasUtilities as boolean,
      areaSqm: formData.areaSqm as number,
      siteDetails: formData.siteDetails as string,

      // Insurance and financial
      insuranceRequired: formData.insuranceRequired as boolean,
      bankGuaranteeRequired: formData.bankGuaranteeRequired as boolean,
      bankGuaranteeAmount: formData.bankGuaranteeAmount as number,
      bankGuaranteePercentage: formData.bankGuaranteePercentage as number,
      checkScheduleLastRun: formData.checkScheduleLastRun as Record<string, unknown> | undefined,

      // Organization
      clientOrganization: formData.clientOrganization as string,
      donorOrganization: formData.donorOrganization as string,
      sector: formData.sector as string,
      projectType: formData.projectType as string,
      priority: formData.priority as string,

      // Procurement and materials
      materialsBudget: formData.materialsBudget as number,
      procurementLeadTime: formData.procurementLeadTime as number,
      resourceAssignment: formData.resourceAssignment as ProjectResource[] | undefined,

      // References and details
      projectReferenceNumber: formData.projectReferenceNumber as string,
      projectOrder: formData.projectOrder as string,
      projectResponsableId: formData.projectResponsableId as string,
      forme: formData.forme as string,
      fundingSource: formData.fundingSource as string,
      localisation: formData.localisation as Record<string, unknown>,
      receptionStatus: formData.receptionStatus as string,
      environmentalConstraints: formData.environmentalConstraints as string,
      closureNotes: formData.closureNotes as string,

      // Workflow configuration
      paymentWorkflowConfig: formData.paymentWorkflowConfig as Record<string, unknown>,
      workspaceId: formData.workspaceId as string,
    };
  }

  /**
   * CreateProjectDTO → Entity Data Object
   * For repository create operations - returns plain object with all UI data
   */
  static fromCreateDTOToEntity(dto: CreateProjectDTO): Record<string, unknown> {
    const coordinates = dto.latitude && dto.longitude
      ? new ProjectCoordinates(dto.latitude, dto.longitude)
      : undefined;

    const entityData: Record<string, unknown> = {
      title: dto.title,
      description: dto.description || '',
      status: (dto.status as string) || 'planifié',
      progress: 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location,
      coordinates,
      teamSize: dto.teamSize || 0,
      thumbnail: dto.thumbnail,
      currency: dto.currency || 'XOF',
      createdBy: dto.createdBy,
    };

    // Add optional properties if they exist
    if (dto.financingSource !== undefined) entityData.financingSource = dto.financingSource;
    if (dto.mainContractor !== undefined) entityData.mainContractor = dto.mainContractor;
    if (dto.currentStage !== undefined) entityData.currentStage = dto.currentStage;
    if (dto.currentPhase !== undefined) entityData.currentPhase = dto.currentPhase;
    if (dto.methodology !== undefined) entityData.methodology = dto.methodology;
    if (dto.allowsInitialPayment !== undefined) entityData.allowsInitialPayment = dto.allowsInitialPayment;
    if (dto.initialPaymentPercentage !== undefined) entityData.initialPaymentPercentage = dto.initialPaymentPercentage;
    if (dto.paymentFrequency !== undefined) entityData.paymentFrequency = dto.paymentFrequency;
    if (dto.paymentMode !== undefined) entityData.paymentMode = dto.paymentMode;
    if (dto.retentionPercentage !== undefined) entityData.retentionPercentage = dto.retentionPercentage;
    if (dto.initialAdvancePercentage !== undefined) entityData.initialAdvancePercentage = dto.initialAdvancePercentage;
    if (dto.completionDate !== undefined) entityData.completionDate = new Date(dto.completionDate);
    if (dto.estimatedDays !== undefined) entityData.estimatedDays = dto.estimatedDays;
    if (dto.launchDate !== undefined) entityData.launchDate = new Date(dto.launchDate);
    if (dto.attributionDate !== undefined) entityData.attributionDate = new Date(dto.attributionDate);
    if (dto.requiresConsultantValidation !== undefined) entityData.requiresConsultantValidation = dto.requiresConsultantValidation;
    if (dto.requiresMinistryApproval !== undefined) entityData.requiresMinistryApproval = dto.requiresMinistryApproval;
    if (dto.requiresPermits !== undefined) entityData.requiresPermits = dto.requiresPermits;
    if (dto.permitNumber !== undefined) entityData.permitNumber = dto.permitNumber;
    if (dto.hasUtilities !== undefined) entityData.hasUtilities = dto.hasUtilities;
    if (dto.areaSqm !== undefined) entityData.areaSqm = dto.areaSqm;
    if (dto.siteDetails !== undefined) entityData.siteDetails = dto.siteDetails;
    if (dto.bankGuaranteeRequired !== undefined) entityData.bankGuaranteeRequired = dto.bankGuaranteeRequired;
    if (dto.bankGuaranteeAmount !== undefined) entityData.bankGuaranteeAmount = dto.bankGuaranteeAmount;
    if (dto.bankGuaranteePercentage !== undefined) entityData.bankGuaranteePercentage = dto.bankGuaranteePercentage;
    if (dto.insuranceRequired !== undefined) entityData.insuranceRequired = dto.insuranceRequired;
    if (dto.materialsBudget !== undefined) entityData.materialsBudget = dto.materialsBudget;
    if (dto.procurementLeadTime !== undefined) entityData.procurementLeadTime = dto.procurementLeadTime;
    if (dto.resourceAssignment !== undefined) entityData.resourceAssignment = dto.resourceAssignment;
    if (dto.clientOrganization !== undefined) entityData.clientOrganization = dto.clientOrganization;
    if (dto.donorOrganization !== undefined) entityData.donorOrganization = dto.donorOrganization;
    if (dto.sector !== undefined) entityData.sector = dto.sector;
    if (dto.projectType !== undefined) entityData.projectType = dto.projectType;
    if (dto.priority !== undefined) entityData.priority = dto.priority;
    if (dto.geographicZone !== undefined) entityData.geographicZone = dto.geographicZone;
    if (dto.terrainType !== undefined) entityData.terrainType = dto.terrainType;
    if (dto.environmentalConstraints !== undefined) entityData.environmentalConstraints = dto.environmentalConstraints;
    if (dto.projectReferenceNumber !== undefined) entityData.projectReferenceNumber = dto.projectReferenceNumber;
    if (dto.projectOrder !== undefined) entityData.projectOrder = dto.projectOrder;
    if (dto.clientId !== undefined) entityData.clientId = dto.clientId;
    if (dto.projectResponsableId !== undefined) entityData.projectResponsable = dto.projectResponsableId;
    if (dto.forme !== undefined) entityData.forme = dto.forme;
    if (dto.fundingSource !== undefined) entityData.fundingSource = dto.fundingSource;
    if (dto.localisation !== undefined) entityData.localisation = dto.localisation;
    if (dto.receptionStatus !== undefined) entityData.receptionStatus = dto.receptionStatus;
    if (dto.closureNotes !== undefined) entityData.closureNotes = dto.closureNotes;
    if (dto.checkScheduleLastRun !== undefined) entityData.checkScheduleLastRun = dto.checkScheduleLastRun;
    if (dto.paymentWorkflowConfig !== undefined) entityData.paymentWorkflowConfig = dto.paymentWorkflowConfig;

    return entityData;
  }

  /**
   * UpdateProjectDTO → Update Data Object
   * For repository update operations - returns plain object to avoid read-only property issues
   */
  static fromUpdateDTOToEntity(dto: UpdateProjectDTO): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status as string;
    if (dto.budget !== undefined) updates.budget = dto.budget;
    if (dto.progress !== undefined) updates.progress = dto.progress;
    if (dto.startDate !== undefined) updates.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updates.endDate = new Date(dto.endDate);
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.teamSize !== undefined) updates.teamSize = dto.teamSize;
    if (dto.thumbnail !== undefined) updates.thumbnail = dto.thumbnail;

    return updates;
  }

  /**
   * ProjectWorkflowData → ProjectDetailDTO
   * Converts multi-step workflow data to detailed project DTO for API operations
   */
  static workflowToDetailDTO(workflowData: any): ProjectDetailDTO {
    const projectData = workflowData.projectData;
    const relatedData = workflowData.relatedData;

    // Convert basic project data
    const projectDTO: ProjectDetailDTO = {
      ...this.toDTO(this.fromDTO(projectData)), // Convert using existing logic
      // Override with workflow-specific data
      id: projectData.id || '',
      title: projectData.title,
      description: projectData.description || '',
      status: projectData.status || ProjectStatus.PLANIFIE,
      progress: projectData.progress || 0,
      budget: projectData.budget || 0,
      startDate: projectData.startDate || '',
      endDate: projectData.endDate || '',
      location: projectData.location || '',
      address: projectData.address,
      latitude: projectData.latitude,
      longitude: projectData.longitude,
      teamSize: projectData.teamSize || 0,
      thumbnail: projectData.thumbnail,
      createdAt: projectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Workflow step tracking stored as currentStage (ConstructionStage)
      currentStage: String(workflowData.currentStep) as any,

      // Convert related data to domain collections
      phases: relatedData?.phases ? PhaseTransformer.manyToDTO(relatedData.phases) : [],
      tasks: relatedData?.tasks ? TaskTransformer.manyToDTO(relatedData.tasks) : [],
      risks: relatedData?.risks ? RiskTransformer.manyToDTO(relatedData.risks) : [],
      milestones: relatedData?.milestones ? MilestoneTransformer.manyToDTO(relatedData.milestones) : [],
      payments: relatedData?.payments ? PaymentTransformer.manyToDTO(relatedData.payments) : [],
      materials: relatedData?.materials ? MaterialTransformer.manyToDTO(relatedData.materials) : [],
      stakeholders: relatedData?.stakeholders ? StakeholderTransformer.manyToDTO(relatedData.stakeholders) : [],
      inspections: relatedData?.inspections ? InspectionTransformer.manyToDTO(relatedData.inspections) : [],

      // Required by ProjectDetailDTO
      alerts: [],
      constructionMilestones: relatedData?.milestones ? MilestoneTransformer.manyToDTO(relatedData.milestones) : [],
      tenders: [],

      // Aliases for UI compatibility
      plannedPhases: relatedData?.phases ? PhaseTransformer.manyToDTO(relatedData.phases) : [],
      expenses: relatedData?.payments ? PaymentTransformer.manyToDTO(relatedData.payments) : [],
      resources: workflowData.resources,
    };

    return projectDTO;
  }

  /**
   * ProjectDetailDTO → ProjectWorkflowData
   * Converts detailed project DTO back to workflow data for form editing
   */
  static detailDTOToWorkflow(dto: ProjectDetailDTO): any {
    return {
      // Basic project data
      projectData: {
        id: dto.id,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        progress: dto.progress,
        budget: dto.budget,
        startDate: dto.startDate,
        endDate: dto.endDate,
        location: dto.location,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        teamSize: dto.teamSize,
        thumbnail: dto.thumbnail,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        // Include all other project fields...
        financingSource: dto.financingSource,
        mainContractor: dto.mainContractor,
        currency: dto.currency,
        category: dto.category,
        subCategory: dto.subCategory,
        priorityLevel: dto.priorityLevel,
        riskLevel: dto.riskLevel,
        methodology: dto.methodology,
        projectReference: dto.projectReference,
        selectionMode: dto.selectionMode,
        marketType: dto.marketType,
        requiresPermits: dto.requiresPermits,
        permitNumber: dto.permitNumber,
        environmentalImpact: dto.environmentalImpact,
        environmentalConstraints: dto.environmentalConstraints,
        insuranceRequired: dto.insuranceRequired,
        bankGuaranteeRequired: dto.bankGuaranteeRequired,
        hasUtilities: dto.hasUtilities,
        areaSqm: dto.areaSqm,
        siteDetails: dto.siteDetails,
      },

      // Workflow step tracking
      currentStep: dto.currentStep,
      completedSteps: dto.completedSteps,
      stepValidation: dto.stepValidation,
      workflowState: dto.workflowState,

      // Step-specific collections
      stakeholdersData: dto.stakeholdersData,
      locationData: dto.locationData,
      phasesData: dto.phasesData,
      risksData: dto.risksData,
      complianceData: dto.complianceData,
      validationData: dto.validationData,

      // Related domain collections
      relatedData: {
        phases: dto.phases ? PhaseTransformer.manyFromDTO(dto.phases) : [],
        tasks: dto.tasks ? TaskTransformer.manyFromDTO(dto.tasks) : [],
        risks: dto.risks ? RiskTransformer.manyFromDTO(dto.risks) : [],
        milestones: dto.milestones ? MilestoneTransformer.manyFromDTO(dto.milestones) : [],
        payments: dto.payments ? PaymentTransformer.manyFromDTO(dto.payments) : [],
        materials: dto.materials ? MaterialTransformer.manyFromDTO(dto.materials) : [],
        stakeholders: dto.stakeholders ? StakeholderTransformer.manyFromDTO(dto.stakeholders) : [],
        inspections: dto.inspections ? InspectionTransformer.manyFromDTO(dto.inspections) : [],
      },

      // Resources
      resources: dto.resources,
    };
  }

  /**
   * Workflow Form Update → Update Data Object
   * Handles incremental updates from workflow form steps
   */
  static workflowFormUpdateToEntity(updates: Partial<any>): Record<string, unknown> {
    const entityUpdates: Record<string, unknown> = {};

    // Handle project data updates
    if (updates.projectData) {
      const projectUpdates = this.fromUpdateDTOToEntity({
        id: updates.projectData.id || '',
        ...updates.projectData
      });
      Object.assign(entityUpdates, projectUpdates);
    }

    // Handle related data updates (convert to entity format)
    if (updates.relatedData) {
      if (updates.relatedData.phases) {
        entityUpdates.phases = PhaseTransformer.manyFromDTO(updates.relatedData.phases);
      }
      if (updates.relatedData.tasks) {
        entityUpdates.tasks = TaskTransformer.manyFromDTO(updates.relatedData.tasks);
      }
      if (updates.relatedData.risks) {
        entityUpdates.risks = RiskTransformer.manyFromDTO(updates.relatedData.risks);
      }
      if (updates.relatedData.stakeholders) {
        entityUpdates.stakeholders = StakeholderTransformer.manyFromDTO(updates.relatedData.stakeholders);
      }
      // Add other related data conversions...
    }

    return entityUpdates;
  }

  /**
   * Domain Entity → UI State
   * Transforms entity to UI-friendly format with calculated fields
   */
  static toUI(project: Project): Record<string, unknown> {
    const dto = this.toDTO(project);
    const daysRemaining = project.endDate 
      ? Math.max(0, Math.ceil((project.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      ...dto,
      isOverdue: project.isOverdue(),
      isCompleted: project.isCompleted(),
      daysRemaining,
      budgetFormatted: new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: project.currency || 'XOF' 
      }).format(project.budget),
      progressFormatted: `${project.progress}%`,
    };
  }

  /**
   * Batch: Domain Entities → UI States
   */
  static manyToUI(projects: Project[]): Record<string, unknown>[] {
    return projects.map(project => this.toUI(project));
  }

  // =================== CREATE REQUEST TRANSFORMATIONS ===================

  /**
   * Create Request DTO → Domain Entity
   * Used when creating a new project from API request
   */
  static fromCreateRequest(request: CreateProjectDTO, id: string): Project {
    const coordinates = request.latitude && request.longitude
      ? new ProjectCoordinates(request.latitude, request.longitude)
      : undefined;

    return Project.create({
      id,
      title: request.title,
      description: request.description || '',
      status: 'planifié' as string,
      progress: 0,
      budget: request.budget || 0,
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
      location: request.location,
      coordinates,
      teamSize: request.teamSize || 0,
      thumbnail: request.thumbnail,
      currency: request.currency || 'XOF',
      createdBy: request.createdBy,
    });
  }

  /**
   * Create Request DTO → Supabase Insert Object
   * Direct transformation for database insertion
   */
  static createToSupabase(request: CreateProjectDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      title: request.title,
      description: request.description || '',
      status: 'planifié',
      progress: 0,
      budget: request.budget || 0,
      start_date: request.startDate || now,
      end_date: request.endDate,
      location: request.location || '',
      coordinates_latitude: request.latitude,
      coordinates_longitude: request.longitude,
      team_size: request.teamSize || 0,
      thumbnail: request.thumbnail,
      currency: request.currency || 'XOF',
      created_by: request.createdBy,
      created_at: now,
      updated_at: now,
    };
  }

  // =================== DETAIL & SUMMARY TRANSFORMATIONS ===================

  /**
   * Domain Entity → Detail DTO
   * Includes all related data for detail views
   */
  static toDetailDTO(project: Project): ProjectDetailDTO {
    const baseDTO = this.toDTO(project);
    const phases = project.phases?.map(phase => PhaseTransformer.toDTO(phase)) || [];
    const payments = project.payments?.map(payment => PaymentTransformer.toDTOWithProjectContext(payment, project)) || [];

    return {
      ...baseDTO,
      // Populate collections from Project entity
      // Delegate phase transformation to PhaseTransformer (OOP principle: separation of concerns)
      phases: phases,
      // Delegate task transformation to TaskTransformer (OOP principle: separation of concerns)
      tasks: project.tasks?.map(task => TaskTransformer.toDTO(task)) || [],
      // Delegate risk transformation to RiskTransformer (OOP principle: separation of concerns)
      risks: project.risks?.map(risk => RiskTransformer.toDTO(risk)) || [],
      // Delegate milestone transformation to MilestoneTransformer (OOP principle: separation of concerns)
      milestones: project.milestones?.map(milestone => MilestoneTransformer.toDTO(milestone)) || [],
      // Delegate payment transformation to PaymentTransformer (OOP principle: separation of concerns)
      payments: payments,
      // Delegate material transformation to MaterialTransformer (OOP principle: separation of concerns)
      materials: project.materials?.map(material => MaterialTransformer.toDTO(material)) || [],
      // Delegate stakeholder transformation to StakeholderTransformer (OOP principle: separation of concerns)
      stakeholders: project.suppliers?.map(supplier => StakeholderTransformer.toDTO(supplier as any)) || [],
      inspections: project.inspections?.map(inspection => InspectionTransformer.toDTO(inspection)) || [],
      alerts: [], // Project entity doesn't have alerts collection yet
      constructionMilestones: project.milestones?.map(milestone => MilestoneTransformer.toDTO(milestone)) || [],
      tenders: project.tenders?.map(tender => TenderDomainTransformer.toDTO(tender)) || [],
      expenses: payments.filter(payment => payment.status === 'paid'), // Alias for payments

      // ADDING MISSING PROPERTIES
      plannedPhases: phases, // Alias for phases
      resources: [], // Default empty array - can be populated from employees/materials if needed

      // Insurance related collections (placeholder for now)
      insurancePolicies: [],
      insuranceCertificates: [],

      // Performance data
      escalationThresholds: {
        alert: 10,
        notification: 20,
        guarantee: 30,
        legal: 40,
      },

      // Team allocation
      teamAllocations: [],

      // Documents
      documents: project.documents?.map(doc => ({
        id: doc.id,
        title: doc.title,
        documentType: doc.documentType,
        description: doc.description,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        status: doc.status,
        assignedTo: doc.assignedTo,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        deadlineDate: doc.deadlineDate,
        isInternalOnly: doc.isInternalOnly,
        isSharedWithSuppliers: doc.isSharedWithSuppliers,
        tags: doc.tags,
        mimeType: doc.mimeType,
        metadata: doc.metadata,
        phaseId: doc.phaseId,
        projectId: doc.projectId,
        inspectionId: doc.inspectionId,
        paymentId: doc.paymentId,
        supplierId: doc.supplierId,
        sharedDate: null,
        updatedAt: doc.updatedAt
      })) || [],
    };
  }

  /**
   * Domain Entity → Summary DTO
   * Lightweight representation with counts
   */
  static toSummaryDTO(project: Project, counts?: {
    phasesCount?: number;
    tasksCount?: number;
    risksCount?: number;
    inspectionsCount?: number;
    paymentsCount?: number;
  }): ProjectSummaryDTO {
    const baseDTO = this.toDTO(project);
    
    return {
      ...baseDTO,
      phasesCount: counts?.phasesCount || 0,
      tasksCount: counts?.tasksCount || 0,
      risksCount: counts?.risksCount || 0,
      inspectionsCount: counts?.inspectionsCount || 0,
      paymentsCount: counts?.paymentsCount || 0,
    };
  }
}
