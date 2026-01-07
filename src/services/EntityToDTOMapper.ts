// Mapping between database entities and DTOs
import { ProjectEntity, ProjectRiskEntity, TaskAssignmentEntity, InspectionEntity, PaymentEntity, ProjectPhaseEntity, PhaseStepData, PhaseTaskData } from '@/types/entities';
import { ProjectDTO, ProjectDetailDTO, ProjectSummaryDTO, ProjectListItemDTO, TaskDTO, InspectionDTO, PaymentDTO, RiskDTO } from '@/types/dto';
import { PhaseDTO, PhaseSummaryDTO, PhaseStepDTO, PhaseTaskDTO, PhaseStatus, PhaseFormDTO } from '@/types/phase-dto';
import { StepItem } from '@/types/unified-workflow';
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

  // ============= Phase Mappings =============

  /**
   * Map PhaseTaskData to PhaseTaskDTO
   */
  static phaseTaskDataToDTO(task: PhaseTaskData): PhaseTaskDTO {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      status: (task.status as PhaseStatus) || 'pending',
      progress: task.progress || 0,
      estimated_duration_days: task.estimated_duration_days,
      actual_duration_days: task.actual_duration_days,
      start_date: task.start_date,
      end_date: task.end_date,
      assigned_to: task.assigned_to || [],
      dependencies: task.dependencies || [],
      weight: task.weight,
      order_index: task.order_index || 0
    };
  }

  /**
   * Map PhaseStepData to PhaseStepDTO
   */
  static phaseStepDataToDTO(step: PhaseStepData): PhaseStepDTO {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      status: (step.status as PhaseStatus) || 'pending',
      progress: step.progress || 0,
      estimated_duration_days: step.estimated_duration_days,
      actual_duration_days: step.actual_duration_days,
      start_date: step.start_date,
      end_date: step.end_date,
      order_index: step.order_index || 0,
      tasks: (step.tasks || []).map(task => this.phaseTaskDataToDTO(task))
    };
  }

  /**
   * Map ProjectPhaseEntity to PhaseDTO
   * Supports multiple data sources: steps, customStages, or parsed from description
   */
  static phaseEntityToDTO(entity: ProjectPhaseEntity): PhaseDTO {
    const customData = entity.custom_phase_data || {};
    
    // Try to get steps from different sources
    let steps: PhaseStepDTO[] = [];
    
    // Priority 1: Direct steps array in custom_phase_data
    if (customData.steps && customData.steps.length > 0) {
      steps = customData.steps.map((step: PhaseStepData) => this.phaseStepDataToDTO(step));
    }
    // Priority 2: customStages array (from ConstructionPhaseManager format)
    else if (customData.customStages && customData.customStages.length > 0) {
      steps = customData.customStages.map((stage: any, stageIndex: number) => ({
        id: stage.id || `stage-${stageIndex}`,
        name: stage.name,
        description: stage.description || '',
        status: (stage.status as PhaseStatus) || 'pending',
        progress: stage.progress || 0,
        estimated_duration_days: stage.estimatedDurationDays || null,
        order_index: stage.order || stageIndex,
        tasks: (stage.tasks || []).map((task: any, taskIndex: number) => ({
          id: task.id || `task-${stageIndex}-${taskIndex}`,
          name: task.name,
          description: task.description || '',
          status: (task.status as PhaseStatus) || 'pending',
          progress: task.progress || 0,
          estimated_duration_days: task.estimatedDurationDays || null,
          order_index: taskIndex,
          assigned_to: task.assignedTo || [],
          dependencies: [],
          weight: 1
        }))
      }));
    }
    // Priority 3: Parse from description (legacy data format)
    else if (entity.description && entity.description.includes('Étapes:')) {
      steps = this.parseStepsFromDescription(entity.description);
    }
    
    return {
      id: entity.id,
      project_id: entity.project_id,
      phase_name: entity.phase_name || '',
      construction_phase: entity.construction_phase,
      construction_stage: entity.construction_stage,
      description: entity.description,
      status: (entity.status as PhaseStatus) || 'pending',
      progress: entity.progress || 0,
      estimated_cost: entity.estimated_cost,
      actual_cost: entity.actual_cost,
      estimated_duration_days: entity.estimated_duration_days,
      actual_duration_days: entity.actual_duration_days,
      start_date: entity.start_date,
      end_date: entity.end_date,
      actual_start_date: entity.actual_start_date,
      actual_end_date: entity.actual_end_date,
      order_index: entity.order_index || 0,
      dependencies: entity.dependencies || [],
      steps,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * Parse steps from description text (legacy format support)
   * Format: **StepName**\n• Task1\n• Task2
   */
  static parseStepsFromDescription(description: string): PhaseStepDTO[] {
    const steps: PhaseStepDTO[] = [];
    
    // Extract the part after "Étapes:"
    const stepsSection = description.split('Étapes:')[1]?.split('Jalons clés:')[0] || '';
    if (!stepsSection.trim()) return steps;
    
    // Split by step headers (marked with **)
    const stepMatches = stepsSection.split(/\*\*([^*]+)\*\*/);
    
    let stepIndex = 0;
    for (let i = 1; i < stepMatches.length; i += 2) {
      const stepName = stepMatches[i]?.trim();
      const tasksText = stepMatches[i + 1] || '';
      
      if (!stepName) continue;
      
      // Parse tasks (lines starting with •)
      const tasks: PhaseTaskDTO[] = [];
      const taskLines = tasksText.split('\n').filter(line => line.trim().startsWith('•'));
      
      taskLines.forEach((line, taskIndex) => {
        const taskName = line.replace('•', '').trim();
        if (taskName) {
          tasks.push({
            id: `parsed-task-${stepIndex}-${taskIndex}`,
            name: taskName,
            description: '',
            status: 'pending',
            progress: 0,
            order_index: taskIndex,
            assigned_to: [],
            dependencies: [],
            weight: 1
          });
        }
      });
      
      steps.push({
        id: `parsed-step-${stepIndex}`,
        name: stepName,
        description: '',
        status: 'pending',
        progress: 0,
        order_index: stepIndex,
        tasks
      });
      
      stepIndex++;
    }
    
    return steps;
  }

  /**
   * Map ProjectPhaseEntity to PhaseSummaryDTO (without nested data)
   */
  static phaseEntityToSummaryDTO(entity: ProjectPhaseEntity): PhaseSummaryDTO {
    const customData = entity.custom_phase_data || {};
    
    // Try multiple sources for steps count
    let steps: any[] = customData.steps || [];
    if (steps.length === 0 && customData.customStages) {
      steps = customData.customStages;
    }
    if (steps.length === 0 && entity.description?.includes('Étapes:')) {
      steps = this.parseStepsFromDescription(entity.description);
    }
    
    const allTasks = steps.flatMap((s: any) => s.tasks || []);
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;

    return {
      id: entity.id,
      project_id: entity.project_id,
      phase_name: entity.phase_name || '',
      status: (entity.status as PhaseStatus) || 'pending',
      progress: entity.progress || 0,
      steps_count: steps.length,
      tasks_count: allTasks.length,
      completed_tasks: completedTasks,
      start_date: entity.start_date,
      end_date: entity.end_date,
      order_index: entity.order_index || 0
    };
  }

  /**
   * Map PhaseFormDTO to ProjectPhaseEntity (for insert/update)
   */
  static phaseFormToEntity(
    formData: PhaseFormDTO, 
    projectId: string
  ): Omit<ProjectPhaseEntity, 'id' | 'created_at' | 'updated_at'> {
    const steps: PhaseStepData[] = (formData.steps || []).map((step, stepIndex) => ({
      id: crypto.randomUUID(),
      name: step.name,
      description: step.description,
      status: 'pending',
      progress: 0,
      estimated_duration_days: step.estimated_duration_days,
      order_index: step.order_index ?? stepIndex,
      tasks: (step.tasks || []).map((task, taskIndex) => ({
        id: crypto.randomUUID(),
        name: task.name,
        description: task.description,
        status: 'pending',
        progress: 0,
        estimated_duration_days: task.estimated_duration_days,
        assigned_to: task.assigned_to || [],
        order_index: task.order_index ?? taskIndex
      }))
    }));

    return {
      project_id: projectId,
      phase_name: formData.phase_name,
      description: formData.description,
      construction_phase: formData.construction_phase,
      construction_stage: formData.construction_stage,
      estimated_cost: formData.estimated_cost,
      estimated_duration_days: formData.estimated_duration_days,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: 'pending',
      progress: 0,
      order_index: formData.order_index ?? 0,
      custom_phase_data: { steps }
    };
  }

  /**
   * Map PhaseDTO back to entity format (for updates)
   */
  static phaseDTOToEntity(dto: PhaseDTO): Partial<ProjectPhaseEntity> {
    const stepsSource = Array.isArray(dto.steps) ? dto.steps : [];
    const steps: PhaseStepData[] = stepsSource.map((stepAny: any, idx: number) => {
      // If already PhaseStepDTO-like (has tasks array), map directly
      if (stepAny && Array.isArray(stepAny.tasks)) {
        const step = stepAny as PhaseStepDTO;
        return {
          id: step.id,
          name: step.name,
          description: step.description,
          status: step.status,
          progress: step.progress,
          estimated_duration_days: step.estimated_duration_days,
          actual_duration_days: step.actual_duration_days,
          start_date: step.start_date,
          end_date: step.end_date,
          order_index: step.order_index ?? idx,
          tasks: (step.tasks || []).map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            status: task.status,
            progress: task.progress,
            estimated_duration_days: task.estimated_duration_days,
            actual_duration_days: task.actual_duration_days,
            start_date: task.start_date,
            end_date: task.end_date,
            assigned_to: task.assigned_to,
            dependencies: task.dependencies,
            weight: task.weight,
            order_index: task.order_index
          }))
        } as PhaseStepData;
      }

      // Otherwise assume unified StepItem shape and map minimally
      const si = stepAny as StepItem;
      return {
        id: si?.id || `step-${idx}`,
        name: si?.name || (si as any)?.label || `Étape ${idx + 1}`,
        description: si?.description || '',
        status: (si as any)?.status || 'pending',
        progress: (si as any)?.progress ?? 0,
        estimated_duration_days: (si as any)?.metadata?.estimated_duration_days ?? undefined,
        actual_duration_days: undefined,
        start_date: undefined,
        end_date: undefined,
        order_index: (si as any)?.order ?? idx,
        tasks: []
      } as unknown as PhaseStepData;
    });

    return {
      id: dto.id,
      project_id: dto.project_id,
      phase_name: dto.phase_name,
      description: dto.description,
      construction_phase: dto.construction_phase,
      construction_stage: dto.construction_stage,
      status: dto.status,
      progress: dto.progress,
      estimated_cost: dto.estimated_cost,
      actual_cost: dto.actual_cost,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      actual_start_date: dto.actual_start_date,
      actual_end_date: dto.actual_end_date,
      order_index: dto.order_index,
      dependencies: dto.dependencies,
      custom_phase_data: { steps }
    };
  }

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
      // Map DB estimated_days to form estimated_duration_days
      estimated_duration_days: (entity.estimated_days || entity.estimated_duration_days)?.toString() || '',
      currency: entity.currency || 'MRU',
      status: mapStatus(entity.status),
      start_date: formatDate(entity.start_date),
      end_date: formatDate(entity.end_date),
      startDate: formatDate(entity.start_date),
      endDate: formatDate(entity.end_date),
      // Payment - map DB initial_advance_percentage to form initial_advance
      payment_mode: entity.payment_mode || 'progressive',
      payment_frequency: entity.payment_frequency || 'monthly',
      initial_advance: entity.initial_advance_percentage || entity.initial_advance || 20,
      retention_percentage: entity.retention_percentage || 5,
      advance_percentage: entity.initial_advance_percentage || 20,
      // Meta
      priority: entity.priority || 'medium',
      project_type: entity.project_type || 'construction',
      sector: entity.sector || '',
      permit_number: entity.permit_number || '',
      progress: entity.progress || 0,
      team_size: entity.team_size || 1,
      // Location - map DB columns to form fields
      address: entity.location || '',
      location: entity.location || '',
      latitude: entity.coordinates_latitude,
      longitude: entity.coordinates_longitude,
      geographic_zone: entity.geographic_zone || '',
      terrain_type: entity.terrain_type || '',
      environmental_constraints: entity.environmental_constraints || '',
      has_utilities: entity.has_utilities || false,
      requires_permits: entity.requires_permits || false,
      area_sqm: entity.area_sqm?.toString() || '',
      site_details: entity.site_details || '',
      // JSON location data
      adresse: entity.adresse,
      localisation: entity.localisation,
      forme: entity.forme,
      // Stakeholders - map DB IDs to form fields
      main_contractor: entity.main_contractor || '',
      project_manager_id: entity.project_responsable_id,
      project_responsable_id: entity.project_responsable_id,
      client_id: entity.client_id,
      engineering_consultant_id: entity.engineering_consultant_id,
      technical_manager_id: entity.technical_manager_id,
      supervisor_id: entity.supervisor_id,
      // Financing
      financing_source: entity.financing_source || entity.funding_source || '',
      market_type: entity.market_type || '',
      selection_mode: entity.selection_mode || '',
      donor_organization: entity.donor_organization || '',
      // Workspace
      workspace_id: entity.workspace_id,
      // Workflow flags
      requires_consultant_validation: entity.requires_consultant_validation || false,
      requires_ministry_approval: entity.requires_ministry_approval || false,
      // Phases
      current_phase: entity.current_phase || '',
      current_stage: entity.current_stage || '',
      // Payment config
      allows_initial_payment: entity.allows_initial_payment || false,
      initial_payment_percentage: entity.initial_payment_percentage || 0
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

    // Base fields always included (required fields with defaults)
    const baseFields = {
      title: formData.title || 'Nouveau projet',
      description: formData.description || '',
      location: formData.address || formData.location || 'Non spécifié',
      status: formData.status || 'planning',
      progress: formData.progress || 0,
      thumbnail: formData.thumbnail || '/placeholder.svg',
      team_size: formData.team_size || 1
    };

    // Step 1: Basic info - map form fields to actual DB columns
    const step1Fields = {
      ...baseFields,
      project_reference: nullIfEmpty(formData.project_reference),
      budget: parseFloat(formData.budget || '0') || 0,
      // Map form estimated_duration_days to DB estimated_days
      estimated_days: parseInt(formData.estimated_duration_days || '0') || null,
      currency: formData.currency || 'MRU',
      start_date: nullIfEmpty(formData.start_date || formData.startDate) || new Date().toISOString().split('T')[0],
      end_date: nullIfEmpty(formData.end_date || formData.endDate),
      payment_mode: formData.payment_mode || 'progressive',
      payment_frequency: formData.payment_frequency || 'monthly',
      // Map form initial_advance to DB initial_advance_percentage
      initial_advance_percentage: formData.initial_advance || 20,
      retention_percentage: formData.retention_percentage || 5,
      priority: formData.priority || 'medium',
      project_type: formData.project_type || 'construction',
      sector: nullIfEmpty(formData.sector),
      permit_number: nullIfEmpty(formData.permit_number),
      financing_source: nullIfEmpty(formData.financing_source),
      funding_source: nullIfEmpty(formData.financing_source),
      market_type: nullIfEmpty(formData.market_type),
      selection_mode: nullIfEmpty(formData.selection_mode)
    };

    // Step 2: Stakeholders - map form fields to DB columns
    const step2Fields = {
      main_contractor: nullIfEmpty(formData.main_contractor),
      // Map form project_manager_id to DB project_responsable_id
      project_responsable_id: nullIfEmpty(formData.project_manager_id || formData.project_responsable_id),
      client_id: nullIfEmpty(formData.client_id),
      engineering_consultant_id: nullIfEmpty(formData.engineering_consultant_id),
      technical_manager_id: nullIfEmpty(formData.technical_manager_id),
      supervisor_id: nullIfEmpty(formData.supervisor_id),
      requires_consultant_validation: formData.requires_consultant_validation || false,
      requires_ministry_approval: formData.requires_ministry_approval || false
    };

    // Step 3: Location - map form fields to actual DB columns
    const step3Fields = {
      // Map form address to DB location
      location: formData.address || formData.location || 'Non spécifié',
      // Map form lat/lng to DB coordinates_latitude/longitude
      coordinates_latitude: formData.latitude || null,
      coordinates_longitude: formData.longitude || null,
      // JSON location data
      adresse: formData.adresse || (formData.address ? { address: formData.address } : null),
      localisation: formData.localisation || formData.shapeData?.shape || null,
      forme: formData.forme || formData.shapeData?.shapeType || null,
      // Location metadata
      geographic_zone: nullIfEmpty(formData.geographic_zone),
      terrain_type: nullIfEmpty(formData.terrain_type),
      environmental_constraints: nullIfEmpty(formData.environmental_constraints),
      has_utilities: formData.has_utilities || false,
      requires_permits: formData.requires_permits || false,
      area_sqm: parseFloat(formData.area_sqm || '0') || null,
      site_details: nullIfEmpty(formData.site_details)
    };

    // Step 6: Payment workflow config + financing
    const step6Fields = {
      allows_initial_payment: formData.allows_initial_payment || false,
      initial_payment_percentage: formData.initial_payment_percentage || 0,
      payment_workflow_config: formData.payment_workflow_config || null,
      donor_organization: nullIfEmpty(formData.donor_organization),
      workspace_id: nullIfEmpty(formData.workspace_id)
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