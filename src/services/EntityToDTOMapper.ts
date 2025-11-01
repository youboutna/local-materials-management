// Mapping between database entities and DTOs
import { ProjectEntity, ProjectRiskEntity, TaskAssignmentEntity, InspectionEntity, PaymentEntity } from '@/types/entities';
import { ProjectDTO, ProjectDetailDTO, ProjectSummaryDTO, ProjectListItemDTO, TaskDTO, InspectionDTO, PaymentDTO, RiskDTO } from '@/types/dto';
import { ProjectStatus } from '@/types/project';

export class EntityToDTOMapper {
  // ============= Project Mappings =============

  static projectEntityToDTO(entity: ProjectEntity): ProjectDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      location: entity.location,
      status: entity.status as ProjectStatus,
      progress: entity.progress,
      budget: entity.budget,
      startDate: entity.start_date,
      endDate: entity.end_date,
      thumbnail: entity.thumbnail,
      teamSize: entity.team_size,
      coordinates: entity.coordinates_latitude && entity.coordinates_longitude ? {
        latitude: entity.coordinates_latitude,
        longitude: entity.coordinates_longitude
      } : undefined,
      // Add localization fields
      localisation: (entity as any).localisation || [],
      forme: (entity as any).forme,
      adresse: (entity as any).adresse,
      // Location-specific fields
      geographicZone: (entity as any).geographic_zone,
      terrainType: (entity as any).terrain_type,
      environmentalConstraints: (entity as any).environmental_constraints,
      hasUtilities: (entity as any).has_utilities,
      requiresPermits: (entity as any).requires_permits,
      financingSource: entity.financing_source,
      marketType: entity.market_type,
      selectionMode: entity.selection_mode,
      launchDate: entity.launch_date,
      attributionDate: entity.attribution_date,
      projectResponsableId: entity.project_responsable_id,
      mainContractor: entity.main_contractor,
      projectReference: entity.project_reference,
      allowsInitialPayment: entity.allows_initial_payment,
      initialPaymentPercentage: entity.initial_payment_percentage,
      currentPhase: entity.current_phase as any,
      currentStage: entity.current_stage as any
    };
  }

  static projectEntityToSummaryDTO(
    entity: ProjectEntity,
    counts: {
      tasksCount: number;
      risksCount: number;
      inspectionsCount: number;
      paymentsCount: number;
      phasesCount: number;
    },
    lastActivity?: string
  ): ProjectSummaryDTO {
    const baseDTO = this.projectEntityToDTO(entity);
    return {
      ...baseDTO,
      ...counts,
      lastActivity
    };
  }

  static projectEntityToDetailDTO(
    entity: ProjectEntity,
    relatedData: {
      risks: RiskDTO[];
      tasks: TaskDTO[];
      inspections: InspectionDTO[];
      payments: PaymentDTO[];
      phases: any[];
    }
  ): ProjectDetailDTO {
    const baseDTO = this.projectEntityToDTO(entity);
    return {
      ...baseDTO,
      tasks: relatedData.tasks.map(task => ({
        ...task,
        phaseId: '',
        dependencies: [],
        assignedTo: task.assignedTo || [],
        weight: 1,
        estimatedDuration: task.estimatedDuration || 30,
        optimisticEstimate: undefined,
        pessimisticEstimate: undefined,
        criticalPath: false,
        ganttColor: undefined
      })),
      risks: relatedData.risks.map(risk => ({
        ...risk,
        relatedTasks: []
      })),
      resources: [],
      inspections: relatedData.inspections.map(inspection => ({
        ...inspection,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        documents: inspection.documents || [],
        issues: inspection.issues || []
      })),
      plannedPhases: relatedData.phases,
      expenses: relatedData.payments
    };
  }

  static projectEntityToListItemDTO(entity: ProjectEntity): ProjectListItemDTO {
    return {
      id: entity.id,
      title: entity.title,
      location: entity.location,
      status: entity.status as ProjectStatus,
      progress: entity.progress,
      budget: entity.budget,
      startDate: entity.start_date,
      endDate: entity.end_date,
      thumbnail: entity.thumbnail,
      teamSize: entity.team_size,
      coordinates: entity.coordinates_latitude && entity.coordinates_longitude ? {
        latitude: entity.coordinates_latitude,
        longitude: entity.coordinates_longitude
      } : undefined
    };
  }

  // ============= Task Mappings =============

  static taskEntityToDTO(entity: TaskAssignmentEntity): TaskDTO {
    return {
      id: entity.id,
      name: entity.title,
      description: entity.description || '',
      assignedTo: entity.assigned_to ? [entity.assigned_to] : [],
      status: entity.status as 'not_started' | 'in_progress' | 'completed' | 'delayed',
      progress: entity.status === 'completed' ? 100 : entity.status === 'in_progress' ? 50 : 0,
      startDate: entity.created_at.split('T')[0],
      endDate: entity.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      estimatedDuration: 30, // Default duration
      actualDuration: entity.completion_date ? 
        Math.ceil((new Date(entity.completion_date).getTime() - new Date(entity.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
        undefined,
      costEstimate: 0, // Not available in current schema
      actualCost: 0 // Not available in current schema
    };
  }

  // ============= Risk Mappings =============

  static riskEntityToDTO(entity: ProjectRiskEntity): RiskDTO {
    return {
      id: entity.id,
      title: entity.risk_title || '',
      description: entity.risk_description || '',
      probability: parseFloat(entity.probability || '0'),
      impact: parseFloat(entity.impact || '0'),
      mitigationPlan: entity.mitigation_strategy || '',
      status: (entity.status as 'identified' | 'monitored' | 'mitigated' | 'resolved') || 'identified'
    };
  }

  // ============= Inspection Mappings =============

  static inspectionEntityToDTO(entity: InspectionEntity): InspectionDTO {
    return {
      id: entity.id,
      project_id: entity.project_id,
      inspector: entity.inspector,
      date: entity.date,
      status: entity.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending',
      progress_at_inspection: entity.progress_at_inspection,
      comments: entity.comments,
      phase_id: entity.phase_id,
      documents: entity.documents || [],
      issues: [] // Transform from entity.documents if needed
    };
  }

  // ============= Payment Mappings =============

  static paymentEntityToDTO(entity: PaymentEntity): PaymentDTO {
    return {
      id: entity.id,
      amount: entity.amount,
      payment_date: entity.payment_date,
      payment_method: entity.payment_method,
      progress_at_payment: entity.progress_at_payment,
      transaction_id: entity.transaction_id,
      contractor_name: entity.contractor_name,
      contractor_contact: entity.contractor_contact,
      bank_name: entity.bank_name,
      account_number: entity.account_number,
      check_number: entity.check_number,
      mobile_number: entity.mobile_number,
      mobile_operator: entity.mobile_operator,
      receiver_name: entity.receiver_name
    };
  }

  // ============= Inspection Mapping =============

  /**
   * Map InspectionEntity to InspectionDTO with optional project info
   */
  static inspectionEntityToDTOWithProject(
    entity: InspectionEntity, 
    projectInfo?: { title: string; status: string }
  ): any {
    return {
      id: entity.id,
      project_id: entity.project_id,
      date: entity.date,
      status: entity.status,
      inspector: entity.inspector,
      comments: entity.comments || null,
      progress_at_inspection: entity.progress_at_inspection || null,
      documents: entity.documents || null,
      phase_id: entity.phase_id || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      projects: projectInfo || null
    };
  }

  // ============= Tender Mapping =============

  /**
   * Map TenderEntity to TenderDTO
   */
  static tenderEntityToDTO(entity: any): any {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      project_id: entity.project_id || null,
      launch_date: entity.launch_date || null,
      attribution_date: entity.attribution_date || null,
      selection_mode: entity.selection_mode || null,
      market_type: entity.market_type || null,
      financing_source: entity.financing_source || null,
      project_reference: entity.project_reference || null,
      status: entity.status,
      tender_number: entity.tender_number || null,
      publication_date: entity.publication_date || null,
      deadline_date: entity.deadline_date || null,
      budget_min: entity.budget_min || null,
      budget_max: entity.budget_max || null,
      evaluation_criteria: entity.evaluation_criteria || null,
      eligibility_requirements: entity.eligibility_requirements || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * Map TenderSubmissionEntity to TenderSubmissionDTO
   */
  static tenderSubmissionEntityToDTO(entity: any): any {
    return {
      id: entity.id,
      tender_id: entity.tender_id,
      supplier_id: entity.supplier_id || null,
      supplier_name: entity.supplier_name,
      submission_date: entity.submission_date,
      status: entity.status,
      total_amount: entity.total_amount || null,
      secret_code: entity.secret_code || null,
      secret_expires_at: entity.secret_expires_at || null,
      is_secret_active: entity.is_secret_active || false,
      secret_access_count: entity.secret_access_count || 0,
      max_secret_access: entity.max_secret_access || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  // ============= Reverse Mappings (DTO to Entity) =============

  static projectDTOToEntity(dto: ProjectDTO): Omit<ProjectEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      title: dto.title,
      description: dto.description,
      location: dto.location,
      status: dto.status,
      progress: dto.progress,
      budget: dto.budget,
      start_date: dto.startDate,
      end_date: dto.endDate,
      thumbnail: dto.thumbnail,
      team_size: dto.teamSize,
      coordinates_latitude: dto.coordinates?.latitude,
      coordinates_longitude: dto.coordinates?.longitude,
      financing_source: dto.financingSource,
      market_type: dto.marketType,
      selection_mode: dto.selectionMode,
      launch_date: dto.launchDate,
      attribution_date: dto.attributionDate,
      project_responsable_id: dto.projectResponsableId,
      main_contractor: dto.mainContractor,
      project_reference: dto.projectReference,
      allows_initial_payment: dto.allowsInitialPayment,
      initial_payment_percentage: dto.initialPaymentPercentage,
      current_phase: dto.currentPhase,
      current_stage: dto.currentStage
    };
  }
}