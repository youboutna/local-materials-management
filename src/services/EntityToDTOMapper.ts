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

  // ============= Form Data Mappings (for ProjectFormService) =============

  /**
   * Map database entity to form data format
   */
  static projectEntityToFormData(entity: any): any {
    const formatDate = (dateString: any): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    const mapStatus = (status: string): string => {
      const mapping: Record<string, string> = {
        'en attente': 'planning',
        'en cours': 'en cours',
        'suspendu': 'suspendu',
        'terminé': 'terminé',
        'annulé': 'annulé'
      };
      return mapping[status] || status || 'planning';
    };

    return {
      // Basic info
      title: entity.title || '',
      project_reference: entity.project_reference || '',
      description: entity.description || '',
      budget: entity.budget?.toString() || '',
      estimated_duration_days: entity.estimated_duration_days?.toString() || '',
      currency: entity.currency || 'MRU',
      status: mapStatus(entity.status),
      start_date: formatDate(entity.start_date),
      end_date: formatDate(entity.end_date),
      startDate: formatDate(entity.start_date),
      endDate: formatDate(entity.end_date),
      // Payment
      payment_mode: entity.payment_mode || 'progressive',
      payment_frequency: entity.payment_frequency || 'monthly',
      initial_advance: entity.initial_advance || 20,
      retention_percentage: entity.retention_percentage || 5,
      advance_percentage: entity.advance_percentage || 20,
      // Meta
      priority: entity.priority || 'medium',
      project_type: entity.project_type || 'construction',
      sector: entity.sector || '',
      permit_number: entity.permit_number || '',
      progress: entity.progress || 0,
      // Location
      address: entity.address || entity.location || '',
      location: entity.location || entity.address || '',
      latitude: entity.latitude || entity.coordinates_latitude,
      longitude: entity.longitude || entity.coordinates_longitude,
      area_sqm: entity.area_sqm,
      site_details: entity.site_details || '',
      geographic_zone: entity.geographic_zone || '',
      terrain_type: entity.terrain_type || '',
      environmental_constraints: entity.environmental_constraints || '',
      has_utilities: entity.has_utilities || false,
      requires_permits: entity.requires_permits || false,
      // Stakeholders
      client_name: entity.client_name || '',
      main_contractor: entity.main_contractor || '',
      engineering_consultant: entity.engineering_consultant || '',
      project_manager_id: entity.project_manager_id,
      technical_manager_id: entity.technical_manager_id,
      supervisor_id: entity.supervisor_id,
      client_id: entity.client_id,
      workspace_id: entity.workspace_id,
      // Financing
      financing_source: entity.financing_source || '',
      market_type: entity.market_type || '',
      selection_mode: entity.selection_mode || '',
      // Financial instruments
      bank_guarantee_required: entity.bank_guarantee_required || false,
      bank_guarantee_amount: entity.bank_guarantee_amount,
      insurance_required: entity.insurance_required || false
    };
  }

  /**
   * Map form data to database entity format
   */
  static formDataToProjectEntity(formData: any, step?: number): any {
    const nullIfEmpty = (value: any) => {
      if (value === '' || value === undefined) return null;
      return value;
    };

    // Base fields always included
    const baseFields = {
      title: formData.title,
      description: formData.description,
      status: formData.status || 'planning',
      progress: formData.progress || 0
    };

    // Step 1: Basic info
    const step1Fields = {
      ...baseFields,
      project_reference: nullIfEmpty(formData.project_reference),
      budget: parseFloat(formData.budget || '0') || 0,
      estimated_duration_days: parseInt(formData.estimated_duration_days || '0') || null,
      currency: formData.currency || 'MRU',
      start_date: nullIfEmpty(formData.start_date || formData.startDate),
      end_date: nullIfEmpty(formData.end_date || formData.endDate),
      payment_mode: formData.payment_mode || 'progressive',
      payment_frequency: formData.payment_frequency || 'monthly',
      initial_advance: formData.initial_advance || 20,
      retention_percentage: formData.retention_percentage || 5,
      priority: formData.priority || 'medium',
      project_type: formData.project_type || 'construction',
      sector: nullIfEmpty(formData.sector),
      permit_number: nullIfEmpty(formData.permit_number),
      financing_source: nullIfEmpty(formData.financing_source),
      market_type: nullIfEmpty(formData.market_type),
      selection_mode: nullIfEmpty(formData.selection_mode)
    };

    // Step 2: Stakeholders
    const step2Fields = {
      client_name: nullIfEmpty(formData.client_name),
      main_contractor: nullIfEmpty(formData.main_contractor),
      engineering_consultant: nullIfEmpty(formData.engineering_consultant),
      project_manager_id: nullIfEmpty(formData.project_manager_id),
      technical_manager_id: nullIfEmpty(formData.technical_manager_id),
      supervisor_id: nullIfEmpty(formData.supervisor_id),
      client_id: nullIfEmpty(formData.client_id),
      workspace_id: nullIfEmpty(formData.workspace_id)
    };

    // Step 3: Location
    const step3Fields = {
      address: nullIfEmpty(formData.address),
      location: nullIfEmpty(formData.location || formData.address),
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      coordinates_latitude: formData.latitude || null,
      coordinates_longitude: formData.longitude || null,
      area_sqm: formData.area_sqm || null,
      site_details: nullIfEmpty(formData.site_details),
      geographic_zone: nullIfEmpty(formData.geographic_zone),
      terrain_type: nullIfEmpty(formData.terrain_type),
      environmental_constraints: nullIfEmpty(formData.environmental_constraints),
      has_utilities: formData.has_utilities || false,
      requires_permits: formData.requires_permits || false
    };

    // Step 6: Financial instruments
    const step6Fields = {
      advance_percentage: formData.advance_percentage || 20,
      bank_guarantee_required: formData.bank_guarantee_required || false,
      bank_guarantee_amount: formData.bank_guarantee_amount || null,
      insurance_required: formData.insurance_required || false
    };

    // Return based on step (undefined = all fields)
    if (step === undefined) {
      return {
        ...step1Fields,
        ...step2Fields,
        ...step3Fields,
        ...step6Fields
      };
    }

    switch (step) {
      case 1:
        return step1Fields;
      case 2:
        return { ...baseFields, ...step2Fields };
      case 3:
        return { ...baseFields, ...step3Fields };
      case 4: // Phases - handled separately
      case 5: // Risks - handled separately
        return baseFields;
      case 6:
        return { ...baseFields, ...step6Fields };
      case 7: // Validation
        return { ...baseFields, status: formData.status || 'planning' };
      default:
        return step1Fields;
    }
  }

  /**
   * Get required fields for validation per step
   */
  static getRequiredFieldsForStep(step: number): string[] {
    switch (step) {
      case 1:
        return ['title', 'description', 'budget', 'project_type', 'start_date'];
      case 2:
        return []; // At least one stakeholder recommended but not required
      case 3:
        return ['address'];
      case 4:
        return []; // Phases handled separately
      case 5:
        return []; // Risks handled separately
      case 6:
        return []; // Compliance handled separately
      case 7:
        return [];
      default:
        return [];
    }
  }

  /**
   * Validate form data for a specific step
   */
  static validateStepData(formData: any, step: number): { valid: boolean; errors: string[] } {
    const requiredFields = this.getRequiredFieldsForStep(step);
    const errors: string[] = [];

    for (const field of requiredFields) {
      const value = formData[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}